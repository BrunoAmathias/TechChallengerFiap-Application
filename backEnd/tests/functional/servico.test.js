const request = require('supertest');
const app = require('../../src/server');

// Mock dos repositórios e serviços
jest.mock('../../src/infrastructure/servico.repository');

const ServicoRepository = require('../../src/infrastructure/servico.repository');

describe('Servico Functional Tests (Mocked)', () => {
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
    ServicoRepository.criar = jest.fn();
    ServicoRepository.buscarPorId = jest.fn();
    ServicoRepository.buscar = jest.fn();
    ServicoRepository.atualizar = jest.fn();
    ServicoRepository.deletar = jest.fn();
  });

  describe('POST /servicos', () => {
    it('should create a servico successfully', async () => {
      const servicoData = {
        nome: 'Troca de óleo',
        descricao: 'Troca completa do óleo do motor',
        valor: 150.00
      };

      const mockCreatedServico = { id: 1, ...servicoData };
      ServicoRepository.criar.mockResolvedValue(mockCreatedServico);

      const response = await request(app)
        .post('/servicos')
        .set('Authorization', `Bearer ${token}`)
        .send(servicoData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCreatedServico);
      expect(ServicoRepository.criar).toHaveBeenCalledWith(
        expect.objectContaining(servicoData)
      );
    });

    it('should fail without auth token', async () => {
      const servicoData = {
        nome: 'Troca de óleo',
        descricao: 'Troca completa do óleo do motor',
        valor: 150.00
      };

      const response = await request(app)
        .post('/servicos')
        .send(servicoData);

      expect(response.status).toBe(401);
    });

    it('should fail with invalid data', async () => {
      const servicoData = {
        nome: '', // Nome vazio
        descricao: 'Troca completa do óleo do motor',
        valor: 150.00
      };

      const response = await request(app)
        .post('/servicos')
        .set('Authorization', `Bearer ${token}`)
        .send(servicoData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /servicos', () => {
    it('should list servicos', async () => {
      const mockServicos = [
        { id: 1, nome: 'Troca de óleo', valor: 150.00 },
        { id: 2, nome: 'Alinhamento', valor: 80.00 }
      ];

      ServicoRepository.buscar.mockResolvedValue(mockServicos);

      const response = await request(app)
        .get('/servicos')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockServicos);
      expect(ServicoRepository.buscar).toHaveBeenCalled();
    });
  });

  describe('GET /servicos/:id', () => {
    it('should return servico by id', async () => {
      const mockServico = { id: 1, nome: 'Troca de óleo', valor: 150.00 };
      ServicoRepository.buscarPorId.mockResolvedValue(mockServico);

      const response = await request(app)
        .get('/servicos/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockServico);
      expect(ServicoRepository.buscarPorId).toHaveBeenCalledWith('1');
    });

    it('should return 401 for non-existent servico', async () => {
      ServicoRepository.buscarPorId.mockRejectedValue(new Error('Serviço não encontrado'));

      const response = await request(app)
        .get('/servicos/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Serviço não encontrado');
    });
  });

  describe('PUT /servicos/:id', () => {
    it('should update servico successfully', async () => {
      const updateData = { nome: 'Troca de óleo Atualizado' };
      const mockUpdatedServico = { id: 1, nome: 'Troca de óleo Atualizado' };

      ServicoRepository.atualizar.mockResolvedValue(mockUpdatedServico);

      const response = await request(app)
        .put('/servicos/1')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedServico);
      expect(ServicoRepository.atualizar).toHaveBeenCalledWith('1', updateData);
    });
  });

  describe('DELETE /servicos/:id', () => {
    it('should delete servico successfully', async () => {
      ServicoRepository.deletar.mockResolvedValue(true);

      const response = await request(app)
        .delete('/servicos/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
      expect(ServicoRepository.deletar).toHaveBeenCalledWith('1');
    });
  });
});