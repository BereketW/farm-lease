import nodemailer from "nodemailer";

let transport: nodemailer.Transporter | null = null;
let transportMode: "smtp" | "json" = "json";

export function getTransport() {
  if (transport) return transport;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transport = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });
    transportMode = "smtp";
    console.log(`[auth-mailer] SMTP transport ready: ${host}:${port}`);
  } else {
    transport = nodemailer.createTransport({ jsonTransport: true });
    transportMode = "json";
    console.log(
      "[auth-mailer] no SMTP_* env vars set — using JSON transport (emails are logged, not delivered)"
    );
  }

  return transport;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const from = process.env.MAIL_FROM ?? "FarmLease <no-reply@farmlease.local>";
  try {
    await getTransport().sendMail({
      from,
      to,
      subject,
      html,
      text,
    });
    console.log(`[auth-mailer] (${transportMode}) sent "${subject}" -> ${to}`);
  } catch (error) {
    console.error(`[auth-mailer] failed to send email to ${to}:`, error);
  }
}
