const nodemailer = require('nodemailer');
const NotificationService = require('../../src/application/notification.service');

jest.mock('nodemailer', () => ({
  createTransport: jest.fn()
}), { virtual: true });

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
  });

  it('envia email real quando SMTP está configurado', async () => {
    process.env.SMTP_HOST = 'smtp.test.local';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'user@test.local';
    process.env.SMTP_PASS = 'secret';
    process.env.SMTP_FROM = 'no-reply@oficina.local';

    const sendMail = jest.fn().mockResolvedValue({ messageId: 'abc123' });
    nodemailer.createTransport.mockReturnValue({ sendMail });

    const result = await NotificationService.enviarEmail('cliente@teste.com', 'Assunto', 'Corpo');

    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'no-reply@oficina.local',
      to: 'cliente@teste.com',
      subject: 'Assunto',
      text: 'Corpo'
    }));
    expect(result.success).toBe(true);
  });

  it('fallback para log quando SMTP não está configurado', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await NotificationService.enviarEmail('cliente@teste.com', 'Assunto', 'Corpo');

    expect(nodemailer.createTransport).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.fallback).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
