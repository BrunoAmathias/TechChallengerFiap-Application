class OrdemServico {
  constructor({
    id,
    cliente_id,
    veiculo_id,
    servicos = [],
    pecas = [],
    valor_total = 0,
    status = "Recebida",
    aprovado = false,
    created_at,
    updated_at,
  }) {
    this.id = id;
    this.cliente_id = cliente_id;
    this.veiculo_id = veiculo_id;
    this.servicos = servicos;
    this.pecas = pecas;
    this.valor_total = valor_total;
    this.status = status;
    this.aprovado = aprovado;
    this.created_at = created_at;
    this.updated_at = updated_at;

    this.validar();
  }

  validar() {
    const statuses = [
      "Recebida",
      "Em diagnóstico",
      "Aguardando aprovação",
      "Em execução",
      "Finalizada",
      "Entregue",
    ];

    if (!this.cliente_id) throw new Error("Cliente é obrigatório");
    if (!this.veiculo_id) throw new Error("Veículo é obrigatório");
    if (!Array.isArray(this.servicos)) throw new Error("Serviços devem ser uma lista");
    if (!Array.isArray(this.pecas)) throw new Error("Peças devem ser uma lista");
    if (this.valor_total == null || isNaN(this.valor_total)) throw new Error("Valor total inválido");
    if (!statuses.includes(this.status)) throw new Error("Status inválido");
  }
}

module.exports = OrdemServico;
