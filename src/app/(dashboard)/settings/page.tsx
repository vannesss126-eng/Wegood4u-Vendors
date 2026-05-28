"use client";

import { useRouter } from "next/navigation";
import { differenceInMonths, format, parseISO } from "date-fns";
import type { ReactNode } from "react";
import {
  Bell,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Info,
  Lock,
  LogOut,
  MapPin,
  Phone,
  Star,
  Utensils,
  UserPlus,
  Zap,
} from "lucide-react";

import { MOCK_STORE, MOCK_USER } from "@/lib/mock";
import { MOCK_TODAY } from "@/lib/mock/visits";
import { IS_MOCK_AUTH, mockSignOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsSection } from "@/components/dashboard/settings-section";
import { cn } from "@/lib/utils";

const PLAN_TIER: Record<typeof MOCK_STORE.plan, { label: string; sub: string }> = {
  Starter: { label: "Starter", sub: "Tier 1 of 3" },
  Growth: { label: "Growth", sub: "Tier 2 of 3" },
  Premium: { label: "Premium", sub: "Tier 3 of 3" },
};

export default function SettingsPage() {
  const router = useRouter();
  const enrolledDate = parseISO(`${MOCK_STORE.enrolledAt}T00:00:00+08:00`);
  const today = parseISO(`${MOCK_TODAY}T00:00:00+08:00`);
  const monthsActive = Math.max(0, differenceInMonths(today, enrolledDate));

  const handleSignOut = async () => {
    if (IS_MOCK_AUTH) {
      mockSignOut();
    } else {
      await supabase.auth.signOut();
    }
    router.replace("/login");
  };

  return (
    <div className="mx-auto max-w-[880px]">
      <PageHeader
        title="Settings"
        subtitle="Manage your restaurant profile, partnership, team, and notifications."
      />

      {/* Restaurant profile */}
      <SettingsSection
        title="Restaurant profile"
        subtitle="Your store info on Wegood4u — read-only here"
        flush
      >
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
          <div
            className="relative aspect-square overflow-hidden"
            style={{
              background:
                "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.18), transparent 50%), linear-gradient(135deg, #2a8167 0%, #16513F 100%)",
            }}
          >
            <div className="absolute inset-0 grid place-items-center text-white/85">
              <Utensils className="h-16 w-16" strokeWidth={1.5} />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 70% 80%, rgba(0,0,0,0.18), transparent 50%)",
              }}
            />
          </div>

          <div className="flex flex-col justify-center px-7 py-6">
            <span className="mb-2.5 inline-flex w-fit items-center rounded-full bg-primary-tint px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em] text-primary-deep">
              Restaurant
            </span>
            <h2 className="m-0 mb-1 text-[22px] font-bold tracking-tight text-foreground">
              {MOCK_STORE.name}
            </h2>
            <p className="mb-4 text-[13px] font-medium text-muted-foreground">
              {MOCK_STORE.description}
            </p>

            <div className="mt-auto flex flex-wrap items-center gap-x-[18px] gap-y-2 text-[12.5px] font-semibold text-foreground">
              <MetaItem
                icon={
                  <Star
                    className="h-3.5 w-3.5"
                    style={{ color: "#E5A93D" }}
                    fill="currentColor"
                    strokeWidth={0}
                  />
                }
              >
                {MOCK_STORE.rating.toFixed(2)}
              </MetaItem>
              <MetaItem icon={<DollarSign className="h-3.5 w-3.5 text-primary" />}>
                {MOCK_STORE.priceRange}
              </MetaItem>
              <MetaItem icon={<Clock className="h-3.5 w-3.5 text-primary" />}>
                {MOCK_STORE.hours}
              </MetaItem>
              <MetaItem icon={<Calendar className="h-3.5 w-3.5 text-primary" />}>
                {MOCK_STORE.days}
              </MetaItem>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 border-t border-border md:grid-cols-2">
          <DetailCell
            icon={<MapPin className="h-3 w-3" />}
            label="Address"
            hasRightBorder
          >
            <div className="whitespace-pre-line text-[13.5px] font-semibold leading-[1.5] text-foreground">
              {MOCK_STORE.address}
            </div>
          </DetailCell>
          <DetailCell icon={<Phone className="h-3 w-3" />} label="Phone">
            <div className="text-[13.5px] font-semibold text-foreground">
              {MOCK_STORE.phone}
            </div>
            <div className="mt-0.5 text-[11.5px] font-medium text-muted-foreground">
              Public-facing on store listing
            </div>
          </DetailCell>
        </div>

        <ReadOnlyNote>
          <b className="font-bold text-foreground">Read-only.</b> Restaurant details
          are managed by the Wegood4u admin team. To update, email{" "}
          <b className="font-bold text-foreground">wegood4u@gmail.com</b> or contact
          your account manager.
        </ReadOnlyNote>
      </SettingsSection>

      {/* Partnership */}
      <SettingsSection
        title="Partnership"
        subtitle="Your enrolment, plan, and per-visit fee"
        flush
      >
        <div className="grid grid-cols-2 divide-x divide-border md:grid-cols-4">
          <PartnershipCell
            label="Plan"
            value={PLAN_TIER[MOCK_STORE.plan].label}
            sub={PLAN_TIER[MOCK_STORE.plan].sub}
          />
          <PartnershipCell
            label="Per-visit fee"
            value={`RM ${MOCK_STORE.perVisitFee.toFixed(2)}`}
            sub="Flat rate, all visits"
          />
          <PartnershipCell
            label="Enrolled"
            value={format(enrolledDate, "d MMM yyyy")}
            sub={`${monthsActive} months active`}
          />
          <PartnershipCell
            label="Status"
            valueSlot={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-tint px-2.5 py-1 text-[11px] font-bold text-primary-deep">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Active
              </span>
            }
            sub="Statements monthly"
          />
        </div>
      </SettingsSection>

      {/* Team members */}
      <SettingsSection
        title="Team members"
        subtitle="People who can access this restaurant's dashboard"
        phaseBadge="Phase 5"
        flush
      >
        <div className="flex items-center gap-3.5 border-b border-border px-[22px] py-4">
          <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-deep text-[13px] font-bold text-primary-foreground">
            {MOCK_USER.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              {MOCK_USER.name}
              <span className="inline-flex rounded-full bg-primary-tint px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-primary-deep">
                You
              </span>
            </div>
            <div className="mt-0.5 text-xs font-medium text-muted-foreground">
              {MOCK_USER.email} · last active just now
            </div>
          </div>
          <span className="inline-flex items-center rounded-md border border-border bg-bg-soft px-2.5 py-1 text-xs font-semibold text-foreground">
            {MOCK_USER.role}
          </span>
        </div>

        <div className="border-t border-dashed border-border px-6 py-5 text-center">
          <div className="mx-auto mb-2.5 grid h-9 w-9 place-items-center rounded-full bg-bg-soft text-muted-foreground">
            <UserPlus className="h-4 w-4" />
          </div>
          <div className="text-[13px] font-bold text-foreground">
            Invite teammates — coming soon
          </div>
          <p className="mx-auto mt-1 max-w-[340px] text-[11.5px] font-medium leading-relaxed text-muted-foreground">
            Soon you&apos;ll be able to invite managers and staff with view-only or
            full access. Multi-user roles ship in Phase 5.
          </p>
        </div>
      </SettingsSection>

      {/* Notification preferences */}
      <SettingsSection
        title="Notification preferences"
        subtitle="How we'll alert you about visits, statements, and weekly summaries"
        phaseBadge="Phase K"
        flush
      >
        <NotifRow
          icon={<Bell className="h-[15px] w-[15px] text-primary" />}
          name="New visit verified"
          desc="Real-time push when a customer's selfie + receipt is approved. Useful for spotting verified visits as they happen."
          on
        />
        <NotifRow
          icon={<FileText className="h-[15px] w-[15px] text-primary" />}
          name="Monthly statement issued"
          desc="Push on the 1st of each month when your statement auto-finalises. Statement PDF attached in-app."
          on
        />
        <NotifRow
          icon={<Zap className="h-[15px] w-[15px] text-primary" />}
          name="Weekly performance digest"
          desc="Every Monday morning — visit count, content reach, and top metrics for the week prior."
          on={false}
          last
        />

        <ReadOnlyNote icon={<Info className="h-3.5 w-3.5" />}>
          <b className="font-bold text-foreground">Coming in Phase K.</b> Web Push
          notifications activate after beta launch — pending feedback from initial
          partner cohort. Email digest as a fallback can be enabled earlier on
          request.
        </ReadOnlyNote>
      </SettingsSection>

      {/* Account */}
      <SettingsSection title="Account" subtitle="Your sign-in details and session" flush>
        <div className="flex items-center justify-between gap-3.5 border-b border-border px-[22px] py-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground">
              Email
            </div>
            <div className="mt-1 text-[13.5px] font-semibold text-foreground">
              {MOCK_USER.email}
            </div>
            <div className="mt-1 text-[11.5px] font-medium text-muted-foreground">
              Used for sign-in and statement delivery
            </div>
          </div>
          <a
            href="https://wegood4u.com/reset-password"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-[12.5px] font-semibold text-foreground transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Lock className="h-3.5 w-3.5" />
            Reset password
          </a>
        </div>

        <div className="flex items-center justify-between gap-3.5 px-[22px] py-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground">
              Session
            </div>
            <div className="mt-1 text-[13.5px] font-semibold text-foreground">
              Active · KL, Malaysia · Safari on macOS
            </div>
            <div className="mt-1 text-[11.5px] font-medium text-muted-foreground">
              Last activity just now
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-[12.5px] font-semibold text-foreground transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}

