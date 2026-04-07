const express = require("express");
const router = express.Router();
const authMiddleware = require("./middlewares/auth.middleware")


const ServicoController = require("./servico.controller");
const servicoController = require("./servico.controller");

router.post("/servicos",(req, res)=> ServicoController.criar(req, res))
router.get("/servicos",(req, res)=> ServicoController.buscar(req, res))
router.get("/servicos/:id",(req, res)=> ServicoController.buscarPorId(req, res))
router.delete("/servicos/:id", (req, res)=> servicoController.deletar(req, res))
router.put("/servicos/:id", (req, res)=> servicoController.atualizar(req, res))



module.exports = router;