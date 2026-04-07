const Servico = require("../domain/servico")

class CriarServico{
    constructor(ServicoRepository){ 
     
        this.ServicoRepository = ServicoRepository   

    }

    async execute(data){
        const servico = new Servico(data);
        return await this.ServicoRepository.criar(servico)
    }
}


class BuscarServico{
    constructor(ServicoRepository){
        this.ServicoRepository = ServicoRepository  
    }
    async execute(){
        return await this.ServicoRepository.buscar()
    }

}


class BuscarServicoPorId{
    constructor(ServicoRepository){
        this.ServicoRepository = ServicoRepository  
    }
    async execute(id){
        const servico = await this.ServicoRepository.buscarPorId(id)
        if(!servico) throw new Error("Serviço não encontrado")
        return servico
    }

}

class DeletarServico {
    constructor(ServicoRepository) {
        this.ServicoRepository = ServicoRepository
    }
    async execute(id){
        const servico = await this.ServicoRepository.deletar(id)
        return servico
    }

}

class AtualizarServico {
    constructor(ServicoRepository) {
        this.ServicoRepository = ServicoRepository
    }

    async execute(id, data){
        const servico = await this.ServicoRepository.atualizar(id, data)
        if (!servico) throw new Error("Serviço não encontrado")
        return servico
    }
}


module.exports = 
{
CriarServico,
BuscarServico,
BuscarServicoPorId,
DeletarServico,
AtualizarServico
}