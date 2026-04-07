const AuthService = require('../application/auth.service');

class AuthController {
  async login(req, res) {
    try {
      const { email, senha } = req.body;
      const result = await AuthService.login(email, senha);
      return res.json(result);
    } catch (err) {
      return res.status(401).json({ error: err.message });
    }
  }
}

module.exports = new AuthController();