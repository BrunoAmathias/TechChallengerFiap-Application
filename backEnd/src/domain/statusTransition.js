/**
 * Máquina de Estados para Ordem de Serviço
 * Define o fluxo automático de transição entre status
 */

const STATUS_SEQUENCE = [
  'Recebida',
  'Em diagnóstico',
  'Aguardando aprovação',
  'Em execução',
  'Finalizada',
  'Entregue'
];

class StatusTransition {
  static getNextStatus(currentStatus) {
    const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus);
    
    if (currentIndex === -1) {
      throw new Error(`Status inválido: ${currentStatus}`);
    }
    
    if (currentIndex === STATUS_SEQUENCE.length - 1) {
      throw new Error('A ordem de serviço já está finalizada (status: Entregue)');
    }
    
    return STATUS_SEQUENCE[currentIndex + 1];
  }

  static isValidStatus(status) {
    return STATUS_SEQUENCE.includes(status);
  }

  static canAdvance(currentStatus) {
    const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus);
    return currentIndex !== -1 && currentIndex < STATUS_SEQUENCE.length - 1;
  }

  static getStatusSequence() {
    return [...STATUS_SEQUENCE];
  }
}

module.exports = StatusTransition;
