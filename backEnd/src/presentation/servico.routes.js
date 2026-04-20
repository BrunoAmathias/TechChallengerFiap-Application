const express = require("express");
const router = express.Router();
const authMiddleware = require("./middlewares/auth.middleware");
const ServicoController = require("./servico.controller");

/**
 * @swagger
 * tags:
 *   name: Serviços
 *   description: Gerenciamento de serviços
 */

/**
 * @swagger
 * /servicos:
 *   post:
 *     summary: Cadastra um novo serviço
 *     tags: [Serviços]
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
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Troca de óleo
 *               descricao:
 *                 type: string
 *                 example: Troca completa do óleo do motor
 *               valor:
 *                 type: number
 *                 example: 150.00
 *     responses:
 *       201:
 *         description: Serviço cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Servico'
 *       401:
 *         description: Não autorizado
 */
router.post("/servicos", authMiddleware, (req, res) => ServicoController.criar(req, res));

/**
 * @swagger
 * /servicos:
 *   get:
 *     summary: Lista todos os serviços
 *     tags: [Serviços]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de serviços
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Servico'
 *       401:
 *         description: Não autorizado
 */
router.get("/servicos", authMiddleware, (req, res) => ServicoController.buscar(req, res));

/**
 * @swagger
 * /servicos/{id}:
 *   get:
 *     summary: Busca serviço por ID
 *     tags: [Serviços]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do serviço
 *     responses:
 *       201:
 *         description: Serviço encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Servico'
 *       401:
 *         description: Não autorizado
 */
router.get("/servicos/:id", authMiddleware, (req, res) => ServicoController.buscarPorId(req, res));

/**
 * @swagger
 * /servicos/{id}:
 *   put:
 *     summary: Atualiza dados de um serviço
 *     tags: [Serviços]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do serviço
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
 *     responses:
 *       200:
 *         description: Serviço atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Servico'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.put("/servicos/:id", authMiddleware, (req, res) => ServicoController.atualizar(req, res));

/**
 * @swagger
 * /servicos/{id}:
 *   delete:
 *     summary: Remove um serviço
 *     tags: [Serviços]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do serviço
 *     responses:
 *       204:
 *         description: Serviço removido com sucesso
 *       400:
 *         description: Erro ao remover
 *       401:
 *         description: Não autorizado
 */
router.delete("/servicos/:id", authMiddleware, (req, res) => ServicoController.deletar(req, res));

module.exports = router;