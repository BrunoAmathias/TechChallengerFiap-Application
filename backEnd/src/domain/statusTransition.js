/**
 * Máquina de Estados da Ordem de Serviço (saga coreografada)
 *
 * Fluxo principal:
 *   Recebida → Aguardando aprovação → Aguardando pagamento → Aguardando execução
 *   → Em diagnóstico → Em execução → Finalizada → Entregue
 *
 * "Cancelada" é a compensação e pode ser alcançada de qualquer status antes de
 * "Finalizada" (inclusive "Em execução", quando o reparo falha).
 */
const { TransicaoInvalidaError } = require('./errors');

const STATUS = Object.freeze({
  RECEBIDA: 'Recebida',
  AGUARDANDO_APROVACAO: 'Aguardando aprovação',
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  AGUARDANDO_EXECUCAO: 'Aguardando execução',
  EM_DIAGNOSTICO: 'Em diagnóstico',
  EM_EXECUCAO: 'Em execução',
  FINALIZADA: 'Finalizada',
  ENTREGUE: 'Entregue',
  CANCELADA: 'Cancelada'
});

const STATUS_SEQUENCE = [
  STATUS.RECEBIDA,
  STATUS.AGUARDANDO_APROVACAO,
  STATUS.AGUARDANDO_PAGAMENTO,
  STATUS.AGUARDANDO_EXECUCAO,
  STATUS.EM_DIAGNOSTICO,
  STATUS.EM_EXECUCAO,
  STATUS.FINALIZADA,
  STATUS.ENTREGUE
];

const STATUS_FINAIS = [STATUS.ENTREGUE, STATUS.CANCELADA];

class StatusTransition {
  static get STATUS() {
    return STATUS;
  }

  static isValidStatus(status) {
    return STATUS_SEQUENCE.includes(status) || status === STATUS.CANCELADA;
  }

  static getStatusSequence() {
    return [...STATUS_SEQUENCE];
  }

  static getTodosStatus() {
    return [...STATUS_SEQUENCE, STATUS.CANCELADA];
  }

  static isFinal(status) {
    return STATUS_FINAIS.includes(status);
  }

  static getNextStatus(currentStatus) {
    const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus);

    if (currentIndex === -1) {
      throw new TransicaoInvalidaError(`Status inválido: ${currentStatus}`);
    }

    if (currentIndex === STATUS_SEQUENCE.length - 1) {
      throw new TransicaoInvalidaError('A ordem de serviço já foi entregue');
    }

    return STATUS_SEQUENCE[currentIndex + 1];
  }

  static podeCancelar(currentStatus) {
    const index = STATUS_SEQUENCE.indexOf(currentStatus);
    return index !== -1 && index < STATUS_SEQUENCE.indexOf(STATUS.FINALIZADA);
  }

  static canTransition(from, to) {
    if (!this.isValidStatus(from) || !this.isValidStatus(to)) return false;
    if (to === STATUS.CANCELADA) return this.podeCancelar(from);
    if (this.isFinal(from)) return false;
    return this.getNextStatus(from) === to;
  }

  static assertTransition(from, to) {
    if (!this.canTransition(from, to)) {
      throw new TransicaoInvalidaError(`Transição inválida: "${from}" → "${to}"`);
    }
  }

  /**
   * Indica que `to` já ficou para trás no fluxo, ou seja, o evento chegou
   * atrasado (a OS já avançou ou foi cancelada). Esses eventos são ignorados.
   */
  static isObsoleta(from, to) {
    if (from === STATUS.CANCELADA) return to !== STATUS.CANCELADA;
    if (to === STATUS.CANCELADA) return false;

    const fromIndex = STATUS_SEQUENCE.indexOf(from);
    const toIndex = STATUS_SEQUENCE.indexOf(to);
    return fromIndex !== -1 && toIndex !== -1 && toIndex < fromIndex;
  }
}

module.exports = StatusTransition;
module.exports.STATUS = STATUS;
