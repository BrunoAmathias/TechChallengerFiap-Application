const express = require("express");
const router = express.Router();
const authMiddleware = require("./middlewares/auth.middleware")

const VeiculoController = require("./veiculo.controller");

router.post("/veiculos",authMiddleware, (req, res) =>  VeiculoController.criar(req, res))
router.get("/veiculos",authMiddleware,(req, res) =>  VeiculoController.listar(req, res))
router.get("/veiculos/:id",authMiddleware,(req, res) =>  VeiculoController.buscarPorId(req, res))
router.delete("/veiculos/:id",authMiddleware,(req, res) =>  VeiculoController.deletar(req, res))
router.put("/veiculos/:id",authMiddleware,(req, res) => VeiculoController.atualizar(req, res))


module.exports = router;
