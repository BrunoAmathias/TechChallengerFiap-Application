const OrdemServico = require("../domain/ordemServico");

class CriarOrdemServico {
  constructor(
    ordemServicoRepository,
    clienteRepository,
    veiculoRepository,
    servicoRepository,
    pecaRepository
  ) {
    this.ordemServicoRepository = ordemServicoRepository;
    this.clienteRepository = clienteRepository;
    this.veiculoRepository = veiculoRepository;
    this.servicoRepository = servicoRepository;
    this.pecaRepository = pecaRepository;
  }

  async execute(data) {
    const { cliente, veiculo, servicos = [], pecas = [] } = data;

    if (!cliente || !cliente.documento) {
      throw new Error("Documento do cliente é obrigatório para criar a OS");
    }

    let clienteExistente = await this.clienteRepository.buscarPorDocumento(cliente.documento);
    if (!clienteExistente) {
      clienteExistente = await this.clienteRepository.criar(cliente);
    }

    if (!veiculo || !veiculo.placa) {
      throw new Error("Veículo com placa é obrigatório para criar a OS");
    }

    let veiculoExistente = await this.veiculoRepository.buscarPorPlaca(veiculo.placa);
    if (!veiculoExistente) {
      veiculoExistente = await this.veiculoRepository.criar(veiculo);
    }

    const parseDecimal = (value, field) => {
      if (value == null) {
        throw new Error(`${field} inválido`);
      }

      let text = String(value).trim();
      text = text.replace(/[R$\s]/g, "");
      if (text.includes(",") && !text.includes(".")) {
        text = text.replace(",", ".");
      } else if (text.includes(",") && text.includes(".")) {
        text = text.replace(/,/g, "");
      }

      const parsed = Number(text);
      if (Number.isNaN(parsed)) {
        throw new Error(`${field} inválido`);
      }
      return parsed;
    };

    const servicosItems = await Promise.all(
      servicos.map(async (item) => {
        if (!item.id) {
          throw new Error("Cada serviço deve ter um id");
        }

        const servico = await this.servicoRepository.buscarPorId(item.id);
        if (!servico) {
          throw new Error(`Serviço não encontrado: id ${item.id}`);
        }

        const valorUnitario = parseDecimal(servico.valor, `Valor do serviço ${item.id}`);

        return {
          servico_id: servico.id,
          nome: servico.nome,
          descricao: servico.descricao,
          valor_unitario: valorUnitario,
          quantidade: 1,
          total: valorUnitario,
        };
      })
    );

    const pecasItems = await Promise.all(
      pecas.map(async (item) => {
        if (!item.id) {
          throw new Error("Cada peça deve ter um id");
        }

        const peca = await this.pecaRepository.buscarPorId(item.id);
        if (!peca) {
          throw new Error(`Peça não encontrada: id ${item.id}`);
        }

        const quantidade = Number(item.quantidade || 1);
        if (quantidade <= 0) {
          throw new Error("Quantidade de peça deve ser maior que zero");
        }

        if (peca.quantidade < quantidade) {
          throw new Error(`Estoque insuficiente para a peça ${peca.nome}`);
        }

        const valorUnitario = parseDecimal(peca.valor, `Valor da peça ${item.id}`);

        return {
          peca_id: peca.id,
          nome: peca.nome,
          descricao: peca.descricao,
          valor_unitario: valorUnitario,
          quantidade,
          total: valorUnitario * quantidade,
        };
      })
    );

    const valor_total =
      servicosItems.reduce((total, item) => total + item.total, 0) +
      pecasItems.reduce((total, item) => total + item.total, 0);

    const ordem = new OrdemServico({
      cliente_id: clienteExistente.id,
      veiculo_id: veiculoExistente.id,
      servicos: servicosItems,
      pecas: pecasItems,
      valor_total,
    });

    return await this.ordemServicoRepository.criar(ordem, servicosItems, pecasItems);
  }
}

class BuscarOrdensServico {
  constructor(ordemServicoRepository) {
    this.ordemServicoRepository = ordemServicoRepository;
  }

  async execute() {
    return await this.ordemServicoRepository.listar();
  }
}

class BuscarOrdemServicoPorId {
  constructor(ordemServicoRepository) {
    this.ordemServicoRepository = ordemServicoRepository;
  }

  async execute(id) {
    const ordem = await this.ordemServicoRepository.buscarPorId(id);
    if (!ordem) {
      throw new Error("Ordem de serviço não encontrada");
    }
    return ordem;
  }
}

class BuscarOrdensPorCliente {
  constructor(ordemServicoRepository, clienteRepository) {
    this.ordemServicoRepository = ordemServicoRepository;
    this.clienteRepository = clienteRepository;
  }

  async execute(documento) {
    const cliente = await this.clienteRepository.buscarPorDocumento(documento);
    if (!cliente) {
      throw new Error("Cliente não encontrado");
    }
    return await this.ordemServicoRepository.buscarPorClienteId(cliente.id);
  }
}

class AtualizarStatusOrdemServico {
  constructor(ordemServicoRepository) {
    this.ordemServicoRepository = ordemServicoRepository;
  }

  async execute(id, status) {
    if (!status) {
      throw new Error("Status é obrigatório");
    }
    return await this.ordemServicoRepository.atualizarStatus(id, status);
  }
}

class AprovarOrdemServico {
  constructor(ordemServicoRepository) {
    this.ordemServicoRepository = ordemServicoRepository;
  }

  async execute(id) {
    return await this.ordemServicoRepository.aprovar(id, true);
  }
}

module.exports = {
  CriarOrdemServico,
  BuscarOrdensServico,
  BuscarOrdemServicoPorId,
  BuscarOrdensPorCliente,
  AtualizarStatusOrdemServico,
  AprovarOrdemServico,
};
