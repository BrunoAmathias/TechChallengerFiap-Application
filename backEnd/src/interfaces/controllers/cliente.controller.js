const { CriarCliente, BuscarClientePorId, ListarClientes, AtualizarCliente, DeletarCliente } = require("../../application/cliente.service");
const clienteRepository = require("../../infrastructure/repositories/cliente.repository"); 
const ValidarDocumento = require("../../infrastructure/utils/cpf-validator");


const Validador = new ValidarDocumento()
const criaCliente = new CriarCliente(clienteRepository, Validador);
const buscarCliente = new BuscarClientePorId(clienteRepository);
const listarClientes = new ListarClientes(clienteRepository);
const atualizarCliente = new AtualizarCliente(clienteRepository, Validador);
const deletarCliente = new DeletarCliente(clienteRepository);



class ClienteController {
  async criar(req, res) {
    try {
      const result = await criaCliente.execute(req.body);
      return res.status(201).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  async buscarPorId(req, res) {
    try {
      const result = await buscarCliente.execute(req.params.id);
      return res.json(result);
    } catch (err) {
      return res.status(404).json({ error: err.message });
    }
  }

  async listar(req, res) {
    const result = await listarClientes.execute();
    return res.json(result);
  }
  

  async atualizar(req, res) {
    try {
      const result = await atualizarCliente.execute(req.params.id, req.body);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  async deletar(req, res) {
    await deletarCliente.execute(req.params.id);
    return res.status(204).send();
  }
}

module.exports = new ClienteController();