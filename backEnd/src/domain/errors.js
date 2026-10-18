class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

/** Transição de status não permitida pela máquina de estados (HTTP 409). */
class TransicaoInvalidaError extends DomainError {}

/** Recurso inexistente (HTTP 404). */
class NaoEncontradoError extends DomainError {}

/** Estoque insuficiente para reservar as peças da OS (HTTP 409). */
class EstoqueInsuficienteError extends DomainError {}

module.exports = {
  DomainError,
  TransicaoInvalidaError,
  NaoEncontradoError,
  EstoqueInsuficienteError
};
