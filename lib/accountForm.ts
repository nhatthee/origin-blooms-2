const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function normalizeAccountEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Client-side password rules until a real auth provider defines its own. */
export const ACCOUNT_PASSWORD_MIN_LENGTH = 8;

export function passwordMeetsMinimum(value: string): boolean {
  return value.length >= ACCOUNT_PASSWORD_MIN_LENGTH;
}

/** Shown when auth backend is not wired — never treat as a successful sign-in. */
export const ACCOUNT_AUTH_UNAVAILABLE_MESSAGE =
  "Account sign-in isn’t connected yet. You can keep browsing and send inquiries without logging in, or email sales@originblooms.com.";
