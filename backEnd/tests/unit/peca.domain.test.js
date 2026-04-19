const Peca = require('../../src/domain/peca');

describe('Peca Domain', () => {
  describe('constructor', () => {
    it('should create a valid Peca', () => {
      const pecaData = {
        id: 1,
        nome: 'Filtro de óleo',
        descricao: 'Filtro de óleo para motor',
        valor: 25.00,
        quantidade: 10
      };

      const peca = new Peca(pecaData);

      expect(peca.id).toBe(1);
      expect(peca.nome).toBe('Filtro de óleo');
      expect(peca.descricao).toBe('Filtro de óleo para motor');
      expect(peca.valor).toBe(25.00);
      expect(peca.quantidade).toBe(10);
    });

    it('should throw error for missing nome', () => {
      const pecaData = {
        descricao: 'Filtro de óleo para motor',
        valor: 25.00,
        quantidade: 10
      };

      expect(() => new Peca(pecaData)).toThrow('Nome é obrigatório');
    });

    it('should throw error for missing descricao', () => {
      const pecaData = {
        nome: 'Filtro de óleo',
        valor: 25.00,
        quantidade: 10
      };

      expect(() => new Peca(pecaData)).toThrow('Descrição é obrigatória');
    });

    it('should throw error for missing valor', () => {
      const pecaData = {
        nome: 'Filtro de óleo',
        descricao: 'Filtro de óleo para motor',
        quantidade: 10
      };

      expect(() => new Peca(pecaData)).toThrow('Valor é obrigatório');
    });
  });
});