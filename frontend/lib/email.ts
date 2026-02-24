import nodemailer from 'nodemailer';

const port = parseInt(process.env.EMAIL_PORT || '465');
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'mail.climaticpro.ro',
  port: port,
  secure: port === 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'contact@climaticpro.ro',
    pass: process.env.EMAIL_PASS,
  },
});

console.log('Email Transporter Configured:', {
  host: process.env.EMAIL_HOST || 'mail.climaticpro.ro',
  port: process.env.EMAIL_PORT || '465',
  user: process.env.EMAIL_USER || 'contact@climaticpro.ro',
  passConfigured: !!process.env.EMAIL_PASS
});

interface OrderEmailData {
  orderId: number;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  date: string;
  products: { name: string; quantity: number; price: number }[];
  total: number;
  isInstallationOnly?: boolean;
}

export const sendOrderConfirmationEmail = async (data: OrderEmailData) => {
  const { orderId, customerName, email, phone, address, date, products, total } = data;

  const productRows = products.map(p => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.price} RON</td>
    </tr>
  `).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h1 style="color: #0891b2;">Confirmare Comandă #${orderId}</h1>
      <p>Salut ${customerName},</p>
      <p>Îți mulțumim pentru comanda plasată la ClimaticPRO. Detaliile programării tale sunt mai jos:</p>
      
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Data Instalării:</strong> ${date}</p>
        <p><strong>Adresă:</strong> ${address}</p>
        <p><strong>Telefon:</strong> ${phone}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #0891b2; color: #fff;">
            <th style="padding: 10px; text-align: left;">Produs / Serviciu</th>
            <th style="padding: 10px; text-align: left;">Cant.</th>
            <th style="padding: 10px; text-align: left;">Preț</th>
          </tr>
        </thead>
        <tbody>
          ${productRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
            <td style="padding: 10px; font-weight: bold; color: #0891b2;">${total} RON</td>
          </tr>
        </tfoot>
      </table>

      <p>Te vom contacta telefonic în scurt timp pentru confirmarea finală.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #666;">
        ClimaticPRO - Instalare Profesională Aer Condiționat<br/>
        Tel: +40 316 300 101 | Email: <a href="mailto:contact@climaticpro.ro">contact@climaticpro.ro</a>
      </p>
    </div>
  `;

  const mailOptions = {
    from: '"ClimaticPRO" <contact@climaticpro.ro>',
    to: email,
    cc: 'contact@climaticpro.ro', // Send copy to admin
    subject: `Confirmare Comandă #${orderId} - ClimaticPRO`,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email} for order ${orderId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

interface SendEmailProps {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
  cc?: string;
  replyTo?: string;
}

export const sendGenericEmail = async ({ to, subject, html, attachments, cc, replyTo }: SendEmailProps) => {
  const mailOptions = {
    from: '"ClimaticPRO" <contact@climaticpro.ro>',
    to,
    cc,
    replyTo,
    subject,
    html,
    attachments
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Generic email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending generic email:', error);
    return false;
  }
};
