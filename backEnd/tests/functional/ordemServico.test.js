const request = require('supertest');
const app = require('../../src/server');

// Mock dos repositórios
jest.mock('../../src/infrastructure/repositories/ordemServico.repository');
jest.mock('../../src/infrastructure/repositories/cliente.repository');
jest.mock('../../src/infrastructure/repositories/veiculo.repository');
jest.mock('../../src/infrastructure/repositories/servico.repository');
jest.mock('../../src/infrastructure/repositories/peca.repository');

const OrdemServicoRepository = require('../../src/infrastructure/repositories/ordemServico.repository');
const ClienteRepository = require('../../src/infrastructure/repositories/cliente.repository');
const VeiculoRepository = require('../../src/infrastructure/repositories/veiculo.repository');
const ServicoRepository = require('../../src/infrastructure/repositories/servico.repository');
const PecaRepository = require('../../src/infrastructure/repositories/peca.repository');

describe('OrdemServico Functional Tests (Mocked)', () => {
  let token;

  beforeAll(async () => {
    const response = await request(app)
      .post('/login')
      .send({
        email: process.env.MOCK_USER_EMAIL,
        senha: process.env.MOCK_USER_PASSWORD
      });

    token = response.body.token;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    OrdemServicoRepository.criar = jest.fn();
    OrdemServicoRepository.listar = jest.fn();
    OrdemServicoRepository.buscarPorId = jest.fn();
    OrdemServicoRepository.buscarPorClienteId = jest.fn();
    OrdemServicoRepository.atualizarStatus = jest.fn();
    OrdemServicoRepository.aprovar = jest.fn();
    OrdemServicoRepository.atualizarStatusOsServico = jest.fn();
    OrdemServicoRepository.finalizarServicosOs = jest.fn();
    OrdemServicoRepository.buscarServicosFinalizadosComTempoMedio = jest.fn();

    ClienteRepository.buscarPorId = jest.fn();
    ClienteRepository.buscarPorDocumento = jest.fn();

    VeiculoRepository.buscarPorId = jest.fn();
    VeiculoRepository.buscarPorPlaca = jest.fn();

    ServicoRepository.buscarPorId = jest.fn();
    PecaRepository.buscarPorId = jest.fn();
  });

  describe('POST /os', () => {
    it('should create an ordem servico successfully', async () => {
      
const ordemData = {
  cliente: {
    id: 1,
    documento: '803.110.530-84'
  },

  veiculo: {
    id: 1,
    placa: 'ABC1234'
  },

  servicos: [
    {
      id: 1,
      quantidade: 1
    },
    {
      id: 2,
      quantidade: 1
    }
  ],

  pecas: [
    {
      id: 1,
      quantidade: 1
    }
  ],

  descricao_problema: 'Problema no motor'
};


      const mockCreatedOrdem = {
        id: 1,
        cliente_id: 1,
        veiculo_id: 1,
        valor_total: 250,
        status: 'AGUARDANDO_APROVACAO',
        aprovado: false,
        servicos: [
          {
            servico_id: 1,
            quantidade: 1,
            valor_unitario: 100,
            total: 100
          },
          {
            servico_id: 2,
            quantidade: 1,
            valor_unitario: 100,
            total: 100
          }
        ],
        pecas: [
          {
            peca_id: 1,
            quantidade: 1,
            valor_unitario: 50,
            total: 50
          }
        ],
        data_criacao: '2026-06-27T00:00:00.000Z'
      };

      OrdemServicoRepository.criar.mockResolvedValue(mockCreatedOrdem);

    
      ClienteRepository.buscarPorDocumento.mockResolvedValue({
        id: 1,
        nome: 'Bruno Augusto Mathias',
        email: 'bruno.mathias@braskem.com',
        telefone: '11941292327',
        tipo_documento: 'CPF',
        documento: '803.110.530-84'
      });


      
      ClienteRepository.buscarPorId.mockResolvedValue({
        id: 1,
        nome: 'Bruno Augusto Mathias',
        email: 'bruno.mathias@braskem.com',
        telefone: '11941292327',
        tipo_documento: 'CPF',
        documento: '803.110.530-84'
      });


      VeiculoRepository.buscarPorId.mockResolvedValue({
        id: 1,
        cliente_id: 1,
        placa: 'ABC1234'
      });

      VeiculoRepository.buscarPorPlaca.mockResolvedValue({
        id: 1,
        cliente_id: 1,
        placa: 'ABC1234'
      });

      ServicoRepository.buscarPorId.mockImplementation((id) =>
        Promise.resolve({
          id: Number(id),
          nome: 'Serviço Teste',
          valor: 100,
          preco: 100,
          valor_unitario: 100
        })
      );

      PecaRepository.buscarPorId.mockImplementation((id) =>
        Promise.resolve({
          id: Number(id),
          nome: 'Peça Teste',
          valor: 50,
          preco: 50,
          valor_unitario: 50,
          quantidade: 10
        })
      );

      const response = await request(app)
        .post('/os')
        .set('Authorization', `Bearer ${token}`)
        .send(ordemData);

      if (response.status !== 201) {
        console.log('ERRO POST /os:', response.body);
      }

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCreatedOrdem);
      expect(OrdemServicoRepository.criar).toHaveBeenCalled();
    });

    it('should fail without auth token', async () => {
      const ordemData = {
        documento_cliente: '12345678909',
        veiculo_id: 1,
        placa: 'ABC1234',
        servicos: [
          {
            id: 1,
            servico_id: 1,
            quantidade: 1
          }
        ],
        descricao_problema: 'Problema no motor'
      };

      const response = await request(app)
        .post('/os')
        .send(ordemData);

      expect(response.status).toBe(401);
    });

    it('should fail with invalid data', async () => {
      const ordemData = {
        documento_cliente: '',
        veiculo_id: 1,
        servicos: [
          {
            id: 1,
            servico_id: 1,
            quantidade: 1
          }
        ],
        descricao_problema: 'Problema no motor'
      };

      const response = await request(app)
        .post('/os')
        .set('Authorization', `Bearer ${token}`)
        .send(ordemData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /os', () => {
    it('should list ordens servico', async () => {
      const mockOrdens = [
        {
          id: 1,
          cliente_id: 1,
          status: 'AGUARDANDO_APROVACAO'
        },
        {
          id: 2,
          cliente_id: 2,
          status: 'APROVADA'
        }
      ];

      OrdemServicoRepository.listar.mockResolvedValue(mockOrdens);

      const response = await request(app)
        .get('/os')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockOrdens);
      expect(OrdemServicoRepository.listar).toHaveBeenCalled();
    });
  });

  describe('GET /os/:id', () => {
    it('should return ordem servico by id', async () => {
      const mockOrdem = {
        id: 1,
        cliente_id: 1,
        status: 'AGUARDANDO_APROVACAO'
      };

      OrdemServicoRepository.buscarPorId.mockResolvedValue(mockOrdem);

      const response = await request(app)
        .get('/os/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockOrdem);
      expect(OrdemServicoRepository.buscarPorId).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent ordem', async () => {
      OrdemServicoRepository.buscarPorId.mockRejectedValue(
        new Error('Ordem de serviço não encontrada')
      );

      const response = await request(app)
        .get('/os/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        'error',
        'Ordem de serviço não encontrada'
      );
    });
  });

  describe('GET /os/cliente/:documento', () => {
    it('should return ordens by cliente documento', async () => {
      const mockOrdens = [
        {
          id: 1,
          cliente_id: 1,
          status: 'AGUARDANDO_APROVACAO'
        }
      ];

      ClienteRepository.buscarPorDocumento.mockResolvedValue({
        id: 1,
        nome: 'Cliente Teste',
        documento: '12345678909'
      });

      OrdemServicoRepository.buscarPorClienteId.mockResolvedValue(mockOrdens);

      const response = await request(app)
        .get('/os/cliente/12345678909')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockOrdens);
      expect(ClienteRepository.buscarPorDocumento).toHaveBeenCalledWith('12345678909');
      expect(OrdemServicoRepository.buscarPorClienteId).toHaveBeenCalledWith(1);
    });
  });

  describe('PATCH /os/:id/status', () => {
    it('should update ordem status successfully', async () => {
      const updateData = {
        status: 'APROVADA'
      };

      const mockUpdatedOrdem = {
        id: 1,
        status: 'APROVADA'
      };

      OrdemServicoRepository.atualizarStatus.mockResolvedValue(mockUpdatedOrdem);

      const response = await request(app)
        .patch('/os/1/status')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedOrdem);
      expect(OrdemServicoRepository.atualizarStatus).toHaveBeenCalledWith(
        '1',
        'APROVADA'
      );
    });
  });

  describe('PATCH /os/:id/approve', () => {
    it('should approve ordem successfully', async () => {
      const mockApprovedOrdem = {
        id: 1,
        cliente_id: 1,
        status: 'APROVADA',
        valor_total: 250
      };

      OrdemServicoRepository.aprovar.mockResolvedValue(mockApprovedOrdem);

      
      ClienteRepository.buscarPorId.mockResolvedValue({
        id: 1,
        nome: 'Bruno Augusto Mathias',
        email: 'bruno.mathias@braskem.com',
        telefone: '11941292327',
        tipo_documento: 'CPF',
        documento: '803.110.530-84'
      });


      const response = await request(app)
        .patch('/os/1/approve')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockApprovedOrdem);
      expect(OrdemServicoRepository.aprovar).toHaveBeenCalledWith('1', true);
    });
  });

  describe('PATCH /os/:id/advance', () => {
    it('should advance ordem status successfully', async () => {
      const mockOrdemAtual = {
        id: 1,
        cliente_id: 1,
        status: 'Recebida'
      };

      const mockAdvancedOrdem = {
        id: 1,
        cliente_id: 1,
        status: 'Em diagnóstico'
      };

      OrdemServicoRepository.buscarPorId.mockResolvedValue(mockOrdemAtual);

      OrdemServicoRepository.atualizarStatus.mockResolvedValue(mockAdvancedOrdem);

      OrdemServicoRepository.atualizarStatusOsServico.mockResolvedValue([]);

      OrdemServicoRepository.finalizarServicosOs.mockResolvedValue([]);

      

      ClienteRepository.buscarPorId.mockResolvedValue({
        id: 1,
        nome: 'Bruno Augusto Mathias',
        email: 'bruno.mathias@braskem.com',
        telefone: '11941292327',
        tipo_documento: 'CPF',
        documento: '803.110.530-84'
      });



      const response = await request(app)
        .patch('/os/1/advance')
        .set('Authorization', `Bearer ${token}`)
        .send();

      if (response.status !== 200) {
        console.log('ERRO PATCH /os/1/advance:', response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAdvancedOrdem);

      expect(OrdemServicoRepository.buscarPorId).toHaveBeenCalledWith('1');
      expect(OrdemServicoRepository.atualizarStatus).toHaveBeenCalled();
    });
  });

  describe('GET /os/:id/servicos-finalizados', () => {
    it('should return servicos finalizados with tempo medio', async () => {
      const mockServicos = [
        {
          servico_id: 1,
          valor_unitario: 100,
          total: 100,
          tempo_minutos: 120,
          tempo_medio_minutos: 120
        }
      ];

      OrdemServicoRepository.buscarServicosFinalizadosComTempoMedio.mockResolvedValue(
        mockServicos
      );

      const response = await request(app)
        .get('/os/1/servicos-finalizados')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty('ordem_servico_id', '1');
      expect(response.body).toHaveProperty('servicos_finalizados');
      expect(response.body).toHaveProperty('tempo_medio_geral_minutos');
      expect(response.body).toHaveProperty('total_servicos_finalizados');

      expect(Array.isArray(response.body.servicos_finalizados)).toBe(true);

      expect(OrdemServicoRepository.buscarServicosFinalizadosComTempoMedio)
        .toHaveBeenCalledWith('1');
    });
  });
});