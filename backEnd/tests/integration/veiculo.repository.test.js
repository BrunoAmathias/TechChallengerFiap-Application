require('dotenv').config();
const pool = require('../../src/infrastructure/database/connection'); // ← caminho correto
const VeiculoRepository = require('../../src/infrastructure/repositories/veiculo.repository');

describe('Veiculo Repository Integration Tests', () => {
  let createdVeiculoId;

  beforeAll(async () => {
    await pool.query("DELETE FROM veiculos WHERE placa = 'ABC1234'");
  });

  describe('criar', () => {
    it('should create a veiculo', async () => {
      const veiculoData = {
        placa: 'ABC1234',
        modelo: 'Civic',
        marca: 'Honda',
        ano: 2020
      };

      const result = await VeiculoRepository.criar(veiculoData);

      expect(result).toHaveProperty('id');
      expect(result.placa).toBe(veiculoData.placa);
      expect(result.modelo).toBe(veiculoData.modelo);
      createdVeiculoId = result.id;
    });
  });

  describe('buscarPorId', () => {
    it('should find veiculo by id', async () => {
      const result = await VeiculoRepository.buscarVeiculoPorId(createdVeiculoId);

      expect(result).toHaveProperty('id', createdVeiculoId);
      expect(result.placa).toBe('ABC1234');
    });

    it('should return undefined for non-existent id', async () => {
      const result = await VeiculoRepository.buscarVeiculoPorId(99999);

      expect(result).toBeUndefined();
    });
  });

  describe('listar', () => {
    it('should list veiculos', async () => {
      const result = await VeiculoRepository.listar();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('atualizar', () => {
    it('should update veiculo', async () => {
      const updateData = {
        modelo: 'Civic EX'
      };

      const result = await VeiculoRepository.atualizar(createdVeiculoId, updateData);

      expect(result.modelo).toBe('Civic EX');
    });
  });

  describe('deletar', () => {
    it('should delete veiculo', async () => {
      await VeiculoRepository.deletar(createdVeiculoId);

      const result = await VeiculoRepository.buscarVeiculoPorId(createdVeiculoId);
      expect(result).toBeUndefined();
    });
  });
});