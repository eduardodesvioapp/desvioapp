// scripts/admin-mailer/worker.mjs
// Worker que consome public.email_outbox e envia e-mails aos
// admins (public.users.is_admin = true) via Gmail SMTP.

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SMTP_HOST = "smtp.gmail.com",
  SMTP_PORT = "465",
  SMTP_USER,
  SMTP_PASS,
  SMTP_SENDER_NAME = "Desvio",
  SMTP_FROM,
  POLL_INTERVAL_MS = "5000",
  MAX_ATTEMPTS = "5",
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!SMTP_USER || !SMTP_PASS) {
  console.error("Faltam SMTP_USER / SMTP_PASS");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

const pollMs = Number(POLL_INTERVAL_MS);
const maxAttempts = Number(MAX_ATTEMPTS);

async function getAdmins() {
  const { data, error } = await sb
    .from("users")
    .select("id, email, name")
    .eq("is_admin", true)
    .not("email", "is", null);

  if (error) throw error;
  return (data ?? [])
    .map((u) => u.email)
    .filter((e) => typeof e === "string" && e.includes("@"));
}

function renderEmail(eventType, p) {
  const created = new Date(p.created_at).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
  const confirmed = p.confirmed_at
    ? new Date(p.confirmed_at).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    })
    : null;

  if (eventType === "account_created") {
    return {
      subject: `[Desvio] Nova conta aguardando confirmação: ${p.user_email}`,
      text:
        `Nova conta criada no Desvio.\n\n` +
        `E-mail: ${p.user_email}\n` +
        `ID: ${p.user_id}\n` +
        `Criada em: ${created}\n` +
        `Status: aguardando confirmação de e-mail.\n`,
      html: `
        <h2 style="font-family:sans-serif;color:#111">Nova conta aguardando confirmação</h2>
        <p style="font-family:sans-serif;color:#444">Um novo usuário se cadastrou no <b>Desvio</b>.</p>
        <table style="font-family:sans-serif;border-collapse:collapse">
          <tr><td><b>E-mail</b></td><td>${esc(p.user_email)}</td></tr>
          <tr><td><b>ID</b></td><td>${esc(p.user_id)}</td></tr>
          <tr><td><b>Criada em</b></td><td>${esc(created)}</td></tr>
          <tr><td><b>Status</b></td><td>⏳ aguardando confirmação</td></tr>
        </table>
        <p style="font-family:sans-serif;color:#666;font-size:12px;margin-top:24px">
          Você receberá outro e-mail automaticamente quando o usuário confirmar o endereço.
        </p>
      `,
    };
  }

  return {
    subject: `[Desvio] Conta confirmada: ${p.user_email}`,
    text:
      `Conta confirmada no Desvio.\n\n` +
      `E-mail: ${p.user_email}\n` +
      `ID: ${p.user_id}\n` +
      `Criada em: ${created}\n` +
      `Confirmada em: ${confirmed ?? "—"}\n`,
    html: `
      <h2 style="font-family:sans-serif;color:#111">✅ Conta confirmada</h2>
      <p style="font-family:sans-serif;color:#444">O usuário confirmou o e-mail e agora está ativo.</p>
      <table style="font-family:sans-serif;border-collapse:collapse">
        <tr><td><b>E-mail</b></td><td>${esc(p.user_email)}</td></tr>
        <tr><td><b>ID</b></td><td>${esc(p.user_id)}</td></tr>
        <tr><td><b>Criada em</b></td><td>${esc(created)}</td></tr>
        <tr><td><b>Confirmada em</b></td><td>${esc(confirmed ?? "—")}</td></tr>
      </table>
    `,
  };
}

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function claimPending(limit = 10) {
  // Pega IDs primeiro (atômico só se usarmos UPDATE ... RETURNING)
  const { data, error } = await sb
    .from("email_outbox")
    .update({ status: "sending" })
    .eq("status", "pending")
    .lt("attempts", maxAttempts)
    .order("created_at", { ascending: true })
    .limit(limit)
    .select("id, event_type, payload, attempts");

  if (error) throw error;
  return data ?? [];
}

async function processRow(row) {
  const admins = await getAdmins();
  if (admins.length === 0) {
    await sb
      .from("email_outbox")
      .update({
        status: "failed",
        last_error: "nenhum admin com email válido",
        sent_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    return;
  }

  const { subject, text, html } = renderEmail(row.event_type, row.payload);
  const fromAddr = SMTP_FROM || SMTP_USER;
  const sent = [];
  const failed = [];

  for (const to of admins) {
    try {
      await transporter.sendMail({
        from: `"${SMTP_SENDER_NAME}" <${fromAddr}>`,
        to,
        subject,
        text,
        html,
        headers: { "X-Desvio-Event": row.event_type },
      });
      sent.push(to);
    } catch (e) {
      failed.push(to);
      console.error(`mailer: falha para ${to}:`, e?.message ?? e);
    }
  }

  const allOk = failed.length === 0;
  await sb
    .from("email_outbox")
    .update({
      status: allOk ? "sent" : (row.attempts + 1 >= maxAttempts ? "failed" : "pending"),
      last_error: allOk ? null : `${failed.length} destinatário(s) falharam`,
      sent_at: allOk ? new Date().toISOString() : null,
    })
    .eq("id", row.id);

  // Auditoria
  try {
    await sb.from("admin_notifications_log").insert({
      event: row.event_type,
      user_id: row.payload.user_id,
      user_email: row.payload.user_email,
      recipients: sent,
      failures: failed,
    });
  } catch (e) {
    console.warn("mailer: falha ao gravar log:", e?.message ?? e);
  }
}

async function tick() {
  try {
    const rows = await claimPending(10);
    for (const row of rows) {
      try {
        await processRow(row);
      } catch (e) {
        console.error(`mailer: erro na linha ${row.id}:`, e?.message ?? e);
        await sb
          .from("email_outbox")
          .update({
            status: row.attempts + 1 >= maxAttempts ? "failed" : "pending",
            last_error: String(e?.message ?? e),
          })
          .eq("id", row.id);
      }
    }
  } catch (e) {
    console.error("mailer: tick falhou:", e?.message ?? e);
  }
}

console.log(
  `admin-mailer: rodando (poll ${pollMs}ms, max ${maxAttempts} tentativas)`,
);

await tick();
setInterval(tick, pollMs);
