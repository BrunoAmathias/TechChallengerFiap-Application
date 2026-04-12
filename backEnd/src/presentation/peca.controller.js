const { CriarPeca, BuscarPecas, BuscarPecaPorId, AtualizarPeca, DeletarPeca } = require("../application/peca.service");
const PecaRepository = require("../infrastructure/peca.repository");

const criarPeca = new CriarPeca(PecaRepository);
const buscarPecas = new BuscarPecas(PecaRepository);
const buscarPecaPorId = new BuscarPecaPorId(PecaRepository);
const atualizarPeca = new AtualizarPeca(PecaRepository);
const deletarPeca = new DeletarPeca(PecaRepository);

class PecaController {
  async criar(req, res) {
    try {
      const result = await criarPeca.execute(req.body);
      return res.status(201).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  async buscar(req, res) {
    try {
      const result = await buscarPecas.execute();
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  async buscarPorId(req, res) {
    const id = req.params.id;
    try {
      const result = await buscarPecaPorId.execute(id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(404).json({ error: err.message });
    }
  }

  async atualizar(req, res) {
    const id = req.params.id;
    try {
      const result = await atualizarPeca.execute(id, req.body);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  async deletar(req, res) {
    const id = req.params.id;
    try {
      await deletarPeca.execute(id);
      return res.status(204).send();
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
}

module.exports = new PecaController();
