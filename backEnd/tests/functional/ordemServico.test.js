const request = require('supertest');
const app = require('../../src/server');

// Mock dos repositórios e da transação
jest.mock('../../src/infrastructure/repositories/ordemServico.repository');
jest.mock('../../src/infrastructure/repositories/cliente.repository');
jest.mock('../../src/infrastructure/repositories/veiculo.repository');
jest.mock('../../src/infrastructure/repositories/servico.repository');
jest.mock('../../src/infrastructure/repositories/peca.repository');
jest.mock('../../src/infrastructure/repositories/osHistorico.repository');
jest.mock('../../src/infrastructure/repositories/outbox.repository');
jest.mock('../../src/infrastructure/repositories/processedEvents.repository');
jest.mock('../../src/infrastructure/database/unitOfWork');

const OrdemServicoRepository = require('../../src/infrastructure/repositories/ordemServico.repository');
const ClienteRepository = require('../../src/infrastructure/repositories/cliente.repository');
const VeiculoRepository = require('../../src/infrastructure/repositories/veiculo.repository');
const ServicoRepository = require('../../src/infrastructure/repositories/servico.repository');
const PecaRepository = require('../../src/infrastructure/repositories/peca.repository');
const HistoricoRepository = require('../../src/infrastructure/repositories/osHistorico.repository');
const OutboxRepository = require('../../src/infrastructure/repositories/outbox.repository');
const UnitOfWork = require('../../src/infrastructure/database/unitOfWork');

const tx = { transacao: true };

const cliente = {
  id: 1,
  nome: 'Bruno Augusto Mathias',
  email: 'cliente@teste.com',
  telefone: '11999999999',
  tipo_documento: 'CPF',
  documento: '803.110.530-84'
};

const veiculo = { id: 1, placa: 'ABC1234', marca: 'Fiat', modelo: 'Uno', ano: 2020 };

