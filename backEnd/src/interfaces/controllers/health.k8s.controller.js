
class HealthK8sController {
async checkHealth(req, res) {
       await res.status(200).json({
            status: "OK",
            timestamp: new Date().toISOString()
        })
    }
}

module.exports = new HealthK8sController();