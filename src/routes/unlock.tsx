import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { unlockSite } from "@/lib/gate.functions";

export const Route = createFileRoute("/unlock")({
  head: () => ({
    meta: [
      { title: "E.D.I.T.H. — Access Required" },
      { name: "description", content: "Enter the access code to reach E.D.I.T.H." },
      { property: "og:title", content: "E.D.I.T.H. — Access Required" },
      { property: "og:description", content: "Enter the access code to reach E.D.I.T.H." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Unlock,
});

function Unlock() {
  const router = useRouter();
  const unlock = useServerFn(unlockSite);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const password = new FormData(e.currentTarget).get("password") as string;
    try {
      const { ok } = await unlock({ data: { password } });
      if (ok) await router.navigate({ to: "/" });
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 hud-bg">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 liquid-glass-card rounded-2xl p-6 shadow-2xl">
        <h1 className="jarvis-title text-center text-lg tracking-[0.3em] text-primary">E.D.I.T.H. ACCESS</h1>
        <p className="text-center text-xs text-muted-foreground">Tactical clearance code required.</p>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Access code (or leave blank if none)"
          className="liquid-glass-input w-full px-4 py-2.5 text-xs text-foreground focus:outline-none"
        />
        {error && <p className="text-destructive text-center text-xs">Invalid access code, sir.</p>}
        <button disabled={busy} type="submit" className="liquid-glass-btn w-full py-2.5 text-xs tracking-widest disabled:opacity-50">
          {busy ? "VERIFYING CLEARANCE…" : "ENTER SYSTEM"}
        </button>
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => router.navigate({ to: "/" })}
            className="text-[11px] text-muted-foreground hover:text-primary transition tracking-wider underline underline-offset-4"
          >
            Direct Access / Home
          </button>
        </div>
      </form>
    </div>
  );
}
