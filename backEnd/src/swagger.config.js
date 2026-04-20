const swaggerJSDoc = require('swagger-jsdoc');

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
      },
      schemas: {
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
            status: { type: 'string', enum: ['Aguardando aprovação', 'Em execução', 'Finalizada', 'Cancelada'] },
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
  apis: [
    './src/presentation/auth.routes.js',
    './src/presentation/cliente.routes.js',
    './src/presentation/veiculo.routes.js',
    './src/presentation/servico.routes.js',
    './src/presentation/peca.routes.js',
    './src/presentation/ordemServico.routes.js',
  ],
};

const specs = swaggerJSDoc(options);
module.exports = specs;