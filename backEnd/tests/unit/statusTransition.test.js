const StatusTransition = require('../../src/domain/statusTransition');
const { TransicaoInvalidaError } = require('../../src/domain/errors');

const { STATUS } = StatusTransition;

describe('StatusTransition (máquina de estados da OS)', () => {
  it('segue a sequência da saga até Entregue', () => {
    expect(StatusTransition.getStatusSequence()).toEqual([
      'Recebida',
      'Aguardando aprovação',
      'Aguardando pagamento',
      'Aguardando execução',
      'Em diagnóstico',
      'Em execução',
      'Finalizada',
      'Entregue'
    ]);
    expect(StatusTransition.getTodosStatus()).toContain('Cancelada');
  });

  it('permite apenas o próximo status do fluxo', () => {
    const sequencia = StatusTransition.getStatusSequence();
    for (let i = 0; i < sequencia.length - 1; i++) {
      expect(StatusTransition.canTransition(sequencia[i], sequencia[i + 1])).toBe(true);
    }

    expect(StatusTransition.canTransition(STATUS.RECEBIDA, STATUS.FINALIZADA)).toBe(false);
    expect(StatusTransition.canTransition(STATUS.EM_EXECUCAO, STATUS.EM_DIAGNOSTICO)).toBe(false);
  });

  it('permite cancelar em qualquer status antes de Finalizada', () => {
    [
      STATUS.RECEBIDA,
      STATUS.AGUARDANDO_APROVACAO,
      STATUS.AGUARDANDO_PAGAMENTO,
      STATUS.AGUARDANDO_EXECUCAO,
      STATUS.EM_DIAGNOSTICO,
      STATUS.EM_EXECUCAO
    ].forEach((status) => expect(StatusTransition.canTransition(status, STATUS.CANCELADA)).toBe(true));

    [STATUS.FINALIZADA, STATUS.ENTREGUE, STATUS.CANCELADA].forEach((status) =>
      expect(StatusTransition.canTransition(status, STATUS.CANCELADA)).toBe(false)
    );
  });

  it('não sai de status finais', () => {
    expect(StatusTransition.isFinal(STATUS.ENTREGUE)).toBe(true);
    expect(StatusTransition.isFinal(STATUS.CANCELADA)).toBe(true);
    expect(StatusTransition.canTransition(STATUS.CANCELADA, STATUS.RECEBIDA)).toBe(false);
    expect(() => StatusTransition.getNextStatus(STATUS.ENTREGUE)).toThrow(TransicaoInvalidaError);
  });

  it('rejeita status desconhecidos, incluindo o antigo "Recusada"', () => {
    expect(StatusTransition.isValidStatus('Recusada')).toBe(false);
    expect(StatusTransition.canTransition('Recusada', STATUS.CANCELADA)).toBe(false);
    expect(() => StatusTransition.getNextStatus('Recusada')).toThrow('Status inválido: Recusada');
  });

  it('assertTransition lança TransicaoInvalidaError', () => {
    expect(() => StatusTransition.assertTransition(STATUS.RECEBIDA, STATUS.AGUARDANDO_APROVACAO)).not.toThrow();
    expect(() => StatusTransition.assertTransition(STATUS.RECEBIDA, STATUS.ENTREGUE)).toThrow(TransicaoInvalidaError);
  });

  it('identifica eventos atrasados (status destino já ficou para trás)', () => {
    expect(StatusTransition.isObsoleta(STATUS.EM_DIAGNOSTICO, STATUS.AGUARDANDO_EXECUCAO)).toBe(true);
    expect(StatusTransition.isObsoleta(STATUS.CANCELADA, STATUS.AGUARDANDO_APROVACAO)).toBe(true);
    expect(StatusTransition.isObsoleta(STATUS.RECEBIDA, STATUS.AGUARDANDO_PAGAMENTO)).toBe(false);
    expect(StatusTransition.isObsoleta(STATUS.EM_EXECUCAO, STATUS.CANCELADA)).toBe(false);
    expect(StatusTransition.isObsoleta(STATUS.CANCELADA, STATUS.CANCELADA)).toBe(false);
  });

  it('expõe o mapa de status', () => {
    expect(StatusTransition.STATUS.AGUARDANDO_PAGAMENTO).toBe('Aguardando pagamento');
  });
});
