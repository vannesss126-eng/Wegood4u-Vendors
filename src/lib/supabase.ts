import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase env vars. Expected NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env / .env.local."
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseKey);

export type PartnerAccount = {
  user_id: string;
  partner_store_id: string;
  role: string;
};

export async function fetchPartnerAccounts(userId: string): Promise<PartnerAccount[]> {
  const { data, error } = await supabase
    .from("partner_accounts")
    .select("user_id, partner_store_id, role")
    .eq("user_id", userId);

  if (error) throw error;
  return data ?? [];
}
