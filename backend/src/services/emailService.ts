import nodemailer from 'nodemailer';

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  const mockEnabled = process.env.EMAIL_MOCK === 'true'
    || (process.env.NODE_ENV !== 'production' && process.env.EMAIL_MOCK !== 'false');
  if (mockEnabled) {
    process.stdout.write(
      `\n--- EMAIL MOCK ---\nTo: ${to}\nSubject: ${subject}\nBody: ${html}\n-----------------\n`
    );
    return;
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  if (!user || !pass) {
    throw new Error('El servicio de correo no está configurado');
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: { user, pass },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || user,
    to,
    subject,
    html,
  });
}; 