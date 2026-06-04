const pool = require("../database/connection");

class PecaRepository {
  async criar(peca) {
    const result = await pool.query(
      `INSERT INTO pecas (nome, descricao, valor, quantidade)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [peca.nome, peca.descricao, peca.valor, peca.quantidade]
    );
    return result.rows[0];
  }

  async listar() {
    const result = await pool.query(`SELECT * FROM pecas`);
    return result.rows;
  }

  async buscarPorId(id) {
    const result = await pool.query(`SELECT * FROM pecas WHERE id = $1`, [id]);
    return result.rows[0];
  }

  async atualizar(id, peca) {
    const result = await pool.query(
      `UPDATE pecas
       SET nome = COALESCE($1, nome),
           descricao = COALESCE($2, descricao),
           valor = COALESCE($3, valor),
           quantidade = COALESCE($4, quantidade)
       WHERE id = $5
       RETURNING *`,
      [peca.nome || null, peca.descricao || null, peca.valor || null, peca.quantidade || null, id]
    );
    return result.rows[0];
  }

  async deletar(id) {
    await pool.query(`DELETE FROM pecas WHERE id = $1`, [id]);
  }
}

module.exports = new PecaRepository();
