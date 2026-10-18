const { timingSafeEqual } = require("node:crypto");

const HEADER = "x-service-token";

function tokensIguais(recebido, esperado) {
  const a = Buffer.from(String(recebido));
  const b = Buffer.from(String(esperado));
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Autenticação service-to-service das rotas /internal: o chamador (Billing,
 * Execution) envia o token compartilhado SERVICE_TOKEN no header x-service-token.
 */
function serviceAuthMiddleware(req, res, next) {
  const esperado = process.env.SERVICE_TOKEN;

  if (!esperado) {
    return res.status(503).json({ error: "Autenticação entre serviços não configurada" });
  }

  const recebido = req.get(HEADER);
  if (!recebido || !tokensIguais(recebido, esperado)) {
    return res.status(401).json({ error: "Token de serviço inválido" });
  }

  return next();
}

module.exports = serviceAuthMiddleware;
module.exports.HEADER = HEADER;
