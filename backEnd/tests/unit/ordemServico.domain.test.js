const OrdemServico = require('../../src/domain/ordemServico');

describe('OrdemServico Domain', () => {
  describe('constructor', () => {
    it('should create a valid OrdemServico', () => {
      const ordemData = {
        id: 1,
        cliente_id: 1,
        veiculo_id: 1,
        servicos: [1, 2],
        pecas: [1],
        valor_total: 250.00,
        status: 'Recebida',
        aprovado: false
      };

      const ordem = new OrdemServico(ordemData);

      expect(ordem.id).toBe(1);
      expect(ordem.cliente_id).toBe(1);
      expect(ordem.veiculo_id).toBe(1);
      expect(ordem.servicos).toEqual([1, 2]);
      expect(ordem.pecas).toEqual([1]);
      expect(ordem.valor_total).toBe(250.00);
      expect(ordem.status).toBe('Recebida');
      expect(ordem.aprovado).toBe(false);
    });

    it('should create OrdemServico with default values', () => {
      const ordemData = {
        cliente_id: 1,
        veiculo_id: 1
      };

      const ordem = new OrdemServico(ordemData);

      expect(ordem.servicos).toEqual([]);
      expect(ordem.pecas).toEqual([]);
      expect(ordem.valor_total).toBe(0);
      expect(ordem.status).toBe('Recebida');
      expect(ordem.aprovado).toBe(false);
    });

    it('should throw error for missing cliente_id', () => {
      const ordemData = {
        veiculo_id: 1
      };

      expect(() => new OrdemServico(ordemData)).toThrow('Cliente é obrigatório');
    });

    it('should throw error for missing veiculo_id', () => {
      const ordemData = {
        cliente_id: 1
      };

      expect(() => new OrdemServico(ordemData)).toThrow('Veículo é obrigatório');
    });

    it('should throw error for invalid servicos type', () => {
      const ordemData = {
        cliente_id: 1,
        veiculo_id: 1,
        servicos: 'invalid'
      };

      expect(() => new OrdemServico(ordemData)).toThrow('Serviços devem ser uma lista');
    });

    it('should throw error for invalid pecas type', () => {
      const ordemData = {
        cliente_id: 1,
        veiculo_id: 1,
        pecas: 'invalid'
      };

      expect(() => new OrdemServico(ordemData)).toThrow('Peças devem ser uma lista');
    });

    it('should throw error for invalid valor_total', () => {
      const ordemData = {
        cliente_id: 1,
        veiculo_id: 1,
        valor_total: 'invalid'
      };

      expect(() => new OrdemServico(ordemData)).toThrow('Valor total inválido');
    });

    it('should throw error for invalid status', () => {
      const ordemData = {
        cliente_id: 1,
        veiculo_id: 1,
        status: 'Status Inválido'
      };

      expect(() => new OrdemServico(ordemData)).toThrow('Status inválido');
    });

    it('should accept all valid statuses', () => {
      const validStatuses = [
        'Recebida',
        'Em diagnóstico',
        'Aguardando aprovação',
        'Em execução',
        'Finalizada',
        'Entregue'
      ];

      validStatuses.forEach(status => {
        const ordemData = {
          cliente_id: 1,
          veiculo_id: 1,
          status: status
        };

        expect(() => new OrdemServico(ordemData)).not.toThrow();
      });
    });
  });
});