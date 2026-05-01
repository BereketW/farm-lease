type EmailTemplateInput = {
  title: string;
  body: string;
  actionUrl?: string;
};

export function buildEmailTemplate({
  title,
  body,
  actionUrl,
}: EmailTemplateInput) {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <h2 style="margin: 0 0 12px;">${escapeHtml(title)}</h2>
      <p style="margin: 0 0 16px;">${escapeHtml(body)}</p>
      ${
        actionUrl
          ? `<a href="${actionUrl}" style="display:inline-block;padding:10px 14px;background:#111;color:#fff;text-decoration:none;border-radius:8px;">Open FarmLease</a>`
          : ""
      }
    </div>
  `;

  const text = actionUrl ? `${title}\n\n${body}\n\n${actionUrl}` : `${title}\n\n${body}`;

  return { html, text };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