describe('OrdemServico Functional Tests (Mocked)', () => {
  let token;

  beforeAll(async () => {
    const response = await request(app)
      .post('/login')
      .send({
        email: process.env.MOCK_USER_EMAIL,
        senha: process.env.MOCK_USER_PASSWORD
      });

    token = response.body.token;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SERVICE_TOKEN = 'token-servico-teste';

    UnitOfWork.run = jest.fn((fn) => fn(tx));

    OrdemServicoRepository.criar = jest.fn();
    OrdemServicoRepository.listar = jest.fn();
    OrdemServicoRepository.buscarPorId = jest.fn();
    OrdemServicoRepository.buscarParaAtualizar = jest.fn();
    OrdemServicoRepository.buscarPorClienteId = jest.fn();
    OrdemServicoRepository.atualizarStatus = jest.fn();
    OrdemServicoRepository.buscarServicosFinalizadosComTempoMedio = jest.fn();

    HistoricoRepository.registrar = jest.fn().mockResolvedValue({});
    HistoricoRepository.listarPorOs = jest.fn();
    OutboxRepository.adicionar = jest.fn().mockResolvedValue();

    ClienteRepository.buscarPorId = jest.fn();
    ClienteRepository.buscarPorDocumento = jest.fn();
    ClienteRepository.criar = jest.fn();

    VeiculoRepository.buscarVeiculoPorId = jest.fn();
    VeiculoRepository.buscarPorPlaca = jest.fn();
    VeiculoRepository.criar = jest.fn();

    ServicoRepository.buscarPorId = jest.fn();
    PecaRepository.buscarPorId = jest.fn();
  });

  describe('POST /os', () => {
    const ordemData = {
      cliente: { documento: cliente.documento },
      veiculo: { placa: veiculo.placa },
      servicos: [{ id: 1 }, { id: 2 }],
      pecas: [{ id: 1, quantidade: 1 }]
    };

    function mockCatalogo() {
      ClienteRepository.buscarPorDocumento.mockResolvedValue(cliente);
      VeiculoRepository.buscarPorPlaca.mockResolvedValue(veiculo);
      ServicoRepository.buscarPorId.mockImplementation((id) =>
        Promise.resolve({ id: Number(id), nome: `Serviço ${id}`, descricao: 'desc', valor: 100 })
      );
      PecaRepository.buscarPorId.mockImplementation((id) =>
        Promise.resolve({ id: Number(id), nome: 'Peça Teste', descricao: 'desc', valor: '50,00', quantidade: 10 })
      );
    }

    it('cria a OS, registra o histórico e grava os.aberta no outbox na mesma transação', async () => {
      mockCatalogo();
      const ordemCriada = { id: 7, cliente_id: 1, veiculo_id: 1, valor_total: 250, status: 'Recebida' };
      OrdemServicoRepository.criar.mockResolvedValue(ordemCriada);

      const response = await request(app)
        .post('/os')
        .set('Authorization', `Bearer ${token}`)
        .send(ordemData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(ordemCriada);

      const [ordem, servicos, pecas, txUsada] = OrdemServicoRepository.criar.mock.calls[0];
      expect(ordem.valor_total).toBe(250);
      expect(servicos).toHaveLength(2);
      expect(pecas[0]).toMatchObject({ peca_id: 1, quantidade: 1, valor_unitario: 50 });
      expect(txUsada).toBe(tx);

      expect(HistoricoRepository.registrar).toHaveBeenCalledWith(
        expect.objectContaining({ osId: 7, status: 'Recebida', origem: 'os-service' }),
        tx
      );

      const [evento, txOutbox] = OutboxRepository.adicionar.mock.calls[0];
      expect(txOutbox).toBe(tx);
      expect(evento).toMatchObject({
        type: 'os.aberta',
        version: 1,
        correlationId: '7',
        source: 'os-service',
        payload: {
          osId: 7,
          valorTotal: 250,
          cliente: { id: 1, email: cliente.email, documento: cliente.documento },
          veiculo: { id: 1, placa: 'ABC1234' }
        }
      });
      expect(evento.payload.servicos).toHaveLength(2);
      expect(evento.eventId).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('cria cliente e veículo quando ainda não existem', async () => {
      mockCatalogo();
      ClienteRepository.buscarPorDocumento.mockResolvedValue(null);
      ClienteRepository.criar.mockResolvedValue(cliente);
      VeiculoRepository.buscarPorPlaca.mockResolvedValue(null);
      VeiculoRepository.criar.mockResolvedValue(veiculo);
      OrdemServicoRepository.criar.mockResolvedValue({ id: 8, valor_total: 250, status: 'Recebida' });

      const response = await request(app)
        .post('/os')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...ordemData, cliente: { ...cliente, id: undefined }, veiculo });

      expect(response.status).toBe(201);
      expect(ClienteRepository.criar).toHaveBeenCalled();
      expect(VeiculoRepository.criar).toHaveBeenCalled();
    });

    it('retorna 409 quando a reserva de estoque falha na transação', async () => {
      mockCatalogo();
      const { EstoqueInsuficienteError } = require('../../src/domain/errors');
      OrdemServicoRepository.criar.mockRejectedValue(new EstoqueInsuficienteError('Estoque insuficiente para a peça Peça Teste'));

      const response = await request(app)
        .post('/os')
        .set('Authorization', `Bearer ${token}`)
        .send(ordemData);

      expect(response.status).toBe(409);
      expect(OutboxRepository.adicionar).not.toHaveBeenCalled();
    });

    it('retorna 400 quando o estoque já é insuficiente na validação', async () => {
      mockCatalogo();
      PecaRepository.buscarPorId.mockResolvedValue({ id: 1, nome: 'Peça', valor: 50, quantidade: 0 });

      const response = await request(app)
        .post('/os')
        .set('Authorization', `Bearer ${token}`)
        .send(ordemData);

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/Estoque insuficiente/);
    });

    it('falha sem token', async () => {
      const response = await request(app).post('/os').send(ordemData);
      expect(response.status).toBe(401);
    });

    it('falha com dados inválidos', async () => {
      const response = await request(app)
        .post('/os')
        .set('Authorization', `Bearer ${token}`)
        .send({ cliente: {}, servicos: [] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it.each([
      ['veículo sem placa', { veiculo: {} }, /placa/],
      ['serviço sem id', { servicos: [{}] }, /Cada serviço deve ter um id/],
      ['peça sem id', { pecas: [{}] }, /Cada peça deve ter um id/],
      ['peça com quantidade zero', { pecas: [{ id: 1, quantidade: -1 }] }, /maior que zero/]
    ])('falha com %s', async (_caso, sobrescrita, mensagem) => {
      mockCatalogo();

      const response = await request(app)
        .post('/os')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...ordemData, ...sobrescrita });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(mensagem);
    });

    it('falha quando serviço ou peça não existem', async () => {
      mockCatalogo();
      ServicoRepository.buscarPorId.mockResolvedValue(null);

      const response = await request(app)
        .post('/os')
        .set('Authorization', `Bearer ${token}`)
        .send(ordemData);

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/Serviço não encontrado/);
    });
  });

  describe('GET /os', () => {
    it('lista as ordens em andamento', async () => {
      OrdemServicoRepository.listar.mockResolvedValue([{ id: 1, status: 'Em execução' }]);

      const response = await request(app).get('/os').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  describe('GET /os/:id e consulta pública', () => {
    it('retorna a OS por id', async () => {
      OrdemServicoRepository.buscarPorId.mockResolvedValue({ id: 1, status: 'Recebida' });

      const response = await request(app).get('/os/1').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
    });

    it('retorna 404 para OS inexistente', async () => {
      OrdemServicoRepository.buscarPorId.mockResolvedValue(null);

      const response = await request(app).get('/os/999').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('permite consulta pública sem token', async () => {
      OrdemServicoRepository.buscarPorId.mockResolvedValue({ id: 1, status: 'Em diagnóstico' });

      const response = await request(app).get('/os/consulta/1');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('Em diagnóstico');
    });
  });

  describe('GET /os/cliente/:documento', () => {
    it('retorna as ordens do cliente', async () => {
      ClienteRepository.buscarPorDocumento.mockResolvedValue(cliente);
      OrdemServicoRepository.buscarPorClienteId.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const response = await request(app)
        .get(`/os/cliente/${cliente.documento}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('retorna 404 quando o cliente não existe', async () => {
      ClienteRepository.buscarPorDocumento.mockResolvedValue(null);

      const response = await request(app).get('/os/cliente/000').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /os/:id/historico', () => {
    it('retorna o status atual e o histórico', async () => {
      OrdemServicoRepository.buscarPorId.mockResolvedValue({ id: 1, status: 'Aguardando aprovação' });
      HistoricoRepository.listarPorOs.mockResolvedValue([
        { status_anterior: null, status: 'Recebida', origem: 'os-service' },
        { status_anterior: 'Recebida', status: 'Aguardando aprovação', origem: 'billing-service' }
      ]);

      const response = await request(app).get('/os/1/historico').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status_atual).toBe('Aguardando aprovação');
      expect(response.body.historico).toHaveLength(2);
    });

    it('retorna 404 para OS inexistente', async () => {
      OrdemServicoRepository.buscarPorId.mockResolvedValue(null);

      const response = await request(app).get('/os/9/historico').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /os/:id/entregar', () => {
    it('entrega uma OS finalizada e publica os.entregue', async () => {
      OrdemServicoRepository.buscarParaAtualizar.mockResolvedValue({ id: 1, status: 'Finalizada' });
      OrdemServicoRepository.atualizarStatus.mockResolvedValue({ id: 1, status: 'Entregue' });

      const response = await request(app).patch('/os/1/entregar').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('Entregue');
      expect(OutboxRepository.adicionar).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'os.entregue', correlationId: '1' }),
        tx
      );
    });

    it('retorna 409 quando a OS ainda não foi finalizada', async () => {
      OrdemServicoRepository.buscarParaAtualizar.mockResolvedValue({ id: 1, status: 'Em execução' });

      const response = await request(app).patch('/os/1/entregar').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(409);
      expect(OrdemServicoRepository.atualizarStatus).not.toHaveBeenCalled();
    });

    it('retorna 404 para OS inexistente', async () => {
      OrdemServicoRepository.buscarParaAtualizar.mockResolvedValue(null);

      const response = await request(app).patch('/os/1/entregar').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('rotas removidas na fase 4', () => {
    it.each(['status', 'approve', 'advance'])('PATCH /os/:id/%s não existe mais', async (rota) => {
      const response = await request(app).patch(`/os/1/${rota}`).set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(404);
    });
  });

  describe('GET /internal/os/:id', () => {
    it('retorna a OS com cliente e veículo para outro serviço', async () => {
      OrdemServicoRepository.buscarPorId.mockResolvedValue({ id: 1, cliente_id: 1, veiculo_id: 1, servicos: [], pecas: [] });
      ClienteRepository.buscarPorId.mockResolvedValue(cliente);
      VeiculoRepository.buscarVeiculoPorId.mockResolvedValue(veiculo);

      const response = await request(app).get('/internal/os/1').set('x-service-token', 'token-servico-teste');

      expect(response.status).toBe(200);
      expect(response.body.cliente.email).toBe(cliente.email);
      expect(response.body.veiculo.placa).toBe('ABC1234');
    });

    it('recusa sem token de serviço ou com token errado', async () => {
      expect((await request(app).get('/internal/os/1')).status).toBe(401);
      expect((await request(app).get('/internal/os/1').set('x-service-token', 'errado')).status).toBe(401);
      expect((await request(app).get('/internal/os/1').set('Authorization', `Bearer ${token}`)).status).toBe(401);
    });

    it('retorna 503 quando SERVICE_TOKEN não está configurado', async () => {
      delete process.env.SERVICE_TOKEN;

      const response = await request(app).get('/internal/os/1').set('x-service-token', 'qualquer');

      expect(response.status).toBe(503);
    });

    it('retorna 404 para OS inexistente', async () => {
      OrdemServicoRepository.buscarPorId.mockResolvedValue(null);

      const response = await request(app).get('/internal/os/1').set('x-service-token', 'token-servico-teste');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /os/:id/servicos-finalizados', () => {
    it('retorna os serviços finalizados com tempo médio', async () => {
      OrdemServicoRepository.buscarServicosFinalizadosComTempoMedio.mockResolvedValue([
        { id: 1, servico_id: 1, nome: 'Troca de óleo', valor_unitario: '100', total: '100', tempo_minutos: '30', tempo_medio_minutos: '30' }
      ]);

      const response = await request(app).get('/os/1/servicos-finalizados').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.tempo_medio_geral_minutos).toBe(30);
      expect(response.body.servicos_finalizados[0].tempo_gasto_minutos).toBe(30);
    });

    it('retorna lista vazia quando não há serviços finalizados', async () => {
      OrdemServicoRepository.buscarServicosFinalizadosComTempoMedio.mockResolvedValue([]);

      const response = await request(app).get('/os/1/servicos-finalizados').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.servicos_finalizados).toEqual([]);
    });
  });
});
