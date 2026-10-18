const newrelic = require("newrelic");
const StatusTransition = require("../domain/statusTransition");
const { NaoEncontradoError } = require("../domain/errors");
const EventTypes = require("./events/eventTypes");
const { criarEvento } = require("./events/eventFactory");
const logger = require("../infrastructure/logger");

const { STATUS } = StatusTransition;

const RESULTADO = Object.freeze({
  APLICADO: "aplicado",
  DUPLICADO: "duplicado",
  MESMO_STATUS: "mesmo_status",
  OBSOLETO: "obsoleto"
});

function calcularDuracaoStatusMinutos(updatedAt) {
  if (!updatedAt) return 0;

  const inicio = new Date(updatedAt);

  if (Number.isNaN(inicio.getTime())) return 0;

  return Math.max(0, (Date.now() - inicio.getTime()) / 60000);
}

/**
 * Aplica uma mudança de status na OS em uma única transação:
 * idempotência (processed_events) → transição validada pela máquina de estados
 * → efeitos colaterais (serviços, estoque) → histórico → eventos no outbox.
 *
 * Eventos repetidos, do mesmo status ou atrasados (a OS já avançou) são
 * ignorados sem erro. Transições inválidas lançam TransicaoInvalidaError: no
 * consumer isso vira retry e, esgotadas as tentativas, DLQ.
 */
class TransicionarStatusOrdemServico {
  constructor({
    ordemServicoRepository,
    historicoRepository,
    outboxRepository,
    processedEventsRepository,
    unitOfWork
  }) {
    this.ordemServicoRepository = ordemServicoRepository;
    this.historicoRepository = historicoRepository;
    this.outboxRepository = outboxRepository;
    this.processedEventsRepository = processedEventsRepository;
    this.unitOfWork = unitOfWork;
  }

  async execute({
    osId,
    para,
    origem,
    evento = null,
    observacao = null,
    motivoCancelamento = null,
    liberarEstoque = false
  }) {
    const quando = evento?.occurredAt ? new Date(evento.occurredAt) : new Date();

    const resultado = await this.unitOfWork.run(async (tx) => {
      if (evento) {
        const novo = await this.processedEventsRepository.registrar(evento.eventId, evento.type, tx);
        if (!novo) return { resultado: RESULTADO.DUPLICADO };
      }

      const ordemAtual = await this.ordemServicoRepository.buscarParaAtualizar(osId, tx);
      if (!ordemAtual) {
        throw new NaoEncontradoError(`Ordem de serviço não encontrada: id ${osId}`);
      }

      const de = ordemAtual.status;

      if (de === para) {
        return { resultado: RESULTADO.MESMO_STATUS, ordem: ordemAtual };
      }

      if (StatusTransition.isObsoleta(de, para)) {
        return { resultado: RESULTADO.OBSOLETO, ordem: ordemAtual };
      }

      StatusTransition.assertTransition(de, para);

      const ordemAtualizada = await this.ordemServicoRepository.atualizarStatus(osId, para, tx, {
        motivoCancelamento: para === STATUS.CANCELADA ? motivoCancelamento : null
      });

      if (para === STATUS.EM_EXECUCAO) {
        await this.ordemServicoRepository.iniciarServicosOs(osId, quando, tx);
      }

      if (para === STATUS.FINALIZADA) {
        await this.ordemServicoRepository.finalizarServicosOs(osId, quando, tx);
      }

      let pecasLiberadas = [];
      if (liberarEstoque) {
        pecasLiberadas = await this.ordemServicoRepository.liberarEstoque(osId, tx);
      }

      await this.historicoRepository.registrar(
        {
          osId,
          statusAnterior: de,
          status: para,
          origem,
          eventId: evento?.eventId ?? null,
          observacao: observacao ?? motivoCancelamento
        },
        tx
      );

      const eventoSaida = this.criarEventoSaida({ osId, de, para, evento, motivoCancelamento, pecasLiberadas, quando });
      if (eventoSaida) {
        await this.outboxRepository.adicionar(eventoSaida, tx);
      }

      return {
        resultado: RESULTADO.APLICADO,
        ordem: ordemAtualizada,
        de,
        pecasLiberadas,
        statusAnteriorDesde: ordemAtual.updated_at
      };
    });

    if (resultado.resultado === RESULTADO.APLICADO) {
      newrelic.recordCustomEvent("StatusOS", {
        ordemId: String(osId),
        statusAnterior: String(resultado.de),
        novoStatus: String(para),
        origem: String(origem),
        evento: String(evento?.type ?? "http"),
        duracaoStatusMinutos: calcularDuracaoStatusMinutos(resultado.statusAnteriorDesde)
      });
    } else {
      logger.info(
        { osId, para, origem, eventId: evento?.eventId, eventType: evento?.type, resultado: resultado.resultado },
        "Transição de status ignorada"
      );
    }

    return resultado;
  }

  criarEventoSaida({ osId, de, para, evento, motivoCancelamento, pecasLiberadas, quando }) {
    const opcoes = { correlationId: osId, causationId: evento?.eventId ?? null };

    if (para === STATUS.CANCELADA) {
      return criarEvento(
        EventTypes.OS_CANCELADA,
        {
          osId: Number(osId),
          statusAnterior: de,
          motivo: motivoCancelamento,
          eventoOrigem: evento?.type ?? null,
          pecasLiberadas: pecasLiberadas.map((p) => ({ pecaId: p.peca_id, quantidade: p.quantidade }))
        },
        opcoes
      );
    }

    if (para === STATUS.ENTREGUE) {
      return criarEvento(EventTypes.OS_ENTREGUE, { osId: Number(osId), entregueEm: quando.toISOString() }, opcoes);
    }

    return null;
  }
}

/**
 * Registra no histórico um evento que não muda o status da OS (ex.: estorno),
 * com a mesma garantia de idempotência dos handlers de transição.
 */
class RegistrarOcorrenciaOrdemServico {
  constructor({ ordemServicoRepository, historicoRepository, processedEventsRepository, unitOfWork }) {
    this.ordemServicoRepository = ordemServicoRepository;
    this.historicoRepository = historicoRepository;
    this.processedEventsRepository = processedEventsRepository;
    this.unitOfWork = unitOfWork;
  }

  async execute({ osId, origem, evento, observacao }) {
    return this.unitOfWork.run(async (tx) => {
      const novo = await this.processedEventsRepository.registrar(evento.eventId, evento.type, tx);
      if (!novo) return { resultado: RESULTADO.DUPLICADO };

      const ordem = await this.ordemServicoRepository.buscarParaAtualizar(osId, tx);
      if (!ordem) {
        throw new NaoEncontradoError(`Ordem de serviço não encontrada: id ${osId}`);
      }

      await this.historicoRepository.registrar(
        { osId, statusAnterior: ordem.status, status: ordem.status, origem, eventId: evento.eventId, observacao },
        tx
      );

      return { resultado: RESULTADO.APLICADO, ordem };
    });
  }
}

module.exports = {
  TransicionarStatusOrdemServico,
  RegistrarOcorrenciaOrdemServico,
  RESULTADO,
  calcularDuracaoStatusMinutos
};
