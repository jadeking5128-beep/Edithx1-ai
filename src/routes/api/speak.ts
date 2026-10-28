import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { VOICES } from "@/lib/styx-settings";
import { getAllGeminiKeys } from "@/lib/ai.server";

export const Route = createFileRoute("/api/speak")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        // Allow guest token
        const isGuest = token === "guest" || token.startsWith("guest-");

        if (!isGuest) {
          const sb = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data: u } = await sb.auth.getUser(token);
          if (!u.user) return new Response("Unauthorized", { status: 401 });
        }

        const body = (await request.json().catch(() => null)) as { text?: string; voice?: string; fallbackKeys?: string[] } | null;
        const text = String(body?.text ?? "").slice(0, 3000);
        if (!text) return new Response("No text", { status: 400 });
        const voice = VOICES.some((v) => v.id === body?.voice) ? body!.voice! : "Charon";

        const keys = getAllGeminiKeys(body?.fallbackKeys ?? []);
        if (keys.length === 0) return new Response("Voice not configured", { status: 500 });

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i]!;
          try {
            const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent", {
              method: "POST",
              headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text }] }],
                generationConfig: {
                  responseModalities: ["AUDIO"],
                  speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
                },
              }),
              signal: request.signal,
            });

            if (res.status === 429) {
              console.warn(`[Speak TTS] Key #${i + 1} rate-limited, falling back...`);
              continue;
            }
            if (!res.ok) {
              console.warn(`[Speak TTS] Key #${i + 1} returned status ${res.status}`);
              continue;
            }

            const j = (await res.json()) as { candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[] };
            const audio = j.candidates?.[0]?.content?.parts?.find((x) => x.inlineData?.data)?.inlineData?.data;
            if (!audio) continue;

            const sse = `data: ${JSON.stringify({ type: "speech.audio.delta", audio })}\n\ndata: ${JSON.stringify({ type: "speech.audio.done" })}\n\n`;
            return new Response(sse, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store" } });
          } catch (e) {
            console.warn(`[Speak TTS] Failed with key #${i + 1}:`, e);
            continue;
          }
        }

        return new Response("No audio generated from available keys", { status: 502 });
      },
    },
  },
});
