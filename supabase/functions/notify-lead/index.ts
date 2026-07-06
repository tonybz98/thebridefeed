// the bride feed — notificare pe email la fiecare cerere nouă din calendar.
//
// Se declanșează printr-un Database Webhook Supabase pe INSERT în tabela `leads`.
// Trimite un email prin Resend către adresa de admin (MAIL_TO).
//
// Secrete necesare (Supabase → Edge Functions → Manage secrets):
//   RESEND_API_KEY  — cheia din resend.com (obligatoriu)
//   MAIL_TO         — destinatarul notificării (default: contact@thebridefeed.ro)
//   MAIL_FROM       — expeditorul; până verifici domeniul, lasă onboarding@resend.dev
//   WEBHOOK_SECRET  — opțional; dacă e setat, cererea trebuie să trimită
//                     headerul `x-webhook-secret` cu aceeași valoare.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const MAIL_TO = Deno.env.get("MAIL_TO") ?? "contact@thebridefeed.ro";
const MAIL_FROM = Deno.env.get("MAIL_FROM") ?? "the bride feed <onboarding@resend.dev>";
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string)
  );

const row = (label: string, value: unknown) =>
  value ? `<tr><td style="padding:4px 12px 4px 0;color:#8a8178;">${label}</td><td style="padding:4px 0;font-weight:600;">${esc(value)}</td></tr>` : "";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // verificare opțională de secret
  if (WEBHOOK_SECRET && req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY lipsește");
    return new Response("Missing RESEND_API_KEY", { status: 500 });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Database Webhook trimite { type, table, record, old_record, schema }.
  // Acceptăm și un `record` direct, pentru test manual.
  const lead = (payload.record as Record<string, unknown>) ?? payload;

  const dateStr = lead.date
    ? new Date(String(lead.date)).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })
    : "(nespecificată)";

  const subject = `Cerere nouă pentru ${dateStr}${lead.name ? ` — ${lead.name}` : ""}`;

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:auto;color:#2a2622;">
      <h2 style="margin:0 0 4px;">Cerere nouă din calendar 🎉</h2>
      <p style="margin:0 0 16px;color:#8a8178;">Cineva a cerut disponibilitatea pentru <b style="color:#c97b5f;">${esc(dateStr)}</b>.</p>
      <table style="border-collapse:collapse;font-size:14px;">
        ${row("Nume", lead.name)}
        ${row("Telefon", lead.phone)}
        ${row("Email", lead.email)}
        ${row("Miri", lead.couple)}
        ${row("Locație", lead.location)}
        ${row("Pachet", lead.pkg)}
        ${row("Mesaj", lead.notes)}
      </table>
      <p style="margin:20px 0 0;">
        <a href="https://thebridefeed.ro/admin" style="background:#c97b5f;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600;">Deschide panoul de admin</a>
      </p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [MAIL_TO],
      reply_to: lead.email ? String(lead.email) : undefined,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend a eșuat:", res.status, err);
    return new Response(`Resend error: ${res.status}`, { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
