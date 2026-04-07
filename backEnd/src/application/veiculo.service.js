const Veiculos = require("../domain/veiculo");

class CriarVeiculo{
    constructor(veiculoRepository, ){
        this.veiculoRepository = veiculoRepository;   
    }
    async execute(data){
        const veiculo = new Veiculos(data)
       return await this.veiculoRepository.criar(veiculo)
    }
}

class listarVeiculos{
    constructor(veiculoRepository){
        this.veiculoRepository = veiculoRepository;   
    }

    async execute(){
    return await this.veiculoRepository.listar()
}
}


class BuscarVeiculoPorId{
    constructor(veiculoRepository){
        this.veiculoRepository = veiculoRepository;   
    }

    async execute(id){
        const veiculo = await this.veiculoRepository.buscarVeiculoPorId(id)
        if (!veiculo) {throw new Error("Veiculo não encontrado") 
        }
        return veiculo

    }
    }


class deletarVeiculo{
    constructor(veiculoRepository){
        this.veiculoRepository = veiculoRepository;
    }

    async execute(id){
        return await this.veiculoRepository.deletar(id)
    } 
}

class atualizarVeiculo{
    constructor(veiculoRepository){
        this.veiculoRepository = veiculoRepository
    }
    async execute(id, data){
        return await this.veiculoRepository.atualizar(id, data)
    }
}

module.exports = {
    CriarVeiculo,
    BuscarVeiculoPorId,
    listarVeiculos,
    deletarVeiculo,
    atualizarVeiculo
}
