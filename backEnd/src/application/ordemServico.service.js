const OrdemServico = require("../domain/ordemServico");
const StatusTransition = require("../domain/statusTransition");
const NotificationService = require("./notification.service")

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

    // Buscar veículo existente pela placa (sempre usar dados do banco se existir)
    let veiculoExistente = await this.veiculoRepository.buscarPorPlaca(veiculo.placa);
    if (!veiculoExistente) {
      // Criar novo veículo apenas se não existir
      veiculoExistente = await this.veiculoRepository.criar(veiculo);
    }
    // Se já existe, usar os dados do banco (não validar consistência)

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
  constructor(ordemServicoRepository, clienteRepository) {
    this.ordemServicoRepository = ordemServicoRepository;
    this.clienteRepository = clienteRepository;
  }

  async execute(id) {
    const ordemAprovada = await this.ordemServicoRepository.aprovar(id, true);

    // Buscar dados do cliente para notificação
    const cliente = await this.clienteRepository.buscarPorId(ordemAprovada.cliente_id);

    if (cliente) {
      // Enviar notificação de email (mock)
      await NotificationService.enviarEmailAprovacao(ordemAprovada, cliente);
    }

    return ordemAprovada;
  }
}

class AvancarStatusOrdemServico {
  constructor(ordemServicoRepository, clienteRepository) {
    this.ordemServicoRepository = ordemServicoRepository;
    this.clienteRepository = clienteRepository;
  }

  async execute(id) {

    const date_time = new Date().toISOString();
    // Busca a ordem de serviço atual através do repositório
    const ordemAtual = await this.ordemServicoRepository.buscarPorId(id);
    if (!ordemAtual) {
      throw new Error(`Ordem de serviço não encontrada: id ${id}`);
    }
    // Busca o cliente atual através do repositório
    const cliente = await this.clienteRepository.buscarPorId(ordemAtual.cliente_id);

    if (!cliente) {
      throw new Error(`cliente não encontrado: id ${ordemAtual.cliente_id}`);
    }

    // Obtém o próximo status através da máquina de estados
    const novoStatus = StatusTransition.getNextStatus(ordemAtual.status);

    // Aprovação automática ao passar de "Aguardando aprovação" para "Em execução"
    if (ordemAtual.status === 'Aguardando aprovação' && novoStatus === 'Em execução') {
      const ordemAtualizada = await this.ordemServicoRepository.atualizarStatus(id, novoStatus, true) ;

      try {
        await NotificationService.enviarEmailAprovacao(ordemAtualizada, cliente);
      } catch (error) {
        console.error(`Erro ao enviar email de aprovação: ${error.message}`);
      }

      // Quando OS muda para "Em execução", iniciar todos os serviços
      try {
        await this.ordemServicoRepository.atualizarStatusOsServico(novoStatus, date_time, id);
      } catch (error) {
        console.error(`Erro ao iniciar serviços da OS ${id}: ${error.message}`);
      }
      return ordemAtualizada;
    }

    // Quando OS muda para "Finalizada", finalizar todos os serviços
    if (ordemAtual.status === 'Em execução' && novoStatus === 'Finalizada') {
      const ordemAtualizada = await this.ordemServicoRepository.atualizarStatus(id, novoStatus);

      try {
        await this.ordemServicoRepository.finalizarServicosOs(id, date_time, novoStatus);
      } catch (error) {
        console.error(`Erro ao finalizar serviços da OS ${id}: ${error.message}`);
      }
      return ordemAtualizada;
    }

    // Atualiza o status através do repositório (sem alterar aprovação)
    return await this.ordemServicoRepository.atualizarStatus(id, novoStatus);
  }
}

class BuscarServicosFinalizadosComTempoMedio {
  constructor(ordemServicoRepository) {
    this.ordemServicoRepository = ordemServicoRepository;
  }

  async execute(id) {
    const servicos = await this.ordemServicoRepository.buscarServicosFinalizadosComTempoMedio(id);

    if (!servicos || servicos.length === 0) {
      return {
        ordem_servico_id: id,
        servicos_finalizados: [],
        tempo_medio_geral_minutos: 0,
        mensagem: "Nenhum serviço finalizado encontrado para esta OS"
      };
    }

    // Formatar os dados de resposta
    const servicosFormatados = servicos.map(servico => ({
      id: servico.id,
      servico_id: servico.servico_id,
      nome: servico.nome,
      descricao: servico.descricao,
      quantidade: servico.quantidade,
      valor_unitario: parseFloat(servico.valor_unitario),
      total: parseFloat(servico.total),
      status: servico.status,
      start_time: servico.start_time,
      end_time: servico.end_time,
      tempo_gasto_minutos: parseFloat(servico.tempo_minutos) || 0
    }));

    const tempoMedioGeral = parseFloat(servicos[0].tempo_medio_minutos) || 0;

    return {
      ordem_servico_id: id,
      servicos_finalizados: servicosFormatados,
      tempo_medio_geral_minutos: tempoMedioGeral,
      total_servicos_finalizados: servicos.length
    };
  }
}

module.exports = {
  CriarOrdemServico,
  BuscarOrdensServico,
  BuscarOrdemServicoPorId,
  BuscarOrdensPorCliente,
  AtualizarStatusOrdemServico,
  AprovarOrdemServico,
  AvancarStatusOrdemServico,
  BuscarServicosFinalizadosComTempoMedio,
};
