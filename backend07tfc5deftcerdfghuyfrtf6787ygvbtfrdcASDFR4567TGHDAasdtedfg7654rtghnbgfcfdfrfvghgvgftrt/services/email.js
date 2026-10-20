const nodemailer = require('nodemailer');

async function enviarEmail({ to, subject, text, replyTo }) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const destination = String(to || process.env.SUPPORT_EMAIL_TO || '').trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const from = process.env.SMTP_FROM || user;
  if (!host || !user || !pass || !destination || !from || !Number.isInteger(port) || port <= 0) {
    return { enviado: false, estado: 'nao_configurado' };
  }

  let transport;
  try {
    transport = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: { user, pass }
    });
    await transport.sendMail({ from, to: destination, subject, text, replyTo });
    return { enviado: true, estado: 'enviado' };
  } catch (err) {
    console.error('[EMAIL] Falha de entrega SMTP:', err.message);
    return { enviado: false, estado: 'falha' };
  } finally {
    transport?.close();
  }
}

module.exports = { enviarEmail };
