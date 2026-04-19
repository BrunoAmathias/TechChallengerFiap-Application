const { CriarPeca, BuscarPecas, BuscarPecaPorId, AtualizarPeca, DeletarPeca } = require('../../src/application/peca.service');
const Peca = require('../../src/domain/peca');

jest.mock('../../src/domain/peca');

describe('Peca Service', () => {
  let mockPecaRepository;

  beforeEach(() => {
    mockPecaRepository = {
      criar: jest.fn(),
      buscarPorId: jest.fn(),
      listar: jest.fn(),
      atualizar: jest.fn(),
      deletar: jest.fn()
    };

    Peca.mockClear();
  });

  describe('CriarPeca', () => {
    it('should create a peca successfully', async () => {
      const service = new CriarPeca(mockPecaRepository);
      const pecaData = {
        nome: 'Filtro de óleo',
        descricao: 'Filtro de óleo para motor',
        valor: 25.00,
        quantidade: 10
      };

      const mockPeca = { id: 1, ...pecaData };
      Peca.mockImplementation(() => mockPeca);
      mockPecaRepository.criar.mockResolvedValue(mockPeca);

      const result = await service.execute(pecaData);

      expect(Peca).toHaveBeenCalledWith(pecaData);
      expect(mockPecaRepository.criar).toHaveBeenCalledWith(mockPeca);
      expect(result).toBe(mockPeca);
    });

    it('should throw error if Peca validation fails', async () => {
      const service = new CriarPeca(mockPecaRepository);
      const pecaData = { nome: '', descricao: 'Filtro de óleo' };

      Peca.mockImplementation(() => {
        throw new Error('Nome é obrigatório');
      });

      await expect(service.execute(pecaData)).rejects.toThrow('Nome é obrigatório');
    });
  });

  describe('BuscarPecaPorId', () => {
    it('should return peca if found', async () => {
      const service = new BuscarPecaPorId(mockPecaRepository);
      const mockPeca = { id: 1, nome: 'Filtro de óleo' };

      mockPecaRepository.buscarPorId.mockResolvedValue(mockPeca);

      const result = await service.execute(1);

      expect(mockPecaRepository.buscarPorId).toHaveBeenCalledWith(1);
      expect(result).toBe(mockPeca);
    });

    it('should throw error if peca not found', async () => {
      const service = new BuscarPecaPorId(mockPecaRepository);

      mockPecaRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.execute(1)).rejects.toThrow('Peça não encontrada');
    });
  });

  describe('BuscarPecas', () => {
    it('should return list of pecas', async () => {
      const service = new BuscarPecas(mockPecaRepository);
      const mockPecas = [{ id: 1, nome: 'Filtro' }, { id: 2, nome: 'Óleo' }];

      mockPecaRepository.listar.mockResolvedValue(mockPecas);

      const result = await service.execute();

      expect(mockPecaRepository.listar).toHaveBeenCalled();
      expect(result).toBe(mockPecas);
    });
  });

  describe('AtualizarPeca', () => {
    it('should update peca successfully', async () => {
      const service = new AtualizarPeca(mockPecaRepository);
      const updateData = { nome: 'Filtro Atualizado' };
      const mockUpdatedPeca = { id: 1, nome: 'Filtro Atualizado' };

      mockPecaRepository.atualizar.mockResolvedValue(mockUpdatedPeca);

      const result = await service.execute(1, updateData);

      expect(mockPecaRepository.atualizar).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(mockUpdatedPeca);
    });

    it('should throw error if peca not found', async () => {
      const service = new AtualizarPeca(mockPecaRepository);

      mockPecaRepository.atualizar.mockResolvedValue(null);

      await expect(service.execute(1, {})).rejects.toThrow('Peça não encontrada');
    });
  });

  describe('DeletarPeca', () => {
    it('should delete peca successfully', async () => {
      const service = new DeletarPeca(mockPecaRepository);

      mockPecaRepository.deletar.mockResolvedValue(true);

      const result = await service.execute(1);

      expect(mockPecaRepository.deletar).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });
});