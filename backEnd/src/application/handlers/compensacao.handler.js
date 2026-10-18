const newrelic = require("newrelic");
const { STATUS } = require("../../domain/statusTransition");
const { RESULTADO } = require("../transicaoStatus.service");
const { osIdDoEvento } = require("./osIdDoEvento");

/**
 * Compensação da saga: cancela a OS e devolve o estoque reservado.
 * Usado por orcamento.falhou, orcamento.recusado, pagamento.falhou e execucao.falhou.
 */
function criarHandlerCompensacao(motivoPadrao, { transicionarStatus }) {
  return async function compensar(evento) {
    const osId = osIdDoEvento(evento);
    const motivo = evento.payload?.motivo ? `${motivoPadrao}: ${evento.payload.motivo}` : motivoPadrao;

    const resultado = await transicionarStatus.execute({
      osId,
      para: STATUS.CANCELADA,
      origem: evento.source || evento.type.split(".")[0],
      evento,
      motivoCancelamento: motivo,
      liberarEstoque: true
    });

    if (resultado.resultado === RESULTADO.APLICADO) {
      newrelic.recordCustomEvent("SagaCompensacao", {
        osId: String(osId),
        evento: String(evento.type),
        servico: "os-service",
        acao: "CancelarOS+LiberarEstoque",
        pecasLiberadas: resultado.pecasLiberadas?.length ?? 0
      });
    }

    return resultado;
  };
}

module.exports = { criarHandlerCompensacao };
