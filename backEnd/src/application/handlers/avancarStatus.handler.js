const { osIdDoEvento } = require("./osIdDoEvento");

/**
 * Handler genérico do fluxo principal: o evento leva a OS para `statusDestino`.
 * Usado por orcamento.gerado, orcamento.aprovado, pagamento.confirmado e
 * execucao.finalizada.
 */
function criarHandlerAvanco(statusDestino, { transicionarStatus }) {
  return async function avancarStatus(evento) {
    return transicionarStatus.execute({
      osId: osIdDoEvento(evento),
      para: statusDestino,
      origem: evento.source || evento.type.split(".")[0],
      evento,
      observacao: `Evento ${evento.type}`
    });
  };
}

module.exports = { criarHandlerAvanco };
