const { CriarServico, BuscarServico, BuscarServicoPorId, AtualizarServico, DeletarServico } = require('../../src/application/servico.service');
const Servico = require('../../src/domain/servico');

jest.mock('../../src/domain/servico');

describe('Servico Service', () => {
  let mockServicoRepository;

  beforeEach(() => {
    mockServicoRepository = {
      criar: jest.fn(),
      buscar: jest.fn(),
      buscarPorId: jest.fn(),
      atualizar: jest.fn(),
      deletar: jest.fn()
    };

    Servico.mockClear();
  });

  describe('CriarServico', () => {
    it('should create a servico successfully', async () => {
      const service = new CriarServico(mockServicoRepository);
      const servicoData = {
        nome: 'Troca de óleo',
        descricao: 'Troca completa do óleo do motor',
        valor: 150.00
      };

      const mockServico = { id: 1, ...servicoData };
      Servico.mockImplementation(() => mockServico);
      mockServicoRepository.criar.mockResolvedValue(mockServico);

      const result = await service.execute(servicoData);

      expect(Servico).toHaveBeenCalledWith(servicoData);
      expect(mockServicoRepository.criar).toHaveBeenCalledWith(mockServico);
      expect(result).toBe(mockServico);
    });

    it('should throw error if Servico validation fails', async () => {
      const service = new CriarServico(mockServicoRepository);
      const servicoData = { nome: '', descricao: 'Troca de óleo' };

      Servico.mockImplementation(() => {
        throw new Error('Nome do serviço é obrigatório');
      });

      await expect(service.execute(servicoData)).rejects.toThrow('Nome do serviço é obrigatório');
    });
  });

  describe('BuscarServicoPorId', () => {
    it('should return servico if found', async () => {
      const service = new BuscarServicoPorId(mockServicoRepository);
      const mockServico = { id: 1, nome: 'Troca de óleo' };

      mockServicoRepository.buscarPorId.mockResolvedValue(mockServico);

      const result = await service.execute(1);

      expect(mockServicoRepository.buscarPorId).toHaveBeenCalledWith(1);
      expect(result).toBe(mockServico);
    });

    it('should throw error if servico not found', async () => {
      const service = new BuscarServicoPorId(mockServicoRepository);

      mockServicoRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.execute(1)).rejects.toThrow('Serviço não encontrado');
    });
  });

  describe('BuscarServico', () => {
    it('should return list of servicos', async () => {
      const service = new BuscarServico(mockServicoRepository);
      const mockServicos = [{ id: 1, nome: 'Troca de óleo' }, { id: 2, nome: 'Revisão' }];

      mockServicoRepository.buscar.mockResolvedValue(mockServicos);

      const result = await service.execute();

      expect(mockServicoRepository.buscar).toHaveBeenCalled();
      expect(result).toBe(mockServicos);
    });
  });

  describe('AtualizarServico', () => {
    it('should update servico successfully', async () => {
      const service = new AtualizarServico(mockServicoRepository);
      const updateData = { nome: 'Troca de óleo Atualizado' };
      const mockUpdatedServico = { id: 1, nome: 'Troca de óleo Atualizado' };

      mockServicoRepository.atualizar.mockResolvedValue(mockUpdatedServico);

      const result = await service.execute(1, updateData);

      expect(mockServicoRepository.atualizar).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(mockUpdatedServico);
    });

    it('should throw error if servico not found', async () => {
      const service = new AtualizarServico(mockServicoRepository);

      mockServicoRepository.atualizar.mockResolvedValue(null);

      await expect(service.execute(1, {})).rejects.toThrow('Serviço não encontrado');
    });
  });

  describe('DeletarServico', () => {
    it('should delete servico successfully', async () => {
      const service = new DeletarServico(mockServicoRepository);

      mockServicoRepository.deletar.mockResolvedValue(true);

      const result = await service.execute(1);

      expect(mockServicoRepository.deletar).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });
});