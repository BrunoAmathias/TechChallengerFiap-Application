class Cliente {
  constructor({ id, nome, email, telefone, tipo_documento, documento }, ValidarDocumento ) {
    this.id = id;
    this.nome = nome;
    this.email = email;
    this.telefone = telefone;
    this.tipo_documento = tipo_documento;
    this.documento = documento;

    this.validarDados(ValidarDocumento);
  }

  validarDados(ValidarDocumento) {
    const tipo = this.tipo_documento ? this.tipo_documento.toUpperCase() : "";    
    if (!this.nome) throw new Error("Nome é obrigatório");
    if (!this.email) throw new Error("Email é obrigatório");
    if (tipo !=="CPF" && tipo !== "CNPJ" ) throw new Error("Tipo de documento deve ser CPF ou CNPJ") 
    if (!ValidarDocumento.validate(this.documento, tipo)) {
      throw new Error(`${tipo} inválido`);
    }
    this.documento = ValidarDocumento.formatar(this.documento, tipo);


  }

}

module.exports = Cliente;