require('dotenv').config();
const OrdemServicoRepository = require('../../src/infrastructure/repositories/ordemServico.repository');
const ClienteRepository = require('../../src/infrastructure/repositories/cliente.repository');
const VeiculoRepository = require('../../src/infrastructure/repositories/veiculo.repository');
const ServicoRepository = require('../../src/infrastructure/repositories/servico.repository');
const PecaRepository = require('../../src/infrastructure/repositories/peca.repository');

describe('OrdemServico Repository Integration Tests', () => {
  let createdOrdemId;
  let testClienteId;
  let testVeiculoId;
  let testServicoId;
  let testPecaId;

  beforeAll(async () => {
    const cliente = await ClienteRepository.criar({
      nome: 'Cliente Teste OS',
      telefone: '987654321',
      email: 'testos@teste.com',
      tipo_documento: 'CPF',
      documento: '98765432100'
    });
    testClienteId = cliente.id;

    const veiculo = await VeiculoRepository.criar({
      placa: 'XYZ9999',
      modelo: 'Corolla',
      marca: 'Toyota',
      ano: 2021
    });
    testVeiculoId = veiculo.id;

    const servico = await ServicoRepository.criar({
      nome: 'Alinhamento',
      descricao: 'Alinhamento e balanceamento',
      valor: 80.00
    });
    testServicoId = servico.id;

    const peca = await PecaRepository.criar({
      nome: 'Bateria',
      descricao: 'Bateria 60Ah',
      valor: 350.00,
      quantidade: 10  // era quantidade_estoque
    });
    testPecaId = peca.id;
  });

  afterAll(async () => {
    await ClienteRepository.deletar(testClienteId);
    await ServicoRepository.deletar(testServicoId);
    await PecaRepository.deletar(testPecaId);
    await VeiculoRepository.deletar(testVeiculoId);
  });

  describe('criar', () => {
    it('should create an ordem servico', async () => {
      const ordemData = {
        cliente_id: testClienteId,
        veiculo_id: testVeiculoId,
        valor_total: 430.00,
        status: 'Aguardando aprovação',
        aprovado: false
      };

      // repositório recebe (ordem, servicosItems, pecasItems)
      const servicosItems = [{
        servico_id: testServicoId,
        quantidade: 1,
        valor_unitario: 80.00,
        total: 80.00
      }];

      const pecasItems = [{
        peca_id: testPecaId,
        quantidade: 1,
        valor_unitario: 350.00,
        total: 350.00
      }];

      const result = await OrdemServicoRepository.criar(ordemData, servicosItems, pecasItems);

      expect(result).toHaveProperty('id');
      expect(result.cliente_id).toBe(testClienteId);
      expect(result.veiculo_id).toBe(testVeiculoId);
      createdOrdemId = result.id;
    });
  });

  describe('buscarPorId', () => {
    it('should find ordem servico by id', async () => {
      const result = await OrdemServicoRepository.buscarPorId(createdOrdemId);

      expect(result).toHaveProperty('id', createdOrdemId);
      expect(result.cliente_id).toBe(testClienteId);
    });

    it('should return null for non-existent id', async () => {
      const result = await OrdemServicoRepository.buscarPorId(99999);

      expect(result).toBeNull();  // repositório retorna null, não undefined
    });
  });

  describe('listar', () => {  // era buscar
    it('should list all ordens servico', async () => {
      const result = await OrdemServicoRepository.listar();  // era buscar()

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('buscarPorClienteId', () => {  // era buscarPorCliente
    it('should find ordens by cliente id', async () => {
      const result = await OrdemServicoRepository.buscarPorClienteId(testClienteId);  // era buscarPorCliente

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('atualizarStatus', () => {
    it('should update ordem status', async () => {
      const result = await OrdemServicoRepository.atualizarStatus(createdOrdemId, 'APROVADA');

      expect(result.status).toBe('APROVADA');
    });
  });

  describe('deletar', () => {
    it('should delete ordem servico', async () => {
      // repositório não tem deletar — removemos via SQL direto
      const pool = require('../../src/infrastructure/database/connection');
      await pool.query('DELETE FROM ordens_servico WHERE id = $1', [createdOrdemId]);

      const result = await OrdemServicoRepository.buscarPorId(createdOrdemId);
      expect(result).toBeNull();
    });
  });
});