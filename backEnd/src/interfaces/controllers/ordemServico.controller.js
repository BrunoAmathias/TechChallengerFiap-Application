const { useCases } = require("../../container");
const { NaoEncontradoError, TransicaoInvalidaError, EstoqueInsuficienteError } = require("../../domain/errors");

function statusDoErro(err, padrao = 400) {
  if (err instanceof NaoEncontradoError) return 404;
  if (err instanceof TransicaoInvalidaError || err instanceof EstoqueInsuficienteError) return 409;
  return padrao;
}

class OrdemServicoController {
  async criar(req, res) {
    try {
      const result = await useCases.criarOrdemServico.execute(req.body);
      return res.status(201).json(result);
    } catch (err) {
      return res.status(statusDoErro(err)).json({ error: err.message });
    }
  }

  async buscar(req, res) {
    try {
      const result = await useCases.buscarOrdensServico.execute();
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  async buscarPorId(req, res) {
    try {
      const result = await useCases.buscarOrdemServicoPorId.execute(req.params.id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(statusDoErro(err, 404)).json({ error: err.message });
    }
  }

  async buscarPorCliente(req, res) {
    try {
      const result = await useCases.buscarOrdensPorCliente.execute(req.params.documento);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(statusDoErro(err, 404)).json({ error: err.message });
    }
  }

  async buscarHistorico(req, res) {
    try {
      const result = await useCases.buscarHistorico.execute(req.params.id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(statusDoErro(err)).json({ error: err.message });
    }
  }

  async entregar(req, res) {
    try {
      const result = await useCases.entregarOrdemServico.execute(req.params.id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(statusDoErro(err)).json({ error: err.message });
    }
  }

  async buscarInterna(req, res) {
    try {
      const result = await useCases.buscarOrdemInterna.execute(req.params.id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(statusDoErro(err)).json({ error: err.message });
    }
  }

  async buscarServicosFinalizados(req, res) {
    try {
      const result = await useCases.buscarServicosFinalizados.execute(req.params.id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
}

module.exports = new OrdemServicoController();
