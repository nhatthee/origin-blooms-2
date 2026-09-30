"use server";

import { Resend } from "resend";
import {
  parseContactFormData,
  validateContactInquiry,
  type ContactActionResult,
} from "../../lib/contact";
import { buildInquiryExcelAttachment } from "../../lib/exportInquiryExcel";
import {
  formatInquiryLine,
  formatInquirySummary,
  parseInquiryItemsFormField,
  totalsByUnit,
  type InquiryItem,
} from "../../lib/inquiry";

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

function formatItemsForEmail(items: InquiryItem[]): string {
  if (items.length === 0) return "";
  const lines = items.map((item) => `• ${formatInquiryLine(item)}`);
  const unitLines = totalsByUnit(items).map((entry) => `• ${entry.total} ${entry.unit}`);
  return ["Selected varieties:", ...lines, "", "Totals by unit:", ...unitLines].join("\n");
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

  const inquiryParse = parseInquiryItemsFormField(formData.get("inquiryItems"));
  if (!inquiryParse.ok) {
    return { ok: false, error: inquiryParse.error };
  }

  const inquiryItems = inquiryParse.items.filter((item) => item.quantity > 0);
  const requireInquiryItems = formData.get("requireInquiryItems") === "1";

  if (requireInquiryItems && inquiryItems.length === 0) {
    return {
      ok: false,
      error:
        "Your inquiry list is empty. Add products before confirming, or go back to edit your request.",
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

  const submittedAt = new Date();
  const summary = formatInquirySummary(inquiryItems);
  const itemsBlock = formatItemsForEmail(inquiryItems);

  const subjectParts = [
    "Wholesale inquiry",
    input.businessName || input.name,
    input.interestedIn || summary.interestedIn || null,
  ].filter(Boolean);

  const textBody = [
    `Name: ${input.name}`,
    `Business name: ${input.businessName || "—"}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone || "—"}`,
    `Interested in: ${input.interestedIn || "—"}`,
    `Estimated quantity: ${input.quantity || summary.quantity || "—"}`,
    `Delivery location: ${input.deliveryLocation || "—"}`,
    `Needed by: ${input.neededBy || "—"}`,
    "",
    "Message:",
    input.message,
    ...(itemsBlock ? ["", itemsBlock, "", "Full line details are in the attached Excel file."] : []),
  ].join("\n");

  const htmlItems =
    inquiryItems.length > 0
      ? `<tr>
          <td style="padding:8px 12px 8px 0;vertical-align:top;color:#6c5f70;font-weight:600;white-space:nowrap;">Selected varieties</td>
          <td style="padding:8px 0;vertical-align:top;color:#33283a;">
            <ul style="margin:0;padding-left:18px;">
              ${inquiryItems
                .map((item) => `<li>${escapeHtml(formatInquiryLine(item))}</li>`)
                .join("")}
            </ul>
            <p style="margin:12px 0 0;color:#6c5f70;">
              ${escapeHtml(
                totalsByUnit(inquiryItems)
                  .map((entry) => `${entry.total} ${entry.unit}`)
                  .join(" · "),
              )}
            </p>
            <p style="margin:8px 0 0;color:#6c5f70;font-size:13px;">
              Full line details are in the attached Excel file.
            </p>
          </td>
        </tr>`
      : "";

  const htmlBody = `
    <div style="font-family:Plus Jakarta Sans,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;">
      <p style="margin:0 0 16px;color:#48235c;font-weight:700;">New Origin Blooms wholesale inquiry</p>
      <table style="border-collapse:collapse;width:100%;max-width:640px;">
        ${row("Name", input.name)}
        ${row("Business name", input.businessName)}
        ${row("Email", input.email)}
        ${row("Phone", input.phone)}
        ${row("Interested in", input.interestedIn)}
        ${row("Estimated quantity", input.quantity || summary.quantity)}
        ${row("Delivery location", input.deliveryLocation)}
        ${row("Needed by", input.neededBy)}
        ${row("Message", input.message)}
        ${htmlItems}
      </table>
    </div>
  `;

  let attachments:
    | {
        filename: string;
        content: Buffer;
        contentType: string;
      }[]
    | undefined;

  if (inquiryItems.length > 0) {
    try {
      const excel = await buildInquiryExcelAttachment(inquiryItems, {
        name: input.name,
        businessName: input.businessName,
        email: input.email,
        phone: input.phone,
        message: input.message,
        submittedAt,
      });
      attachments = [
        {
          filename: excel.filename,
          content: excel.buffer,
          contentType: excel.contentType,
        },
      ];
    } catch (error) {
      console.error("Failed to build inquiry Excel attachment:", error);
      return {
        ok: false,
        error:
          "We couldn’t prepare the inquiry spreadsheet. Please try again or email sales@originblooms.com.",
      };
    }
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: input.email,
      subject: subjectParts.join(" — "),
      text: textBody,
      html: htmlBody,
      ...(attachments ? { attachments } : {}),
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
