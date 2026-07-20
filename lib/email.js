// Envoi d'email via l'API Brevo (gratuit, verification d'un expediteur simple sans nom de domaine requis).
// Doc : https://developers.brevo.com/docs/send-a-transactional-email

export async function sendEmail({ to, toName, subject, html, text }) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY n'est pas configure.");
  }
  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM n'est pas configure.");
  }
  if (!to) {
    throw new Error('Destinataire manquant.');
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: {
        email: process.env.EMAIL_FROM,
        name: process.env.EMAIL_FROM_NAME || 'Agenda projets',
      },
      to: [{ email: to, name: toName || undefined }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Envoi email echoue (${res.status}) : ${errText}`);
  }
  return res.json();
}
