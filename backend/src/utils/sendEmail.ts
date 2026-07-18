import nodemailer from 'nodemailer';
import { buildDefaultEmail } from './emailTemplate.js';

const sendEmail = async (options: { email: string; subject: string; message: string; html?: string }) => {
    const transporter = nodemailer.createTransport({

        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }

    });

    const mailOption = {
        from: `TaskBridge <${process.env.EMAIL_FROM}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || buildDefaultEmail(options.subject, options.message).html
    };

    await transporter.sendMail(mailOption);
}

export default sendEmail