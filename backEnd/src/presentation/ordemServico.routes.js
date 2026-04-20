const express = require("express");
const router = express.Router();
const authMiddleware = require("./middlewares/auth.middleware");
const OrdemServicoController = require("./ordemServico.controller");

/**
 * @swagger
 * tags:
 *   name: Ordens de Serviço
 *   description: Gerenciamento de ordens de serviço
 */

/**
 * @swagger
 * /os:
 *   post:
 *     summary: Cria uma nova ordem de serviço
 *     tags: [Ordens de Serviço]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cliente_id
 *               - veiculo_id
 *             properties:
 *               cliente_id:
 *                 type: integer
 *                 example: 1
 *               veiculo_id:
 *                 type: integer
 *                 example: 1
 *               descricao_problema:
 *                 type: string
 *                 example: Barulho no motor
 *               servicos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     servico_id:
 *                       type: integer
 *                     quantidade:
 *                       type: integer
 *                     valor_unitario:
 *                       type: number
 *                     total:
 *                       type: number
 *               pecas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     peca_id:
 *                       type: integer
 *                     quantidade:
 *                       type: integer
 *                     valor_unitario:
 *                       type: number
 *                     total:
 *                       type: number
 *     responses:
 *       201:
 *         description: Ordem de serviço criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrdemServico'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.post("/os", authMiddleware, (req, res) => OrdemServicoController.criar(req, res));

/**
 * @swagger
 * /os:
 *   get:
 *     summary: Lista todas as ordens de serviço
 *     tags: [Ordens de Serviço]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ordens de serviço
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OrdemServico'
 *       401:
 *         description: Não autorizado
 */
router.get("/os", authMiddleware, (req, res) => OrdemServicoController.buscar(req, res));

/**
 * @swagger
 * /os/cliente/{documento}:
 *   get:
 *     summary: Busca ordens de serviço pelo documento do cliente
 *     tags: [Ordens de Serviço]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documento
 *         required: true
 *         schema:
 *           type: string
 *         description: CPF ou CNPJ do cliente
 *         example: "52998224725"
 *     responses:
 *       200:
 *         description: Ordens encontradas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OrdemServico'
 *       404:
 *         description: Cliente não encontrado
 *       401:
 *         description: Não autorizado
 */
router.get("/os/cliente/:documento", authMiddleware, (req, res) => OrdemServicoController.buscarPorCliente(req, res));

/**
 * @swagger
 * /os/{id}:
 *   get:
 *     summary: Busca ordem de serviço por ID (autenticado)
 *     tags: [Ordens de Serviço]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da ordem de serviço
 *     responses:
 *       200:
 *         description: Ordem de serviço encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrdemServico'
 *       404:
 *         description: Ordem não encontrada
 *       401:
 *         description: Não autorizado
 */
router.get("/os/:id", authMiddleware, (req, res) => OrdemServicoController.buscarPorId(req, res));

/**
 * @swagger
 * /os/consulta/{id}:
 *   get:
 *     summary: Consulta pública de ordem de serviço por ID (sem autenticação)
 *     tags: [Ordens de Serviço]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da ordem de serviço
 *     responses:
 *       200:
 *         description: Ordem de serviço encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrdemServico'
 *       404:
 *         description: Ordem não encontrada
 */
router.get("/os/consulta/:id", (req, res) => OrdemServicoController.buscarPorId(req, res));

/**
 * @swagger
 * /os/{id}/servicos-finalizados:
 *   get:
 *     summary: Busca serviços finalizados de uma OS com tempo médio
 *     tags: [Ordens de Serviço]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da ordem de serviço
 *     responses:
 *       200:
 *         description: Lista de serviços finalizados com tempo médio
 *       401:
 *         description: Não autorizado
 */
router.get("/os/:id/servicos-finalizados", authMiddleware, (req, res) => OrdemServicoController.buscarServicosFinalizados(req, res));

/**
 * @swagger
 * /os/{id}/status:
 *   patch:
 *     summary: Atualiza o status de uma ordem de serviço
 *     tags: [Ordens de Serviço]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da ordem de serviço
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Aguardando aprovação, Em execução, Finalizada, Cancelada]
 *                 example: Em execução
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrdemServico'
 *       400:
 *         description: Status inválido
 *       401:
 *         description: Não autorizado
 */
router.patch("/os/:id/status", authMiddleware, (req, res) => OrdemServicoController.atualizarStatus(req, res));

/**
 * @swagger
 * /os/{id}/approve:
 *   patch:
 *     summary: Aprova uma ordem de serviço
 *     tags: [Ordens de Serviço]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da ordem de serviço
 *     responses:
 *       200:
 *         description: Ordem aprovada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrdemServico'
 *       400:
 *         description: Erro ao aprovar
 *       401:
 *         description: Não autorizado
 */
router.patch("/os/:id/approve", authMiddleware, (req, res) => OrdemServicoController.aprovar(req, res));

/**
 * @swagger
 * /os/{id}/advance:
 *   patch:
 *     summary: Avança o status de uma ordem de serviço
 *     tags: [Ordens de Serviço]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da ordem de serviço
 *     responses:
 *       200:
 *         description: Status avançado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrdemServico'
 *       400:
 *         description: Erro ao avançar status
 *       401:
 *         description: Não autorizado
 */
router.patch("/os/:id/advance", authMiddleware, (req, res) => OrdemServicoController.avancar(req, res));

module.exports = router;