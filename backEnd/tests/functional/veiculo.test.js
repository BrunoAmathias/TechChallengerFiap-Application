const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/server');

// 🔥 força um secret fixo para testes
process.env.JWT_SECRET = 'test_secret';

// Mock do repositório
jest.mock('../../src/infrastructure/repositories/veiculo.repository');

const VeiculoRepository = require('../../src/infrastructure/repositories/veiculo.repository');

describe('Veiculo Functional Tests (Mocked)', () => {
  let token;

  beforeAll(() => {
    // 🔥 token válido garantido
    token = jwt.sign(
      { id: 1, email: 'teste@email.com' },
      process.env.JWT_SECRET
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();

    VeiculoRepository.criar = jest.fn();
    VeiculoRepository.buscarVeiculoPorId = jest.fn();
    VeiculoRepository.listar = jest.fn();
    VeiculoRepository.atualizar = jest.fn();
    VeiculoRepository.deletar = jest.fn();
  });

  describe('POST /veiculos', () => {
    it('should create a veiculo successfully', async () => {
      const veiculoData = {
        placa: 'ABC1234',
        modelo: 'Civic',
        marca: 'Honda',
        ano: 2020
      };

      const mockCreatedVeiculo = { id: 1, ...veiculoData };
      VeiculoRepository.criar.mockResolvedValue(mockCreatedVeiculo);

      const response = await request(app)
        .post('/veiculos')
        .set('Authorization', `Bearer ${token}`)
        .send(veiculoData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCreatedVeiculo);

      expect(VeiculoRepository.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          marca: 'Honda',
          modelo: 'Civic',
          ano: 2020,
          placa: 'ABC1234'
        })
      );
    });

    it('should fail without auth token', async () => {
      const response = await request(app)
        .post('/veiculos')
        .send({
          placa: 'ABC1234',
          modelo: 'Civic',
          marca: 'Honda',
          ano: 2020
        });

      expect(response.status).toBe(401);
    });

    it('should fail with invalid data', async () => {
      const response = await request(app)
        .post('/veiculos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          placa: '', // inválido
          modelo: 'Civic',
          marca: 'Honda',
          ano: 2020
        });

      // 🔥 agora sim vai cair na validação
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /veiculos', () => {
    it('should list veiculos', async () => {
      const mockVeiculos = [
        { id: 1, placa: 'ABC1234', modelo: 'Civic' },
        { id: 2, placa: 'DEF5678', modelo: 'Corolla' }
      ];

      VeiculoRepository.listar.mockResolvedValue(mockVeiculos);

      const response = await request(app)
        .get('/veiculos')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVeiculos);
    });
  });

  describe('GET /veiculos/:id', () => {
    it('should return veiculo by id', async () => {
      const mockVeiculo = { id: 1, placa: 'ABC1234', modelo: 'Civic' };

      VeiculoRepository.buscarVeiculoPorId.mockResolvedValue(mockVeiculo);

      const response = await request(app)
        .get('/veiculos/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVeiculo);
    });

    it('should return 400 when not found', async () => {
      VeiculoRepository.buscarVeiculoPorId.mockResolvedValue(null);

      const response = await request(app)
        .get('/veiculos/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /veiculos/:id', () => {
    it('should update veiculo successfully', async () => {
      const updateData = { modelo: 'Civic Atualizado' };
      const mockUpdatedVeiculo = { id: 1, modelo: 'Civic Atualizado' };

      VeiculoRepository.atualizar.mockResolvedValue(mockUpdatedVeiculo);

      const response = await request(app)
        .put('/veiculos/1')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedVeiculo);
    });
  });

  describe('DELETE /veiculos/:id', () => {
    it('should delete veiculo successfully', async () => {
      VeiculoRepository.deletar.mockResolvedValue(true);

      const response = await request(app)
        .delete('/veiculos/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
    });
  });
});