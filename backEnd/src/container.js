/**
 * Composition root do OS Service: instancia repositórios, casos de uso e
 * handlers da saga uma única vez, para os controllers e para a mensageria.
 */
const ordemServicoRepository = require("./infrastructure/repositories/ordemServico.repository");
const clienteRepository = require("./infrastructure/repositories/cliente.repository");
const veiculoRepository = require("./infrastructure/repositories/veiculo.repository");
const servicoRepository = require("./infrastructure/repositories/servico.repository");
const pecaRepository = require("./infrastructure/repositories/peca.repository");
const historicoRepository = require("./infrastructure/repositories/osHistorico.repository");
const outboxRepository = require("./infrastructure/repositories/outbox.repository");
const processedEventsRepository = require("./infrastructure/repositories/processedEvents.repository");
const unitOfWork = require("./infrastructure/database/unitOfWork");

const {
  CriarOrdemServico,
  BuscarOrdensServico,
  BuscarOrdemServicoPorId,
  BuscarOrdensPorCliente,
  BuscarHistoricoOrdemServico,
  BuscarOrdemServicoInterna,
  EntregarOrdemServico,
  BuscarServicosFinalizadosComTempoMedio,
} = require("./application/ordemServico.service");
const {
  TransicionarStatusOrdemServico,
  RegistrarOcorrenciaOrdemServico,
} = require("./application/transicaoStatus.service");
const { criarHandlers } = require("./application/handlers");

const transicionarStatus = new TransicionarStatusOrdemServico({
  ordemServicoRepository,
  historicoRepository,
  outboxRepository,
  processedEventsRepository,
  unitOfWork,
});

const registrarOcorrencia = new RegistrarOcorrenciaOrdemServico({
  ordemServicoRepository,
  historicoRepository,
  processedEventsRepository,
  unitOfWork,
});

const useCases = {
  criarOrdemServico: new CriarOrdemServico(
    ordemServicoRepository,
    clienteRepository,
    veiculoRepository,
    servicoRepository,
    pecaRepository,
    { historicoRepository, outboxRepository, unitOfWork }
  ),
  buscarOrdensServico: new BuscarOrdensServico(ordemServicoRepository),
  buscarOrdemServicoPorId: new BuscarOrdemServicoPorId(ordemServicoRepository),
  buscarOrdensPorCliente: new BuscarOrdensPorCliente(ordemServicoRepository, clienteRepository),
  buscarHistorico: new BuscarHistoricoOrdemServico(ordemServicoRepository, historicoRepository),
  buscarOrdemInterna: new BuscarOrdemServicoInterna(ordemServicoRepository, clienteRepository, veiculoRepository),
  entregarOrdemServico: new EntregarOrdemServico(transicionarStatus),
  buscarServicosFinalizados: new BuscarServicosFinalizadosComTempoMedio(ordemServicoRepository),
  transicionarStatus,
  registrarOcorrencia,
};

const handlers = criarHandlers({ transicionarStatus, registrarOcorrencia });

module.exports = {
  useCases,
  handlers,
  repositories: { outboxRepository },
  unitOfWork,
};
