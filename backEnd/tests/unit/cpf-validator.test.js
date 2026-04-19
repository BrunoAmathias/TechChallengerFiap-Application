const ValidarDocumento = require('../../src/infrastructure/utils/cpf-validator');

describe('ValidarDocumento', () => {
  let validator;

  beforeEach(() => {
    validator = new ValidarDocumento();
  });

  describe('validate', () => {
    it('should validate a valid CPF', () => {
      const validCpf = '52998224725'; // Valid CPF
      expect(validator.validate(validCpf, 'CPF')).toBe(true);
    });

    it('should invalidate an invalid CPF', () => {
      const invalidCpf = '12345678900';
      expect(validator.validate(invalidCpf, 'CPF')).toBe(false);
    });

    it('should validate a valid CNPJ', () => {
      const validCnpj = '11444777000161'; // Valid CNPJ
      expect(validator.validate(validCnpj, 'CNPJ')).toBe(true);
    });

    it('should invalidate an invalid CNPJ', () => {
      const invalidCnpj = '12345678000100';
      expect(validator.validate(invalidCnpj, 'CNPJ')).toBe(false);
    });

    it('should return false for invalid type', () => {
      expect(validator.validate('12345678909', 'INVALID')).toBe(false);
    });

    it('should return false for no type', () => {
      expect(validator.validate('12345678909')).toBe(false);
    });
  });

  describe('formatar', () => {
    it('should format a CPF', () => {
      const cpf = '52998224725';
      expect(validator.formatar(cpf, 'CPF')).toBe('529.982.247-25');
    });

    it('should format a CNPJ', () => {
      const cnpj = '11444777000161';
      expect(validator.formatar(cnpj, 'CNPJ')).toBe('11.444.777/0001-61');
    });

    it('should return original number for invalid type', () => {
      const number = '12345678909';
      expect(validator.formatar(number, 'INVALID')).toBe(number);
    });

    it('should return original number for no type', () => {
      const number = '12345678909';
      expect(validator.formatar(number)).toBe(number);
    });
  });
});