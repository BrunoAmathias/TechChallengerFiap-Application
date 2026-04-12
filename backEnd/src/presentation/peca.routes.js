const express = require("express");
const router = express.Router();
const authMiddleware = require("./middlewares/auth.middleware")

const PecaController = require("./peca.controller");

router.post("/pecas", authMiddleware, (req, res) => PecaController.criar(req, res));
router.get("/pecas", authMiddleware, (req, res) => PecaController.buscar(req, res));
router.get("/pecas/:id", authMiddleware, (req, res) => PecaController.buscarPorId(req, res));
router.put("/pecas/:id", authMiddleware, (req, res) => PecaController.atualizar(req, res));
router.delete("/pecas/:id", authMiddleware, (req, res) => PecaController.deletar(req, res));

module.exports = router;