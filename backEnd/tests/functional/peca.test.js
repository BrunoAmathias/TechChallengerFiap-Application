const request = require('supertest');
const app = require('../../src/server');

// Mock dos repositórios e serviços
jest.mock('../../src/infrastructure/peca.repository');

const PecaRepository = require('../../src/infrastructure/peca.repository');

describe('Peca Functional Tests (Mocked)', () => {
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
    PecaRepository.criar = jest.fn();
    PecaRepository.buscarPorId = jest.fn();
    PecaRepository.listar = jest.fn();
    PecaRepository.atualizar = jest.fn();
    PecaRepository.deletar = jest.fn();
  });

  describe('POST /pecas', () => {
    it('should create a peca successfully', async () => {
      const pecaData = {
        nome: 'Filtro de óleo',
        descricao: 'Filtro de óleo para motor',
        valor: 25.00,
        quantidade: 50
      };

      const mockCreatedPeca = { id: 1, ...pecaData };
      PecaRepository.criar.mockResolvedValue(mockCreatedPeca);

      const response = await request(app)
        .post('/pecas')
        .set('Authorization', `Bearer ${token}`)
        .send(pecaData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCreatedPeca);
      expect(PecaRepository.criar).toHaveBeenCalledWith(
        expect.objectContaining(pecaData)
      );
    });

    it('should fail without auth token', async () => {
      const pecaData = {
        nome: 'Filtro de óleo',
        descricao: 'Filtro de óleo para motor',
        valor: 25.00,
        quantidade: 50
      };

      const response = await request(app)
        .post('/pecas')
        .send(pecaData);

      expect(response.status).toBe(401);
    });

    it('should fail with invalid data', async () => {
      const pecaData = {
        nome: '', // Nome vazio
        descricao: 'Filtro de óleo para motor',
        valor: 25.00,
        quantidade: 50
      };

      const response = await request(app)
        .post('/pecas')
        .set('Authorization', `Bearer ${token}`)
        .send(pecaData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /pecas', () => {
    it('should list pecas', async () => {
      const mockPecas = [
        { id: 1, nome: 'Filtro de óleo', valor: 25.00 },
        { id: 2, nome: 'Velas de ignição', valor: 45.00 }
      ];

      PecaRepository.listar.mockResolvedValue(mockPecas);

      const response = await request(app)
        .get('/pecas')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPecas);
      expect(PecaRepository.listar).toHaveBeenCalled();
    });
  });

  describe('GET /pecas/:id', () => {
    it('should return peca by id', async () => {
      const mockPeca = { id: 1, nome: 'Filtro de óleo', valor: 25.00 };
      PecaRepository.buscarPorId.mockResolvedValue(mockPeca);

      const response = await request(app)
        .get('/pecas/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPeca);
      expect(PecaRepository.buscarPorId).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent peca', async () => {
      PecaRepository.buscarPorId.mockRejectedValue(new Error('Peça não encontrada'));

      const response = await request(app)
        .get('/pecas/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Peça não encontrada');
    });
  });

  describe('PUT /pecas/:id', () => {
    it('should update peca successfully', async () => {
      const updateData = { nome: 'Filtro de óleo Atualizado' };
      const mockUpdatedPeca = { id: 1, nome: 'Filtro de óleo Atualizado' };

      PecaRepository.atualizar.mockResolvedValue(mockUpdatedPeca);

      const response = await request(app)
        .put('/pecas/1')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedPeca);
      expect(PecaRepository.atualizar).toHaveBeenCalledWith('1', updateData);
    });
  });

  describe('DELETE /pecas/:id', () => {
    it('should delete peca successfully', async () => {
      PecaRepository.deletar.mockResolvedValue(true);

      const response = await request(app)
        .delete('/pecas/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
      expect(PecaRepository.deletar).toHaveBeenCalledWith('1');
    });
  });
});