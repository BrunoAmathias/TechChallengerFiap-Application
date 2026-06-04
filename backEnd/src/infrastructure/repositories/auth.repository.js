const pool = require('../database/connection.js');

class UsuarioRepository {
  async criar(usuario) {
    const { nome, email, senha } = usuario;
    const result = await pool.query(
      'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email',
      [nome, email, senha]
    );
    return result.rows[0];
  }

 async buscarPorEmail(email) {
    // Verifica se o email enviado é o mesmo do .env
    if (email === process.env.MOCK_USER_EMAIL) {
      return {
        id: process.env.MOCK_USER_ID,
        email: process.env.MOCK_USER_EMAIL,
        senha: process.env.MOCK_USER_PASSWORD, 
        nome: "Administrador Mock"
      };
    }
    
    return null; // Usuário não encontrado
  }
}

module.exports = new UsuarioRepository();