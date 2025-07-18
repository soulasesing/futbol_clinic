//import nodemailer from 'nodemailer';

export const sendEmail = async (to: string, subject: string, html: string) => {
  // Para desarrollo: solo loguea en consola
  console.log(`\n--- EMAIL MOCK ---\nTo: ${to}\nSubject: ${subject}\nBody: ${html}\n-----------------\n`);
  // Para producción, configura el transporter con Gmail SMTP
  // const transporter = nodemailer.createTransport({
  //   service: 'gmail',
  //   auth: {
  //     user: process.env.GMAIL_USER,
  //     pass: process.env.GMAIL_PASS,
  //   },
  // });
  // await transporter.sendMail({ from: process.env.GMAIL_USER, to, subject, html });
}; 