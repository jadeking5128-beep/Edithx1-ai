import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

type GateSession = { unlocked?: boolean };

function cfg() {
  return {
    password: process.env["SESSION_SECRET"] || "fallback-edith-hud-secret-key-32-chars-minimum",
    name: "styx-gate",
    maxAge: 60 * 60 * 24 * 7,
    cookie: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" },
  };
}

function matches(input: string, expected: string) {
  try {
    const a = createHash("sha256").update(input, "utf8").digest();
    const b = createHash("sha256").update(expected, "utf8").digest();
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const isUnlocked = createServerFn({ method: "GET" }).handler(async () => {
  const expected = process.env["SITE_PASSWORD"];
  // If no site password is set in the environment, grant open access by default
  if (!expected || expected.trim() === "") {
    return { unlocked: true };
  }
  try {
    const s = await useSession<GateSession>(cfg());
    return { unlocked: !!s.data?.unlocked };
  } catch {
    return { unlocked: true };
  }
});

export const unlockSite = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => ({ password: String(d?.password ?? "").slice(0, 200) }))
  .handler(async ({ data }) => {
    const expected = process.env["SITE_PASSWORD"];
    if (!expected || expected.trim() === "") {
      return { ok: true as const };
    }
    if (!matches(data.password, expected)) return { ok: false as const };
    try {
      const s = await useSession<GateSession>(cfg());
      await s.update({ unlocked: true });
    } catch {
      // In case session fails, still allow if password matched
    }
    return { ok: true as const };
  });
