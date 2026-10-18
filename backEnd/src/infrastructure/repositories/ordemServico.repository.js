const pool = require("../database/connection");
const { EstoqueInsuficienteError } = require("../../domain/errors");

/**
 * Todos os métodos recebem `db` opcional: o client de uma transação aberta
 * pelo UnitOfWork ou, por padrão, o pool.
 */
class OrdemServicoRepository {
  async criar(ordem, servicosItems = [], pecasItems = [], db = pool) {
    const ordemResult = await db.query(
      `INSERT INTO ordens_servico
       (cliente_id, veiculo_id, valor_total, status, aprovado)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        ordem.cliente_id,
        ordem.veiculo_id,
        ordem.valor_total,
        ordem.status,
        ordem.aprovado,
      ]
    );

    const ordemCriada = ordemResult.rows[0];

    for (const item of servicosItems) {
      await db.query(
        `INSERT INTO os_servicos
         (os_id, servico_id, quantidade, valor_unitario, total)
         VALUES ($1, $2, $3, $4, $5)`,
        [ordemCriada.id, item.servico_id, item.quantidade, item.valor_unitario, item.total]
      );
    }

    for (const item of pecasItems) {
      await db.query(
        `INSERT INTO os_pecas
         (os_id, peca_id, quantidade, valor_unitario, total)
         VALUES ($1, $2, $3, $4, $5)`,
        [ordemCriada.id, item.peca_id, item.quantidade, item.valor_unitario, item.total]
      );

      // Reserva de estoque: só decrementa se houver saldo (evita estoque negativo
      // quando duas OS disputam a mesma peça).
      const reserva = await db.query(
        `UPDATE pecas
         SET quantidade = quantidade - $1
         WHERE id = $2 AND quantidade >= $1`,
        [item.quantidade, item.peca_id]
      );

      if (reserva.rowCount === 0) {
        throw new EstoqueInsuficienteError(`Estoque insuficiente para a peça ${item.nome || item.peca_id}`);
      }
    }

    ordemCriada.servicos = servicosItems;
    ordemCriada.pecas = pecasItems;
    return ordemCriada;
  }

  async listar(db = pool) {
    const result = await db.query(
      `SELECT * FROM ordens_servico
      WHERE status not in ('Finalizada', 'Entregue', 'Cancelada')
      ORDER BY case when status = 'Em execução' then 1
           when status = 'Em diagnóstico' then 2
           when status = 'Aguardando execução' then 3
           when status = 'Aguardando pagamento' then 4
           when status = 'Aguardando aprovação' then 5
           when status = 'Recebida' then 6
      else 7 end, created_at ASC`
    );

    return result.rows;
  }

  async buscarPorId(id, db = pool) {
    const result = await db.query(`SELECT * FROM ordens_servico WHERE id = $1`, [id]);
    const ordem = result.rows[0];
    if (!ordem) return null;

    const servicosResult = await db.query(
      `SELECT os.*, s.nome, s.descricao
       FROM os_servicos os
       JOIN servicos s ON s.id = os.servico_id
       WHERE os.os_id = $1`,
      [id]
    );

    const pecasResult = await db.query(
      `SELECT op.*, p.nome, p.descricao
       FROM os_pecas op
       JOIN pecas p ON p.id = op.peca_id
       WHERE op.os_id = $1`,
      [id]
    );

    ordem.servicos = servicosResult.rows;
    ordem.pecas = pecasResult.rows;
    return ordem;
  }

  /** Lê a OS bloqueando a linha até o fim da transação (evita transições concorrentes). */
  async buscarParaAtualizar(id, db) {
    const result = await db.query(`SELECT * FROM ordens_servico WHERE id = $1 FOR UPDATE`, [id]);
    return result.rows[0] || null;
  }

  async buscarPorClienteId(cliente_id, db = pool) {
    const result = await db.query(
      `SELECT * FROM ordens_servico WHERE cliente_id = $1 ORDER BY created_at DESC`,
      [cliente_id]
    );
    return result.rows;
  }

  async atualizarStatus(id, status, db = pool, { motivoCancelamento = null, aprovado = null } = {}) {
    const result = await db.query(
      `UPDATE ordens_servico
       SET status = $1,
           motivo_cancelamento = COALESCE($2, motivo_cancelamento),
           aprovado = COALESCE($3, aprovado),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, motivoCancelamento, aprovado, id]
    );
    return result.rows[0];
  }

  async iniciarServicosOs(id, startTime, db = pool) {
    await db.query(
      `UPDATE os_servicos
       SET status = 'Em execução',
           start_time = COALESCE(start_time, $1),
           updated_at = NOW()
       WHERE os_id = $2`,
      [startTime, id]
    );
  }

  async finalizarServicosOs(id, endTime, db = pool) {
    await db.query(
      `UPDATE os_servicos
       SET status = 'Finalizada',
           end_time = $1,
           updated_at = NOW()
       WHERE os_id = $2`,
      [endTime, id]
    );
  }

  /** Compensação: devolve ao estoque as peças reservadas pela OS. */
  async liberarEstoque(id, db = pool) {
    const result = await db.query(
      `UPDATE pecas p
       SET quantidade = p.quantidade + op.quantidade
       FROM os_pecas op
       WHERE op.os_id = $1 AND op.peca_id = p.id
       RETURNING p.id AS peca_id, op.quantidade`,
      [id]
    );
    return result.rows;
  }

  async buscarServicosFinalizadosComTempoMedio(id, db = pool) {
    const result = await db.query(
      `SELECT
        os.*,
        s.nome,
        s.descricao,
        ROUND(EXTRACT(EPOCH FROM (os.end_time - os.start_time)) / 60, 2) as tempo_minutos,
        ROUND(AVG(EXTRACT(EPOCH FROM (os.end_time - os.start_time)) / 60) OVER (), 2) as tempo_medio_minutos
       FROM os_servicos os
       JOIN servicos s ON s.id = os.servico_id
       WHERE os.os_id = $1
         AND os.status = 'Finalizada'
         AND os.start_time IS NOT NULL
         AND os.end_time IS NOT NULL`,
      [id]
    );
    return result.rows;
  }
}

module.exports = new OrdemServicoRepository();
