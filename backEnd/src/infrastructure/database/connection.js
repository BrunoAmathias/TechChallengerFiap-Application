const {Pool} = require('pg')

const pool = new Pool({
    user:'postgres',
    host: 'localhost',       
    database: 'oficina',     
    password: 'Bruninho28@',   
    port: 5432,              
});

module.exports = pool;