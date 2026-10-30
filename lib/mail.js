/** SMTP-отправка через nodemailer. */

import nodemailer from 'nodemailer';

export function smtpConfigured(settings) {
  return Boolean(
    settings?.smtpEnabled
    && String(settings.smtpHost || '').trim()
    && String(settings.smtpFrom || settings.smtpUser || '').trim(),
  );
}

export function createTransport(settings) {
  if (!smtpConfigured(settings)) {
    const err = new Error('SMTP не настроен');
    err.status = 400;
    throw err;
  }
  const port = Number(settings.smtpPort) || 587;
  return nodemailer.createTransport({
    host: String(settings.smtpHost).trim(),
    port,
    secure: settings.smtpSecure === true || port === 465,
    auth: settings.smtpUser
      ? {
        user: String(settings.smtpUser).trim(),
        pass: String(settings.smtpPass || ''),
      }
      : undefined,
  });
}

export async function sendMail(settings, { to, subject, text, html }) {
  const transport = createTransport(settings);
  const fromName = String(settings.smtpFromName || settings.institutionName || 'Журнал').trim();
  const fromAddr = String(settings.smtpFrom || settings.smtpUser || '').trim();
  const from = fromName ? `"${fromName.replace(/"/g, '')}" <${fromAddr}>` : fromAddr;
  return transport.sendMail({
    from,
    to,
    subject,
    text,
    html: html || undefined,
  });
}

export function accessCredentialsEmail({
  institutionName,
  displayName,
  roleLabel,
  username,
  email,
  tempPassword,
  appUrl,
}) {
  const title = institutionName || 'Электронный дневник';
  const lines = [
    `Здравствуйте${displayName ? `, ${displayName}` : ''}!`,
    '',
    `Вам выдан доступ к системе «${title}» (${roleLabel || 'пользователь'}).`,
    '',
    `Логин: ${username}`,
    email ? `Email: ${email}` : null,
    `Временный пароль: ${tempPassword}`,
    '',
    'При первом входе смените пароль.',
    appUrl ? `Адрес: ${appUrl}` : null,
    '',
    'Если вы не ожидали это письмо — просто игнорируйте его.',
  ].filter((line) => line != null);
  const text = lines.join('\n');
  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#131816">
      <h2 style="margin:0 0 12px;font-weight:650">${escapeHtml(title)}</h2>
      <p>Здравствуйте${displayName ? `, <b>${escapeHtml(displayName)}</b>` : ''}!</p>
      <p>Вам выдан доступ (${escapeHtml(roleLabel || 'пользователь')}).</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#5f6a64">Логин</td><td><b>${escapeHtml(username)}</b></td></tr>
        ${email ? `<tr><td style="padding:4px 12px 4px 0;color:#5f6a64">Email</td><td>${escapeHtml(email)}</td></tr>` : ''}
        <tr><td style="padding:4px 12px 4px 0;color:#5f6a64">Пароль</td><td style="font-size:20px;letter-spacing:0.08em"><b>${escapeHtml(tempPassword)}</b></td></tr>
      </table>
      <p>При первом входе смените пароль.</p>
      ${appUrl ? `<p><a href="${escapeHtml(appUrl)}">${escapeHtml(appUrl)}</a></p>` : ''}
    </div>
  `;
  return {
    subject: `Доступ к «${title}»`,
    text,
    html,
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
