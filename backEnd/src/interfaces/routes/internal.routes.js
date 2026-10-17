const express = require("express");
const router = express.Router();
const serviceAuthMiddleware = require("../middlewares/serviceAuth.middleware");
const OrdemServicoController = require("../controllers/ordemServico.controller");

/**
 * @swagger
 * /internal/os/{id}:
 *   get:
 *     summary: Detalhes completos da OS para outros microsserviços (Billing, Execution)
 *     tags: [Interno]
 *     security:
 *       - serviceToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OS com cliente, veículo, serviços e peças
 *       401:
 *         description: Token de serviço inválido
 *       404:
 *         description: Ordem não encontrada
 */
router.get("/internal/os/:id", serviceAuthMiddleware, (req, res) => OrdemServicoController.buscarInterna(req, res));

module.exports = router;
