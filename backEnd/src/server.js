const express = require('express');
const pool = require('./infrastructure/database/connection');

const app = express();

app.get('/clientes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});



app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});