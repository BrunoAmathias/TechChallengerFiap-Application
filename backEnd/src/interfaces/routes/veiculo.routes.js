const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const VeiculoController = require("../controllers/veiculo.controller");

/**
 * @swagger
 * tags:
 *   name: Veículos
 *   description: Gerenciamento de veículos
 */

/**
 * @swagger
 * /veiculos:
 *   post:
 *     summary: Cadastra um novo veículo
 *     tags: [Veículos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - placa
 *               - modelo
 *               - marca
 *               - ano
 *             properties:
 *               placa:
 *                 type: string
 *                 example: ABC1234
 *               modelo:
 *                 type: string
 *                 example: Civic
 *               marca:
 *                 type: string
 *                 example: Honda
 *               ano:
 *                 type: integer
 *                 example: 2020
 *               cor:
 *                 type: string
 *                 example: Prata
 *     responses:
 *       201:
 *         description: Veículo cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Veiculo'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.post("/veiculos", authMiddleware, (req, res) => VeiculoController.criar(req, res));

/**
 * @swagger
 * /veiculos:
 *   get:
 *     summary: Lista todos os veículos
 *     tags: [Veículos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de veículos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Veiculo'
 *       401:
 *         description: Não autorizado
 */
router.get("/veiculos", authMiddleware, (req, res) => VeiculoController.listar(req, res));

/**
 * @swagger
 * /veiculos/{id}:
 *   get:
 *     summary: Busca veículo por ID
 *     tags: [Veículos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do veículo
 *     responses:
 *       200:
 *         description: Veículo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Veiculo'
 *       400:
 *         description: Veículo não encontrado
 *       401:
 *         description: Não autorizado
 */
router.get("/veiculos/:id", authMiddleware, (req, res) => VeiculoController.buscarPorId(req, res));

/**
 * @swagger
 * /veiculos/{id}:
 *   put:
 *     summary: Atualiza dados de um veículo
 *     tags: [Veículos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do veículo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               placa:
 *                 type: string
 *               modelo:
 *                 type: string
 *               marca:
 *                 type: string
 *               ano:
 *                 type: integer
 *               cor:
 *                 type: string
 *     responses:
 *       200:
 *         description: Veículo atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Veiculo'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.put("/veiculos/:id", authMiddleware, (req, res) => VeiculoController.atualizar(req, res));

/**
 * @swagger
 * /veiculos/{id}:
 *   delete:
 *     summary: Remove um veículo
 *     tags: [Veículos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do veículo
 *     responses:
 *       204:
 *         description: Veículo removido com sucesso
 *       401:
 *         description: Não autorizado
 */
router.delete("/veiculos/:id", authMiddleware, (req, res) => VeiculoController.deletar(req, res));

module.exports = router;