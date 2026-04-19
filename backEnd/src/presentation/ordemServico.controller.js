const {
  CriarOrdemServico,
  BuscarOrdensServico,
  BuscarOrdemServicoPorId,
  BuscarOrdensPorCliente,
  AtualizarStatusOrdemServico,
  AprovarOrdemServico,
  AvancarStatusOrdemServico,
  BuscarServicosFinalizadosComTempoMedio,
} = require("../application/ordemServico.service");

const OrdemServicoRepository = require("../infrastructure/ordemServico.repository");
const ClienteRepository = require("../infrastructure/cliente.repository");
const VeiculoRepository = require("../infrastructure/veiculo.repository");
const ServicoRepository = require("../infrastructure/servico.repository");
const PecaRepository = require("../infrastructure/peca.repository");

const criarOrdemServico = new CriarOrdemServico(
  OrdemServicoRepository,
  ClienteRepository,
  VeiculoRepository,
  ServicoRepository,
  PecaRepository
);
const buscarOrdensServico = new BuscarOrdensServico(OrdemServicoRepository);
const buscarOrdemServicoPorId = new BuscarOrdemServicoPorId(OrdemServicoRepository);
const buscarOrdensPorCliente = new BuscarOrdensPorCliente(OrdemServicoRepository, ClienteRepository);
const atualizarStatusOrdemServico = new AtualizarStatusOrdemServico(OrdemServicoRepository);
const aprovarOrdemServico = new AprovarOrdemServico(OrdemServicoRepository, ClienteRepository);
const avancarStatusOrdemServico = new AvancarStatusOrdemServico(OrdemServicoRepository, ClienteRepository);
const buscarServicosFinalizadosComTempoMedio = new BuscarServicosFinalizadosComTempoMedio(OrdemServicoRepository);

class OrdemServicoController {
  async criar(req, res) {
    try {
      const result = await criarOrdemServico.execute(req.body);
      return res.status(201).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  async buscar(req, res) {
    try {
      const result = await buscarOrdensServico.execute();
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  async buscarPorId(req, res) {
    const id = req.params.id;
    try {
      const result = await buscarOrdemServicoPorId.execute(id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(404).json({ error: err.message });
    }
  }

  async buscarPorCliente(req, res) {
    const documento = req.params.documento;
    try {
      const result = await buscarOrdensPorCliente.execute(documento);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(404).json({ error: err.message });
    }
  }

  async atualizarStatus(req, res) {
    const id = req.params.id;
    const { status } = req.body;
    try {
      const result = await atualizarStatusOrdemServico.execute(id, status);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  async aprovar(req, res) {
    const id = req.params.id;
    try {
      const result = await aprovarOrdemServico.execute(id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  async avancar(req, res) {
    const id = req.params.id;
    try {
      const result = await avancarStatusOrdemServico.execute(id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  async buscarServicosFinalizados(req, res) {
    const id = req.params.id;
    try {
      const result = await buscarServicosFinalizadosComTempoMedio.execute(id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
}

module.exports = new OrdemServicoController();
