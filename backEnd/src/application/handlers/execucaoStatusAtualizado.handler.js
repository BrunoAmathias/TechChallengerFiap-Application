const { STATUS } = require("../../domain/statusTransition");
const { RESULTADO } = require("../transicaoStatus.service");
const { osIdDoEvento } = require("./osIdDoEvento");

/** Status do Execution Service → status da OS. NA_FILA já corresponde a "Aguardando execução". */
const MAPA_STATUS_EXECUCAO = Object.freeze({
  EM_DIAGNOSTICO: STATUS.EM_DIAGNOSTICO,
  EM_REPARO: STATUS.EM_EXECUCAO
});

function criarHandlerExecucaoStatusAtualizado({ transicionarStatus }) {
  return async function execucaoStatusAtualizado(evento) {
    const statusExecucao = evento.payload?.status;
    const para = MAPA_STATUS_EXECUCAO[statusExecucao];

    if (!para) {
      return { resultado: RESULTADO.MESMO_STATUS, ignorado: `status de execução ${statusExecucao} não altera a OS` };
    }

    return transicionarStatus.execute({
      osId: osIdDoEvento(evento),
      para,
      origem: evento.source || "execution-service",
      evento,
      observacao: evento.payload?.tecnico
        ? `Execução ${statusExecucao} (técnico: ${evento.payload.tecnico})`
        : `Execução ${statusExecucao}`
    });
  };
}

module.exports = { criarHandlerExecucaoStatusAtualizado, MAPA_STATUS_EXECUCAO };
