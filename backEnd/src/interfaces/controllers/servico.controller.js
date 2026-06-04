const {CriarServico, BuscarServico, BuscarServicoPorId, DeletarServico, AtualizarServico} = require("../../application/servico.service")
const ServicoRepository = require("../../infrastructure/repositories/servico.repository")

const criaServico = new CriarServico(ServicoRepository)
const buscarServico = new BuscarServico(ServicoRepository)
const buscarServicoPorId = new BuscarServicoPorId(ServicoRepository)
const atualizaServico = new AtualizarServico(ServicoRepository)
const deletaServico = new DeletarServico(ServicoRepository)

class ServicoController{
    async criar(req, res){
        try {
            const result = await criaServico.execute(req.body)
            return res.status(201).json(result)
        } catch (err) {
             return res.status(401).json({error: err.message})
        }
        
    }
    async buscar(req, res){
        try {
            const result = await buscarServico.execute()
            return res.status(200).json(result)
        } catch (err) {
            return res.status(401).json({error: err.message})

        }
    }
 
     async buscarPorId(req, res){
         const id = req.params.id
        try {
            const result = await buscarServicoPorId.execute(id)
            return res.status(200).json(result)
        } catch (err) {
            return res.status(401).json({error: err.message})
        }
    }

     async deletar(req, res){
        const id = req.params.id
        try {
            await deletaServico.execute(id)
            return res.status(204).send()
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
     }


     async atualizar(req, res){
        const id = req.params.id
        console.log("BODY:", req.body) 
        try {
            const result = await atualizaServico.execute(id, req.body)
            return res.json(result)
        } catch (err) {
            return res.status(400).json({ error: err.message });

        }
     }
}


module.exports = new ServicoController()

