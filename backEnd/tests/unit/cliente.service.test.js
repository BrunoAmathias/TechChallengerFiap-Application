const { CriarCliente, BuscarClientePorId, ListarClientes, AtualizarCliente, DeletarCliente } = require('../../src/application/cliente.service');
const Cliente = require('../../src/domain/cliente');

jest.mock('../../src/domain/cliente');

describe('Cliente Service', () => {
  let mockClienteRepository;
  let mockValidador;

  beforeEach(() => {
    mockClienteRepository = {
      criar: jest.fn(),
      buscarPorId: jest.fn(),
      listar: jest.fn(),
      atualizar: jest.fn(),
      deletar: jest.fn()
    };

    mockValidador = {
      validate: jest.fn(),
      formatar: jest.fn()
    };

    Cliente.mockClear();
  });

  describe('CriarCliente', () => {
    it('should create a cliente successfully', async () => {
      const service = new CriarCliente(mockClienteRepository, mockValidador);
      const clienteData = {
        nome: 'João Silva',
        email: 'joao@example.com',
        tipo_documento: 'CPF',
        documento: '12345678909'
      };

      const mockCliente = { id: 1, ...clienteData };
      Cliente.mockImplementation(() => mockCliente);
      mockClienteRepository.criar.mockResolvedValue(mockCliente);

      const result = await service.execute(clienteData);

      expect(Cliente).toHaveBeenCalledWith(clienteData, mockValidador);
      expect(mockClienteRepository.criar).toHaveBeenCalledWith(mockCliente);
      expect(result).toBe(mockCliente);
    });

    it('should throw error if Cliente validation fails', async () => {
      const service = new CriarCliente(mockClienteRepository, mockValidador);
      const clienteData = { nome: '', email: 'joao@example.com' };

      Cliente.mockImplementation(() => {
        throw new Error('Nome é obrigatório');
      });

      await expect(service.execute(clienteData)).rejects.toThrow('Nome é obrigatório');
    });
  });

  describe('BuscarClientePorId', () => {
    it('should return cliente if found', async () => {
      const service = new BuscarClientePorId(mockClienteRepository);
      const mockCliente = { id: 1, nome: 'João Silva' };

      mockClienteRepository.buscarPorId.mockResolvedValue(mockCliente);

      const result = await service.execute(1);

      expect(mockClienteRepository.buscarPorId).toHaveBeenCalledWith(1);
      expect(result).toBe(mockCliente);
    });

    it('should throw error if cliente not found', async () => {
      const service = new BuscarClientePorId(mockClienteRepository);

      mockClienteRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.execute(1)).rejects.toThrow('Cliente não encontrado');
    });
  });

  describe('ListarClientes', () => {
    it('should return list of clientes', async () => {
      const service = new ListarClientes(mockClienteRepository);
      const mockClientes = [{ id: 1, nome: 'João' }, { id: 2, nome: 'Maria' }];

      mockClienteRepository.listar.mockResolvedValue(mockClientes);

      const result = await service.execute();

      expect(mockClienteRepository.listar).toHaveBeenCalled();
      expect(result).toBe(mockClientes);
    });
  });

  describe('AtualizarCliente', () => {
    it('should update cliente successfully', async () => {
      const service = new AtualizarCliente(mockClienteRepository, mockValidador);
      const updateData = { nome: 'João Silva Atualizado' };

      mockClienteRepository.atualizar.mockResolvedValue({ id: 1, ...updateData });

      const result = await service.execute(1, updateData);

      expect(mockClienteRepository.atualizar).toHaveBeenCalledWith(1, updateData, mockValidador);
      expect(result).toEqual({ id: 1, ...updateData });
    });
  });

  describe('DeletarCliente', () => {
    it('should delete cliente successfully', async () => {
      const service = new DeletarCliente(mockClienteRepository);

      mockClienteRepository.deletar.mockResolvedValue(true);

      const result = await service.execute(1);

      expect(mockClienteRepository.deletar).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });
});