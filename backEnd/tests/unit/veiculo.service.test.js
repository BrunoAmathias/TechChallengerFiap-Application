const { CriarVeiculo, BuscarVeiculoPorId, listarVeiculos, atualizarVeiculo, deletarVeiculo } = require('../../src/application/veiculo.service');
const Veiculos = require('../../src/domain/veiculo');

jest.mock('../../src/domain/veiculo');

describe('Veiculo Service', () => {
  let mockVeiculoRepository;

  beforeEach(() => {
    mockVeiculoRepository = {
      criar: jest.fn(),
      buscarVeiculoPorId: jest.fn(),
      listar: jest.fn(),
      atualizar: jest.fn(),
      deletar: jest.fn()
    };

    Veiculos.mockClear();
  });

  describe('CriarVeiculo', () => {
    it('should create a veiculo successfully', async () => {
      const service = new CriarVeiculo(mockVeiculoRepository);
      const veiculoData = {
        marca: 'Toyota',
        modelo: 'Corolla',
        ano: 2020,
        placa: 'ABC-1234'
      };

      const mockVeiculo = { id: 1, ...veiculoData };
      Veiculos.mockImplementation(() => mockVeiculo);
      mockVeiculoRepository.criar.mockResolvedValue(mockVeiculo);

      const result = await service.execute(veiculoData);

      expect(Veiculos).toHaveBeenCalledWith(veiculoData);
      expect(mockVeiculoRepository.criar).toHaveBeenCalledWith(mockVeiculo);
      expect(result).toBe(mockVeiculo);
    });

    it('should throw error if Veiculo validation fails', async () => {
      const service = new CriarVeiculo(mockVeiculoRepository);
      const veiculoData = { marca: '', modelo: 'Corolla' };

      Veiculos.mockImplementation(() => {
        throw new Error('Marca é obrigatória');
      });

      await expect(service.execute(veiculoData)).rejects.toThrow('Marca é obrigatória');
    });
  });

  describe('BuscarVeiculoPorId', () => {
    it('should return veiculo if found', async () => {
      const service = new BuscarVeiculoPorId(mockVeiculoRepository);
      const mockVeiculo = { id: 1, marca: 'Toyota' };

      mockVeiculoRepository.buscarVeiculoPorId.mockResolvedValue(mockVeiculo);

      const result = await service.execute(1);

      expect(mockVeiculoRepository.buscarVeiculoPorId).toHaveBeenCalledWith(1);
      expect(result).toBe(mockVeiculo);
    });

    it('should throw error if veiculo not found', async () => {
      const service = new BuscarVeiculoPorId(mockVeiculoRepository);

      mockVeiculoRepository.buscarVeiculoPorId.mockResolvedValue(null);

      await expect(service.execute(1)).rejects.toThrow('Veiculo não encontrado');
    });
  });

  describe('listarVeiculos', () => {
    it('should return list of veiculos', async () => {
      const service = new listarVeiculos(mockVeiculoRepository);
      const mockVeiculos = [{ id: 1, marca: 'Toyota' }, { id: 2, marca: 'Honda' }];

      mockVeiculoRepository.listar.mockResolvedValue(mockVeiculos);

      const result = await service.execute();

      expect(mockVeiculoRepository.listar).toHaveBeenCalled();
      expect(result).toBe(mockVeiculos);
    });
  });

  describe('atualizarVeiculo', () => {
    it('should update veiculo successfully', async () => {
      const service = new atualizarVeiculo(mockVeiculoRepository);
      const updateData = { marca: 'Toyota Updated' };

      mockVeiculoRepository.atualizar.mockResolvedValue({ id: 1, ...updateData });

      const result = await service.execute(1, updateData);

      expect(mockVeiculoRepository.atualizar).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual({ id: 1, ...updateData });
    });
  });

  describe('deletarVeiculo', () => {
    it('should delete veiculo successfully', async () => {
      const service = new deletarVeiculo(mockVeiculoRepository);

      mockVeiculoRepository.deletar.mockResolvedValue(true);

      const result = await service.execute(1);

      expect(mockVeiculoRepository.deletar).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });
});