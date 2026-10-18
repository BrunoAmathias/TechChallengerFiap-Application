const {
  TransicionarStatusOrdemServico,
  RegistrarOcorrenciaOrdemServico,
  RESULTADO,
  calcularDuracaoStatusMinutos
} = require('../../src/application/transicaoStatus.service');
const { criarHandlers } = require('../../src/application/handlers');
const { osIdDoEvento } = require('../../src/application/handlers/osIdDoEvento');
const { criarEvento, validarEnvelope } = require('../../src/application/events/eventFactory');
const { TransicaoInvalidaError, NaoEncontradoError } = require('../../src/domain/errors');
const { STATUS } = require('../../src/domain/statusTransition');

/** Banco em memória: uma OS e as tabelas que a saga toca. */
function criarFakes(statusInicial = STATUS.RECEBIDA) {
  const estado = {
    ordem: { id: 10, status: statusInicial, updated_at: new Date(Date.now() - 5 * 60000).toISOString() },
    historico: [],
    outbox: [],
    processados: new Set(),
    estoqueLiberado: 0,
    servicosIniciados: null,
    servicosFinalizados: null
  };

  const ordemServicoRepository = {
    buscarParaAtualizar: jest.fn(async (id) => (Number(id) === estado.ordem.id ? { ...estado.ordem } : null)),
    atualizarStatus: jest.fn(async (id, status, tx, { motivoCancelamento } = {}) => {
      estado.ordem = { ...estado.ordem, status, motivo_cancelamento: motivoCancelamento };
      return { ...estado.ordem };
    }),
    iniciarServicosOs: jest.fn(async (id, quando) => { estado.servicosIniciados = quando; }),
    finalizarServicosOs: jest.fn(async (id, quando) => { estado.servicosFinalizados = quando; }),
    liberarEstoque: jest.fn(async () => {
      estado.estoqueLiberado += 1;
      return [{ peca_id: 3, quantidade: 2 }];
    })
  };

  const deps = {
    ordemServicoRepository,
    historicoRepository: { registrar: jest.fn(async (h) => estado.historico.push(h)) },
    outboxRepository: { adicionar: jest.fn(async (e) => estado.outbox.push(e)) },
    processedEventsRepository: {
      registrar: jest.fn(async (eventId) => {
        if (estado.processados.has(eventId)) return false;
        estado.processados.add(eventId);
        return true;
      })
    },
    unitOfWork: { run: jest.fn((fn) => fn({ tx: true })) }
  };

  const transicionarStatus = new TransicionarStatusOrdemServico(deps);
  const registrarOcorrencia = new RegistrarOcorrenciaOrdemServico(deps);
  const handlers = criarHandlers({ transicionarStatus, registrarOcorrencia });

  return { estado, deps, transicionarStatus, handlers };
}

function evento(type, payload = {}, source = 'billing-service') {
  return { ...criarEvento(type, { osId: 10, ...payload }, { correlationId: 10 }), source };
}

