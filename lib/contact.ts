export const INTEREST_OPTIONS = [
  "Cut Orchids",
  "Loose Blooms",
  "Bouquets",
  "All Products",
] as const;

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

export const CONTACT_DRAFT_KEY = "origin-blooms:contact-draft-v1";

export type ContactFormValues = {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  interestedIn: string;
  quantity: string;
  deliveryLocation: string;
  neededBy: string;
  message: string;
  website: string;
};

export const EMPTY_CONTACT_VALUES: ContactFormValues = {
  name: "",
  businessName: "",
  email: "",
  phone: "",
  interestedIn: "",
  quantity: "",
  deliveryLocation: "",
  neededBy: "",
  message: "",
  website: "",
};

export function contactValuesToFormData(values: ContactFormValues): FormData {
  const formData = new FormData();
  formData.set("name", values.name);
  formData.set("businessName", values.businessName);
  formData.set("email", values.email);
  formData.set("phone", values.phone);
  formData.set("interestedIn", values.interestedIn);
  formData.set("quantity", values.quantity);
  formData.set("deliveryLocation", values.deliveryLocation);
  formData.set("neededBy", values.neededBy);
  formData.set("message", values.message);
  formData.set("website", values.website);
  return formData;
}

export function readContactDraft(): ContactFormValues | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CONTACT_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ContactFormValues>;
    return {
      ...EMPTY_CONTACT_VALUES,
      name: typeof parsed.name === "string" ? parsed.name : "",
      businessName: typeof parsed.businessName === "string" ? parsed.businessName : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
      interestedIn: typeof parsed.interestedIn === "string" ? parsed.interestedIn : "",
      quantity: typeof parsed.quantity === "string" ? parsed.quantity : "",
      deliveryLocation:
        typeof parsed.deliveryLocation === "string" ? parsed.deliveryLocation : "",
      neededBy: typeof parsed.neededBy === "string" ? parsed.neededBy : "",
      message: typeof parsed.message === "string" ? parsed.message : "",
      website: "",
    };
  } catch {
    return null;
  }
}

export function writeContactDraft(values: ContactFormValues): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      CONTACT_DRAFT_KEY,
      JSON.stringify({
        name: values.name,
        businessName: values.businessName,
        email: values.email,
        phone: values.phone,
        interestedIn: values.interestedIn,
        quantity: values.quantity,
        deliveryLocation: values.deliveryLocation,
        neededBy: values.neededBy,
        message: values.message,
      }),
    );
  } catch {
    // private mode — ignore
  }
}

export function clearContactDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CONTACT_DRAFT_KEY);
  } catch {
    // ignore
  }
}
