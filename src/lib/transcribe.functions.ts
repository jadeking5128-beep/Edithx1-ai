import { createServerFn } from "@tanstack/react-start";
import { getAllGeminiKeys } from "@/lib/ai.server";

export const transcribeAudio = createServerFn({ method: "POST" })
  .validator((d: FormData) => {
    if (!(d instanceof FormData)) throw new Error("Invalid input");
    const file = d.get("file");
    if (!(file instanceof File) || !file.size || file.size > 20_000_000) throw new Error("Invalid audio");
    return d;
  })
  .handler(async ({ data }) => {
    const keys = getAllGeminiKeys();
    const file = data.get("file") as File;
    const bytes = new Uint8Array(await file.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    const base64Audio = btoa(bin);

    const models = ["gemini-3.1-flash-lite", "gemini-3.5-flash"];

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]!;
      for (const model of models) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [
                { text: "Transcribe this speech exactly. Output only the spoken words. If there is no speech or only noise, output nothing." },
                { inline_data: { mime_type: "audio/wav", data: base64Audio } },
              ] }],
              generationConfig: { temperature: 0 },
            }),
          });

          if (res.status === 429 || res.status === 403 || res.status === 401) {
            continue;
          }
          if (!res.ok) {
            continue;
          }

          const j = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
          const text = j.candidates?.[0]?.content?.parts?.map((x) => x.text ?? "").join("") ?? "";
          if (text.trim()) {
            return { text: text.trim(), error: "" };
          }
        } catch {
          continue;
        }
      }
    }

    // Return empty without throwing fatal error
    return { text: "", error: "" };
  });
