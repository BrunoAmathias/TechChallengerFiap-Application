require('newrelic');
require('dotenv').config();
const express = require("express");
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger.config');
const logger = require('./infrastructure/logger');
const correlationIdMiddleware = require('./interfaces/middlewares/correlationId.middleware');
const app = express();
app.disable("x-powered-by"); // não expõe a tecnologia do servidor no header X-Powered-By
 
app.use(correlationIdMiddleware);
app.use(express.json());
 
// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
 
const clienteRoutes = require("./interfaces/routes/cliente.routes");
const authRoutes = require("./interfaces/routes/auth.routes");
const veiculoRoutes = require("./interfaces/routes/veiculo.routes")
const servicoRoutes = require("./interfaces/routes/servico.routes")
const pecaRoutes = require("./interfaces/routes/peca.routes")
const ordemServicoRoutes = require("./interfaces/routes/ordemServico.routes")
const healthK8sRoutes = require("./interfaces/routes/health.k8s.routes")
const internalRoutes = require("./interfaces/routes/internal.routes")

app.use(healthK8sRoutes);
app.use(internalRoutes);
app.use(clienteRoutes);
app.use(veiculoRoutes);
app.use(servicoRoutes)
app.use(pecaRoutes);
app.use(ordemServicoRoutes);
app.use(authRoutes);

module.exports = app;

if (require.main === module) {
  const { iniciarMensageria } = require('./infrastructure/messaging');
  const { handlers, repositories, unitOfWork } = require('./container');
  const pool = require('./infrastructure/database/connection');

  if (process.env.RABBITMQ_URL) {
    app.locals.mensageria = iniciarMensageria({
      url: process.env.RABBITMQ_URL,
      handlers,
      outboxRepository: repositories.outboxRepository,
      unitOfWork
    });
  } else {
    logger.warn('RABBITMQ_URL não definido: mensageria desabilitada (eventos ficam no outbox)');
  }

  const port = Number(process.env.PORT) || 3000;
  const server = app.listen(port, () => {
    logger.info({ port }, `Server rodando na porta ${port} (Swagger em /api-docs)`);
  });

  const encerrar = async (signal) => {
    logger.info({ signal }, 'Encerrando o OS Service');
    server.close();
    await app.locals.mensageria?.stop();
    await pool.end().catch(() => {});
    process.exit(0);
  };

  process.on('SIGTERM', encerrar);
  process.on('SIGINT', encerrar);
}