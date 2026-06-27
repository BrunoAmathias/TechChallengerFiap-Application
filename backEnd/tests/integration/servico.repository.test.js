require('dotenv').config();
const ServicoRepository = require('../../src/infrastructure/repositories/servico.repository');


describe('Servico Repository Integration Tests', () => {
  let createdServicoId;

  describe('criar', () => {
    it('should create a servico', async () => {
      const servicoData = {
        nome: 'Troca de óleo',
        descricao: 'Troca completa do óleo do motor',
        valor: 150.00
      };

      const result = await ServicoRepository.criar(servicoData);

      expect(result).toHaveProperty('id');
      expect(result.nome).toBe(servicoData.nome);
      expect(result.descricao).toBe(servicoData.descricao);
      createdServicoId = result.id;
    });
  });

  describe('buscarPorId', () => {
    it('should find servico by id', async () => {
      const result = await ServicoRepository.buscarPorId(createdServicoId);

      expect(result).toHaveProperty('id', createdServicoId);
      expect(result.nome).toBe('Troca de óleo');
    });

    it('should return undefined for non-existent id', async () => {
      const result = await ServicoRepository.buscarPorId(99999);

      expect(result).toBeUndefined();
    });
  });

  describe('buscar', () => {
    it('should list all servicos', async () => {
      const result = await ServicoRepository.buscar();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('atualizar', () => {
    it('should update servico', async () => {
      const updateData = {
        nome: 'Troca de óleo Sintético',
        valor: 180.00
      };

      const result = await ServicoRepository.atualizar(createdServicoId, updateData);

      expect(result.nome).toBe('Troca de óleo Sintético');
      expect(parseFloat(result.valor)).toBe(180.00);

    });
  });

  describe('deletar', () => {
    it('should delete servico', async () => {
      await ServicoRepository.deletar(createdServicoId);

      const result = await ServicoRepository.buscarPorId(createdServicoId);
      expect(result).toBeUndefined();
    });
  });
});