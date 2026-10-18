const swaggerJSDoc = require('swagger-jsdoc');
const StatusTransition = require('./domain/statusTransition');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tech Challenger FIAP - Automotive Service API',
      version: '1.0.0',
      description: 'API para gerenciamento de serviços automotivos, incluindo clientes, veículos, ordens de serviço e peças.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        serviceToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-service-token',
        },
      },
      schemas: {
        HistoricoOrdemServico: {
          type: 'object',
          properties: {
            ordem_servico_id: { type: 'integer' },
            status_atual: { type: 'string', enum: StatusTransition.getTodosStatus() },
            historico: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  status_anterior: { type: 'string', nullable: true },
                  status: { type: 'string' },
                  origem: { type: 'string', example: 'billing-service' },
                  event_id: { type: 'string', format: 'uuid', nullable: true },
                  observacao: { type: 'string', nullable: true },
                  created_at: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        Cliente: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nome: { type: 'string' },
            documento: { type: 'string' },
            email: { type: 'string' },
            telefone: { type: 'string' },
          },
        },
        Veiculo: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            placa: { type: 'string' },
            modelo: { type: 'string' },
            marca: { type: 'string' },
            ano: { type: 'integer' },
            cor: { type: 'string' },
          },
        },
        OrdemServico: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            cliente_id: { type: 'integer' },
            veiculo_id: { type: 'integer' },
            status: { type: 'string', enum: StatusTransition.getTodosStatus() },
            motivo_cancelamento: { type: 'string', nullable: true },
            valor_total: { type: 'number' },
            data_criacao: { type: 'string', format: 'date-time' },
            servicos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  servico_id: { type: 'integer' },
                  nome: { type: 'string' },
                  descricao: { type: 'string' },
                  valor_unitario: { type: 'number' },
                  quantidade: { type: 'integer' },
                  total: { type: 'number' },
                },
              },
            },
            pecas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  peca_id: { type: 'integer' },
                  nome: { type: 'string' },
                  descricao: { type: 'string' },
                  valor_unitario: { type: 'number' },
                  quantidade: { type: 'integer' },
                  total: { type: 'number' },
                },
              },
            },
          },
        },
        Servico: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nome: { type: 'string' },
            descricao: { type: 'string' },
            valor: { type: 'number' },
          },
        },
        Peca: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nome: { type: 'string' },
            descricao: { type: 'string' },
            valor: { type: 'number' },
            quantidade: { type: 'integer' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/interfaces/routes/*.js'],
};

const specs = swaggerJSDoc(options);
module.exports = specs;