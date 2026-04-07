class Veiculos{
    constructor({id, marca, modelo, ano, placa}){
        this.id = id;
        this.marca = marca;
        this.modelo = modelo;
        this.ano = ano;
        this.placa = placa;
        
        this.validarCarro()
    }

    validarCarro(){
        if(!this.marca) throw new Error("Marca é obrigatória");
        if(!this.modelo) throw new Error("modelo é obrigatória");
        if(!this.ano) throw new Error("ano é obrigatória");
        if(!this.placa) throw new Error("placa é obrigatória");
    }

}


module.exports = Veiculos;



