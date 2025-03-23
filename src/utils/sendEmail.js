import { transporter } from "../config/nodemailer.config.js";

const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: process.env.GMAIL_USER,
        to,
        subject,
        text,
    };

    try {
       await transporter.sendMail(mailOptions);
       console.log("Email sent successfully!");
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

export { sendEmail };