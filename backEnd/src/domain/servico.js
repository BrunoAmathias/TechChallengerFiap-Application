class Servico{
    constructor({id, nome, descricao, valor}){
        this.id = id
        this.nome = nome
        this.descricao = descricao
        this.valor = valor

        this.validarDados()
    }

    validarDados(){
        if(!this.nome){throw new Error("Nome do serviço é obrigatório")}
        if(!this.descricao){throw new Error("Descrição do serviço é obrigatório")}
        if(!this.valor){throw new Error("Valor do serviço é obrigatório")}
    }
}


module.exports = Servico