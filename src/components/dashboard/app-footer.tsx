// App footer — renders on every (dashboard)/* route via the dashboard layout.
// Excluded from (auth)/login per design (login screen has no footer).

export function AppFooter() {
  return (
    <footer className="mt-12 mb-2 border-t border-border py-[18px] text-center text-xs font-medium tracking-[0.02em] text-text-dim">
      Wegood4u Vendors — Powered by{" "}
      <a
        href="https://saysheji.com"
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-primary underline-offset-[3px] transition-opacity hover:underline hover:opacity-80"
      >
        Say Sheji
      </a>
    </footer>
  );
}
