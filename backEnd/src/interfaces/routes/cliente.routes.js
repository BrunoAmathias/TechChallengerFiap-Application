const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const ClienteController = require("../controllers/cliente.controller");

/**
 * @swagger
 * tags:
 *   name: Clientes
 *   description: Gerenciamento de clientes
 */

/**
 * @swagger
 * /clientes:
 *   post:
 *     summary: Cria um novo cliente
 *     tags: [Clientes]
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
 *               - email
 *               - tipo_documento
 *               - documento
 *             properties:
 *               nome:
 *                 type: string
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 example: joao@email.com
 *               telefone:
 *                 type: string
 *                 example: "11999999999"
 *               tipo_documento:
 *                 type: string
 *                 enum: [CPF, CNPJ]
 *                 example: CPF
 *               documento:
 *                 type: string
 *                 example: "52998224725"
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cliente'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.post("/clientes", authMiddleware, (req, res) => ClienteController.criar(req, res));

/**
 * @swagger
 * /clientes:
 *   get:
 *     summary: Lista todos os clientes
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Cliente'
 *       401:
 *         description: Não autorizado
 */
router.get("/clientes", authMiddleware, (req, res) => ClienteController.listar(req, res));

/**
 * @swagger
 * /clientes/{id}:
 *   get:
 *     summary: Busca cliente por ID
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cliente'
 *       404:
 *         description: Cliente não encontrado
 *       401:
 *         description: Não autorizado
 */
router.get("/clientes/:id", authMiddleware, (req, res) => ClienteController.buscarPorId(req, res));

/**
 * @swagger
 * /clientes/{id}:
 *   put:
 *     summary: Atualiza dados de um cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               telefone:
 *                 type: string
 *               tipo_documento:
 *                 type: string
 *               documento:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cliente'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.put("/clientes/:id", authMiddleware, (req, res) => ClienteController.atualizar(req, res));

/**
 * @swagger
 * /clientes/{id}:
 *   delete:
 *     summary: Remove um cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do cliente
 *     responses:
 *       204:
 *         description: Cliente removido com sucesso
 *       401:
 *         description: Não autorizado
 */
router.delete("/clientes/:id", authMiddleware, (req, res) => ClienteController.deletar(req, res));

module.exports = router;