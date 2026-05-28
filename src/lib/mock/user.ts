// Mock signed-in user — fronts the topbar avatar + user pill in mock-auth mode.
// Linked conceptually to MOCK_STORE (Thai Geng Mookata owner).
// Replaced by real Supabase auth.user + partner_accounts row in Pass 2.

export const MOCK_USER = {
  id: "mock-user-edbert",
  name: "Edbert Han",
  initials: "EH",
  email: "partner@thaigeng.com",
  role: "Owner",
} as const;

export type MockUser = typeof MOCK_USER;
