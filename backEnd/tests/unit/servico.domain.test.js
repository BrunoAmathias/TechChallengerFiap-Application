const Servico = require('../../src/domain/servico');

describe('Servico Domain', () => {
  describe('constructor', () => {
    it('should create a valid Servico', () => {
      const servicoData = {
        id: 1,
        nome: 'Troca de óleo',
        descricao: 'Troca completa do óleo do motor',
        valor: 150.00
      };

      const servico = new Servico(servicoData);

      expect(servico.id).toBe(1);
      expect(servico.nome).toBe('Troca de óleo');
      expect(servico.descricao).toBe('Troca completa do óleo do motor');
      expect(servico.valor).toBe(150.00);
    });

    it('should throw error for missing nome', () => {
      const servicoData = {
        descricao: 'Troca completa do óleo do motor',
        valor: 150.00
      };

      expect(() => new Servico(servicoData)).toThrow('Nome do serviço é obrigatório');
    });

    it('should throw error for missing descricao', () => {
      const servicoData = {
        nome: 'Troca de óleo',
        valor: 150.00
      };

      expect(() => new Servico(servicoData)).toThrow('Descrição do serviço é obrigatório');
    });

    it('should throw error for missing valor', () => {
      const servicoData = {
        nome: 'Troca de óleo',
        descricao: 'Troca completa do óleo do motor'
      };

      expect(() => new Servico(servicoData)).toThrow('Valor do serviço é obrigatório');
    });
  });
});