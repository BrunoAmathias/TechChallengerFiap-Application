const pool = require("../database/connection")

class VeiculoRepository{
async criar(veiculo){
        const result = await pool.query( 
        `INSERT INTO veiculos (marca, modelo, ano, placa)
        VALUES ($1, $2, $3, $4) RETURNING *`,
        [veiculo.marca, veiculo.modelo, veiculo.ano, veiculo.placa]
        );
        return result.rows[0];
}

async buscarVeiculoPorId(id){
    const result = await pool.query(
        `SELECT * FROM veiculos WHERE id = $1`,
        [id]
    );
    
    return result.rows[0]
}

async buscarPorPlaca(placa){
    const result = await pool.query(
        `SELECT * FROM veiculos WHERE placa = $1`,
        [placa]
    );

    return result.rows[0]
}

async listar(){
    const result = await pool.query(`SELECT * FROM veiculos`);
    return result.rows;
}

async deletar(id){
await pool.query(`DELETE FROM veiculos WHERE id = $1`,
    [id])
}
async atualizar(id, veiculo){
  const result = await pool.query(
         `UPDATE veiculos
     SET marca = COALESCE($1, marca), 
         modelo = COALESCE($2, modelo), 
         ano = COALESCE($3, ano),
         placa = COALESCE($4, placa)
        WHERE id = $5
     RETURNING *`,
     [veiculo.marca || null, veiculo.modelo || null, veiculo.ano || null, veiculo.placa || null, id ]

    ) 
    return result.rows[0]
}




}



module.exports = new VeiculoRepository()