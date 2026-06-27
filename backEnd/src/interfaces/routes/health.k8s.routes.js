const express  = require("express");
const router = express.Router();
const healthController = require("../controllers/health.k8s.controller");
/********** Health Check **********/

router.get("/health", (req, res) => healthController.checkHealth(req, res));


module.exports = router;