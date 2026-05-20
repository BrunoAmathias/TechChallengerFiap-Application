const request = require('supertest');
const app = require('../../src/server');

// Mock dos repositórios e serviços
jest.mock('../../src/infrastructure/ordemServico.repository');
jest.mock('../../src/infrastructure/cliente.repository');
jest.mock('../../src/infrastructure/veiculo.repository');
jest.mock('../../src/infrastructure/servico.repository');
jest.mock('../../src/infrastructure/peca.repository');

const OrdemServicoRepository = require('../../src/infrastructure/ordemServico.repository');
const ClienteRepository = require('../../src/infrastructure/cliente.repository');
const VeiculoRepository = require('../../src/infrastructure/veiculo.repository');
const ServicoRepository = require('../../src/infrastructure/servico.repository');
const PecaRepository = require('../../src/infrastructure/peca.repository');

describe('OrdemServico Functional Tests (Mocked)', () => {
  let token;

  beforeAll(async () => {
    // Mock do login para obter token
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

    // Setup dos mocks
    OrdemServicoRepository.criar = jest.fn();
    OrdemServicoRepository.buscar = jest.fn();
    OrdemServicoRepository.buscarPorId = jest.fn();
    OrdemServicoRepository.buscarPorCliente = jest.fn();
    OrdemServicoRepository.atualizarStatus = jest.fn();
    OrdemServicoRepository.aprovar = jest.fn();
    OrdemServicoRepository.avancarStatus = jest.fn();
    OrdemServicoRepository.buscarServicosFinalizadosComTempoMedio = jest.fn();

    ClienteRepository.buscarPorId = jest.fn();
    VeiculoRepository.buscarPorId = jest.fn();
    ServicoRepository.buscarPorId = jest.fn();
    PecaRepository.buscarPorId = jest.fn();
  });

  describe('POST /os', () => {
    it('should create an ordem servico successfully', async () => {
      const ordemData = {
        cliente_id: 1,
        veiculo_id: 1,
        servicos: [1, 2],
        pecas: [1],
        descricao_problema: 'Problema no motor'
      };

      const mockCreatedOrdem = {
        id: 1,
        ...ordemData,
        status: 'AGUARDANDO_APROVACAO',
        data_criacao: new Date()
      };

      OrdemServicoRepository.criar.mockResolvedValue(mockCreatedOrdem);
      ClienteRepository.buscarPorId.mockResolvedValue({ id: 1, nome: 'Cliente Teste' });
      VeiculoRepository.buscarPorId.mockResolvedValue({ id: 1, placa: 'ABC1234' });
      ServicoRepository.buscarPorId.mockResolvedValue({ id: 1, nome: 'Troca de óleo' });
      PecaRepository.buscarPorId.mockResolvedValue({ id: 1, nome: 'Filtro de óleo' });

      const response = await request(app)
        .post('/os')
        .set('Authorization', `Bearer ${token}`)
        .send(ordemData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCreatedOrdem);
      expect(OrdemServicoRepository.criar).toHaveBeenCalledWith(
        expect.objectContaining(ordemData)
      );
    });

    it('should fail without auth token', async () => {
      const ordemData = {
        cliente_id: 1,
        veiculo_id: 1,
        servicos: [1],
        descricao_problema: 'Problema no motor'
      };

      const response = await request(app)
        .post('/os')
        .send(ordemData);

      expect(response.status).toBe(401);
    });

    it('should fail with invalid data', async () => {
      const ordemData = {
        cliente_id: '', // Cliente vazio
        veiculo_id: 1,
        servicos: [1],
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
        { id: 1, cliente_id: 1, status: 'AGUARDANDO_APROVACAO' },
        { id: 2, cliente_id: 2, status: 'APROVADA' }
      ];

      OrdemServicoRepository.buscar.mockResolvedValue(mockOrdens);

      const response = await request(app)
        .get('/os')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockOrdens);
      expect(OrdemServicoRepository.buscar).toHaveBeenCalled();
    });
  });

  describe('GET /os/:id', () => {
    it('should return ordem servico by id', async () => {
      const mockOrdem = { id: 1, cliente_id: 1, status: 'AGUARDANDO_APROVACAO' };
      OrdemServicoRepository.buscarPorId.mockResolvedValue(mockOrdem);

      const response = await request(app)
        .get('/os/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockOrdem);
      expect(OrdemServicoRepository.buscarPorId).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent ordem', async () => {
      OrdemServicoRepository.buscarPorId.mockRejectedValue(new Error('Ordem de serviço não encontrada'));

      const response = await request(app)
        .get('/os/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Ordem de serviço não encontrada');
    });
  });

  describe('GET /os/cliente/:documento', () => {
    it('should return ordens by cliente documento', async () => {
      const mockOrdens = [
        { id: 1, cliente_id: 1, status: 'AGUARDANDO_APROVACAO' }
      ];

      OrdemServicoRepository.buscarPorCliente.mockResolvedValue(mockOrdens);
      ClienteRepository.buscarPorId.mockResolvedValue({ id: 1, documento: '12345678909' });

      const response = await request(app)
        .get('/os/cliente/12345678909')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockOrdens);
    });
  });

  describe('PATCH /os/:id/status', () => {
    it('should update ordem status successfully', async () => {
      const updateData = { status: 'APROVADA' };
      const mockUpdatedOrdem = { id: 1, status: 'APROVADA' };

      OrdemServicoRepository.atualizarStatus.mockResolvedValue(mockUpdatedOrdem);

      const response = await request(app)
        .patch('/os/1/status')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedOrdem);
      expect(OrdemServicoRepository.atualizarStatus).toHaveBeenCalledWith('1', 'APROVADA');
    });
  });

  describe('PATCH /os/:id/approve', () => {
    it('should approve ordem successfully', async () => {
      const mockApprovedOrdem = { id: 1, status: 'APROVADA' };

      OrdemServicoRepository.aprovar.mockResolvedValue(mockApprovedOrdem);
      ClienteRepository.buscarPorId.mockResolvedValue({ id: 1, nome: 'Cliente Teste' });

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
      const mockAdvancedOrdem = { id: 1, status: 'EM_ANDAMENTO' };

      OrdemServicoRepository.avancarStatus.mockResolvedValue(mockAdvancedOrdem);
      ClienteRepository.buscarPorId.mockResolvedValue({ id: 1, nome: 'Cliente Teste' });

      const response = await request(app)
        .patch('/os/1/advance')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAdvancedOrdem);
      expect(OrdemServicoRepository.avancarStatus).toHaveBeenCalledWith('1');
    });
  });

  describe('GET /os/:id/servicos-finalizados', () => {
    it('should return servicos finalizados with tempo medio', async () => {
      const mockServicos = [
        { servico_id: 1, tempo_medio: 120 }
      ];

      OrdemServicoRepository.buscarServicosFinalizadosComTempoMedio.mockResolvedValue(mockServicos);

      const response = await request(app)
        .get('/os/1/servicos-finalizados')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockServicos);
      expect(OrdemServicoRepository.buscarServicosFinalizadosComTempoMedio).toHaveBeenCalledWith('1');
    });
  });
});