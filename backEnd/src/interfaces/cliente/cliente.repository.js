const poll = require('../../infrastructure/database/connection');

class ClienteRepository{
    async getAllclientes(){
        const result = await poll.query('SELECT * FROM clientes');
        return result.rows;
    }
}


module.exports = ClienteRepository;