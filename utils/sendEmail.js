const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Creamos un transportador que será nuestro 'cliente'
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Definimos las opciones de envio
  const mailOptions = {
    from: 'Luis Rayas <luisrayasc@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
