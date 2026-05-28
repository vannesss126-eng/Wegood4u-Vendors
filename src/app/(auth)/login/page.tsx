"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckSquare,
  ChevronUp,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

import { supabase, fetchPartnerAccounts } from "@/lib/supabase";
import { IS_MOCK_AUTH, mockSignIn } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!email || !password) {
      toast.error("Enter both email and password.");
      return;
    }

    setSubmitting(true);

    if (IS_MOCK_AUTH) {
      mockSignIn();
      toast.success("Signed in.");
      router.replace("/");
      return;
    }

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError || !authData.user) {
        toast.error(authError?.message ?? "Sign-in failed.");
        return;
      }

      const partnerAccounts = await fetchPartnerAccounts(authData.user.id);

      if (partnerAccounts.length === 0) {
        await supabase.auth.signOut();
        toast.error("This account is not a Wegood4u partner account.", {
          description:
            "Partner accounts are provisioned by Wegood4u admins. Contact your account manager if this looks wrong.",
        });
        return;
      }

      toast.success("Signed in.");
      router.replace("/");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative grid min-h-screen grid-cols-1 overflow-hidden md:grid-cols-[1.1fr_1fr]">
      {/* Ambient glows — clipped by overflow:hidden so they don't add scroll. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-44 -top-44 z-0 h-[560px] w-[560px] rounded-full bg-primary/10 blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-52 -right-52 z-0 h-[500px] w-[500px] rounded-full bg-primary-soft/60 blur-[100px]"
      />

      <BrandPane />

      <FormPane
        email={email}
        password={password}
        showPassword={showPassword}
        submitting={submitting}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onToggleShowPassword={() => setShowPassword((v) => !v)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

/* ============================================================
   LEFT — Brand pane
   ============================================================ */

function BrandPane() {
  return (
    <section className="relative z-[1] flex flex-col border-b border-border bg-bg-soft px-7 py-10 md:border-b-0 md:border-r md:px-[60px] md:py-14">
      {/* Brand mark */}
      <div className="mb-12 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-[11px] bg-primary text-[17px] font-extrabold text-primary-foreground shadow-[0_10px_24px_-6px_var(--primary-glow),inset_0_1px_0_rgba(255,255,255,0.2)]">
          WV
        </div>
        <div className="leading-[1.15]">
          <div className="text-[17px] font-bold tracking-tight text-foreground">
            Wegood4u
          </div>
          <div className="mt-[3px] text-[11px] font-bold uppercase tracking-[0.1em] text-text-dim">
            Vendors
          </div>
        </div>
      </div>

      {/* Headline + sub + KPIs (centered vertically via my-auto) */}
      <div className="my-auto max-w-[460px]">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-primary-deep">
          <CheckSquare className="h-3 w-3" strokeWidth={2.5} />
          Partner portal
        </span>

        <h1 className="m-0 mb-5 text-[30px] font-bold leading-[1.1] tracking-[-0.025em] text-foreground md:text-[40px]">
          See exactly who walked in.
          <br />
          <span className="text-primary">Down to the receipt.</span>
        </h1>

        <p className="max-w-[420px] text-[15px] font-normal leading-[1.6] text-muted-foreground">
          Real-time verified visits, customer demographics, peak hours, and
          content performance for your restaurant. Full transparency on every
          Wegood4u-driven guest.
        </p>

        <div className="mt-9 grid max-w-[460px] grid-cols-3 gap-2.5">
          <MiniKpi label="Verified visits" value="287" delta="+17%" />
          <MiniKpi label="Spend" value="RM 11k" delta="+17%" />
          <MiniKpi label="Reach" value="119K" delta="+23%" />
        </div>
      </div>

      {/* Trust footer */}
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-semibold tracking-[0.02em] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-primary" />
          Trusted by 92+ F&amp;B partners
        </span>
        <span>· Kuala Lumpur · Penang · JB</span>
      </div>
    </section>
  );
}

function MiniKpi({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-border-hi hover:shadow-md">
      <div className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-text-dim">
        {label}
      </div>
      <div className="mt-1.5 text-[19px] font-bold leading-[1.1] tracking-tight text-foreground">
        {value}
      </div>
      <div className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-primary-tint px-1.5 py-0.5 text-[10px] font-bold text-primary">
        <ChevronUp className="h-2 w-2" strokeWidth={3} />
        {delta}
      </div>
    </div>
  );
}

/* ============================================================
   RIGHT — Form pane
   ============================================================ */

type FormPaneProps = {
  email: string;
  password: string;
  showPassword: boolean;
  submitting: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onToggleShowPassword: () => void;
  onSubmit: (e: FormEvent) => void;
};

function FormPane({
  email,
  password,
  showPassword,
  submitting,
  onEmailChange,
  onPasswordChange,
  onToggleShowPassword,
  onSubmit,
}: FormPaneProps) {
  return (
    <section className="relative z-[1] flex flex-col justify-center bg-background px-7 py-10 md:px-[60px] md:py-14">
      <div className="mx-auto w-full max-w-[380px]">
        <div className="mb-8">
          <h2 className="m-0 mb-1.5 text-[26px] font-bold tracking-tight text-foreground">
            Welcome back
          </h2>
          <p className="text-[13px] font-medium text-muted-foreground">
            Sign in to your partner dashboard.
          </p>
        </div>

        <form onSubmit={onSubmit}>
          <Field label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@restaurant.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              disabled={submitting}
              required
              className="field-input"
            />
          </Field>

          <Field
            label="Password"
            htmlFor="password"
            rightAction={
              <a
                href="https://wegood4u.com/reset-password"
                className="text-[12px] font-bold text-primary underline-offset-2 transition-opacity hover:underline hover:opacity-80"
              >
                Forgot password?
              </a>
            }
          >
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                disabled={submitting}
                required
                className="field-input pr-11"
              />
              <button
                type="button"
                onClick={onToggleShowPassword}
                className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-bg-soft hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="mt-3 flex h-[46px] w-full items-center justify-center gap-2 rounded-[10px] bg-primary text-sm font-semibold text-primary-foreground shadow-[0_10px_24px_-8px_var(--primary-glow),inset_0_1px_0_rgba(255,255,255,0.15)] transition-[transform,background,box-shadow] duration-150 hover:-translate-y-px hover:bg-primary-deep hover:shadow-[0_14px_28px_-8px_rgba(32,110,86,0.30),inset_0_1px_0_rgba(255,255,255,0.15)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-[15px] w-[15px]" strokeWidth={2.5} />
              </>
            )}
          </button>

          <div className="mt-3.5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Lock className="h-2.5 w-2.5 text-primary" />
            Encrypted &amp; private — your data stays yours
          </div>
        </form>

        <div className="my-7 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.08em] text-text-dim before:h-px before:flex-1 before:bg-border before:content-[''] after:h-px after:flex-1 after:bg-border after:content-['']">
          Need help?
        </div>

        <div className="flex items-start gap-2.5 rounded-[10px] border border-primary/20 bg-primary-tint px-4 py-3.5 text-[11.5px] leading-[1.5] text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
          <div>
            <b className="font-bold text-foreground">
              Partner accounts are admin-provisioned.
            </b>{" "}
            If you don&apos;t have credentials, contact your Wegood4u account
            manager or email{" "}
            <a
              href="mailto:wegood4u@gmail.com"
              className="font-bold text-primary underline-offset-2 hover:underline"
            >
              wegood4u@gmail.com
            </a>
            .
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  rightAction,
  children,
}: {
  label: string;
  htmlFor: string;
  rightAction?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="block text-xs font-bold tracking-[-0.005em] text-foreground"
        >
          {label}
        </label>
        {rightAction ?? null}
      </div>
      {children}
    </div>
  );
}
