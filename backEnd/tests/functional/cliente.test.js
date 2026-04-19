// 🔥 Mocks PRIMEIRO (ANTES de qualquer import do app)
jest.mock('../../src/infrastructure/cliente.repository');
jest.mock('../../src/infrastructure/utils/cpf-validator');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/server');

const ClienteRepository = require('../../src/infrastructure/cliente.repository');
const ValidarDocumento = require('../../src/infrastructure/utils/cpf-validator');

describe('Cliente Functional Tests (Mocked)', () => {
  let token;

  beforeAll(() => {
    // 🔐 Token válido (sem depender de login)
    token = jwt.sign(
      { id: 1, email: 'teste@email.com' },
      process.env.JWT_SECRET
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // 🔥 MOCK UNIVERSAL DO CPF (funciona para qualquer implementação)
    jest.spyOn(ValidarDocumento.prototype, 'validate').mockReturnValue(true);
    jest.spyOn(ValidarDocumento.prototype, 'formatar').mockImplementation(doc => doc);
    // fallback caso seja classe
    if (ValidarDocumento.mockImplementation) {
      ValidarDocumento.mockImplementation(() => ({
        validate: jest.fn().mockReturnValue(true),
        formatar: jest.fn((doc) => doc)
      }));
    }

    // 🔧 Mock do repository
    ClienteRepository.criar = jest.fn();
    ClienteRepository.buscarPorId = jest.fn();
    ClienteRepository.listar = jest.fn();
    ClienteRepository.atualizar = jest.fn();
    ClienteRepository.deletar = jest.fn();
  });

  // =========================
  // POST
  // =========================
  describe('POST /clientes', () => {
    it('should create a cliente successfully', async () => {
      const clienteData = {
        nome: 'João Silva',
        email: 'joao@example.com',
        telefone: '123456789',
        tipo_documento: 'CPF',
        documento: '52998224725'
      };

      const mockCreatedCliente = { id: 1, ...clienteData };
      ClienteRepository.criar.mockResolvedValue(mockCreatedCliente);

      const response = await request(app)
        .post('/clientes')
        .set('Authorization', `Bearer ${token}`)
        .send(clienteData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCreatedCliente);
      expect(ClienteRepository.criar).toHaveBeenCalledWith(
        expect.objectContaining(clienteData)
      );
    });

    it('should fail without auth token', async () => {
      const response = await request(app)
        .post('/clientes')
        .send({
          nome: 'João Silva',
          email: 'joao@example.com',
          tipo_documento: 'CPF',
          documento: '52998224725'
        });

      expect(response.status).toBe(401);
    });

    it('should fail with invalid data', async () => {
      const response = await request(app)
        .post('/clientes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nome: '', // inválido
          email: 'joao@example.com',
          tipo_documento: 'CPF',
          documento: '52998224725'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  // =========================
  // GET LIST
  // =========================
  describe('GET /clientes', () => {
    it('should list clientes', async () => {
      const mockClientes = [
        { id: 1, nome: 'Cliente 1' },
        { id: 2, nome: 'Cliente 2' }
      ];

      ClienteRepository.listar.mockResolvedValue(mockClientes);

      const response = await request(app)
        .get('/clientes')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockClientes);
      expect(ClienteRepository.listar).toHaveBeenCalled();
    });
  });

  // =========================
  // GET BY ID
  // =========================
  describe('GET /clientes/:id', () => {
    it('should return cliente by id', async () => {
      const mockCliente = { id: 1, nome: 'João Silva' };
      ClienteRepository.buscarPorId.mockResolvedValue(mockCliente);

      const response = await request(app)
        .get('/clientes/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCliente);
      expect(ClienteRepository.buscarPorId).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent cliente', async () => {
      ClienteRepository.buscarPorId.mockResolvedValue(null);

      const response = await request(app)
        .get('/clientes/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  // =========================
  // PUT
  // =========================
  describe('PUT /clientes/:id', () => {
    it('should update cliente successfully', async () => {
      const updateData = { nome: 'João Atualizado' };
      const mockUpdatedCliente = { id: 1, ...updateData };

      ClienteRepository.atualizar.mockResolvedValue(mockUpdatedCliente);

      const response = await request(app)
        .put('/clientes/1')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedCliente);
      expect(ClienteRepository.atualizar).toHaveBeenCalledWith(
        '1',
        updateData,
        expect.any(Object)
      );
    });
  });

  // =========================
  // DELETE
  // =========================
  describe('DELETE /clientes/:id', () => {
    it('should delete cliente successfully', async () => {
      ClienteRepository.deletar.mockResolvedValue(true);

      const response = await request(app)
        .delete('/clientes/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
      expect(ClienteRepository.deletar).toHaveBeenCalledWith('1');
    });
  });
});