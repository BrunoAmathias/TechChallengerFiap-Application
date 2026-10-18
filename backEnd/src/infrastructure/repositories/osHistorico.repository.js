const pool = require("../database/connection");

class OsHistoricoRepository {
  async registrar({ osId, statusAnterior = null, status, origem, eventId = null, observacao = null }, db = pool) {
    const result = await db.query(
      `INSERT INTO os_historico (os_id, status_anterior, status, origem, event_id, observacao)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [osId, statusAnterior, status, origem, eventId, observacao]
    );
    return result.rows[0];
  }

  async listarPorOs(osId, db = pool) {
    const result = await db.query(
      `SELECT id, status_anterior, status, origem, event_id, observacao, created_at
       FROM os_historico
       WHERE os_id = $1
       ORDER BY created_at ASC, id ASC`,
      [osId]
    );
    return result.rows;
  }
}

module.exports = new OsHistoricoRepository();