describe('Saga - TransicionarStatusOrdemServico', () => {
  it('aplica a transição, registra histórico e marca o evento como processado', async () => {
    const { estado, transicionarStatus } = criarFakes();
    const e = evento('orcamento.gerado');

    const r = await transicionarStatus.execute({ osId: 10, para: STATUS.AGUARDANDO_APROVACAO, origem: 'billing-service', evento: e });

    expect(r.resultado).toBe(RESULTADO.APLICADO);
    expect(estado.ordem.status).toBe(STATUS.AGUARDANDO_APROVACAO);
    expect(estado.historico[0]).toMatchObject({
      osId: 10,
      statusAnterior: STATUS.RECEBIDA,
      status: STATUS.AGUARDANDO_APROVACAO,
      origem: 'billing-service',
      eventId: e.eventId
    });
    expect(estado.processados.has(e.eventId)).toBe(true);
    expect(estado.outbox).toHaveLength(0);
  });

  it('ignora evento duplicado sem tocar na OS', async () => {
    const { estado, transicionarStatus, deps } = criarFakes();
    const e = evento('orcamento.gerado');

    await transicionarStatus.execute({ osId: 10, para: STATUS.AGUARDANDO_APROVACAO, origem: 'billing', evento: e });
    const r = await transicionarStatus.execute({ osId: 10, para: STATUS.AGUARDANDO_APROVACAO, origem: 'billing', evento: e });

    expect(r.resultado).toBe(RESULTADO.DUPLICADO);
    expect(deps.ordemServicoRepository.atualizarStatus).toHaveBeenCalledTimes(1);
    expect(estado.historico).toHaveLength(1);
  });

  it('ignora quando a OS já está no status destino', async () => {
    const { transicionarStatus, deps } = criarFakes(STATUS.AGUARDANDO_APROVACAO);

    const r = await transicionarStatus.execute({ osId: 10, para: STATUS.AGUARDANDO_APROVACAO, origem: 'x' });

    expect(r.resultado).toBe(RESULTADO.MESMO_STATUS);
    expect(deps.ordemServicoRepository.atualizarStatus).not.toHaveBeenCalled();
  });

  it('ignora evento atrasado (a OS já avançou)', async () => {
    const { transicionarStatus, deps } = criarFakes(STATUS.EM_DIAGNOSTICO);

    const r = await transicionarStatus.execute({ osId: 10, para: STATUS.AGUARDANDO_EXECUCAO, origem: 'billing' });

    expect(r.resultado).toBe(RESULTADO.OBSOLETO);
    expect(deps.ordemServicoRepository.atualizarStatus).not.toHaveBeenCalled();
  });

  it('lança TransicaoInvalidaError quando o evento chega antes do anterior (vai para retry)', async () => {
    const { transicionarStatus } = criarFakes(STATUS.RECEBIDA);

    await expect(
      transicionarStatus.execute({ osId: 10, para: STATUS.AGUARDANDO_EXECUCAO, origem: 'billing', evento: evento('pagamento.confirmado') })
    ).rejects.toThrow(TransicaoInvalidaError);
  });

  it('lança NaoEncontradoError para OS inexistente', async () => {
    const { transicionarStatus } = criarFakes();

    await expect(transicionarStatus.execute({ osId: 99, para: STATUS.CANCELADA, origem: 'x' })).rejects.toThrow(NaoEncontradoError);
  });

  it('inicia os serviços ao entrar em execução e finaliza ao concluir', async () => {
    const { estado, transicionarStatus } = criarFakes(STATUS.EM_DIAGNOSTICO);
    const e = evento('execucao.status_atualizado', { status: 'EM_REPARO' });

    await transicionarStatus.execute({ osId: 10, para: STATUS.EM_EXECUCAO, origem: 'execution', evento: e });
    expect(estado.servicosIniciados).toEqual(new Date(e.occurredAt));

    await transicionarStatus.execute({ osId: 10, para: STATUS.FINALIZADA, origem: 'execution' });
    expect(estado.servicosFinalizados).toBeInstanceOf(Date);
  });

  it('publica os.entregue no outbox ao entregar', async () => {
    const { estado, transicionarStatus } = criarFakes(STATUS.FINALIZADA);

    await transicionarStatus.execute({ osId: 10, para: STATUS.ENTREGUE, origem: 'os-service' });

    expect(estado.outbox[0]).toMatchObject({ type: 'os.entregue', correlationId: '10', payload: { osId: 10 } });
    expect(estado.outbox[0].causationId).toBeNull();
  });

  it('calcula a duração no status anterior em minutos', () => {
    expect(calcularDuracaoStatusMinutos(null)).toBe(0);
    expect(calcularDuracaoStatusMinutos('data-invalida')).toBe(0);
    expect(calcularDuracaoStatusMinutos(new Date(Date.now() - 120000).toISOString())).toBeCloseTo(2, 0);
  });
});

