const pool = require("./database/connection");



class ServicoRepository{
    async criar(servico){
        const result = await pool.query(
            `INSERT INTO servicos (nome, descricao, valor)
       VALUES ($1, $2, $3) RETURNING *`,
       [servico.nome, servico.descricao, servico.valor]
        )
        return result.rows[0]
    }

    async buscar(){
        const result = await pool.query(`SELECT * FROM servicos`)
            return result.rows
    }

    async buscarPorId(id){
        const result = await pool.query(`SELECT * FROM servicos WHERE id =$1 `, [id])
        return result.rows[0]
    }

    async deletar(id){
        const result = await pool.query(`DELETE FROM servicos WHERE id =$1 `, [id])
        return result.rows[0]
    }

    async atualizar(id, servico){
        const result = await pool.query(
        `UPDATE servicos
         SET nome = COALESCE($1, nome),
         descricao = COALESCE($2, descricao),
         valor = COALESCE($3, valor)
         WHERE id = $4
         RETURNING *`
         , 
            [servico.nome || null, servico.descricao || null, servico.valor || null, id])
            console.log(result);
            return result.rows[0]
    }
}



module.exports = new ServicoRepository()