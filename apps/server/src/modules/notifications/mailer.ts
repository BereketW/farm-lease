import nodemailer from "nodemailer";
import { prisma } from "@farm-lease/db";

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  notifType?: string;
};

type SendMailResult = {
  success: boolean;
  sentAt?: Date;
  error?: string;
  attempts: number;
  logId?: string;
};

let transport: nodemailer.Transporter | null = null;
let transportMode: "smtp" | "json" = "json";

function getTransport() {
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
    console.log(`[mailer] SMTP transport ready: ${host}:${port}`);
  } else {
    transport = nodemailer.createTransport({ jsonTransport: true });
    transportMode = "json";
    console.log(
      "[mailer] no SMTP_* env vars set — using JSON transport (emails are logged, not delivered)"
    );
  }

  return transport;
}

async function recordEmailLog(params: {
  to: string;
  subject: string;
  notifType?: string;
  status: "SENT" | "FAILED";
  attempts: number;
  lastError?: string;
  sentAt?: Date;
}): Promise<string | undefined> {
  try {
    const row = await prisma.emailLog.create({
      data: {
        recipient: params.to,
        subject: params.subject,
        notifType: params.notifType,
        status: params.status,
        attempts: params.attempts,
        lastError: params.lastError,
        sentAt: params.sentAt,
      },
      select: { id: true },
    });
    return row.id;
  } catch (error) {
    // Never let logging failures break email sending.
    console.warn("[mailer] failed to persist EmailLog:", error);
    return undefined;
  }
}

/**
 * Send an email with up to `maxAttempts` retries. Each attempt waits
 * a little longer (250ms, 500ms, 1000ms). After the final attempt —
 * whether it succeeded or failed — a row is written to `EmailLog`
 * with the outcome so operators can audit email delivery.
 */
export async function sendEmailWithRetry(
  input: SendMailInput,
  maxAttempts = 3
): Promise<SendMailResult> {
  const from = process.env.MAIL_FROM ?? "FarmLease <no-reply@farmlease.local>";

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await getTransport().sendMail({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });

      const sentAt = new Date();
      console.log(
        `[mailer] (${transportMode}) sent "${input.subject}" -> ${input.to} (attempt ${attempt})`
      );
      const logId = await recordEmailLog({
        to: input.to,
        subject: input.subject,
        notifType: input.notifType,
        status: "SENT",
        attempts: attempt,
        sentAt,
      });
      return { success: true, sentAt, attempts: attempt, logId };
    } catch (error) {
      lastError = error;
      console.warn(
        `[mailer] attempt ${attempt}/${maxAttempts} failed for ${input.to}:`,
        error instanceof Error ? error.message : error
      );
      if (attempt < maxAttempts) {
        // Exponential-ish backoff: 250ms, 500ms, 1000ms…
        await new Promise((resolve) =>
          setTimeout(resolve, 250 * 2 ** (attempt - 1))
        );
      }
    }
  }

  const errMsg =
    lastError instanceof Error ? lastError.message : "Unknown email error";
  const logId = await recordEmailLog({
    to: input.to,
    subject: input.subject,
    notifType: input.notifType,
    status: "FAILED",
    attempts: maxAttempts,
    lastError: errMsg,
  });

  return {
    success: false,
    error: errMsg,
    attempts: maxAttempts,
    logId,
  };
}
