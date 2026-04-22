const Veiculos = require('../../src/domain/veiculo');

describe('Veiculos Domain', () => {
  describe('constructor', () => {
    it('should create a valid Veiculo', () => {
      const veiculoData = {
        id: 1,
        marca: 'Toyota',
        modelo: 'Corolla',
        ano: 2020,
        placa: 'ABC1234'
      };

      const veiculo = new Veiculos(veiculoData);

      expect(veiculo.id).toBe(1);
      expect(veiculo.marca).toBe('Toyota');
      expect(veiculo.modelo).toBe('Corolla');
      expect(veiculo.ano).toBe(2020);
      expect(veiculo.placa).toBe('ABC1234');
    });

    it('should throw error for missing marca', () => {
      const veiculoData = {
        modelo: 'Corolla',
        ano: 2020,
        placa: 'ABC1234'
      };

      expect(() => new Veiculos(veiculoData)).toThrow('Marca é obrigatória');
    });

    it('should throw error for missing modelo', () => {
      const veiculoData = {
        marca: 'Toyota',
        ano: 2020,
        placa: 'ABC1234'
      };

      expect(() => new Veiculos(veiculoData)).toThrow('Modelo é obrigatório');
    });

    it('should throw error for missing ano', () => {
      const veiculoData = {
        marca: 'Toyota',
        modelo: 'Corolla',
        placa: 'ABC1234'
      };

      expect(() => new Veiculos(veiculoData)).toThrow('Ano é obrigatório');
    });

    it('should throw error for missing placa', () => {
      const veiculoData = {
        marca: 'Toyota',
        modelo: 'Corolla',
        ano: 2020
      };

      expect(() => new Veiculos(veiculoData)).toThrow('Placa é obrigatória');
    });
  });
});