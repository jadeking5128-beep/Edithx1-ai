// Shared AI chat client for EDITH.
// Supports automatic fallback across up to 4+ Gemini API keys if quota/credits are exhausted or rate-limited.
// Server-only — never import from client code.

const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-flash-latest";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type KeyInfo = {
  index: number;
  label: string;
  masked: string;
  status: "active" | "standby" | "exhausted" | "invalid";
  lastUsed?: string;
  error?: string;
};

// In-memory key state tracker for diagnostics
const keyStatuses: Map<string, { status: "active" | "standby" | "exhausted" | "invalid"; error?: string }> = new Map();

/**
 * Gathers all available Gemini API keys from environment variables and optional extra keys.
 */
export function getAllGeminiKeys(extraKeys: string[] = []): string[] {
  const envKeys: (string | undefined)[] = [
    process.env["GEMINI_API_KEY"],
    process.env["GEMINI_API_KEY_2"],
    process.env["GEMINI_API_KEY_3"],
    process.env["GEMINI_API_KEY_4"],
  ];

  // Comma or newline separated list if configured
  const multiEnv = process.env["GEMINI_API_KEYS"]?.split(/[\n,]+/).map((k) => k.trim());
  if (multiEnv) {
    envKeys.push(...multiEnv);
  }

  const combined = [...envKeys, ...extraKeys];
  const uniqueKeys: string[] = [];

  for (const k of combined) {
    if (k && typeof k === "string") {
      const trimmed = k.trim();
      if (trimmed.length > 10 && !uniqueKeys.includes(trimmed)) {
        uniqueKeys.push(trimmed);
      }
    }
  }

  return uniqueKeys;
}

/**
 * Returns safe diagnostic information about the key pool (masked keys, active status).
 */
export function getKeyPoolStatus(extraKeys: string[] = []): KeyInfo[] {
  const keys = getAllGeminiKeys(extraKeys);
  return keys.map((key, i) => {
    const masked = key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : "••••••••";
    const info = keyStatuses.get(key) || { status: i === 0 ? "active" : "standby" };
    return {
      index: i + 1,
      label: i === 0 ? "Primary Key" : `Fallback Key #${i}`,
      masked,
      status: info.status,
      error: info.error,
    };
  });
}

async function callSingleKey(
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
  apiKey: string,
): Promise<{ text: string }> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: { temperature: 0.7, maxOutputTokens: 1200 },
    }),
  });

  if (res.status === 429) {
    throw new Error("RATE_LIMITED");
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error("BAD_API_KEY");
  }
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    if (errBody.includes("RESOURCE_EXHAUSTED") || errBody.includes("quota") || errBody.includes("credit")) {
      throw new Error("CREDITS_DEPLETED");
    }
    throw new Error(`Gemini API error ${res.status}: ${errBody.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error("Empty Gemini response");
  return { text };
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("AI_TIMEOUT")), ms)),
  ]);
}

/**
 * Calls chat with automatic fallback across all configured Gemini API keys.
 * If Key 1 runs out of credits or is rate-limited, it automatically fails over to Key 2, Key 3, Key 4, etc.
 */
export async function callChat(
  systemPrompt: string,
  messages: ChatMessage[],
  extraKeys: string[] = [],
): Promise<string> {
  const keys = getAllGeminiKeys(extraKeys);
  if (keys.length === 0) {
    throw new Error("No Gemini API key configured. Please provide an API key in settings or environment.");
  }

  const models = [PRIMARY_MODEL, FALLBACK_MODEL];
  let lastError: Error | null = null;

  for (let keyIdx = 0; keyIdx < keys.length; keyIdx++) {
    const currentKey = keys[keyIdx]!;
    for (const model of models) {
      try {
        const result = await withTimeout(
          callSingleKey(model, systemPrompt, messages, currentKey),
          20000,
        );
        keyStatuses.set(currentKey, { status: "active" });
        return result.text;
      } catch (err: unknown) {
        const e = err instanceof Error ? err : new Error(String(err));
        lastError = e;
        const msg = e.message;

        const isExhausted =
          msg === "RATE_LIMITED" ||
          msg === "CREDITS_DEPLETED" ||
          msg === "BAD_API_KEY" ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("quota") ||
          msg.includes("credit");

        if (isExhausted) {
          keyStatuses.set(currentKey, { status: "exhausted", error: msg });
          console.warn(`[EDITH AI] Key #${keyIdx + 1} exhausted/failed (${msg}), attempting fallback to next key...`);
          // Break to try the next key in the pool
          break;
        } else if (msg.includes("404") || msg.includes("not found")) {
          // Model might not be supported on this tier, try fallback model with same key
          continue;
        } else {
          keyStatuses.set(currentKey, { status: "invalid", error: msg });
          break;
        }
      }
    }
  }

  throw lastError ?? new Error("All Gemini API keys failed");
}
