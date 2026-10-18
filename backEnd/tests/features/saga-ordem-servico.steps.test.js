const path = require('node:path');
const { loadFeature, defineFeature } = require('jest-cucumber');
const { CriarOrdemServico, EntregarOrdemServico } = require('../../src/application/ordemServico.service');
const { TransicionarStatusOrdemServico, RegistrarOcorrenciaOrdemServico } = require('../../src/application/transicaoStatus.service');
const { criarHandlers } = require('../../src/application/handlers');
const { criarEvento } = require('../../src/application/events/eventFactory');
const { EstoqueInsuficienteError } = require('../../src/domain/errors');

const feature = loadFeature(path.join(__dirname, 'saga-ordem-servico.feature'));

/**
 * "Mundo" em memória: banco do OS Service (OS, estoque, histórico, outbox,
 * eventos processados) e um broker que entrega eventos aos handlers reais.
 */
function criarMundo() {
  const db = { ordens: [], servicos: [], pecas: [], osPecas: [], historico: [], outbox: [], processados: new Set() };
  const copia = (o) => (o ? { ...o } : null);

  const ordemServicoRepository = {
    criar: async (ordem, servicos, pecas) => {
      for (const item of pecas) {
        const peca = db.pecas.find((p) => p.id === item.peca_id);
        if (peca.quantidade < item.quantidade) throw new EstoqueInsuficienteError('Estoque insuficiente');
        peca.quantidade -= item.quantidade;
        db.osPecas.push({ osId: db.ordens.length + 1, pecaId: item.peca_id, quantidade: item.quantidade });
      }
      const nova = { id: db.ordens.length + 1, status: ordem.status, valor_total: ordem.valor_total, updated_at: new Date().toISOString() };
      db.ordens.push(nova);
      return copia(nova);
    },
    buscarParaAtualizar: async (id) => copia(db.ordens.find((o) => o.id === Number(id))),
    atualizarStatus: async (id, status) => {
      const o = db.ordens.find((x) => x.id === Number(id));
      Object.assign(o, { status, updated_at: new Date().toISOString() });
      return copia(o);
    },
    iniciarServicosOs: async () => {},
    finalizarServicosOs: async () => {},
    liberarEstoque: async (id) => {
      const itens = db.osPecas.filter((x) => x.osId === Number(id));
      for (const item of itens) db.pecas.find((p) => p.id === item.pecaId).quantidade += item.quantidade;
      return itens.map((i) => ({ peca_id: i.pecaId, quantidade: i.quantidade }));
    }
  };

  const deps = {
    ordemServicoRepository,
    historicoRepository: { registrar: async (h) => db.historico.push(h) },
    outboxRepository: { adicionar: async (e) => db.outbox.push(e) },
    processedEventsRepository: {
      registrar: async (eventId) => {
        if (db.processados.has(eventId)) return false;
        db.processados.add(eventId);
        return true;
      }
    },
    unitOfWork: { run: (fn) => fn({}) }
  };

  const transicionarStatus = new TransicionarStatusOrdemServico(deps);
  const registrarOcorrencia = new RegistrarOcorrenciaOrdemServico(deps);
  const handlers = criarHandlers({ transicionarStatus, registrarOcorrencia });

  const criarOs = new CriarOrdemServico(
    ordemServicoRepository,
    { buscarPorDocumento: async () => ({ id: 1, nome: 'Maria', email: 'maria@email.com', documento: '52998224725' }) },
    { buscarPorPlaca: async () => ({ id: 1, placa: 'ABC1D23', marca: 'VW', modelo: 'Gol', ano: 2019 }) },
    { buscarPorId: async (id) => db.servicos.find((s) => s.id === Number(id)) },
    { buscarPorId: async (id) => copia(db.pecas.find((p) => p.id === Number(id))) },
    deps
  );
  const entregar = new EntregarOrdemServico(transicionarStatus);

  const mundo = {
    db,
    os: null,
    ultimoEvento: null,
    async abrirOs(quantidadePeca) {
      mundo.os = await criarOs.execute({
        cliente: { documento: '52998224725' },
        veiculo: { placa: 'ABC1D23' },
        servicos: [{ id: 1 }],
        pecas: [{ id: 1, quantidade: quantidadePeca }]
      });
    },
    /** Broker em memória: entrega ao handler o evento publicado por outro serviço. */
    async publicar(type, payloadExtra = {}, source = 'billing-service') {
      const evento = { ...criarEvento(type, { osId: mundo.os.id, ...payloadExtra }, { correlationId: mundo.os.id }), source };
      mundo.ultimoEvento = evento;
      await handlers[type](evento);
      return evento;
    },
    async reenviar(evento) {
      await handlers[evento.type](evento);
    },
    entregar: () => entregar.execute(mundo.os.id),
    statusOs: () => db.ordens.find((o) => o.id === mundo.os.id).status,
    estoque: () => db.pecas[0].quantidade,
    eventosPublicados: (type) => db.outbox.filter((e) => e.type === type)
  };
  return mundo;
}

const brl = (texto) => Number(texto.replace(/[^\d,]/g, '').replace(',', '.'));

