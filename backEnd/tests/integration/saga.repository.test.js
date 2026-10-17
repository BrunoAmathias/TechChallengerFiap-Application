require('dotenv').config();
const pool = require('../../src/infrastructure/database/connection');
const unitOfWork = require('../../src/infrastructure/database/unitOfWork');
const OutboxRepository = require('../../src/infrastructure/repositories/outbox.repository');
const ProcessedEventsRepository = require('../../src/infrastructure/repositories/processedEvents.repository');
const { useCases, handlers } = require('../../src/container');
const { criarEvento } = require('../../src/application/events/eventFactory');
const { STATUS } = require('../../src/domain/statusTransition');

const sufixo = Date.now().toString().slice(-8);

function evento(type, osId, payload = {}) {
  return { ...criarEvento(type, { osId, ...payload }, { correlationId: osId }), source: 'teste-integracao' };
}

async function estoque(pecaId) {
  const { rows } = await pool.query('SELECT quantidade FROM pecas WHERE id = $1', [pecaId]);
  return rows[0].quantidade;
}

async function outboxDaOs(osId) {
  const { rows } = await pool.query(
    'SELECT type, payload, published_at FROM outbox WHERE aggregate_id = $1 ORDER BY created_at',
    [String(osId)]
  );
  return rows;
}

