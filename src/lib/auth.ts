// Auth helpers — branches between mock and Supabase modes.
//
// Mock mode (NEXT_PUBLIC_AUTH_MODE=mock):
//   - Login page accepts any input, calls mockSignIn().
//   - (dashboard)/layout.tsx gates on hasMockSession() instead of Supabase session.
//   - Sign-out clears the flag.
//
// Supabase mode (anything else, including unset):
//   - Real signInWithPassword + partner_accounts check.

export const IS_MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MODE === "mock";

const MOCK_SESSION_KEY = "wv-mock-session";

export function mockSignIn(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MOCK_SESSION_KEY, "1");
}

export function mockSignOut(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MOCK_SESSION_KEY);
}

export function hasMockSession(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MOCK_SESSION_KEY) === "1";
}