defineFeature(feature, (test) => {
  let mundo;

  const contexto = ({ given, and }) => {
    given(/^que existe o serviço "(.*)" de R\$ (.*)$/, (nome, valor) => {
      mundo = criarMundo();
      mundo.db.servicos.push({ id: 1, nome, descricao: nome, valor: brl(valor) });
    });
    and(/^que existe a peça "(.*)" de R\$ (.*) com (\d+) unidades em estoque$/, (nome, valor, qtd) => {
      mundo.db.pecas.push({ id: 1, nome, descricao: nome, valor: valor, quantidade: Number(qtd) });
    });
  };

  const entaoStatus = (step) => step(/^a OS (?:fica|continua) "(.*)"$/, (status) => expect(mundo.statusOs()).toBe(status));
  const quandoBilling = (step) => step(/^o Billing publica "(.*)"$/, (type) => mundo.publicar(type));
  const eventoPublicado = (step) => step(/^o evento "(.*)" é publicado$/, (type) => {
    const eventos = mundo.eventosPublicados(type);
    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toMatchObject({ correlationId: String(mundo.os.id), source: 'os-service', payload: { osId: mundo.os.id } });
  });
  const estoqueVolta = (step) => step(/^o estoque da peça volta a ter (\d+) unidades$/, (qtd) => expect(mundo.estoque()).toBe(Number(qtd)));
  const osAberta = (step) => step(/^uma OS aberta com (\d+) unidades da peça$/, (qtd) => mundo.abrirOs(Number(qtd)));
  const billingPublicou = (step) => step(/^o Billing publicou "(.*)"$/, (type) => mundo.publicar(type));

  test('Fluxo completo até a entrega', ({ given, and, when, then }) => {
    contexto({ given, and });

    when(/^o atendente abre uma OS com o serviço e (\d+) unidades da peça$/, (qtd) => mundo.abrirOs(Number(qtd)));
    then(/^a OS fica "(.*)" com valor total de R\$ (.*)$/, (status, valor) => {
      expect(mundo.statusOs()).toBe(status);
      expect(Number(mundo.os.valor_total)).toBe(brl(valor));
    });
    and(/^o estoque da peça passa a ter (\d+) unidades$/, (qtd) => expect(mundo.estoque()).toBe(Number(qtd)));
    eventoPublicado(and);
    quandoBilling(when);
    entaoStatus(then);
    quandoBilling(when);
    entaoStatus(then);
    quandoBilling(when);
    entaoStatus(then);
    when(/^o Execution publica "(.*)" com status "(.*)"$/, (type, status) => mundo.publicar(type, { status }, 'execution-service'));
    entaoStatus(then);
    when(/^o Execution publica "(.*)" com status "(.*)"$/, (type, status) => mundo.publicar(type, { status }, 'execution-service'));
    entaoStatus(then);
    when(/^o Execution publica "(.*)"$/, (type) => mundo.publicar(type, {}, 'execution-service'));
    entaoStatus(then);
    when('o atendente registra a entrega do veículo', () => mundo.entregar());
    entaoStatus(then);
    eventoPublicado(and);
    and(/^o histórico da OS tem (\d+) etapas$/, (n) => {
      expect(mundo.db.historico.map((h) => h.status)).toHaveLength(Number(n));
    });
  });

  test('Orçamento recusado cancela a OS e devolve o estoque', ({ given, and, when, then }) => {
    contexto({ given, and });
    osAberta(given);
    billingPublicou(and);
    quandoBilling(when);
    entaoStatus(then);
    estoqueVolta(and);
    eventoPublicado(and);
  });

  test('Falha na execução cancela a OS e devolve o estoque', ({ given, and, when, then }) => {
    contexto({ given, and });
    osAberta(given);
    and(/^a OS foi paga e está "(.*)"$/, async (status) => {
      await mundo.publicar('orcamento.gerado');
      await mundo.publicar('orcamento.aprovado');
      await mundo.publicar('pagamento.confirmado');
      await mundo.publicar('execucao.status_atualizado', { status: 'EM_DIAGNOSTICO' }, 'execution-service');
      expect(mundo.statusOs()).toBe(status);
    });
    when(/^o Execution publica "(.*)"$/, (type) => mundo.publicar(type, { motivo: 'Peça indisponível' }, 'execution-service'));
    entaoStatus(then);
    estoqueVolta(and);
    eventoPublicado(and);
    when(/^o Billing publica "(.*)"$/, (type) => mundo.publicar(type, { valor: 180 }));
    entaoStatus(then);
    and('o histórico registra o estorno', () => {
      expect(mundo.db.historico.at(-1).observacao).toMatch(/Pagamento estornado/);
    });
  });

  test('Evento repetido não é processado duas vezes', ({ given, and, when, then }) => {
    contexto({ given, and });
    osAberta(given);
    billingPublicou(and);
    when(/^o Billing publica "(.*)" duas vezes$/, async (type) => {
      const evento = await mundo.publicar(type);
      await mundo.reenviar(evento);
    });
    estoqueVolta(then);
    and(/^o evento "(.*)" é publicado uma única vez$/, (type) => expect(mundo.eventosPublicados(type)).toHaveLength(1));
  });
});
