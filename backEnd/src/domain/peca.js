class Peca {
    constructor({id, nome, descricao, valor, quantidade}) {
        this.id = id
        this.nome = nome
        this.descricao = descricao
        this.valor = valor
        this.quantidade = quantidade
       this.validar()
    }
    validar(){
        if(!this.nome) throw new Error("Nome é obrigatório")
        if(!this.descricao) throw new Error("Descrição é obrigatória")
        if(!this.valor) throw new Error("Valor é obrigatório")
    }
}

module.exports = Peca