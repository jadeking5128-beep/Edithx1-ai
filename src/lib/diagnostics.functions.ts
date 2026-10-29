import { createServerFn } from "@tanstack/react-start";
import { getAiDiagnostics, type AiDiagnostics } from "@/lib/ai.server";

export const fetchAiDiagnostics = createServerFn({ method: "POST" })
  .inputValidator((d: { fallbackKeys?: string[] }) => ({
    fallbackKeys: Array.isArray(d?.fallbackKeys)
      ? d.fallbackKeys.filter((k): k is string => typeof k === "string")
      : [],
  }))
  .handler(async ({ data }): Promise<AiDiagnostics> => {
    return getAiDiagnostics(data.fallbackKeys);
  });
