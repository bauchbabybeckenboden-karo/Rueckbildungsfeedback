// netlify/functions/feedback-notification.mjs
// Schickt Karo das Feedback (Somatic Beckenboden / Rückbildungserfolg) als Mail
// im Layout Wunderwerk Frau.
// Sicherheit: Mail nur an eine feste Adresse, nur einfache Feldnamen,
// gekürzte Texte, begrenzte Feldanzahl, HTML wird maskiert.

const EMPFAENGER = "bauch.baby.beckenboden@gmail.com";
const ABSENDER = "Karo · Bauch · Baby · Beckenboden <kontakt@bauch-baby-beckenboden.com>";
const LOGO = "https://raw.githubusercontent.com/bauchbabybeckenboden-karo/Logos/main/Clitlogo-creme.png";

const LABELS = {
  eingereicht_am: "Eingereicht",
  teilnehmer_name: "Name",
  geburt_zeitraum: "Geburt (Zeitraum)",
  zustand_vorher: "Zustand vorher",
  schmerz_kurs: "Schmerzen im Kurs",
  schmerz_detail: "Schmerzen (Details)",
  modifikation: "Modifikationen",
  tempo: "Tempo",
  veraenderung_ja: "Veränderung bemerkt",
  veraenderung_beschreibung: "Veränderung (Beschreibung)",
  koerper_bewusstsein: "Körperbewusstsein",
  verlangsamung: "Verlangsamung",
  praesenz: "Präsenz",
  zuhause_uebt: "Übt zuhause",
  zuhause_hilfe: "Hilfe zuhause",
  empfehlen: "Würde empfehlen",
  weitere_themen: "Weitere Themen",
  positives: "Positives",
  sonstiges: "Sonstiges",
  frage_1: "Frage 1",
  frage_2: "Frage 2",
  frage_3: "Frage 3"
};

const MAX_FELDER = 60;

const clean = (v, max = 3000) => {
  if (Array.isArray(v)) v = v.join(", ");
  else if (v && typeof v === "object") v = JSON.stringify(v);
  return String(v ?? "").replace(/\r/g, "").trim().slice(0, max) || "-";
};

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br/>");

const label = (f) =>
  LABELS[f] || f.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

const zeile = (lab, w) =>
  `<tr>
    <td valign="top" style="padding:10px 12px 10px 0;width:170px;border-bottom:1px solid #E8D5D0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;letter-spacing:1px;text-transform:uppercase;color:#8B6464;">${esc(lab)}</td>
    <td valign="top" style="padding:10px 0;border-bottom:1px solid #E8D5D0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#3D2B2B;">${esc(w)}</td>
  </tr>`;

function baueHtml(d, name, felder) {
  const zeilen = felder.map((k) => zeile(label(k), clean(d[k]))).join("");
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F6EBE8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F6EBE8"><tr><td align="center" style="padding:30px 12px;">
<table role="presentation" width="620" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:620px;background:#F3E9E5;border:1px solid #E8D5D0;">
  <tr><td bgcolor="#8B6464" style="background:#8B6464;padding:30px 36px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="middle" style="padding:0 18px 0 0;"><img src="${LOGO}" width="44" height="88" alt="" style="display:block;width:44px;height:88px;border:0;"/></td>
      <td valign="middle">
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;letter-spacing:1px;text-transform:uppercase;color:#E8D5D0;">Neues Feedback &middot; Somatic Beckenboden</p>
        <h1 style="margin:6px 0 0;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:28px;line-height:34px;color:#FBF6F3;">${esc(name)}</h1>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 36px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${zeilen}</table>
  </td></tr>
  <tr><td bgcolor="#8B6464" align="center" style="background:#8B6464;padding:26px 36px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;color:#F3E9E5;text-align:center;">
    <div style="font-family:Georgia,serif;font-size:20px;letter-spacing:1px;color:#F3E9E5;">Wunderwerk Frau</div>
    <div style="width:140px;height:1px;background:#F3E9E5;margin:6px auto;line-height:1px;font-size:1px;">&nbsp;</div>
    <div style="font-size:11px;letter-spacing:3px;color:#F3E9E5;margin-bottom:12px;">BAUCH &middot; BABY &middot; BECKENBODEN</div>
    <a href="https://www.wunderwerk-frau.de" style="color:#F3E9E5;text-decoration:underline;">www.wunderwerk-frau.de</a>
  </td></tr>
</table>
</td></tr></table>
</body>
</html>`;
}

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY fehlt in den Netlify-Variablen");
    return new Response("RESEND_API_KEY fehlt", { status: 500 });
  }

  let d;
  try {
    d = await req.json();
  } catch {
    return new Response("Ungueltige Daten", { status: 400 });
  }
  if (!d || typeof d !== "object" || Array.isArray(d)) {
    return new Response("Ungueltige Daten", { status: 400 });
  }

  const felder = Object.keys(d)
    .filter((k) => /^[a-z0-9_]{1,40}$/.test(k))
    .slice(0, MAX_FELDER);
  if (felder.length === 0) {
    return new Response("Keine Angaben", { status: 400 });
  }
  // Eingereicht und Name nach oben
  const oben = ["eingereicht_am", "teilnehmer_name"].filter((k) => felder.includes(k));
  const sortiert = [...oben, ...felder.filter((k) => !oben.includes(k))];

  const rohName = clean(d.teilnehmer_name, 80).replace(/\s+/g, " ");
  const name = rohName === "-" || rohName === "–" ? "Anonym" : rohName;

  const mail = {
    from: ABSENDER,
    to: [EMPFAENGER],
    subject: `Neues Feedback - Somatic Beckenboden - ${name}`,
    html: baueHtml(d, name, sortiert),
    text: ["Neues Feedback - Somatic Beckenboden", "", ...sortiert.map((k) => `${label(k)}: ${clean(d[k])}`)].join("\n")
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(mail)
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend Fehler:", res.status, err);
    return new Response("Mailversand fehlgeschlagen", { status: 502 });
  }
  return new Response("OK", { status: 200 });
};
