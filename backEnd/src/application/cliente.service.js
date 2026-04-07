const Cliente = require("../domain/cliente");

class CriarCliente {
  constructor(clienteRepository, Validador) { 
    this.clienteRepository = clienteRepository;
    this.Validador = Validador
  }
  async execute(data) {
    const cliente = new Cliente(data, this.Validador);

    return await this.clienteRepository.criar(cliente);
  }
}


class BuscarClientePorId {
  constructor(clienteRepository) { 
    this.clienteRepository = clienteRepository;
  }
  async execute(id) {
    const cliente = await this.clienteRepository.buscarPorId(id);

    if (!cliente) {
      throw new Error("Cliente não encontrado");
    }

    return cliente;
  }
}


class ListarClientes {
  constructor(clienteRepository) { 
    this.clienteRepository = clienteRepository;
  }
  async execute() {
    return await this.clienteRepository.listar();
  }
}


class AtualizarCliente {
  constructor(clienteRepository, Validador) { 
    this.clienteRepository = clienteRepository;
    this.Validador = Validador

  }
  async execute(id, data) {
    return await this.clienteRepository.atualizar(id, data, this.Validador);
  }
}


class DeletarCliente {
  constructor(clienteRepository) { 
    this.clienteRepository = clienteRepository;
  }
  async execute(id) {
    return await this.clienteRepository.deletar(id);
  }
}

module.exports = {
  CriarCliente,
  BuscarClientePorId,
  ListarClientes,
  AtualizarCliente,
  DeletarCliente
};