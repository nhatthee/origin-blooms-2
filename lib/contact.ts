export const INTEREST_OPTIONS = ["Cut Orchids", "Loose Blooms", "Both"] as const;

export type InterestOption = (typeof INTEREST_OPTIONS)[number];

export const CONTACT_LIMITS = {
  name: 100,
  businessName: 120,
  email: 254,
  phone: 40,
  quantity: 120,
  deliveryLocation: 200,
  neededBy: 40,
  message: 2000,
  honeypot: 200,
} as const;

export type ContactInquiryInput = {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  interestedIn: string;
  quantity: string;
  deliveryLocation: string;
  neededBy: string;
  message: string;
  /** Honeypot — must stay empty for real submissions. */
  website: string;
};

export type ContactFieldErrors = Partial<
  Record<keyof Omit<ContactInquiryInput, "website">, string>
>;

export type ContactActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: ContactFieldErrors };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isInterestOption(value: string): value is InterestOption {
  return (INTEREST_OPTIONS as readonly string[]).includes(value);
}

export function trimField(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function validateContactInquiry(
  input: ContactInquiryInput,
): ContactFieldErrors | null {
  const fieldErrors: ContactFieldErrors = {};

  if (!input.name) {
    fieldErrors.name = "Please enter your name.";
  }

  if (!input.email) {
    fieldErrors.email = "Please enter your email.";
  } else if (!EMAIL_PATTERN.test(input.email)) {
    fieldErrors.email = "Please enter a valid email address.";
  }

  if (input.interestedIn && !isInterestOption(input.interestedIn)) {
    fieldErrors.interestedIn = "Please choose a valid interest option.";
  }

  if (!input.message) {
    fieldErrors.message = "Please enter a message.";
  } else if (input.message.length > CONTACT_LIMITS.message) {
    fieldErrors.message = `Message must be ${CONTACT_LIMITS.message} characters or fewer.`;
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}

export function parseContactFormData(formData: FormData): ContactInquiryInput {
  return {
    name: trimField(formData.get("name"), CONTACT_LIMITS.name),
    businessName: trimField(formData.get("businessName"), CONTACT_LIMITS.businessName),
    email: trimField(formData.get("email"), CONTACT_LIMITS.email).toLowerCase(),
    phone: trimField(formData.get("phone"), CONTACT_LIMITS.phone),
    interestedIn: trimField(formData.get("interestedIn"), 40),
    quantity: trimField(formData.get("quantity"), CONTACT_LIMITS.quantity),
    deliveryLocation: trimField(
      formData.get("deliveryLocation"),
      CONTACT_LIMITS.deliveryLocation,
    ),
    neededBy: trimField(formData.get("neededBy"), CONTACT_LIMITS.neededBy),
    message: trimField(formData.get("message"), CONTACT_LIMITS.message),
    website: trimField(formData.get("website"), CONTACT_LIMITS.honeypot),
  };
}
