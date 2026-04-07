const { cpf, cnpj } = require('cpf-cnpj-validator');

class ValidarDocumento {
  // Recebe o valor e o tipo (CPF ou CNPJ)
  validate(numero, tipo) {
    if (tipo === 'CPF') {return cpf.isValid(numero);}
    if (tipo === 'CNPJ') {return cnpj.isValid(numero);}

    // Se o tipo for inválido ou não enviado, negamos a validação
    return false;
  }

  formatar(numero, tipo) {
    const t = tipo?.toUpperCase();
    if (t === 'CPF') return cpf.format(numero);
    if (t === 'CNPJ') return cnpj.format(numero);
    return numero;
  }
}

module.exports = ValidarDocumento;