const express = require("express");
const router = express.Router();
const authMiddleware = require("./middlewares/auth.middleware")

const ClienteController = require("./cliente.controller");

router.post("/clientes", authMiddleware,(req, res) => ClienteController.criar(req, res));
router.get("/clientes", authMiddleware,(req, res) => ClienteController.listar(req, res));
router.get("/clientes/:id", authMiddleware,(req, res) => ClienteController.buscarPorId(req, res));
router.put("/clientes/:id", authMiddleware, (req, res) => ClienteController.atualizar(req, res));
router.delete("/clientes/:id", authMiddleware, (req, res) => ClienteController.deletar(req, res));

module.exports = router;