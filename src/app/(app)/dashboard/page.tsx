import { BarChart3, Construction } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time partner analytics. KPIs and live visit feed land in Phase C.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Verified visits", "Customer spend", "Amount owed", "Content reach"].map(
          (label) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-card p-5"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                —
              </p>
              <p className="mt-2 text-xs text-text-dim">Coming in Phase C</p>
            </div>
          )
        )}
      </div>

      <EmptyState
        icon={Construction}
        title="Phase B shell — auth + layout ready."
        description="Next up: Phase C wires the four KPIs to live Supabase queries (submissions, partner_store_settings, all_social_posts) and adds the recent-visits feed with Supabase Realtime."
      />

      <EmptyState
        icon={BarChart3}
        title="Visits page lives next door."
        description="Use the sidebar to navigate. Visits, Demographics, Peak Hours, Content, Billing, and Settings will fill in across Phases D–I."
      />
    </div>
  );
}
