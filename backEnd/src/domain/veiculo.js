class Veiculos {
    constructor({ id, marca, modelo, ano, placa }) {
        this.id = id;
        this.marca = marca;
        this.modelo = modelo;
        this.ano = ano;
        this.placa = placa;

        this.validarCarro();
    }

    validarCarro() {
        if (!this.marca)  throw new Error("Marca é obrigatória");
        if (!this.modelo) throw new Error("Modelo é obrigatório");
        if (!this.ano)    throw new Error("Ano é obrigatório");
        if (!this.placa)  throw new Error("Placa é obrigatória");

        this.validarPlaca(this.placa);
    }

    validarPlaca(placa) {
        // Remove hífen caso enviado (ex: "ABC-1234" → "ABC1234")
        const placaNormalizada = placa.replace("-", "").toUpperCase();

        const formatoAntigo   = /^[A-Z]{3}[0-9]{4}$/;          // ABC1234
        const formatoMercosul = /^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/; // ABC1D23

        if (!formatoAntigo.test(placaNormalizada) && !formatoMercosul.test(placaNormalizada)) {
            throw new Error(
                "Placa inválida. Use o formato antigo (ABC1234) ou Mercosul (ABC1D23)"
            );
        }

        // Salva já normalizada, sem hífen e em maiúsculo
        this.placa = placaNormalizada;
    }
}

module.exports = Veiculos;