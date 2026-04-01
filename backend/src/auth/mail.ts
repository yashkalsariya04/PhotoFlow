import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

export class MailHelper {
  constructor(private configService: ConfigService) {}

  async sendPasswordEmail(email: string, password: string) {
    const host = this.configService.get<string>('SMTP_HOST');
    const portRaw = this.configService.get<string>('SMTP_PORT');
    const port = portRaw ? parseInt(portRaw, 10) : undefined;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const from = this.configService.get<string>('SMTP_FROM') || user;
    const secureEnv = this.configService.get<string>('SMTP_SECURE');
    const secure = secureEnv != null ? secureEnv === 'true' : port === 465;

    if (!host || !port || !user || !pass || !from) {
      console.error('SMTP configuration is missing. Cannot send email.');
      throw new Error('Email sending is not configured on server');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    try {
      await transporter.verify();

      await transporter.sendMail({
        from,
        to: email,
        subject: 'Your FaceMatrix account password',
        text: [
          'Your FaceMatrix account has been created.',
          '',
          `Email: ${email}`,
          `Password: ${password}`,
          '',
          'Please log in and change your password after first login.',
        ].join('\n'),
      });
    } catch (error) {
      console.error('Failed to send password email:', error);
      throw error;
    }
  }

  async sendResetPasswordEmail(email: string, password: string) {
    const host = this.configService.get<string>('SMTP_HOST');
    const portRaw = this.configService.get<string>('SMTP_PORT');
    const port = portRaw ? parseInt(portRaw, 10) : undefined;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const from = this.configService.get<string>('SMTP_FROM') || user;
    const secureEnv = this.configService.get<string>('SMTP_SECURE');
    const secure = secureEnv != null ? secureEnv === 'true' : port === 465;

    if (!host || !port || !user || !pass || !from) {
      console.error('SMTP configuration is missing. Cannot send email.');
      throw new Error('Email sending is not configured on server');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    try {
      await transporter.verify();

      await transporter.sendMail({
        from,
        to: email,
        subject: 'Your FaceMatrix password has been reset',
        text: [
          'Your FaceMatrix account password has been updated.',
          '',
          `Email: ${email}`,
          `New Password: ${password}`,
          '',
          'You can now log in using this new password.',
        ].join('\n'),
      });
    } catch (error) {
      console.error('Failed to send reset password email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, name: string) {
    const host = this.configService.get<string>('SMTP_HOST');
    const portRaw = this.configService.get<string>('SMTP_PORT');
    const port = portRaw ? parseInt(portRaw, 10) : undefined;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const from = this.configService.get<string>('SMTP_FROM') || user;
    const secureEnv = this.configService.get<string>('SMTP_SECURE');
    const secure = secureEnv != null ? secureEnv === 'true' : port === 465;

    if (!host || !port || !user || !pass || !from) {
      console.error('SMTP configuration is missing. Cannot send email.');
      throw new Error('Email sending is not configured on server');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    try {
      await transporter.verify();

      await transporter.sendMail({
        from,
        to: email,
        subject: 'Welcome to FaceMatrix',
        text: [
          `Hi ${name || 'there'},`,
          '',
          'Your FaceMatrix account has been created successfully.',
          '',
          `Email: ${email}`,
          '',
          'You can now sign in to your dashboard and start using the platform.',
        ].join('\n'),
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
  }
}
