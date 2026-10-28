import { useState } from "react";
import { SENSITIVE, TONES, VOICES, type StyxSettings } from "@/lib/styx-settings";
import { KeyRound, ShieldCheck, Sparkles, Check, Volume2, Sliders } from "lucide-react";

type Props = {
  settings: StyxSettings;
  onChange: (s: StyxSettings) => void;
  onClose: () => void;
  onPreview: (voice: string) => void;
};

function Options({ items, value, onPick }: { items: [string, string][]; value: string; onPick: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onPick(id)}
          className={`liquid-glass-card rounded-lg px-3 py-2 text-left text-xs tracking-wider transition-all ${
            value === id
              ? "border-primary/80 bg-primary/15 text-primary shadow-[0_0_15px_rgba(56,189,248,0.3)] font-semibold"
              : "text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function SettingsPanel({ settings, onChange, onClose, onPreview }: Props) {
  const [savedNote, setSavedNote] = useState(false);
  const fallbackKeys = settings.fallback_keys ?? ["", "", ""];

  const set = (patch: Partial<StyxSettings>) => {
    onChange({ ...settings, ...patch });
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2000);
  };

  const updateFallbackKey = (index: number, val: string) => {
    const next = [...fallbackKeys];
    next[index] = val.trim();
    set({ fallback_keys: next });
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-md" onClick={onClose}>
      <aside
        className="liquid-glass h-full w-full max-w-md overflow-y-auto border-l border-primary/30 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between border-b border-primary/20 pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            <h2 className="jarvis-title text-base sm:text-lg">SYSTEM PARAMETERS</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            ✕
          </button>
        </div>

        {savedNote && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary shadow-[0_0_12px_rgba(56,189,248,0.2)]">
            <Check className="h-4 w-4" /> Parameters synchronized.
          </div>
        )}

        {/* Gemini API Keys & Automatic Fallback */}
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <h3 className="hud-label mb-0 text-foreground">Gemini API Keys Pool</h3>
            </div>
            <span className="liquid-badge text-[10px]">AUTO-FAILOVER</span>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
            Configure up to 3 fallback API keys. When primary credits or rate limits are reached, E.D.I.T.H. automatically cascades to the next available key without disruption.
          </p>

          <div className="space-y-3">
            <div className="liquid-glass-card rounded-xl p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-primary">PRIMARY KEY</span>
                <span className="flex items-center gap-1 text-[10px] text-green-400">
                  <ShieldCheck className="h-3 w-3" /> System Provided / Env
                </span>
              </div>
              <input
                type="password"
                disabled
                value="••••••••••••••••••••••••••••••••"
                className="w-full bg-transparent text-xs text-muted-foreground outline-none"
              />
            </div>

            {[0, 1, 2].map((idx) => {
              const keyVal = fallbackKeys[idx] ?? "";
              const hasKey = keyVal.length > 5;
              return (
                <div key={idx} className="liquid-glass-card rounded-xl p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-medium tracking-wider text-muted-foreground">
                      FALLBACK KEY #{idx + 1}
                    </span>
                    <span className={`text-[10px] font-semibold ${hasKey ? "text-green-400" : "text-muted-foreground/60"}`}>
                      {hasKey ? "READY / STANDBY" : "OPTIONAL"}
                    </span>
                  </div>
                  <input
                    type="password"
                    placeholder={`Paste Gemini API Key #${idx + 1} (AIzaSy...)`}
                    value={keyVal}
                    onChange={(e) => updateFallbackKey(idx, e.target.value)}
                    className="w-full rounded-md border border-primary/20 bg-black/30 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none"
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* Voice Selection */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-primary" />
            <h3 className="hud-label mb-0 text-foreground">Vocal Synthesis</h3>
          </div>

          <label className="liquid-glass-card mb-3 flex cursor-pointer items-center justify-between rounded-xl p-3 text-xs tracking-wider">
            <span>Read AI replies aloud automatically</span>
            <input
              type="checkbox"
              checked={settings.speak_replies}
              onChange={(e) => set({ speak_replies: e.target.checked })}
              className="h-4 w-4 accent-primary"
            />
          </label>

          <div className="liquid-glass-card rounded-xl p-3">
            <label className="hud-label block mb-2 text-[10px]">Active Synthetic Voice</label>
            <select
              value={settings.voice}
              onChange={(e) => set({ voice: e.target.value })}
              className="w-full rounded-md border border-primary/25 bg-black/40 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id} className="bg-slate-900 text-foreground">
                  {v.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onPreview(settings.voice)}
              className="liquid-glass-btn mt-3 flex w-full items-center justify-center gap-1.5 py-2 text-[11px]"
            >
              <Sparkles className="h-3 w-3" /> PREVIEW VOCAL PROFILE
            </button>
          </div>
        </section>

        {/* Tone */}
        <section className="mb-8">
          <h3 className="hud-label text-foreground">Behavioral Personality</h3>
          <Options
            items={Object.entries(TONES).map(([k, v]) => [k, v.label])}
            value={settings.tone}
            onPick={(tone) => set({ tone })}
          />
        </section>

        {/* Sensitive Topics */}
        <section className="mb-6">
          <h3 className="hud-label text-foreground">Security Protocol</h3>
          <Options
            items={Object.entries(SENSITIVE).map(([k, v]) => [k, v.label])}
            value={settings.sensitive}
            onPick={(sensitive) => set({ sensitive })}
          />
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {SENSITIVE[settings.sensitive]?.prompt}
          </p>
        </section>
      </aside>
    </div>
  );
}
