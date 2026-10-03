"use server";

import { createHash } from "crypto";
import { Resend } from "resend";
import {
  parseContactFormData,
  validateContactInquiry,
  type ContactActionResult,
  type ContactInquiryInput,
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
const BRAND_PURPLE = "#48235c";
const BRAND_MUTED = "#6c5f70";
const BRAND_INK = "#33283a";
const BRAND_LINE = "#e7deea";

const ACK_SUBJECT = "We’ve received your inquiry | Origin Blooms";

const ACK_INTRO =
  "Thank you for your inquiry. We’ve received your request and will begin reviewing availability, packing details, and pricing.";

const ACK_ATTACHMENT_NOTE =
  "We’ve attached an Excel summary of the items and quantities you requested for your reference.";

const ACK_CLOSING = "Our team will get back to you as soon as possible.";

/** Absolute HTTPS origin for email assets (clients cannot load localhost / relative paths). */
function emailSiteOrigin(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return "https://originblooms.com";
}

const EMAIL_LOGO_WIDTH = 180;
const EMAIL_LOGO_HEIGHT = 61; // 360×122 source → half for ~180px display width

function emailLogoUrl(): string {
  return `${emailSiteOrigin()}/images/logo/origin-blooms-purple.png`;
}

/** In-process dedupe: same inquiry fingerprint won’t send twice within the TTL. */
const DEDUPE_TTL_MS = 2 * 60 * 1000;
const recentSuccess = new Map<string, number>();
const inflight = new Map<string, Promise<ContactActionResult>>();

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
    <td style="padding:8px 12px 8px 0;vertical-align:top;color:${BRAND_MUTED};font-weight:600;white-space:nowrap;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;vertical-align:top;color:${BRAND_INK};">${escapeHtml(display).replaceAll("\n", "<br />")}</td>
  </tr>`;
}

function formatItemsForEmail(items: InquiryItem[]): string {
  if (items.length === 0) return "";
  const lines = items.map((item) => `• ${formatInquiryLine(item)}`);
  const unitLines = totalsByUnit(items).map((entry) => `• ${entry.total} ${entry.unit}`);
  return ["Selected varieties:", ...lines, "", "Totals by unit:", ...unitLines].join("\n");
}

function formatItemSizeLabel(item: InquiryItem): string {
  if (item.format === "bouquet" && item.sizeLabel) {
    return `${item.code} · Size ${item.sizeLabel}`;
  }
  if (item.sizeLabel && item.lengthRange) {
    return `${item.sizeLabel} (${item.lengthRange})`;
  }
  if (item.optionLabel) return item.optionLabel;
  return "—";
}

function buildInquiryFingerprint(
  input: ContactInquiryInput,
  items: InquiryItem[],
): string {
  const payload = {
    email: input.email,
    name: input.name,
    businessName: input.businessName,
    phone: input.phone,
    interestedIn: input.interestedIn,
    quantity: input.quantity,
    deliveryLocation: input.deliveryLocation,
    neededBy: input.neededBy,
    message: input.message,
    items: items.map((item) => ({
      slug: item.slug,
      optionKey: item.optionKey,
      quantity: item.quantity,
      unit: item.unit,
    })),
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function pruneDedupeMaps(now: number) {
  for (const [key, at] of recentSuccess) {
    if (now - at > DEDUPE_TTL_MS) recentSuccess.delete(key);
  }
}

function buildCustomerAckText(
  items: InquiryItem[],
  hasAttachment: boolean,
): string {
  const lines = [
    "Origin Blooms",
    "https://www.originblooms.com/",
    "",
    ACK_INTRO,
    ...(hasAttachment ? ["", ACK_ATTACHMENT_NOTE] : []),
    "",
    ACK_CLOSING,
    "",
    "Warm regards,",
    "Origin Blooms",
  ];

  if (items.length > 0) {
    lines.push("", "Your request summary:");
    for (const item of items) {
      lines.push(
        `• ${item.name} | ${formatItemSizeLabel(item)} | ${item.quantity} ${item.unit}`,
      );
    }
    const unitTotals = totalsByUnit(items);
    if (unitTotals.length > 0) {
      lines.push("");
      lines.push(
        `Totals: ${unitTotals.map((entry) => `${entry.total} ${entry.unit}`).join(" · ")}`,
      );
    }
  }

  return lines.join("\n");
}

function buildCustomerAckHtml(
  items: InquiryItem[],
  hasAttachment: boolean,
): string {
  const summaryRows =
    items.length > 0
      ? items
          .map(
            (item) => `<tr>
              <td style="padding:10px 12px;border-bottom:1px solid ${BRAND_LINE};color:${BRAND_INK};">${escapeHtml(item.name)}</td>
              <td style="padding:10px 12px;border-bottom:1px solid ${BRAND_LINE};color:${BRAND_MUTED};">${escapeHtml(formatItemSizeLabel(item))}</td>
              <td style="padding:10px 12px;border-bottom:1px solid ${BRAND_LINE};color:${BRAND_INK};text-align:right;white-space:nowrap;">${item.quantity} ${escapeHtml(item.unit)}</td>
            </tr>`,
          )
          .join("")
      : "";

  const totalsNote =
    items.length > 0
      ? `<p style="margin:14px 0 0;font-size:13px;color:${BRAND_MUTED};">
          Totals: ${escapeHtml(
            totalsByUnit(items)
              .map((entry) => `${entry.total} ${entry.unit}`)
              .join(" · "),
          )}
        </p>`
      : "";

  const attachmentNote = hasAttachment
    ? `<p style="margin:0 0 16px;">
        ${escapeHtml(ACK_ATTACHMENT_NOTE)}
      </p>`
    : "";

  const summaryBlock =
    items.length > 0
      ? `
        <div style="margin-top:28px;padding-top:22px;border-top:1px solid ${BRAND_LINE};">
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${BRAND_PURPLE};">
            Your request summary
          </p>
          <table style="border-collapse:collapse;width:100%;font-size:14px;line-height:1.5;">
            <thead>
              <tr>
                <th style="text-align:left;padding:8px 12px;border-bottom:2px solid ${BRAND_PURPLE};color:${BRAND_PURPLE};font-size:12px;letter-spacing:.04em;text-transform:uppercase;">Product</th>
                <th style="text-align:left;padding:8px 12px;border-bottom:2px solid ${BRAND_PURPLE};color:${BRAND_PURPLE};font-size:12px;letter-spacing:.04em;text-transform:uppercase;">Size</th>
                <th style="text-align:right;padding:8px 12px;border-bottom:2px solid ${BRAND_PURPLE};color:${BRAND_PURPLE};font-size:12px;letter-spacing:.04em;text-transform:uppercase;">Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${summaryRows}
            </tbody>
          </table>
          ${totalsNote}
        </div>`
      : "";

  return `
    <div style="margin:0;padding:0;background:#ffffff;">
      <div style="max-width:560px;margin:0 auto;padding:32px 24px;background:#ffffff;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:${BRAND_INK};">
        <div style="margin:0 0 20px;">
          <a
            href="https://www.originblooms.com/"
            target="_blank"
            rel="noopener noreferrer"
            style="display:inline-block;text-decoration:none;"
          >
            <img
              src="${escapeHtml(emailLogoUrl())}"
              alt="Origin Blooms"
              width="${EMAIL_LOGO_WIDTH}"
              height="${EMAIL_LOGO_HEIGHT}"
              style="display:block;border:0;outline:none;text-decoration:none;width:${EMAIL_LOGO_WIDTH}px;max-width:100%;height:auto;"
            />
          </a>
        </div>
        <p style="margin:0 0 16px;">
          ${escapeHtml(ACK_INTRO)}
        </p>
        ${attachmentNote}
        <p style="margin:0 0 16px;">
          ${escapeHtml(ACK_CLOSING)}
        </p>
        <p style="margin:24px 0 0;">
          Warm regards,<br />
          <span style="color:${BRAND_PURPLE};font-weight:700;">Origin Blooms</span>
        </p>
        ${summaryBlock}
      </div>
    </div>
  `;
}

async function sendInquiryOnce(formData: FormData): Promise<ContactActionResult> {
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

  // Report missing env var NAMES only — never log values/secrets.
  const missingEnv: string[] = [];
  if (!apiKey) missingEnv.push("RESEND_API_KEY");
  if (!fromEmail) missingEnv.push("CONTACT_FROM_EMAIL");

  if (missingEnv.length > 0) {
    console.error(
      `Contact form email is not configured. Missing environment variable(s): ${missingEnv.join(", ")}.`,
    );
    return {
      ok: false,
      error:
        "Inquiry email is not configured yet. Please email sales@originblooms.com directly.",
    };
  }

  const fingerprint = buildInquiryFingerprint(input, inquiryItems);
  const now = Date.now();
  pruneDedupeMaps(now);

  if (recentSuccess.has(fingerprint)) {
    // Same inquiry already accepted recently — do not send again.
    return { ok: true };
  }

  const existing = inflight.get(fingerprint);
  if (existing) {
    return existing;
  }

  const work = (async (): Promise<ContactActionResult> => {
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
            <td style="padding:8px 12px 8px 0;vertical-align:top;color:${BRAND_MUTED};font-weight:600;white-space:nowrap;">Selected varieties</td>
            <td style="padding:8px 0;vertical-align:top;color:${BRAND_INK};">
              <ul style="margin:0;padding-left:18px;">
                ${inquiryItems
                  .map((item) => `<li>${escapeHtml(formatInquiryLine(item))}</li>`)
                  .join("")}
              </ul>
              <p style="margin:12px 0 0;color:${BRAND_MUTED};">
                ${escapeHtml(
                  totalsByUnit(inquiryItems)
                    .map((entry) => `${entry.total} ${entry.unit}`)
                    .join(" · "),
                )}
              </p>
              <p style="margin:8px 0 0;color:${BRAND_MUTED};font-size:13px;">
                Full line details are in the attached Excel file.
              </p>
            </td>
          </tr>`
        : "";

    const htmlBody = `
      <div style="font-family:Plus Jakarta Sans,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;">
        <p style="margin:0 0 16px;color:${BRAND_PURPLE};font-weight:700;">New Origin Blooms wholesale inquiry</p>
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

    const resend = new Resend(apiKey);

    try {
      const { error: salesError } = await resend.emails.send({
        from: fromEmail!,
        to: [toEmail],
        replyTo: input.email,
        subject: subjectParts.join(" — "),
        text: textBody,
        html: htmlBody,
        ...(attachments ? { attachments } : {}),
      });

      if (salesError) {
        console.error("Resend failed to send contact inquiry to sales inbox:", salesError);
        return {
          ok: false,
          error:
            "We couldn’t send your inquiry right now. Please try again or email sales@originblooms.com.",
        };
      }
    } catch (error) {
      console.error("Unexpected error sending inquiry to sales inbox:", error);
      return {
        ok: false,
        error:
          "We couldn’t send your inquiry right now. Please try again or email sales@originblooms.com.",
      };
    }

    // Sales email accepted — inquiry is considered successful from here.
    // Customer acknowledgment is best-effort; failures must not force a resubmit.
    recentSuccess.set(fingerprint, Date.now());

    try {
      const hasAttachment = Boolean(attachments?.length);
      const { error: ackError } = await resend.emails.send({
        from: fromEmail!,
        to: [input.email],
        replyTo: toEmail,
        subject: ACK_SUBJECT,
        text: buildCustomerAckText(inquiryItems, hasAttachment),
        html: buildCustomerAckHtml(inquiryItems, hasAttachment),
        // Same .xlsx buffer + filename as the sales email (built once above).
        ...(attachments ? { attachments } : {}),
      });

      if (ackError) {
        console.error(
          "Inquiry sales email succeeded, but customer acknowledgment failed:",
          ackError,
        );
      }
    } catch (error) {
      console.error(
        "Inquiry sales email succeeded, but customer acknowledgment threw:",
        error,
      );
    }

    return { ok: true };
  })();

  inflight.set(fingerprint, work);
  try {
    return await work;
  } finally {
    inflight.delete(fingerprint);
  }
}

export async function sendInquiry(formData: FormData): Promise<ContactActionResult> {
  return sendInquiryOnce(formData);
}
