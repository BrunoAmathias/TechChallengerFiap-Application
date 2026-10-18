# language: pt
Funcionalidade: Saga da ordem de serviço (OS Service)
  Como oficina
  Quero que a OS avance conforme os eventos do Billing e do Execution
  Para que o status e o estoque reflitam o andamento real do atendimento

  Contexto:
    Dado que existe o serviço "Troca de óleo" de R$ 120,00
    E que existe a peça "Filtro" de R$ 30,00 com 10 unidades em estoque

  Cenário: Fluxo completo até a entrega
    Quando o atendente abre uma OS com o serviço e 2 unidades da peça
    Então a OS fica "Recebida" com valor total de R$ 180,00
    E o estoque da peça passa a ter 8 unidades
    E o evento "os.aberta" é publicado
    Quando o Billing publica "orcamento.gerado"
    Então a OS fica "Aguardando aprovação"
    Quando o Billing publica "orcamento.aprovado"
    Então a OS fica "Aguardando pagamento"
    Quando o Billing publica "pagamento.confirmado"
    Então a OS fica "Aguardando execução"
    Quando o Execution publica "execucao.status_atualizado" com status "EM_DIAGNOSTICO"
    Então a OS fica "Em diagnóstico"
    Quando o Execution publica "execucao.status_atualizado" com status "EM_REPARO"
    Então a OS fica "Em execução"
    Quando o Execution publica "execucao.finalizada"
    Então a OS fica "Finalizada"
    Quando o atendente registra a entrega do veículo
    Então a OS fica "Entregue"
    E o evento "os.entregue" é publicado
    E o histórico da OS tem 8 etapas

  Cenário: Orçamento recusado cancela a OS e devolve o estoque
    Dado uma OS aberta com 2 unidades da peça
    E o Billing publicou "orcamento.gerado"
    Quando o Billing publica "orcamento.recusado"
    Então a OS fica "Cancelada"
    E o estoque da peça volta a ter 10 unidades
    E o evento "os.cancelada" é publicado

  Cenário: Falha na execução cancela a OS e devolve o estoque
    Dado uma OS aberta com 2 unidades da peça
    E a OS foi paga e está "Em diagnóstico"
    Quando o Execution publica "execucao.falhou"
    Então a OS fica "Cancelada"
    E o estoque da peça volta a ter 10 unidades
    E o evento "os.cancelada" é publicado
    Quando o Billing publica "pagamento.estornado"
    Então a OS continua "Cancelada"
    E o histórico registra o estorno

  Cenário: Evento repetido não é processado duas vezes
    Dado uma OS aberta com 2 unidades da peça
    E o Billing publicou "orcamento.gerado"
    Quando o Billing publica "orcamento.recusado" duas vezes
    Então o estoque da peça volta a ter 10 unidades
    E o evento "os.cancelada" é publicado uma única vez
