require('dotenv').config();
const express = require("express");
const app = express();

app.use(express.json());

const clienteRoutes = require("./presentation/cliente.routes");
const authRoutes = require("./presentation/auth.routes")
const veiculoRoutes = require("./presentation/veiculo.routes")
const servicoRoutes = require("./presentation/servico.routes")
const pecaRoutes = require("./presentation/peca.routes")
const ordemServicoRoutes = require("./presentation/ordemServico.routes")

app.use(clienteRoutes);
app.use(veiculoRoutes);
app.use(servicoRoutes)
app.use(pecaRoutes);
app.use(ordemServicoRoutes);
app.use(authRoutes);


app.listen(3000, () => {
  console.log("Server rodando na porta 3000");
});