describe('Saga - handlers do OS Service', () => {
  it('fluxo principal completo: Recebida → Finalizada', async () => {
    const { estado, handlers } = criarFakes();

    await handlers['orcamento.gerado'](evento('orcamento.gerado', { orcamentoId: 1 }));
    expect(estado.ordem.status).toBe(STATUS.AGUARDANDO_APROVACAO);

    await handlers['orcamento.aprovado'](evento('orcamento.aprovado'));
    expect(estado.ordem.status).toBe(STATUS.AGUARDANDO_PAGAMENTO);

    await handlers['pagamento.confirmado'](evento('pagamento.confirmado'));
    expect(estado.ordem.status).toBe(STATUS.AGUARDANDO_EXECUCAO);

    const naFila = await handlers['execucao.status_atualizado'](evento('execucao.status_atualizado', { status: 'NA_FILA' }, 'execution-service'));
    expect(naFila.resultado).toBe(RESULTADO.MESMO_STATUS);

    await handlers['execucao.status_atualizado'](evento('execucao.status_atualizado', { status: 'EM_DIAGNOSTICO', tecnico: 'Ana' }, 'execution-service'));
    expect(estado.ordem.status).toBe(STATUS.EM_DIAGNOSTICO);
    expect(estado.historico.at(-1).observacao).toMatch(/técnico: Ana/);

    await handlers['execucao.status_atualizado'](evento('execucao.status_atualizado', { status: 'EM_REPARO' }, 'execution-service'));
    expect(estado.ordem.status).toBe(STATUS.EM_EXECUCAO);

    await handlers['execucao.finalizada'](evento('execucao.finalizada', {}, 'execution-service'));
    expect(estado.ordem.status).toBe(STATUS.FINALIZADA);

    expect(estado.historico.map((h) => h.status)).toEqual([
      STATUS.AGUARDANDO_APROVACAO,
      STATUS.AGUARDANDO_PAGAMENTO,
      STATUS.AGUARDANDO_EXECUCAO,
      STATUS.EM_DIAGNOSTICO,
      STATUS.EM_EXECUCAO,
      STATUS.FINALIZADA
    ]);
    expect(estado.historico[0].origem).toBe('billing-service');
    expect(estado.historico.at(-1).origem).toBe('execution-service');
  });

  it.each([
    ['orcamento.recusado', STATUS.AGUARDANDO_APROVACAO, /Orçamento recusado/],
    ['orcamento.falhou', STATUS.RECEBIDA, /Falha ao gerar orçamento/],
    ['pagamento.falhou', STATUS.AGUARDANDO_PAGAMENTO, /Pagamento não aprovado/],
    ['execucao.falhou', STATUS.EM_EXECUCAO, /Falha na execução/]
  ])('compensação %s: cancela a OS, libera o estoque e publica os.cancelada', async (tipo, statusInicial, motivo) => {
    const { estado, handlers } = criarFakes(statusInicial);

    await handlers[tipo](evento(tipo, { motivo: 'detalhe' }));

    expect(estado.ordem.status).toBe(STATUS.CANCELADA);
    expect(estado.ordem.motivo_cancelamento).toMatch(motivo);
    expect(estado.ordem.motivo_cancelamento).toMatch(/detalhe/);
    expect(estado.estoqueLiberado).toBe(1);
    expect(estado.outbox[0]).toMatchObject({
      type: 'os.cancelada',
      payload: { osId: 10, statusAnterior: statusInicial, eventoOrigem: tipo, pecasLiberadas: [{ pecaId: 3, quantidade: 2 }] }
    });
  });

  it('compensação repetida não libera o estoque duas vezes', async () => {
    const { estado, handlers } = criarFakes(STATUS.AGUARDANDO_APROVACAO);
    const e = evento('orcamento.recusado');

    await handlers['orcamento.recusado'](e);
    await handlers['orcamento.recusado'](e);
    await handlers['pagamento.falhou'](evento('pagamento.falhou'));

    expect(estado.estoqueLiberado).toBe(1);
    expect(estado.outbox).toHaveLength(1);
  });

  it('não cancela uma OS já finalizada', async () => {
    const { handlers } = criarFakes(STATUS.FINALIZADA);

    await expect(handlers['execucao.falhou'](evento('execucao.falhou'))).rejects.toThrow(TransicaoInvalidaError);
  });

  it('pagamento.estornado só registra no histórico', async () => {
    const { estado, handlers } = criarFakes(STATUS.CANCELADA);
    const e = evento('pagamento.estornado', { valor: 250 });

    const r = await handlers['pagamento.estornado'](e);
    const repetido = await handlers['pagamento.estornado'](e);

    expect(r.resultado).toBe(RESULTADO.APLICADO);
    expect(repetido.resultado).toBe(RESULTADO.DUPLICADO);
    expect(estado.ordem.status).toBe(STATUS.CANCELADA);
    expect(estado.historico).toEqual([
      expect.objectContaining({ status: STATUS.CANCELADA, observacao: 'Pagamento estornado (valor: 250)' })
    ]);
  });

  it('pagamento.estornado para OS inexistente lança erro', async () => {
    const { handlers } = criarFakes();
    const e = { ...evento('pagamento.estornado'), payload: { osId: 404 } };

    await expect(handlers['pagamento.estornado'](e)).rejects.toThrow(NaoEncontradoError);
  });

  it('assina exatamente os eventos consumidos pelo OS Service', () => {
    const { handlers } = criarFakes();

    expect(Object.keys(handlers).sort()).toEqual([
      'execucao.falhou',
      'execucao.finalizada',
      'execucao.status_atualizado',
      'orcamento.aprovado',
      'orcamento.falhou',
      'orcamento.gerado',
      'orcamento.recusado',
      'pagamento.confirmado',
      'pagamento.estornado',
      'pagamento.falhou'
    ]);
  });
});

describe('Eventos', () => {
  it('criarEvento monta o envelope padrão', () => {
    const e = criarEvento('os.aberta', { osId: 1 }, { correlationId: 1, causationId: 'abc' });

    expect(e).toMatchObject({ type: 'os.aberta', version: 1, correlationId: '1', source: 'os-service', causationId: 'abc' });
    expect(new Date(e.occurredAt).toISOString()).toBe(e.occurredAt);
  });

  it('criarEvento exige correlationId', () => {
    expect(() => criarEvento('os.aberta', {})).toThrow(/correlationId/);
  });

  it('validarEnvelope aponta os campos ausentes', () => {
    expect(() => validarEnvelope({ type: 'x' })).toThrow(/eventId, occurredAt, correlationId, payload/);
    expect(() => validarEnvelope(null)).toThrow();
  });

  it('osIdDoEvento usa o payload ou o correlationId', () => {
    expect(osIdDoEvento({ payload: { osId: '5' } })).toBe(5);
    expect(osIdDoEvento({ correlationId: '6', payload: {} })).toBe(6);
    expect(() => osIdDoEvento({ type: 'x', payload: { osId: 'abc' } })).toThrow(/sem osId/);
  });
});
