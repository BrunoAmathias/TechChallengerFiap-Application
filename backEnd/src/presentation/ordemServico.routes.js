const express = require("express");
const router = express.Router();
const authMiddleware = require("./middlewares/auth.middleware");
const OrdemServicoController = require("./ordemServico.controller");

router.post("/os", authMiddleware, (req, res) => OrdemServicoController.criar(req, res));
router.get("/os", authMiddleware, (req, res) => OrdemServicoController.buscar(req, res));
router.get("/os/cliente/:documento",authMiddleware,(req, res) => OrdemServicoController.buscarPorCliente(req, res));
router.get("/os/:id", authMiddleware, (req, res) => OrdemServicoController.buscarPorId(req, res));
router.get("/os/consulta/:id", (req, res) => OrdemServicoController.buscarPorId(req, res));
router.get("/os/:id/servicos-finalizados", authMiddleware, (req, res) => OrdemServicoController.buscarServicosFinalizados(req, res));
router.patch("/os/:id/status", authMiddleware, (req, res) => OrdemServicoController.atualizarStatus(req, res));
router.patch("/os/:id/approve", authMiddleware, (req, res) => OrdemServicoController.aprovar(req, res));
router.patch("/os/:id/advance", authMiddleware, (req, res) => OrdemServicoController.avancar(req, res));

module.exports = router;
