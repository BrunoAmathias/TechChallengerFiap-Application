require('dotenv').config();
const express = require("express");
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger.config');
const app = express();
 
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



app.use(healthK8sRoutes);
app.use(clienteRoutes);
app.use(veiculoRoutes);
app.use(servicoRoutes)
app.use(pecaRoutes);
app.use(ordemServicoRoutes);
app.use(authRoutes);
 
module.exports = app;
 
if (require.main === module) {
  app.listen(3000, () => {
    console.log("Server rodando na porta 3000");
    console.log("Swagger disponível em http://localhost:3000/api-docs");
  });
}