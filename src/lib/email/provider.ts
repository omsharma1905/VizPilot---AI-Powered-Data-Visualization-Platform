/**
 * VizPilot Email Delivery Provider Abstraction
 * Supports Development mode (server log event) and Production transactional delivery (Resend / REST API).
 * Never leaks provider keys to the browser. Never logs verification codes in production.
 */

export interface SendVerificationEmailOptions {
  to: string;
  name: string;
  code: string;
  expiresInMinutes: number;
  purpose: 'signup_verification' | 'email_change';
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  sendVerificationEmail(options: SendVerificationEmailOptions): Promise<EmailDeliveryResult>;
}

/**
 * Development-only email provider.
 * Strictly forbidden in production environments.
 */
export class DevelopmentEmailProvider implements EmailProvider {
  async sendVerificationEmail(options: SendVerificationEmailOptions): Promise<EmailDeliveryResult> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[VizPilot Security] DevelopmentEmailProvider is strictly prohibited in production.');
    }

    const purposeLabel = options.purpose === 'signup_verification'
      ? 'Account Email Verification'
      : 'Email Address Change Confirmation';

    console.log('');
    console.log('================================================================');
    console.log('[VIZPILOT DEV EMAIL SERVICE]');
    console.log(`To:               ${options.to} (${options.name})`);
    console.log(`Purpose:          ${purposeLabel}`);
    console.log(`Verification Code: ${options.code}`);
    console.log(`Expires In:       ${options.expiresInMinutes} minutes`);
    console.log('Timestamp:        ' + new Date().toISOString());
    console.log('================================================================');
    console.log('');

    return {
      success: true,
      messageId: `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };
  }
}

/**
 * Production-grade transactional email provider (via Resend REST API or standard HTTP).
 */
export class TransactionalEmailProvider implements EmailProvider {
  private apiKey: string;
  private fromAddress: string;

  constructor(apiKey: string, fromAddress?: string) {
    this.apiKey = apiKey;
    this.fromAddress = fromAddress || process.env.EMAIL_FROM_ADDRESS || 'VizPilot Security <security@vizpilot.ai>';
  }

  async sendVerificationEmail(options: SendVerificationEmailOptions): Promise<EmailDeliveryResult> {
    try {
      const isChange = options.purpose === 'email_change';
      const subject = isChange
        ? 'Confirm your new VizPilot email address'
        : 'Verify your VizPilot corporate account';

      const actionText = isChange
        ? 'confirm your requested email update'
        : 'complete your VizPilot workspace registration';

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #08080b; color: #f8f8fc; margin: 0; padding: 40px 20px; }
    .container { max-width: 540px; margin: 0 auto; background: #0f0f16; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 36px; }
    .logo { font-size: 16px; font-weight: 800; letter-spacing: 0.1em; color: #ffffff; text-transform: uppercase; margin-bottom: 24px; }
    .logo span { color: #818cf8; }
    h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; }
    p { font-size: 14px; line-height: 1.6; color: #a1a1aa; }
    .code-box { background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
    .code { font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 0.25em; color: #818cf8; }
    .footer { font-size: 12px; color: #71717a; margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">VIZ<span>PILOT</span></div>
    <h1>Security Verification Code</h1>
    <p>Hello ${options.name},</p>
    <p>Use the 6-digit one-time code below to ${actionText}. This code will expire in ${options.expiresInMinutes} minutes.</p>
    <div class="code-box">
      <div class="code">${options.code}</div>
    </div>
    <p>If you did not request this verification code, please ignore this message or contact security@vizpilot.ai immediately.</p>
    <div class="footer">
      © ${new Date().getFullYear()} VizPilot Intelligence Systems. Zero-Trace Architecture.
    </div>
  </div>
</body>
</html>`;

      const textContent = `VIZPILOT SECURITY CODE\n\nHello ${options.name},\n\nYour verification code is: ${options.code}\n\nThis code expires in ${options.expiresInMinutes} minutes. If you did not make this request, contact security@vizpilot.ai.`;

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to: [options.to],
          subject,
          html: htmlContent,
          text: textContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('[VizPilot Email] Delivery failed from transactional provider:', data);
        return {
          success: false,
          error: data.message || 'Email delivery failed from transactional provider.',
        };
      }

      return {
        success: true,
        messageId: data.id,
      };
    } catch (err) {
      console.error('[VizPilot Email] Unexpected delivery error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error during email delivery.',
      };
    }
  }
}

/**
 * Returns the configured email provider singleton.
 */
export function getEmailProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER_API_KEY;

  if (apiKey && apiKey.trim().length > 0) {
    return new TransactionalEmailProvider(apiKey.trim());
  }

  if (process.env.NODE_ENV !== 'production') {
    return new DevelopmentEmailProvider();
  }

  throw new Error(
    '[VizPilot Email] In production, an email provider API key must be configured via RESEND_API_KEY or EMAIL_PROVIDER_API_KEY.'
  );
}
