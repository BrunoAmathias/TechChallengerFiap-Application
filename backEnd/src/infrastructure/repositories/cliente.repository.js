const pool = require("../database/connection");

class ClienteRepository {
  async criar(cliente) {
    const result = await pool.query(
      `INSERT INTO clientes (nome, email, telefone, tipo_documento, documento)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [cliente.nome, cliente.email, cliente.telefone, cliente.tipo_documento, cliente.documento]
    );

    return result.rows[0];
  }

  async buscarPorId(id) {
    const result = await pool.query(
      `SELECT * FROM clientes WHERE id = $1`,
      [id]
    );

    return result.rows[0];
  }

  async buscarPorDocumento(documento) {
    const result = await pool.query(
      `SELECT * FROM clientes WHERE documento = $1`,
      [documento]
    );

    return result.rows[0];
  }

  async listar() {
    const result = await pool.query(`SELECT * FROM clientes`);
    return result.rows;
  }

  async atualizar(id, cliente) {
    const result = await pool.query(
     `UPDATE clientes
     SET nome = COALESCE($1, nome), 
         email = COALESCE($2, email), 
         telefone = COALESCE($3, telefone),
         tipo_documento = COALESCE($4, tipo_documento),
         documento = COALESCE($5, documento)
        WHERE id = $6
     RETURNING *`,
      [cliente.nome || null, cliente.email || null, cliente.telefone || null, cliente.tipo_documento || null, cliente.documento || null, id]
    );

    return result.rows[0];
  }

  async deletar(id) {
    await pool.query(`DELETE FROM clientes WHERE id = $1`, [id]);
  }




 
}



module.exports = new ClienteRepository();