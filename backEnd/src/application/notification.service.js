const nodemailer = require('nodemailer');

/**
 * Serviço de Notificações
 * Responsável por enviar notificações por email, com fallback para log quando SMTP não estiver configurado.
 */
class NotificationService {
  constructor() {
    this.transport = null;
  }

  getTransport() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM;

    if (!host || !user || !pass || !from) {
      this.transport = null;
      return null;
    }

    if (this.transport && this.transport.options?.host === host && this.transport.options?.port === port) {
      return this.transport;
    }

    this.transport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      }
    });

    return this.transport;
  }

  /**
   * Envio de email de aprovação de OS
   * @param {Object} ordemServico - Dados da ordem de serviço
   * @param {Object} cliente - Dados do cliente
   */
  async enviarEmailAprovacao(ordemServico, cliente) {
    const subject = `Ordem de Serviço #${ordemServico.id} Aprovada`;
    const body = `Prezado ${cliente.nome}, sua ordem de serviço foi aprovada e está em execução.`;

    return this.enviarEmail(cliente.email, subject, body, {
      status: ordemServico.status,
      valor_total: ordemServico.valor_total,
      data_aprovacao: new Date().toISOString()
    });
  }

  /**
   * Envio de email genérico
   * @param {string} to - Email destinatário
   * @param {string} subject - Assunto
   * @param {string} body - Corpo do email
   * @param {Object} [meta] - Metadados adicionais para log ou corpo
   */
  async enviarEmail(to, subject, body, meta = {}) {
    const transport = this.getTransport();

    if (transport) {
      const info = await transport.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        text: body
      });

      return {
        success: true,
        message: `Email enviado com sucesso para ${to}`,
        messageId: info.messageId,
        timestamp: new Date().toISOString()
      };
    }

    console.log(`📧 [LOG] Para: ${to}`);
    console.log(`📧 Assunto: ${subject}`);
    console.log(`📧 Corpo: ${body}`);
    if (meta.status) {
      console.log(`📧 Status: ${meta.status}`);
    }
    if (meta.valor_total != null) {
      console.log(`📧 Valor total: ${meta.valor_total}`);
    }
    console.log(`📧 --- FIM DO EMAIL ---\n`);

    return {
      success: true,
      message: `Email enviado com sucesso para ${to}`,
      timestamp: new Date().toISOString(),
      fallback: true
    };
  }
}

module.exports = new NotificationService();