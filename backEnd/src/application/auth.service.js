const usuarioRepository = require('../infrastructure/auth.repository');
const jwt = require('jsonwebtoken');

class AuthService {
  async login(email, senha) {
    const usuario = await usuarioRepository.buscarPorEmail(email);

    // O Service compara a senha (que agora vem do .env através do repo)
    if (!usuario || usuario.senha !== senha) {
      throw new Error("Credenciais inválidas");
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { auth: true, token };
  }
}

module.exports = new AuthService();