/* ============================================================
   Inline helpers
   ============================================================ */

function MetaItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      {icon}
      {children}
    </span>
  );
}

function DetailCell({
  icon,
  label,
  hasRightBorder,
  children,
}: {
  icon: ReactNode;
  label: string;
  hasRightBorder?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "px-[22px] py-[18px]",
        hasRightBorder && "md:border-r md:border-border"
      )}
    >
      <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function ReadOnlyNote({
  icon,
  children,
}: {
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 border-t border-dashed border-border bg-bg-soft px-[22px] py-3 text-[11.5px] font-medium leading-relaxed text-muted-foreground">
      <span className="mt-px flex-shrink-0 text-primary">
        {icon ?? <Lock className="h-3.5 w-3.5" />}
      </span>
      <span>{children}</span>
    </div>
  );
}

function PartnershipCell({
  label,
  value,
  valueSlot,
  sub,
}: {
  label: string;
  value?: string;
  valueSlot?: ReactNode;
  sub: string;
}) {
  return (
    <div className="flex flex-col gap-1 px-[22px] py-4">
      <div className="text-[10.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground">
        {label}
      </div>
      {valueSlot ?? (
        <div className="text-[15px] font-bold tracking-tight text-foreground">
          {value}
        </div>
      )}
      <div className="text-[11.5px] font-medium text-muted-foreground">{sub}</div>
    </div>
  );
}

function NotifRow({
  icon,
  name,
  desc,
  on,
  last,
}: {
  icon: ReactNode;
  name: string;
  desc: string;
  on: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3.5 px-[22px] py-4",
        !last && "border-b border-border"
      )}
    >
      <div className="mt-0.5 grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-primary-tint">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-bold text-foreground">{name}</div>
        <div className="mt-0.5 text-[11.5px] font-medium leading-relaxed text-muted-foreground">
          {desc}
        </div>
      </div>
      <div
        aria-disabled
        title="Phase K — toggles activate after beta launch"
        className={cn(
          "relative mt-1 h-[22px] w-[38px] flex-shrink-0 cursor-not-allowed rounded-full border transition-colors",
          on
            ? "border-primary-deep bg-primary opacity-70"
            : "border-border-hi bg-bg-soft opacity-60"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 grid h-[18px] w-[18px] place-items-center rounded-full bg-white shadow-[0_1px_3px_rgba(14,20,16,0.18)] transition-[left,right]",
            on ? "right-0.5" : "left-0.5"
          )}
        />
      </div>
    </div>
  );
}
