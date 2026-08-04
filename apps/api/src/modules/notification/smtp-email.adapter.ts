import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

import { type AppConfig } from '../../config/configuration';
import { type DeliverInput, type NotificationAdapter } from './notification.adapter';

/**
 * SMTP email adapteri — EMAIL kanali uchun REAL jo'natish.
 *
 * SMTP_HOST+SMTP_USER+SMTP_PASS berilgandagina yoqiladi (config.smtp);
 * aks holda `enabled=false` va NotificationService LogAdapter'ga tushadi.
 * Gmail uchun: smtp.gmail.com:587 + App Password.
 */
@Injectable()
export class SmtpEmailAdapter implements NotificationAdapter, OnModuleInit {
  private readonly log = new Logger('SmtpEmail');
  private readonly transporter: Transporter | null = null;
  private readonly from: string = '';

  constructor(config: ConfigService<AppConfig, true>) {
    const smtp = config.get('smtp', { infer: true });
    if (smtp === undefined) {
      return;
    }
    this.from = smtp.from;
    this.transporter = createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.pass },
      // ⚠️ Qat'iy timeout'lar: SMTP/internet o'chiq bo'lsa so'rov OSILMASIN —
      //    yuborish best-effort, xato Notification'da failed bo'lib qayd etiladi.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      dnsTimeout: 5_000,
    });
  }

  /** SMTP sozlanganmi — NotificationService kanal routing'i uchun. */
  get enabled(): boolean {
    return this.transporter !== null;
  }

  /** Ulanishni startda tekshirish — xato ilovani YIQITMAYDI (best-effort kanal). */
  async onModuleInit(): Promise<void> {
    if (this.transporter === null) {
      this.log.log('SMTP sozlanmagan — EMAIL kanal LogAdapter orqali (dev rejim)');
      return;
    }
    try {
      await this.transporter.verify();
      this.log.log(`SMTP tayyor (${this.from})`);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.log.warn(`SMTP ulanish tekshiruvi muvaffaqiyatsiz: ${reason}`);
    }
  }

  async deliver(input: DeliverInput): Promise<void> {
    if (this.transporter === null) {
      throw new Error('SMTP sozlanmagan');
    }
    const mail = renderEmail(input.templateKey, input.payload as Record<string, unknown>);
    await this.transporter.sendMail({
      from: `Kelvin <${this.from}>`,
      to: input.recipient,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
  }
}

interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

/** Payload qiymatini xavfsiz matnga aylantirish (string/number kutiladi). */
function asText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return fallback;
}

/** Shablonlar — templateKey → subject/matn. Noma'lum kalit → generik xat. */
function renderEmail(templateKey: string, payload: Record<string, unknown>): RenderedEmail {
  switch (templateKey) {
    case 'auth.otp_code': {
      const code = asText(payload.code);
      const ttl = asText(payload.ttlMinutes, '5');
      return {
        subject: `Kelvin — kirish kodi: ${code}`,
        text:
          `Sizning kirish kodingiz: ${code}\n\n` +
          `Kod ${ttl} daqiqa amal qiladi va bir marta ishlatiladi.\n` +
          `Agar siz so'ramagan bo'lsangiz — bu xatni e'tiborsiz qoldiring.`,
        html:
          `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">` +
          `<h2 style="margin:0 0 16px">Kelvin</h2>` +
          `<p>Sizning kirish kodingiz:</p>` +
          `<div style="font-size:32px;letter-spacing:8px;font-weight:bold;background:#f6f2ec;` +
          `border-radius:8px;padding:16px;text-align:center">${code}</div>` +
          `<p style="color:#8a8177;font-size:13px;margin-top:16px">` +
          `Kod ${ttl} daqiqa amal qiladi va bir marta ishlatiladi. ` +
          `Agar siz so'ramagan bo'lsangiz — bu xatni e'tiborsiz qoldiring.</p>` +
          `</div>`,
      };
    }
    case 'order_confirmed': {
      const orderNumber = asText(payload.orderNumber);
      return {
        subject: `Kelvin — buyurtma ${orderNumber} tasdiqlandi`,
        text: `Buyurtmangiz ${orderNumber} tasdiqlandi. Yetkazib berish haqida alohida xabar beramiz.`,
        html:
          `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">` +
          `<h2 style="margin:0 0 16px">Kelvin</h2>` +
          `<p>Buyurtmangiz <b>${orderNumber}</b> tasdiqlandi.</p>` +
          `<p style="color:#8a8177;font-size:13px">Yetkazib berish haqida alohida xabar beramiz.</p>` +
          `</div>`,
      };
    }
    default:
      return {
        subject: `Kelvin — bildirishnoma`,
        text: JSON.stringify(payload),
        html: `<pre>${JSON.stringify(payload, null, 2)}</pre>`,
      };
  }
}
