const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const PecaController = require("../controllers/peca.controller");

/**
 * @swagger
 * tags:
 *   name: Peças
 *   description: Gerenciamento de peças
 */

/**
 * @swagger
 * /pecas:
 *   post:
 *     summary: Cadastra uma nova peça
 *     tags: [Peças]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - valor
 *               - quantidade
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Filtro de óleo
 *               descricao:
 *                 type: string
 *                 example: Filtro de óleo para motor
 *               valor:
 *                 type: number
 *                 example: 25.00
 *               quantidade:
 *                 type: integer
 *                 example: 50
 *     responses:
 *       201:
 *         description: Peça cadastrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Peca'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.post("/pecas", authMiddleware, (req, res) => PecaController.criar(req, res));

/**
 * @swagger
 * /pecas:
 *   get:
 *     summary: Lista todas as peças
 *     tags: [Peças]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de peças
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Peca'
 *       401:
 *         description: Não autorizado
 */
router.get("/pecas", authMiddleware, (req, res) => PecaController.buscar(req, res));

/**
 * @swagger
 * /pecas/{id}:
 *   get:
 *     summary: Busca peça por ID
 *     tags: [Peças]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da peça
 *     responses:
 *       200:
 *         description: Peça encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Peca'
 *       404:
 *         description: Peça não encontrada
 *       401:
 *         description: Não autorizado
 */
router.get("/pecas/:id", authMiddleware, (req, res) => PecaController.buscarPorId(req, res));

/**
 * @swagger
 * /pecas/{id}:
 *   put:
 *     summary: Atualiza dados de uma peça
 *     tags: [Peças]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da peça
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               valor:
 *                 type: number
 *               quantidade:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Peça atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Peca'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.put("/pecas/:id", authMiddleware, (req, res) => PecaController.atualizar(req, res));

/**
 * @swagger
 * /pecas/{id}:
 *   delete:
 *     summary: Remove uma peça
 *     tags: [Peças]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da peça
 *     responses:
 *       204:
 *         description: Peça removida com sucesso
 *       401:
 *         description: Não autorizado
 */
router.delete("/pecas/:id", authMiddleware, (req, res) => PecaController.deletar(req, res));

module.exports = router;