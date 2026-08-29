const {Pool} = require('pg')

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.query('SELECT NOW()')
    .then(result => {
        console.log('✅ PostgreSQL conectado!');
        console.log('Horário do banco:', result.rows[0]);
    })
    .catch(error => {
        console.error('❌ Erro ao conectar ao PostgreSQL:', error);
    });

module.exports = pool;