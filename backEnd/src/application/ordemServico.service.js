const newrelic = require('newrelic');
const OrdemServico = require("../domain/ordemServico");
const StatusTransition = require("../domain/statusTransition");
const { NaoEncontradoError } = require("../domain/errors");
const EventTypes = require("./events/eventTypes");
const { criarEvento } = require("./events/eventFactory");

const { STATUS } = StatusTransition;

function parseDecimal(value, field) {
  if (value == null) {
    throw new Error(`${field} inválido`);
  }

  let text = String(value).trim();
  text = text.replace(/[R$\s]/g, "");
  if (text.includes(",") && !text.includes(".")) {
    text = text.replace(",", ".");
  } else if (text.includes(",") && text.includes(".")) {
    text = text.replace(/,/g, "");
  }

  const parsed = Number(text);
  if (Number.isNaN(parsed)) {
    throw new Error(`${field} inválido`);
  }
  return parsed;
}

function montarEventoOsAberta(ordemCriada, cliente, veiculo, servicosItems, pecasItems) {
  return criarEvento(
    EventTypes.OS_ABERTA,
    {
      osId: ordemCriada.id,
      valorTotal: Number(ordemCriada.valor_total),
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone ?? null,
        documento: cliente.documento
      },
      veiculo: {
        id: veiculo.id,
        placa: veiculo.placa,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        ano: veiculo.ano
      },
      servicos: servicosItems.map((item) => ({
        servicoId: item.servico_id,
        nome: item.nome,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valorUnitario: item.valor_unitario,
        total: item.total
      })),
      pecas: pecasItems.map((item) => ({
        pecaId: item.peca_id,
        nome: item.nome,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valorUnitario: item.valor_unitario,
        total: item.total
      }))
    },
    { correlationId: ordemCriada.id }
  );
}

class CriarOrdemServico {
  constructor(
    ordemServicoRepository,
    clienteRepository,
    veiculoRepository,
    servicoRepository,
    pecaRepository,
    { historicoRepository, outboxRepository, unitOfWork }
  ) {
    this.ordemServicoRepository = ordemServicoRepository;
    this.clienteRepository = clienteRepository;
    this.veiculoRepository = veiculoRepository;
    this.servicoRepository = servicoRepository;
    this.pecaRepository = pecaRepository;
    this.historicoRepository = historicoRepository;
    this.outboxRepository = outboxRepository;
    this.unitOfWork = unitOfWork;
  }

  async execute(data) {
    const { cliente, veiculo, servicos = [], pecas = [] } = data;

    if (!cliente || !cliente.documento) {
      throw new Error("Documento do cliente é obrigatório para criar a OS");
    }

    let clienteExistente = await this.clienteRepository.buscarPorDocumento(cliente.documento);
    if (!clienteExistente) {
      clienteExistente = await this.clienteRepository.criar(cliente);
    }

    if (!veiculo || !veiculo.placa) {
      throw new Error("Veículo com placa é obrigatório para criar a OS");
    }

    // Buscar veículo existente pela placa (sempre usar dados do banco se existir)
    let veiculoExistente = await this.veiculoRepository.buscarPorPlaca(veiculo.placa);
    if (!veiculoExistente) {
      veiculoExistente = await this.veiculoRepository.criar(veiculo);
    }

    const servicosItems = await Promise.all(
      servicos.map(async (item) => {
        if (!item.id) {
          throw new Error("Cada serviço deve ter um id");
        }

        const servico = await this.servicoRepository.buscarPorId(item.id);
        if (!servico) {
          throw new Error(`Serviço não encontrado: id ${item.id}`);
        }

        const valorUnitario = parseDecimal(servico.valor, `Valor do serviço ${item.id}`);

        return {
          servico_id: servico.id,
          nome: servico.nome,
          descricao: servico.descricao,
          valor_unitario: valorUnitario,
          quantidade: 1,
          total: valorUnitario,
        };
      })
    );

    const pecasItems = await Promise.all(
      pecas.map(async (item) => {
        if (!item.id) {
          throw new Error("Cada peça deve ter um id");
        }

        const peca = await this.pecaRepository.buscarPorId(item.id);
        if (!peca) {
          throw new Error(`Peça não encontrada: id ${item.id}`);
        }

        const quantidade = Number(item.quantidade || 1);
        if (quantidade <= 0) {
          throw new Error("Quantidade de peça deve ser maior que zero");
        }

        if (peca.quantidade < quantidade) {
          throw new Error(`Estoque insuficiente para a peça ${peca.nome}`);
        }

        const valorUnitario = parseDecimal(peca.valor, `Valor da peça ${item.id}`);

        return {
          peca_id: peca.id,
          nome: peca.nome,
          descricao: peca.descricao,
          valor_unitario: valorUnitario,
          quantidade,
          total: valorUnitario * quantidade,
        };
      })
    );

    const valor_total =
      servicosItems.reduce((total, item) => total + item.total, 0) +
      pecasItems.reduce((total, item) => total + item.total, 0);

    const ordem = new OrdemServico({
      cliente_id: clienteExistente.id,
      veiculo_id: veiculoExistente.id,
      servicos: servicosItems,
      pecas: pecasItems,
      valor_total,
    });

    // OS, reserva de estoque, histórico e evento os.aberta na mesma transação
    const ordemCriada = await this.unitOfWork.run(async (tx) => {
      const criada = await this.ordemServicoRepository.criar(ordem, servicosItems, pecasItems, tx);

      await this.historicoRepository.registrar(
        { osId: criada.id, status: criada.status, origem: "os-service", observacao: "OS aberta" },
        tx
      );

      await this.outboxRepository.adicionar(
        montarEventoOsAberta(criada, clienteExistente, veiculoExistente, servicosItems, pecasItems),
        tx
      );

      return criada;
    });

    newrelic.recordCustomEvent("OrdemServico", {
      ordemId: String(ordemCriada.id),
      status: String(ordemCriada.status ?? STATUS.RECEBIDA),
      valorTotal: Number(ordemCriada.valor_total ?? valor_total)
    });

    return ordemCriada;
  }
}

