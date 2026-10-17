const { osIdDoEvento } = require("./osIdDoEvento");

/**
 * pagamento.estornado não muda o status (a OS já foi cancelada por
 * execucao.falhou); só registra o estorno no histórico da OS.
 */
function criarHandlerPagamentoEstornado({ registrarOcorrencia }) {
  return async function pagamentoEstornado(evento) {
    const valor = evento.payload?.valor != null ? ` (valor: ${evento.payload.valor})` : "";

    return registrarOcorrencia.execute({
      osId: osIdDoEvento(evento),
      origem: evento.source || "billing-service",
      evento,
      observacao: `Pagamento estornado${valor}`
    });
  };
}

module.exports = { criarHandlerPagamentoEstornado };
