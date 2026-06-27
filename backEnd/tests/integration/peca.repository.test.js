require('dotenv').config();
const PecaRepository = require('../../src/infrastructure/repositories/peca.repository');


describe('Peca Repository Integration Tests', () => {
  let createdPecaId;

  describe('criar', () => {
    it('should create a peca', async () => {
      const pecaData = {
        nome: 'Filtro de óleo',
        descricao: 'Filtro de óleo para motor',
        valor: 25.00,
        quantidade: 50
      };

      const result = await PecaRepository.criar(pecaData);

      expect(result).toHaveProperty('id');
      expect(result.nome).toBe(pecaData.nome);
      expect(result.quantidade).toBe(pecaData.quantidade);
      createdPecaId = result.id;
    });
  });

  describe('buscarPorId', () => {
    it('should find peca by id', async () => {
      const result = await PecaRepository.buscarPorId(createdPecaId);

      expect(result).toHaveProperty('id', createdPecaId);
      expect(result.nome).toBe('Filtro de óleo');
    });

    it('should return undefined for non-existent id', async () => {
      const result = await PecaRepository.buscarPorId(99999);

      expect(result).toBeUndefined();
    });
  });

  describe('listar', () => {
    it('should list all pecas', async () => {
      const result = await PecaRepository.listar();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('atualizar', () => {
    it('should update peca', async () => {
      const updateData = {
        valor: 30.00,
        quantidade: 45
      };

      const result = await PecaRepository.atualizar(createdPecaId, updateData);

      expect(parseFloat(result.valor)).toBe(30.00);
      expect(result.quantidade).toBe(45);
    });
  });

  describe('deletar', () => {
    it('should delete peca', async () => {
      await PecaRepository.deletar(createdPecaId);

      const result = await PecaRepository.buscarPorId(createdPecaId);
      expect(result).toBeUndefined();
    });
  });
});