class BuscarOrdensServico {
  constructor(ordemServicoRepository) {
    this.ordemServicoRepository = ordemServicoRepository;
  }

  async execute() {
    return await this.ordemServicoRepository.listar();
  }
}

class BuscarOrdemServicoPorId {
  constructor(ordemServicoRepository) {
    this.ordemServicoRepository = ordemServicoRepository;
  }

  async execute(id) {
    const ordem = await this.ordemServicoRepository.buscarPorId(id);
    if (!ordem) {
      throw new NaoEncontradoError("Ordem de serviço não encontrada");
    }
    return ordem;
  }
}

class BuscarOrdensPorCliente {
  constructor(ordemServicoRepository, clienteRepository) {
    this.ordemServicoRepository = ordemServicoRepository;
    this.clienteRepository = clienteRepository;
  }

  async execute(documento) {
    const cliente = await this.clienteRepository.buscarPorDocumento(documento);
    if (!cliente) {
      throw new NaoEncontradoError("Cliente não encontrado");
    }
    return await this.ordemServicoRepository.buscarPorClienteId(cliente.id);
  }
}

class BuscarHistoricoOrdemServico {
  constructor(ordemServicoRepository, historicoRepository) {
    this.ordemServicoRepository = ordemServicoRepository;
    this.historicoRepository = historicoRepository;
  }

  async execute(id) {
    const ordem = await this.ordemServicoRepository.buscarPorId(id);
    if (!ordem) {
      throw new NaoEncontradoError("Ordem de serviço não encontrada");
    }

    const historico = await this.historicoRepository.listarPorOs(id);
    return { ordem_servico_id: Number(id), status_atual: ordem.status, historico };
  }
}

/** Detalhes completos da OS para outros serviços (GET /internal/os/:id). */
class BuscarOrdemServicoInterna {
  constructor(ordemServicoRepository, clienteRepository, veiculoRepository) {
    this.ordemServicoRepository = ordemServicoRepository;
    this.clienteRepository = clienteRepository;
    this.veiculoRepository = veiculoRepository;
  }

  async execute(id) {
    const ordem = await this.ordemServicoRepository.buscarPorId(id);
    if (!ordem) {
      throw new NaoEncontradoError("Ordem de serviço não encontrada");
    }

    const [cliente, veiculo] = await Promise.all([
      this.clienteRepository.buscarPorId(ordem.cliente_id),
      this.veiculoRepository.buscarVeiculoPorId(ordem.veiculo_id)
    ]);

    return { ...ordem, cliente, veiculo };
  }
}

/** Cliente retira o veículo: Finalizada → Entregue (publica os.entregue). */
class EntregarOrdemServico {
  constructor(transicionarStatus) {
    this.transicionarStatus = transicionarStatus;
  }

  async execute(id) {
    const { ordem } = await this.transicionarStatus.execute({
      osId: id,
      para: STATUS.ENTREGUE,
      origem: "os-service",
      observacao: "Veículo entregue ao cliente"
    });
    return ordem;
  }
}

class BuscarServicosFinalizadosComTempoMedio {
  constructor(ordemServicoRepository) {
    this.ordemServicoRepository = ordemServicoRepository;
  }

  async execute(id) {
    const servicos = await this.ordemServicoRepository.buscarServicosFinalizadosComTempoMedio(id);

    if (!servicos || servicos.length === 0) {
      return {
        ordem_servico_id: id,
        servicos_finalizados: [],
        tempo_medio_geral_minutos: 0,
        mensagem: "Nenhum serviço finalizado encontrado para esta OS"
      };
    }

    const servicosFormatados = servicos.map(servico => ({
      id: servico.id,
      servico_id: servico.servico_id,
      nome: servico.nome,
      descricao: servico.descricao,
      quantidade: servico.quantidade,
      valor_unitario: parseFloat(servico.valor_unitario),
      total: parseFloat(servico.total),
      status: servico.status,
      start_time: servico.start_time,
      end_time: servico.end_time,
      tempo_gasto_minutos: parseFloat(servico.tempo_minutos) || 0
    }));

    const tempoMedioGeral = parseFloat(servicos[0].tempo_medio_minutos) || 0;

    return {
      ordem_servico_id: id,
      servicos_finalizados: servicosFormatados,
      tempo_medio_geral_minutos: tempoMedioGeral,
      total_servicos_finalizados: servicos.length
    };
  }
}

module.exports = {
  CriarOrdemServico,
  BuscarOrdensServico,
  BuscarOrdemServicoPorId,
  BuscarOrdensPorCliente,
  BuscarHistoricoOrdemServico,
  BuscarOrdemServicoInterna,
  EntregarOrdemServico,
  BuscarServicosFinalizadosComTempoMedio,
};
