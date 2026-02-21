/**
 * Email sending via Resend.
 *
 * We wrap Resend in a thin layer so:
 * - The Resend SDK is the only import that knows about Resend.
 * - All callers use typed payload objects.
 * - Errors are always normalised to { ok, error }.
 *
 * Resend is imported dynamically so the module can be loaded even when the
 * RESEND_API_KEY env var is absent (e.g. tests). Actual sends will fail with a
 * clear message in that case.
 *
 * To add Resend: npm install resend
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface EmailResult {
  ok: true;
  id: string;
}

export interface EmailError {
  ok: false;
  error: string;
}

const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? 'Stafferoo <noreply@stafferoo.app>';

/**
 * Send a single email via Resend.
 * Returns a discriminated union — callers must check `.ok`.
 */
export async function sendEmail(
  payload: EmailPayload
): Promise<EmailResult | EmailError> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY not set — email not sent', { to: payload.to, subject: payload.subject });
    return { ok: false, error: 'Email service not configured (RESEND_API_KEY missing)' };
  }

  try {
    // Dynamic import so the module tree is importable without resend installed.
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from:    FROM_ADDRESS,
      to:      payload.to,
      subject: payload.subject,
      html:    payload.html,
      ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
    });

    if (error || !data) {
      console.error('[email] Resend error', { to: payload.to, error });
      return { ok: false, error: error?.message ?? 'Unknown Resend error' };
    }

    console.log('[email] sent', { to: payload.to, subject: payload.subject, id: data.id });
    return { ok: true, id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected email error';
    console.error('[email] unexpected error', { to: payload.to, error: message });
    return { ok: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Email template helpers
// ---------------------------------------------------------------------------

/**
 * Renders the referee invitation email as HTML.
 */
export function refereeInvitationHtml(opts: {
  applicantName: string;
  refereeFirstName: string;
  referenceLink: string;
  expiresAt: Date;
}): string {
  const expiresFormatted = opts.expiresAt.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  <div style="text-align:center;margin-bottom:30px;">
    <h1 style="color:#c653a0;font-size:24px;margin:0;">Stafferoo</h1>
    <p style="color:#666;font-size:14px;margin:5px 0;">Early Years Staffing Platform</p>
  </div>

  <p>Dear ${escHtml(opts.refereeFirstName)},</p>

  <p>
    <strong>${escHtml(opts.applicantName)}</strong> has applied to join Stafferoo as an early years
    professional and has given your name as a reference.
  </p>

  <p>
    We would be grateful if you could take a few minutes to complete a short online reference form.
    Your response is important in helping us ensure the highest standards of childcare.
  </p>

  <div style="text-align:center;margin:30px 0;">
    <a href="${opts.referenceLink}"
       style="background:#c653a0;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
      Complete Reference →
    </a>
  </div>

  <p style="font-size:13px;color:#666;">
    Or copy and paste this link into your browser:<br>
    <a href="${opts.referenceLink}" style="color:#c653a0;">${opts.referenceLink}</a>
  </p>

  <p style="font-size:13px;color:#666;">
    This link expires on <strong>${expiresFormatted}</strong> and can only be used once.
    If you have any questions, please contact us at
    <a href="mailto:support@stafferoo.app" style="color:#c653a0;">support@stafferoo.app</a>.
  </p>

  <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
  <p style="font-size:12px;color:#999;text-align:center;">
    Stafferoo Ltd · support@stafferoo.app<br>
    If you did not expect this email, please ignore it.
  </p>
</body>
</html>`;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