describe('Saga do OS Service (integração com PostgreSQL)', () => {
  let servicoId;
  let pecaId;
  const osCriadas = [];

  const novaOs = (quantidadePeca = 2) =>
    useCases.criarOrdemServico.execute({
      cliente: {
        nome: 'Cliente Saga',
        email: 'saga@teste.com',
        telefone: '11999990000',
        tipo_documento: 'CPF',
        documento: `${sufixo}001`
      },
      veiculo: { placa: `SG${sufixo.slice(-5)}`, marca: 'Fiat', modelo: 'Uno', ano: 2020 },
      servicos: [{ id: servicoId }],
      pecas: [{ id: pecaId, quantidade: quantidadePeca }]
    });

  beforeAll(async () => {
    const servico = await pool.query(
      `INSERT INTO servicos (nome, descricao, valor) VALUES ('Revisão saga', 'teste', 100) RETURNING id`
    );
    servicoId = servico.rows[0].id;

    const peca = await pool.query(
      `INSERT INTO pecas (nome, descricao, valor, quantidade) VALUES ('Filtro saga', 'teste', '25,50', 5) RETURNING id`
    );
    pecaId = peca.rows[0].id;
  });

  afterAll(async () => {
    if (osCriadas.length) {
      await pool.query('DELETE FROM outbox WHERE aggregate_id = ANY($1)', [osCriadas.map(String)]);
      await pool.query('DELETE FROM ordens_servico WHERE id = ANY($1)', [osCriadas]);
    }
    await pool.query('DELETE FROM pecas WHERE id = $1', [pecaId]);
    await pool.query('DELETE FROM servicos WHERE id = $1', [servicoId]);
    await pool.query('DELETE FROM clientes WHERE documento = $1', [`${sufixo}001`]);
    await pool.query('DELETE FROM veiculos WHERE placa = $1', [`SG${sufixo.slice(-5)}`]);
    await pool.end();
  });

  it('abre a OS reservando estoque, com histórico e os.aberta no outbox', async () => {
    const os = await novaOs(2);
    osCriadas.push(os.id);

    expect(os.status).toBe(STATUS.RECEBIDA);
    expect(Number(os.valor_total)).toBeCloseTo(151);
    expect(await estoque(pecaId)).toBe(3);

    const outbox = await outboxDaOs(os.id);
    expect(outbox).toHaveLength(1);
    expect(outbox[0].type).toBe('os.aberta');
    expect(outbox[0].published_at).toBeNull();
    expect(outbox[0].payload.payload).toMatchObject({ osId: os.id, valorTotal: 151 });

    const { historico } = await useCases.buscarHistorico.execute(os.id);
    expect(historico.map((h) => h.status)).toEqual([STATUS.RECEBIDA]);
  });

  it('percorre o fluxo principal pelos handlers até Entregue', async () => {
    const os = await novaOs(1);
    osCriadas.push(os.id);

    await handlers['orcamento.gerado'](evento('orcamento.gerado', os.id));
    await handlers['orcamento.aprovado'](evento('orcamento.aprovado', os.id));
    await handlers['pagamento.confirmado'](evento('pagamento.confirmado', os.id));
    await handlers['execucao.status_atualizado'](evento('execucao.status_atualizado', os.id, { status: 'EM_DIAGNOSTICO' }));
    await handlers['execucao.status_atualizado'](evento('execucao.status_atualizado', os.id, { status: 'EM_REPARO' }));
    await handlers['execucao.finalizada'](evento('execucao.finalizada', os.id));
    await useCases.entregarOrdemServico.execute(os.id);

    const { status_atual, historico } = await useCases.buscarHistorico.execute(os.id);
    expect(status_atual).toBe(STATUS.ENTREGUE);
    expect(historico.map((h) => h.status)).toEqual([
      STATUS.RECEBIDA,
      STATUS.AGUARDANDO_APROVACAO,
      STATUS.AGUARDANDO_PAGAMENTO,
      STATUS.AGUARDANDO_EXECUCAO,
      STATUS.EM_DIAGNOSTICO,
      STATUS.EM_EXECUCAO,
      STATUS.FINALIZADA,
      STATUS.ENTREGUE
    ]);
    expect(historico[1].event_id).toMatch(/^[0-9a-f-]{36}$/);

    // servicos-finalizados continua alimentado (start/end gravados pelos eventos)
    const finalizados = await useCases.buscarServicosFinalizados.execute(os.id);
    expect(finalizados.total_servicos_finalizados).toBe(1);

    expect((await outboxDaOs(os.id)).map((e) => e.type)).toEqual(['os.aberta', 'os.entregue']);
  });

  it('compensa orcamento.recusado: OS Cancelada, estoque devolvido, os.cancelada no outbox, uma única vez', async () => {
    const antes = await estoque(pecaId);
    const os = await novaOs(2);
    osCriadas.push(os.id);
    expect(await estoque(pecaId)).toBe(antes - 2);

    await handlers['orcamento.gerado'](evento('orcamento.gerado', os.id));
    const recusa = evento('orcamento.recusado', os.id, { motivo: 'cliente desistiu' });
    await handlers['orcamento.recusado'](recusa);
    const repetido = await handlers['orcamento.recusado'](recusa);

    expect(repetido.resultado).toBe('duplicado');
    expect(await estoque(pecaId)).toBe(antes);

    const ordem = await useCases.buscarOrdemServicoPorId.execute(os.id);
    expect(ordem.status).toBe(STATUS.CANCELADA);
    expect(ordem.motivo_cancelamento).toMatch(/cliente desistiu/);

    const cancelada = (await outboxDaOs(os.id)).find((e) => e.type === 'os.cancelada');
    expect(cancelada.payload.payload.pecasLiberadas).toEqual([{ pecaId, quantidade: 2 }]);
    expect(cancelada.payload.causationId).toBe(recusa.eventId);
  });

  it('desfaz tudo quando a transição é inválida (nem histórico nem processed_events)', async () => {
    const os = await novaOs(1);
    osCriadas.push(os.id);
    const foraDeOrdem = evento('pagamento.confirmado', os.id);

    await expect(handlers['pagamento.confirmado'](foraDeOrdem)).rejects.toThrow('Transição inválida');

    const { rows } = await pool.query('SELECT 1 FROM processed_events WHERE event_id = $1', [foraDeOrdem.eventId]);
    expect(rows).toHaveLength(0);
    expect((await useCases.buscarHistorico.execute(os.id)).historico).toHaveLength(1);
  });

  it('não abre a OS nem reserva estoque quando falta peça (rollback)', async () => {
    const antes = await estoque(pecaId);
    await pool.query('UPDATE pecas SET quantidade = 0 WHERE id = $1', [pecaId]);

    await expect(novaOs(1)).rejects.toThrow('Estoque insuficiente');

    await pool.query('UPDATE pecas SET quantidade = $2 WHERE id = $1', [pecaId, antes]);
  });

  it('outbox: busca pendentes com lock e marca como publicado', async () => {
    const os = await novaOs(1);
    osCriadas.push(os.id);

    await unitOfWork.run(async (tx) => {
      const pendentes = await OutboxRepository.buscarPendentes(500, tx);
      const doTeste = pendentes.find((p) => p.payload.correlationId === String(os.id));
      expect(doTeste.type).toBe('os.aberta');

      await OutboxRepository.registrarFalha(doTeste.id, 'broker fora', tx);
      await OutboxRepository.marcarPublicado(doTeste.id, tx);
    });

    const [linha] = await outboxDaOs(os.id);
    expect(linha.published_at).not.toBeNull();
    expect(await OutboxRepository.contarPendentes()).toBeGreaterThanOrEqual(0);
  });

  it('processed_events garante idempotência por eventId', async () => {
    const id = evento('qualquer', 1).eventId;

    expect(await ProcessedEventsRepository.registrar(id, 'qualquer')).toBe(true);
    expect(await ProcessedEventsRepository.registrar(id, 'qualquer')).toBe(false);

    await pool.query('DELETE FROM processed_events WHERE event_id = $1', [id]);
  });
});
