require('dotenv').config();
const ClienteRepository = require('../../src/infrastructure/cliente.repository');


describe('Cliente Repository Integration Tests', () => {
  let createdClienteId;

  describe('criar', () => {
    it('should create a cliente', async () => {
      const clienteData = {
        nome: 'Test Cliente',
        telefone: '123456789',
        email: 'test@teste.com', 
        tipo_documento: 'CPF',
        documento: '12345678909'
      };

      const result = await ClienteRepository.criar(clienteData);

      expect(result).toHaveProperty('id');
      expect(result.nome).toBe(clienteData.nome);
      expect(result.telefone).toBe(clienteData.telefone);
      createdClienteId = result.id;
    });
  });

  describe('buscarPorId', () => {
    it('should find cliente by id', async () => {
      const result = await ClienteRepository.buscarPorId(createdClienteId);

      expect(result).toHaveProperty('id', createdClienteId);
      expect(result.nome).toBe('Test Cliente');
    });

    it('should return null for non-existent id', async () => {
      const result = await ClienteRepository.buscarPorId(99999);

      expect(result).toBeUndefined();
    });
  });

  describe('listar', () => {
    it('should list clientes', async () => {
      const result = await ClienteRepository.listar();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('atualizar', () => {
    it('should update cliente', async () => {
      const updateData = {
        nome: 'Updated Cliente'
      };

      const result = await ClienteRepository.atualizar(createdClienteId, updateData);

      expect(result.nome).toBe('Updated Cliente');
    });
  });

  describe('deletar', () => {
    it('should delete cliente', async () => {
      await ClienteRepository.deletar(createdClienteId);

      const result = await ClienteRepository.buscarPorId(createdClienteId);
      expect(result).toBeUndefined();
    });
  });
});