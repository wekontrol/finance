// Email Service - supports SendGrid or SMTP
// Configure via environment variables

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Try SendGrid API if key is available
    if (process.env.SENDGRID_API_KEY) {
      return await sendViaSendGrid(options);
    }

    // Fallback: log to console (for development)
    console.log(`📧 EMAIL NOT CONFIGURED - Would send to ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body: ${options.body}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

async function sendViaSendGrid(options: EmailOptions): Promise<boolean> {
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: options.to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@gestorfinanceiro.com',
      subject: options.subject,
      text: options.body,
      html: options.html || options.body.replace(/\n/g, '<br>')
    };

    await sgMail.send(msg);
    console.log(`✓ Email sent to ${options.to}`);
    return true;
  } catch (error: any) {
    console.error('SendGrid error:', error.message);
    return false;
  }
}

export async function sendBudgetAlertEmail(
  userEmail: string,
  userName: string,
  category: string,
  spent: number,
  limit: number
): Promise<boolean> {
  const percentage = ((spent / limit) * 100).toFixed(0);
  
  return sendEmail({
    to: userEmail,
    subject: `⚠️ Alerta: Orçamento de ${category} em ${percentage}%`,
    body: `Olá ${userName},\n\nSeu orçamento de "${category}" atingiu ${percentage}% do limite.\n\nGasto: ${spent}\nLimite: ${limit}\n\nGerencie seus gastos para manter as finanças em dia!`,
    html: `
      <h2>⚠️ Alerta de Orçamento</h2>
      <p>Olá <strong>${userName}</strong>,</p>
      <p>Seu orçamento de "<strong>${category}</strong>" atingiu <strong style="color: #f59e0b;">${percentage}%</strong> do limite.</p>
      <ul>
        <li>Gasto: <strong>${spent}</strong></li>
        <li>Limite: <strong>${limit}</strong></li>
      </ul>
      <p>Gerencie seus gastos para manter as finanças em dia!</p>
    `
  });
}

export async function sendFinancialTipEmail(
  userEmail: string,
  userName: string,
  tip: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    subject: '💡 Dica Financeira - Gestor Financeiro',
    body: `Olá ${userName},\n\n${tip}\n\nMantenha um bom controle financeiro!`,
    html: `
      <h2>💡 Dica Financeira</h2>
      <p>Olá <strong>${userName}</strong>,</p>
      <p>${tip}</p>
      <p>Mantenha um bom controle financeiro!</p>
    `
  });
}

export async function sendGoalProgressEmail(
  userEmail: string,
  userName: string,
  goalName: string,
  progress: number
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    subject: `🏆 Progresso: ${goalName}`,
    body: `Olá ${userName},\n\nSua meta "${goalName}" atingiu ${progress}% de progresso!\n\nContinue assim!`,
    html: `
      <h2>🏆 Progresso de Meta</h2>
      <p>Olá <strong>${userName}</strong>,</p>
      <p>Sua meta "<strong>${goalName}</strong>" atingiu <strong style="color: #10b981;">${progress}%</strong> de progresso!</p>
      <p>Continue assim!</p>
    `
  });
}
