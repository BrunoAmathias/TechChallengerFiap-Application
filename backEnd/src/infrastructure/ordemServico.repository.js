const pool = require("./database/connection");

class OrdemServicoRepository {
  async criar(ordem, servicosItems = [], pecasItems = []) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const ordemResult = await client.query(
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
        await client.query(
          `INSERT INTO os_servicos
           (os_id, servico_id, quantidade, valor_unitario, total)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            ordemCriada.id,
            item.servico_id,
            item.quantidade,
            item.valor_unitario,
            item.total,
          ]
        );
      }

      for (const item of pecasItems) {
        await client.query(
          `INSERT INTO os_pecas
           (os_id, peca_id, quantidade, valor_unitario, total)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            ordemCriada.id,
            item.peca_id,
            item.quantidade,
            item.valor_unitario,
            item.total,
          ]
        );

        await client.query(
          `UPDATE pecas
           SET quantidade = quantidade - $1
           WHERE id = $2`,
          [item.quantidade, item.peca_id]
        );
      }

      await client.query("COMMIT");

      ordemCriada.servicos = servicosItems;
      ordemCriada.pecas = pecasItems;
      return ordemCriada;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async listar() {
    const result = await pool.query(
      `SELECT * FROM ordens_servico
      WHERE status not in ('Finalizada', 'Entregue')
      ORDER BY case when status = 'Em execução' then 1
           when status = 'Aguardando aprovação' then 2
           when status = 'Em diagnóstico' then 3
           when status = 'Recebida' then 4
           when status = 'Finalizada' then 5
           when status = 'Entregue' then 6
      else 7 end, created_at ASC`

    );

    return result.rows;
  }

  async buscarPorId(id) {
    const result = await pool.query(`SELECT * FROM ordens_servico WHERE id = $1`, [id]);
    const ordem = result.rows[0];
    if (!ordem) return null;

    const servicosResult = await pool.query(
      `SELECT os.*, s.nome, s.descricao
       FROM os_servicos os
       JOIN servicos s ON s.id = os.servico_id
       WHERE os.os_id = $1`,
      [id]
    );

    const pecasResult = await pool.query(
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

  async buscarPorClienteId(cliente_id) {
    const result = await pool.query(
      `SELECT * FROM ordens_servico WHERE cliente_id = $1 ORDER BY created_at DESC`,
      [cliente_id]
    );
    return result.rows;
  }

  async atualizarStatus(id, status, aprovado = null) {
    if (aprovado !== null) {
      const result = await pool.query(
        `UPDATE ordens_servico
         SET status = $1,
             aprovado = $2,
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [status, aprovado, id]
      );
      return result.rows[0];
    } else {
      const result = await pool.query(
        `UPDATE ordens_servico
         SET status = $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [status, id]
      );
      return result.rows[0];
    }
  }

  async atualizarStatusOsServico(status, start_time, id){
    const result = await pool.query(
      `UPDATE os_servicos
       SET status = $1,
           start_time = $2,
           updated_at = NOW()
       WHERE os_id = $3`,
      [status, start_time, id]
    );
    return result.rows;
  }

  async finalizarServicosOs(id, end_time, status){
    const result = await pool.query(
      `UPDATE os_servicos
       SET status = $1,
           end_time = $2,
           updated_at = NOW()
       WHERE os_id = $3`,
      [status, end_time, id]
    );
    return result.rows;
  }

  async aprovar(id, aprovado = true) {
    const result = await pool.query(
      `UPDATE ordens_servico
       SET aprovado = $1,
           status = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [aprovado, aprovado ? "Em execução" : "Recusada", id]
    );
    return result.rows[0];
  }

  async buscarServicosFinalizadosComTempoMedio(id) {
    const result = await pool.query(
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
