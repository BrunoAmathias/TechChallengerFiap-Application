/** O osId vem no payload; o correlationId da saga é o próprio osId. */
function osIdDoEvento(evento) {
  const osId = evento?.payload?.osId ?? evento?.correlationId;

  if (osId == null || Number.isNaN(Number(osId))) {
    throw new Error(`Evento ${evento?.type} sem osId válido`);
  }

  return Number(osId);
}

module.exports = { osIdDoEvento };
