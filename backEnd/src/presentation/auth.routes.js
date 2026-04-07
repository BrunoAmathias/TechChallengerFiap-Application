// No seu arquivo de rotas
const AuthController = require("./auth.controller");
const express = require("express")
const router = express.Router();


router.post("/login",(req, res) => AuthController.login(req, res));

module.exports = router;