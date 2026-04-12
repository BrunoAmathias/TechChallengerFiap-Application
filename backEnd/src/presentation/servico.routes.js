const express = require("express");
const router = express.Router();
const authMiddleware = require("./middlewares/auth.middleware")


const ServicoController = require("./servico.controller");
const servicoController = require("./servico.controller");

router.post("/servicos",authMiddleware,(req, res)=> ServicoController.criar(req, res))
router.get("/servicos",authMiddleware,(req, res)=> ServicoController.buscar(req, res))
router.get("/servicos/:id",authMiddleware,(req, res)=> ServicoController.buscarPorId(req, res))
router.delete("/servicos/:id", authMiddleware, (req, res)=> servicoController.deletar(req, res))
router.put("/servicos/:id", authMiddleware, (req, res)=> servicoController.atualizar(req, res))



module.exports = router;