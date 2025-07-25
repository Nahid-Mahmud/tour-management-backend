import nodemailer from "nodemailer";
import envVariables from "../config/env";
import path from "path";
import ejs from "ejs";
import AppError from "../errorHelpers/AppError";

const transporter = nodemailer.createTransport({
  secure: true,
  auth: {
    user: envVariables.EMAIL_SENDER.SMTP_USER,
    pass: envVariables.EMAIL_SENDER.SMTP_PASS,
  },
  host: envVariables.EMAIL_SENDER.SMTP_HOST,
  port: Number(envVariables.EMAIL_SENDER.SMTP_PORT),
});

interface EmailOptions {
  subject: string;
  to: string;
  templateName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  templateData?: Record<string, any>;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[];
}

export const sendEmail = async ({ subject, to, attachments, templateName, templateData = [] }: EmailOptions) => {
  //
  try {
    const templatePath = path.join(__dirname, `templates/${templateName}`);

    const html = await ejs.renderFile(templatePath, templateData);

    const info = await transporter.sendMail({
      from: envVariables.EMAIL_SENDER.SMTP_FROM,
      to: to,
      subject: subject,
      html: html,
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });

    // eslint-disable-next-line no-console
    console.log(`Email sent ${to} : ${info.response}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.log("Error sending email:", error.message);
    throw new AppError(500, "Failed to send email");
  }
};
