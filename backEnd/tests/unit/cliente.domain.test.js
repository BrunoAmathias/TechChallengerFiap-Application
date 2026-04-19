const Cliente = require('../../src/domain/cliente');
const ValidarDocumento = require('../../src/infrastructure/utils/cpf-validator');

describe('Cliente Domain', () => {
  let mockValidator;

  beforeEach(() => {
    mockValidator = new ValidarDocumento();
  });

  describe('constructor', () => {
    it('should create a valid Cliente with CPF', () => {
      const clienteData = {
        id: 1,
        nome: 'João Silva',
        email: 'joao@example.com',
        telefone: '123456789',
        tipo_documento: 'CPF',
        documento: '52998224725'
      };

      const cliente = new Cliente(clienteData, mockValidator);

      expect(cliente.id).toBe(1);
      expect(cliente.nome).toBe('João Silva');
      expect(cliente.email).toBe('joao@example.com');
      expect(cliente.telefone).toBe('123456789');
      expect(cliente.tipo_documento).toBe('CPF');
      expect(cliente.documento).toBe('529.982.247-25'); // Formatted
    });

    it('should create a valid Cliente with CNPJ', () => {
      const clienteData = {
        id: 2,
        nome: 'Empresa Ltda',
        email: 'empresa@example.com',
        telefone: '987654321',
        tipo_documento: 'CNPJ',
        documento: '11444777000161'
      };

      const cliente = new Cliente(clienteData, mockValidator);

      expect(cliente.id).toBe(2);
      expect(cliente.nome).toBe('Empresa Ltda');
      expect(cliente.email).toBe('empresa@example.com');
      expect(cliente.tipo_documento).toBe('CNPJ');
      expect(cliente.documento).toBe('11.444.777/0001-61'); // Formatted
    });

    it('should throw error for missing nome', () => {
      const clienteData = {
        email: 'joao@example.com',
        tipo_documento: 'CPF',
        documento: '12345678909'
      };

      expect(() => new Cliente(clienteData, mockValidator)).toThrow('Nome é obrigatório');
    });

    it('should throw error for missing email', () => {
      const clienteData = {
        nome: 'João Silva',
        tipo_documento: 'CPF',
        documento: '12345678909'
      };

      expect(() => new Cliente(clienteData, mockValidator)).toThrow('Email é obrigatório');
    });

    it('should throw error for invalid tipo_documento', () => {
      const clienteData = {
        nome: 'João Silva',
        email: 'joao@example.com',
        tipo_documento: 'INVALID',
        documento: '12345678909'
      };

      expect(() => new Cliente(clienteData, mockValidator)).toThrow('Tipo de documento deve ser CPF ou CNPJ');
    });

    it('should throw error for invalid CPF', () => {
      const clienteData = {
        nome: 'João Silva',
        email: 'joao@example.com',
        tipo_documento: 'CPF',
        documento: '12345678900' // Invalid CPF
      };

      expect(() => new Cliente(clienteData, mockValidator)).toThrow('CPF inválido');
    });

    it('should throw error for invalid CNPJ', () => {
      const clienteData = {
        nome: 'Empresa Ltda',
        email: 'empresa@example.com',
        tipo_documento: 'CNPJ',
        documento: '12345678000100' // Invalid CNPJ
      };

      expect(() => new Cliente(clienteData, mockValidator)).toThrow('CNPJ inválido');
    });
  });
});