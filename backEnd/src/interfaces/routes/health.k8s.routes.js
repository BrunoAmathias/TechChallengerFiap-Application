const express  = require("express");
const router = express.Router();
const healthController = require("../controllers/health.k8s.controller");
/********** Health Check **********/

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Verifica o status da API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API saudável
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
router.get("/health", (req, res) => healthController.checkHealth(req, res));

module.exports = router;