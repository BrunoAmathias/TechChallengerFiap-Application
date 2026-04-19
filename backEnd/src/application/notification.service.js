/**
 * Serviço de Notificações
 * Responsável por enviar notificações (email, SMS, etc.)
 */
class NotificationService {
  /**
   * Mock de envio de email de aprovação de OS
   * @param {Object} ordemServico - Dados da ordem de serviço
   * @param {Object} cliente - Dados do cliente
   */
  async enviarEmailAprovacao(ordemServico, cliente) {
    // Mock da notificação de email
    console.log(`📧 [MOCK EMAIL] Enviando notificação de aprovação para ${cliente.email}`);
    console.log(`📧 Assunto: Ordem de Serviço #${ordemServico.id} Aprovada`);
    console.log(`📧 Corpo: Prezado ${cliente.nome}, sua ordem de serviço foi aprovada e está em execução.`);
    console.log(`📧 Status atual: ${ordemServico.status}`);
    console.log(`📧 Valor total: R$ ${ordemServico.valor_total}`);
    console.log(`📧 Data de aprovação: ${new Date().toISOString()}`);
    console.log(`📧 --- FIM DO EMAIL ---\n`);

    // Simula delay de envio
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      message: `Email enviado com sucesso para ${cliente.email}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Mock de envio de email genérico
   * @param {string} to - Email destinatário
   * @param {string} subject - Assunto
   * @param {string} body - Corpo do email
   */
  async enviarEmail(to, subject, body) {
    console.log(`📧 [MOCK EMAIL] Para: ${to}`);
    console.log(`📧 Assunto: ${subject}`);
    console.log(`📧 Corpo: ${body}`);
    console.log(`📧 --- FIM DO EMAIL ---\n`);

    await new Promise(resolve => setTimeout(resolve, 50));

    return {
      success: true,
      message: `Email enviado com sucesso para ${to}`,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new NotificationService();