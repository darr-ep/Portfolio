import type { APIRoute } from 'astro';
import { Resend } from 'resend';

// Single Resend instance for the module lifecycle
const resend = new Resend(import.meta.env.RESEND_API_KEY);

// From address — must be a verified-domain sender in production (see .env.example)
const FROM_ADDRESS =
  (import.meta.env.RESEND_FROM as string | undefined) ??
  'Portfolio Contact <onboarding@resend.dev>';

// In-memory rate limit: at most 1 submission per IP per 30 seconds
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 30_000;

/** Escape HTML special characters to prevent XSS in the email body. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Honeypot: silently drop bot submissions that fill the hidden field
  if (typeof body.website === 'string' && body.website !== '') {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Type guards — reject anything that isn't a string
  if (
    typeof body.name !== 'string' ||
    typeof body.email !== 'string' ||
    typeof body.message !== 'string'
  ) {
    return new Response(JSON.stringify({ error: 'All fields required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const name    = body.name.trim();
  const email   = body.email.trim();
  const message = body.message.trim();

  // Required-field check after trimming whitespace
  if (!name || !email || !message) {
    return new Response(JSON.stringify({ error: 'All fields required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Length limits
  if (name.length > 200 || email.length > 320 || message.length > 5000) {
    return new Response(JSON.stringify({ error: 'Input exceeds maximum length' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email address' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // IP-based rate limit: first value from x-forwarded-for, then clientAddress
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    clientAddress ??
    'unknown';

  const lastSubmit = rateLimitMap.get(ip) ?? 0;
  const now = Date.now();
  if (now - lastSubmit < RATE_LIMIT_MS) {
    return new Response(
      JSON.stringify({ error: 'Too many requests — please wait a moment.' }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
  rateLimitMap.set(ip, now);

  // HTML-escape inputs first, then convert newlines to <br/> for the message
  const safeName    = escapeHtml(name);
  const safeEmail   = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: 'darr.pedraz@gmail.com',
    replyTo: email,
    subject: `New message from ${safeName}`,
    html: `
      <p><strong>From:</strong> ${safeName} (${safeEmail})</p>
      <p><strong>Message:</strong></p>
      <p>${safeMessage}</p>
    `,
  });

  if (error) {
    console.error('[contact] Resend error:', error);
    return new Response(JSON.stringify({ error: 'Send failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
