import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAllGeminiKeys } from "@/lib/ai.server";

export const transcribeAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: FormData) => {
    if (!(d instanceof FormData)) throw new Error("Invalid input");
    const file = d.get("file");
    if (!(file instanceof File) || !file.size || file.size > 20_000_000) throw new Error("Invalid audio");
    return d;
  })
  .handler(async ({ data }) => {
    const keys = getAllGeminiKeys();
    if (keys.length === 0) throw new Error("AI is not configured");

    const file = data.get("file") as File;
    const bytes = new Uint8Array(await file.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    const base64Audio = btoa(bin);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]!;
      try {
        const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
          method: "POST",
          headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [
              { text: "Transcribe this speech exactly. Output only the spoken words. If there is no speech, output nothing." },
              { inline_data: { mime_type: "audio/wav", data: base64Audio } },
            ] }],
            generationConfig: { temperature: 0 },
          }),
        });

        if (res.status === 429) {
          console.warn(`[Transcription] Key #${i + 1} rate-limited, falling back...`);
          continue;
        }
        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          console.warn(`[Transcription] Key #${i + 1} failed (${res.status}): ${errText}`);
          continue;
        }

        const j = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
        const text = j.candidates?.[0]?.content?.parts?.map((x) => x.text ?? "").join("") ?? "";
        return { text: text.trim(), error: "" };
      } catch (err) {
        console.warn(`[Transcription] Error with key #${i + 1}:`, err);
        continue;
      }
    }

    return { text: "", error: "Couldn't understand the audio. Please try again." };
  });
