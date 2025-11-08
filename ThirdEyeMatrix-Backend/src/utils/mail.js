const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // your app password (not your actual Gmail password)
  },
});

async function sendReportEmail(to, subject, htmlContent, attachments = []) {
  try {
    const mailOptions = {
      from: `"Third Eye Matrix" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
}

module.exports = { sendReportEmail };
