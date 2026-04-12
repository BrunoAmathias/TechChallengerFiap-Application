const Peca = require("../domain/peca");

class CriarPeca {
  constructor(pecaRepository) {
    this.pecaRepository = pecaRepository;
  }

  async execute(data) {
    const peca = new Peca(data);
    return await this.pecaRepository.criar(peca);
  }
}

class BuscarPecas {
  constructor(pecaRepository) {
    this.pecaRepository = pecaRepository;
  }

  async execute() {
    return await this.pecaRepository.listar();
  }
}

class BuscarPecaPorId {
  constructor(pecaRepository) {
    this.pecaRepository = pecaRepository;
  }

  async execute(id) {
    const peca = await this.pecaRepository.buscarPorId(id);
    if (!peca) {
      throw new Error("Peça não encontrada");
    }
    return peca;
  }
}

class AtualizarPeca {
  constructor(pecaRepository) {
    this.pecaRepository = pecaRepository;
  }

  async execute(id, data) {
    const peca = await this.pecaRepository.atualizar(id, data);
    if (!peca) {
      throw new Error("Peça não encontrada");
    }
    return peca;
  }
}

class DeletarPeca {
  constructor(pecaRepository) {
    this.pecaRepository = pecaRepository;
  }

  async execute(id) {
    return await this.pecaRepository.deletar(id);
  }
}

module.exports = {
  CriarPeca,
  BuscarPecas,
  BuscarPecaPorId,
  AtualizarPeca,
  DeletarPeca,
};
        