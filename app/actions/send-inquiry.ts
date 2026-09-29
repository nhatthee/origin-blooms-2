"use server";

import { Resend } from "resend";
import {
  parseContactFormData,
  validateContactInquiry,
  type ContactActionResult,
} from "../../lib/contact";

const SALES_INBOX = "sales@originblooms.com";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function row(label: string, value: string): string {
  const display = value || "—";
  return `<tr>
    <td style="padding:8px 12px 8px 0;vertical-align:top;color:#6c5f70;font-weight:600;white-space:nowrap;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;vertical-align:top;color:#33283a;">${escapeHtml(display).replaceAll("\n", "<br />")}</td>
  </tr>`;
}

export async function sendInquiry(formData: FormData): Promise<ContactActionResult> {
  const input = parseContactFormData(formData);

  // Honeypot: pretend success to bots without sending mail.
  if (input.website) {
    return { ok: true };
  }

  const fieldErrors = validateContactInquiry(input);
  if (fieldErrors) {
    return {
      ok: false,
      error: "Please check the highlighted fields and try again.",
      fieldErrors,
    };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.CONTACT_FROM_EMAIL?.trim();
  const toEmail = process.env.CONTACT_TO_EMAIL?.trim() || SALES_INBOX;

  if (!apiKey || !fromEmail) {
    console.error(
      "Contact form email is not configured. Set RESEND_API_KEY and CONTACT_FROM_EMAIL.",
    );
    return {
      ok: false,
      error:
        "Inquiry email is not configured yet. Please email sales@originblooms.com directly.",
    };
  }

  const subjectParts = [
    "Wholesale inquiry",
    input.businessName || input.name,
    input.interestedIn || null,
  ].filter(Boolean);

  const textBody = [
    `Name: ${input.name}`,
    `Business name: ${input.businessName || "—"}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone || "—"}`,
    `Interested in: ${input.interestedIn || "—"}`,
    `Estimated quantity: ${input.quantity || "—"}`,
    `Delivery location: ${input.deliveryLocation || "—"}`,
    `Needed by: ${input.neededBy || "—"}`,
    "",
    "Message:",
    input.message,
  ].join("\n");

  const htmlBody = `
    <div style="font-family:Plus Jakarta Sans,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;">
      <p style="margin:0 0 16px;color:#48235c;font-weight:700;">New Origin Blooms wholesale inquiry</p>
      <table style="border-collapse:collapse;width:100%;max-width:640px;">
        ${row("Name", input.name)}
        ${row("Business name", input.businessName)}
        ${row("Email", input.email)}
        ${row("Phone", input.phone)}
        ${row("Interested in", input.interestedIn)}
        ${row("Estimated quantity", input.quantity)}
        ${row("Delivery location", input.deliveryLocation)}
        ${row("Needed by", input.neededBy)}
        ${row("Message", input.message)}
      </table>
    </div>
  `;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: input.email,
      subject: subjectParts.join(" — "),
      text: textBody,
      html: htmlBody,
    });

    if (error) {
      console.error("Resend failed to send contact inquiry:", error);
      return {
        ok: false,
        error:
          "We couldn’t send your inquiry right now. Please try again or email sales@originblooms.com.",
      };
    }

    return { ok: true };
  } catch (error) {
    console.error("Unexpected contact inquiry error:", error);
    return {
      ok: false,
      error:
        "We couldn’t send your inquiry right now. Please try again or email sales@originblooms.com.",
    };
  }
}
