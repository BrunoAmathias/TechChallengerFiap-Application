const EventTypes = require("../events/eventTypes");
const { STATUS } = require("../../domain/statusTransition");
const { criarHandlerAvanco } = require("./avancarStatus.handler");
const { criarHandlerCompensacao } = require("./compensacao.handler");
const { criarHandlerExecucaoStatusAtualizado } = require("./execucaoStatusAtualizado.handler");
const { criarHandlerPagamentoEstornado } = require("./pagamentoEstornado.handler");

/**
 * Mapa evento consumido → handler. As chaves também são as routing keys que a
 * fila do OS Service escuta na exchange oficina.events.
 */
function criarHandlers(deps) {
  return {
    [EventTypes.ORCAMENTO_GERADO]: criarHandlerAvanco(STATUS.AGUARDANDO_APROVACAO, deps),
    [EventTypes.ORCAMENTO_APROVADO]: criarHandlerAvanco(STATUS.AGUARDANDO_PAGAMENTO, deps),
    [EventTypes.PAGAMENTO_CONFIRMADO]: criarHandlerAvanco(STATUS.AGUARDANDO_EXECUCAO, deps),
    [EventTypes.EXECUCAO_STATUS_ATUALIZADO]: criarHandlerExecucaoStatusAtualizado(deps),
    [EventTypes.EXECUCAO_FINALIZADA]: criarHandlerAvanco(STATUS.FINALIZADA, deps),

    [EventTypes.ORCAMENTO_FALHOU]: criarHandlerCompensacao("Falha ao gerar orçamento", deps),
    [EventTypes.ORCAMENTO_RECUSADO]: criarHandlerCompensacao("Orçamento recusado pelo cliente", deps),
    [EventTypes.PAGAMENTO_FALHOU]: criarHandlerCompensacao("Pagamento não aprovado", deps),
    [EventTypes.EXECUCAO_FALHOU]: criarHandlerCompensacao("Falha na execução", deps),

    [EventTypes.PAGAMENTO_ESTORNADO]: criarHandlerPagamentoEstornado(deps)
  };
}

module.exports = { criarHandlers };
