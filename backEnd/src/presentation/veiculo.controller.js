const {CriarVeiculo, listarVeiculos, BuscarVeiculoPorId, deletarVeiculo, atualizarVeiculo} = require("../application/veiculo.service")
const VeiculoRepository = require("../infrastructure/veiculo.repository")

const criaVeiculo = new CriarVeiculo(VeiculoRepository)
const listaVeiculos = new listarVeiculos(VeiculoRepository)
const buscaVeiculoPorId = new BuscarVeiculoPorId(VeiculoRepository)
const deletaVeiculo = new deletarVeiculo(VeiculoRepository)
const atualizaVeiculo = new atualizarVeiculo(VeiculoRepository)



class VeiculoController{
async criar(req, res){
    try {
        const result = await criaVeiculo.execute(req.body);
        return res.status(201).json(result);
    }catch(err){
        return res.status(401).json({error: err.message})
    }
}

async buscarPorId(req, res){
    const id = req.params.id
    try {
        const result = await buscaVeiculoPorId.execute(id) 
        return res.status(200).json(result)      
    } catch (err) {
        return res.status(400).json({error: err.message})
    }
}

async listar(req, res){
        const result = await listaVeiculos.execute();
        return res.json(result);
    
}

async deletar(req, res){
        const id = req.params.id
        console.log(id);
        await deletaVeiculo.execute(id)
        return res.status(204).json({message:"Veículo excluído com sucesso!", id:id})
}

async atualizar(req, res){
    try {
        const result = await atualizaVeiculo.execute(req.params.id, req.body)
        return res.json(result)
    } catch (err) {
        return res.status(400).json({error:err.message})
    }
}
}

module.exports = new VeiculoController()