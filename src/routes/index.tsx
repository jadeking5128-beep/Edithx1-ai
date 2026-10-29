import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Mic,
  Square,
  Loader2,
  MessageSquare,
  AudioLines,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sliders,
  Trash2,
  LogOut,
  SendHorizontal,
  Volume2,
  Activity,
  Radio,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useServerFn } from "@tanstack/react-start";
import { askJarvis, type NetworkPayload } from "@/lib/jarvis.functions";
import { TaskPanel } from "@/components/TaskPanel";
import { getNetworkStatus, reportBrowserAction } from "@/lib/styx-network.functions";
import { transcribeAudio } from "@/lib/transcribe.functions";
import { recordWav } from "@/lib/record-wav";
import { streamSpeech, unlockAudio } from "@/lib/stream-speech";
import { audioLevel } from "@/lib/audio-level";
import { SettingsPanel } from "@/components/SettingsPanel";
import { DiagnosticPanel } from "@/components/DiagnosticPanel";
import { DEFAULT_SETTINGS, type StyxSettings } from "@/lib/styx-settings";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import type { Session } from "@supabase/supabase-js";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    try {
      const { isUnlocked } = await import("@/lib/gate.functions");
      const { unlocked } = await isUnlocked();
      if (!unlocked) throw redirect({ to: "/unlock" });
    } catch {
      // If gate check fails or throws, allow graceful access
    }
  },
  head: () => ({
    meta: [
      { title: "EDITH X1 — Even Dead, I'm The Hero" },
      { name: "description", content: "Talk to E.D.I.T.H., your personal AI assistant." },
      { property: "og:title", content: "E.D.I.T.H. AI Assistant" },
      { property: "og:description", content: "Talk to E.D.I.T.H., your personal AI assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Msg = { role: "user" | "assistant"; content: string; network?: NetworkPayload | undefined };

function LiquidCore({
  size = 220,
  active = false,
  reactive = false,
  ambient = false,
}: {
  size?: number;
  active?: boolean;
  reactive?: boolean;
  ambient?: boolean;
}) {
  const r1 = useRef<HTMLDivElement>(null);
  const r2 = useRef<HTMLDivElement>(null);
  const r3 = useRef<HTMLDivElement>(null);
  const orb = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!reactive) return;
    let raf = 0,
      a = 0,
      smooth = 0,
      last = performance.now();

    const loop = (t: number) => {
      const dt = Math.min(64, t - last);
      last = t;
      smooth += (audioLevel.value - smooth) * 0.22;
      const speed = 0.025 + smooth * 1.1 + (active ? 0.09 : 0) + (ambient ? 0.04 : 0);
      a += speed * dt;

      if (r1.current) r1.current.style.transform = `rotate(${a * 0.4}deg)`;
      if (r2.current) r2.current.style.transform = `rotate(${-a * 0.8}deg) scale(${1 + smooth * 0.08 + (ambient ? 0.03 : 0)})`;
      if (r3.current) r3.current.style.transform = `rotate(${a * 1.4}deg) scale(${1 + smooth * 0.12 + (ambient ? 0.05 : 0)})`;
      if (orb.current) {
        orb.current.style.transform = `scale(${1 + smooth * 0.45 + (ambient ? 0.08 : 0)})`;
        orb.current.style.filter = `brightness(${1 + smooth * 0.9 + (ambient ? 0.35 : 0)})`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reactive, active, ambient]);

  return (
    <div
      className={`liquid-core-container ${ambient ? "ambient-active" : ""}`}
      style={{ width: size, height: size }}
    >
      <div className="liquid-core-specular" />
      {/* Outer fluid glass dashed track */}
      <div
        ref={r1}
        className={`absolute inset-0 rounded-full border-2 border-dashed border-sky-400/40 ${
          reactive ? "" : "animate-spin-slow"
        }`}
      />
      {/* Middle cyan iridescent ring */}
      <div
        ref={r2}
        className={`absolute inset-[8%] rounded-full border-[3px] border-transparent border-t-cyan-400 border-r-sky-400/60 glow-ring ${
          reactive ? "" : "animate-spin-rev"
        }`}
      />
      {/* Inner fast counter ring */}
      <div
        ref={r3}
        className={`absolute inset-[18%] rounded-full border-[3px] border-transparent border-l-cyan-300 border-b-cyan-500 glow-ring ${
          reactive ? "" : "animate-spin-mid"
        }`}
      />
      {/* Liquid haze caustics */}
      <div className="core-haze absolute inset-[16%] rounded-full opacity-80" />
      {/* Concentric liquid ripples */}
      <div className="core-ripple" />
      <div className="core-ripple core-ripple-2" />
      {/* Central Liquid Glass Energy Orb */}
      <div className="absolute inset-[35%] flex items-center justify-center">
        <div
          ref={orb}
          className={`h-full w-full rounded-full liquid-orb-glow ${
            reactive ? "" : active ? "animate-pulse-fast" : "animate-pulse-slow"
          }`}
        />
      </div>
    </div>
  );
}

const LOCAL_STORAGE_SETTINGS_KEY = "edith_user_settings_v2";
const LOCAL_STORAGE_CHAT_KEY = "edith_guest_messages_v2";

export function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(true); // Default to guest for immediate visibility
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState("");
  const [messages, setMessagesState] = useState<Msg[]>([]);
  const messagesRef = useRef<Msg[]>([]);
  const busyRef = useRef(false);

  const setMessages = (m: Msg[]) => {
    messagesRef.current = m;
    setMessagesState(m);
    if (isGuest) {
      try {
        localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify(m));
      } catch {
        /* ignore */
      }
    }
  };

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const ask = useServerFn(askJarvis);
  const transcribe = useServerFn(transcribeAudio);
  const recRef = useRef<{ stop: () => Promise<File> } | null>(null);
  const emptyStreak = useRef(0);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [settings, setSettings] = useState<StyxSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const speechAbort = useRef<AbortController | null>(null);
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const [convo, setConvo] = useState(false);
  const convoRef = useRef(false);
  const [phase, setPhase] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [ambientActive, setAmbientActive] = useState(false);
  const ambientContextRef = useRef<{ stop: () => void } | null>(null);

  const fetchNetStatus = useServerFn(getNetworkStatus);
  const reportAction = useServerFn(reportBrowserAction);

  type NetStatus = {
    status: "connecting" | "connected" | "disconnected";
    error?: string | undefined;
    tools: { name: string; description: string }[];
    misconfigured: { name: string; reason: string; setup: string }[];
    unavailable: { name: string; reason: string }[];
  };
  const [net, setNet] = useState<NetStatus>({
    status: "connecting",
    tools: [],
    misconfigured: [],
    unavailable: [],
  });
  const [showNet, setShowNet] = useState(false);

  // Load saved settings from localStorage on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Background 'listen' mode: monitors continuous background activity without explicit commands
  useEffect(() => {
    if (!settings.background_listen || convo || recording || phase !== "idle") {
      if (ambientContextRef.current) {
        ambientContextRef.current.stop();
        ambientContextRef.current = null;
      }
      setAmbientActive(false);
      return;
    }

    let active = true;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let consecutiveAbove = 0;
    let checkTimer: number;

    const startAmbient = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkAudio = () => {
          if (!active) return;
          analyser.getByteTimeDomainData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const v = (dataArray[i]! - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / dataArray.length) * 4;
          const threshold = settings.mic_threshold ?? 0.12;

          if (rms > threshold * 0.7) {
            consecutiveAbove++;
            if (consecutiveAbove >= 2) {
              setAmbientActive(true);
            }
          } else {
            consecutiveAbove = 0;
            setAmbientActive(false);
          }

          checkTimer = window.setTimeout(checkAudio, 250);
        };

        checkAudio();

        ambientContextRef.current = {
          stop: () => {
            active = false;
            clearTimeout(checkTimer);
            stream?.getTracks().forEach((t) => t.stop());
            ctx?.close().catch(() => {});
          },
        };
      } catch {
        // Passive microphone access deferred or not granted
      }
    };

    void startAmbient();

    return () => {
      active = false;
      clearTimeout(checkTimer);
      if (ambientContextRef.current) {
        ambientContextRef.current.stop();
        ambientContextRef.current = null;
      }
      setAmbientActive(false);
    };
  }, [settings.background_listen, settings.mic_threshold, convo, recording, phase]);

  async function listen() {
    if (!convoRef.current) return;
    setVoiceError("");
    try {
      setPhase("listening");
      const rec = await recordWav(() => void finishTurn(), settings.mic_threshold ?? 0.12);
      recRef.current = rec;
    } catch {
      setVoiceError("Microphone access was blocked.");
      stopConvo();
    }
  }

  async function finishTurn() {
    const rec = recRef.current;
    recRef.current = null;
    if (!rec || !convoRef.current) return;
    setPhase("thinking");
    try {
      const file = await rec.stop();
      const fd = new FormData();
      fd.append("file", file);
      const r = await transcribe({ data: fd });
      if (r.error || !r.text?.trim()) {
        if (r.error) setVoiceError(r.error);
        emptyStreak.current += 1;
        if (emptyStreak.current >= 3) {
          setVoiceError("I didn't hear anything, sir. Tap the core to resume.");
          return void stopConvo();
        }
        return void listen();
      }
      emptyStreak.current = 0;
      const reply = await sendText(r.text, false);
      if (reply && convoRef.current) {
        setPhase("speaking");
        await speak(reply);
      }
    } catch (e) {
      setVoiceError(e instanceof Error ? e.message : "Recording failed.");
    }
    if (convoRef.current) void listen();
  }

  function startConvo() {
    unlockAudio();
    convoRef.current = true;
    setConvo(true);
    emptyStreak.current = 0;
    void listen();
  }

  function stopConvo() {
    convoRef.current = false;
    setConvo(false);
    setPhase("idle");
    speechAbort.current?.abort();
    const rec = recRef.current;
    recRef.current = null;
    rec?.stop().catch(() => {});
    audioLevel.value = 0;
  }

  useEffect(() => () => {
    convoRef.current = false;
    speechAbort.current?.abort();
    recRef.current?.stop().catch(() => {});
  }, []);

  async function speak(text: string, voice = settings.voice) {
    speechAbort.current?.abort();
    const ac = new AbortController();
    speechAbort.current = ac;
    text = text.replace(/[*_#`>|]/g, "").replace(/\[(.*?)\]\(.*?\)/g, "$1");

    let token = "guest";
    if (session) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token ?? "guest";
    }

    try {
      const fallbackKeys = (settings.fallback_keys ?? []).filter(Boolean);
      await streamSpeech(
        "/api/speak",
        { text, voice, fallbackKeys },
        { Authorization: `Bearer ${token}` },
        ac.signal,
      );
    } catch (e) {
      if (!ac.signal.aborted) setVoiceError("Couldn't play the voice reply.");
      console.error(e);
    }
  }

  async function toggleMic() {
    unlockAudio();
    setVoiceError("");
    if (!recording) {
      try {
        recRef.current = await recordWav(undefined, settings.mic_threshold ?? 0.12);
        setRecording(true);
      } catch {
        setVoiceError("Microphone access was blocked.");
      }
      return;
    }
    setRecording(false);
    setTranscribing(true);
    try {
      const file = await recRef.current!.stop();
      const fd = new FormData();
      fd.append("file", file);
      const r = await transcribe({ data: fd });
      if (r.error) setVoiceError(r.error);
      else if (r.text) await sendText(r.text);
    } catch (e) {
      setVoiceError(e instanceof Error ? e.message : "Recording failed.");
    } finally {
      setTranscribing(false);
    }
  }

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) setIsGuest(false);
    });
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        if (!data.session) setIsGuest(true);
        setReady(true);
      })
      .catch(() => {
        setIsGuest(true);
        setReady(true);
      });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Poll EDITH NETWORK status
  useEffect(() => {
    if (!session && !isGuest) return;
    let dead = false;
    const check = async () => {
      try {
        const r = await fetchNetStatus();
        if (!dead)
          setNet({
            status: r.status,
            error: r.error,
            tools: r.tools,
            misconfigured: r.misconfigured,
            unavailable: r.unavailable,
          });
      } catch {
        if (!dead) setNet((n) => ({ ...n, status: "disconnected", error: "Status check failed" }));
      }
    };
    void check();
    const t = setInterval(check, 60000);
    return () => {
      dead = true;
      clearInterval(t);
    };
  }, [session, isGuest, fetchNetStatus]);

  async function handleBrowserAction(n: {
    browserAction?: { url: string; target?: string } | undefined;
    reportUrl?: string | undefined;
    actionId?: string | undefined;
  }) {
    const ba = n.browserAction;
    if (!ba?.url || !/^https:\/\//i.test(ba.url)) return;
    const win = window.open(ba.url, "_blank", "noopener,noreferrer");
    const opened = !!win;
    if (n.reportUrl && n.actionId) {
      try {
        await reportAction({
          data: { reportUrl: n.reportUrl, actionId: n.actionId, success: opened },
        });
      } catch {
        /* best-effort */
      }
    }
    const note = opened
      ? `Opened ${new URL(ba.url).hostname} in a new tab.`
      : `Your browser blocked the new tab. Please open manually: ${ba.url}`;
    setMessages([...messagesRef.current, { role: "assistant", content: note }]);
  }

  const uid = session?.user.id;
  useEffect(() => {
    if (isGuest) {
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_CHAT_KEY);
        if (local) setMessages(JSON.parse(local));
      } catch {
        /* ignore */
      }
      return;
    }

    if (!uid) {
      setMessages([]);
      return;
    }
    supabase
      .from("messages")
      .select("role, content, network")
      .order("created_at")
      .then(({ data }) => {
        if (data)
          setMessages(
            data.map((d) => ({
              role: d.role as Msg["role"],
              content: d.content,
              network: (d.network as NetworkPayload | null) ?? undefined,
            })),
          );
      });
    supabase
      .from("user_settings")
      .select("speak_replies, voice, tone, sensitive")
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings((prev) => ({ ...prev, ...data }));
      });
  }, [uid, isGuest]);

  async function saveSettings(next: StyxSettings) {
    setSettings(next);
    try {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    if (uid) {
      const { error } = await supabase.from("user_settings").upsert({
        user_id: uid,
        speak_replies: next.speak_replies,
        voice: next.voice,
        tone: next.tone,
        sensitive: next.sensitive,
        updated_at: new Date().toISOString(),
      });
      if (error) setVoiceError("Couldn't save settings to cloud.");
    }
  }

  async function signIn() {
    setAuthError("");
    try {
      const r = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (r.error) setAuthError("Sign-in failed. Please use Guest Mode below or try again.");
    } catch {
      setAuthError("Sign-in encountered an error. You can use Instant Guest Access.");
    }
  }

  function startGuestMode() {
    setIsGuest(true);
    setReady(true);
  }

  async function clearChat() {
    if (uid) {
      await supabase.from("messages").delete().eq("user_id", uid);
    }
    if (isGuest) {
      try {
        localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY);
      } catch {
        /* ignore */
      }
    }
    setMessages([]);
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    await sendText(input);
  }

  async function sendText(raw: string, autoSpeak = true): Promise<string | undefined> {
    const text = raw.trim();
    if (!text || busyRef.current) return;
    let result: string | undefined;
    busyRef.current = true;
    const next = [...messagesRef.current, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      if (uid) {
        await supabase.from("messages").insert({ role: "user", content: text });
      }

      const fallbackKeys = (settings.fallback_keys ?? []).filter(Boolean);
      const { reply, network } = await ask({
        data: {
          messages: next,
          fallbackKeys,
        },
      });

      const updated = [...messagesRef.current, { role: "assistant" as const, content: reply, network }];
      setMessages(updated);

      if (uid) {
        await supabase.from("messages").insert({
          role: "assistant",
          content: reply,
          network: network ? JSON.parse(JSON.stringify(network)) : null,
        });
      }
      if (network?.browserAction) void handleBrowserAction(network);
      result = reply;
      if (autoSpeak && settings.speak_replies) void speak(reply);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection lost. Please try again.";
      setMessages([
        ...messagesRef.current,
        { role: "assistant", content: `I encountered an issue: ${msg}` },
      ]);
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
    return result;
  }

  const activeFallbackCount = (settings.fallback_keys ?? []).filter((k) => k && k.length > 5).length;
  const totalKeys = 1 + activeFallbackCount;

  if (!ready) {
    return (
      <main className="hud-bg flex min-h-screen items-center justify-center">
        <LiquidCore />
      </main>
    );
  }

  if (!session && !isGuest) {
    return (
      <main className="hud-bg flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="liquid-glass-card max-w-md w-full p-8 rounded-3xl flex flex-col items-center shadow-2xl">
          <div className="animate-float mb-6">
            <LiquidCore size={180} />
          </div>

          <h1 className="jarvis-title text-3xl sm:text-4xl tracking-widest text-primary drop-shadow-[0_0_20px_rgba(56,189,248,0.6)]">
            E.D.I.T.H.
          </h1>
          <p className="mt-2 text-xs tracking-[0.25em] text-cyan-300 font-semibold">
            TACTICAL DEFENSE & INTELLIGENCE SYSTEM
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground/80 max-w-xs">
            Multi-Key Resilient Neural Engine with Liquid Glass Architecture.
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-[11px] text-cyan-300">
            <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
            <span>Automatic Failover: {totalKeys} Key Pool Enabled</span>
          </div>

          <div className="mt-8 flex flex-col gap-3 w-full">
            <button onClick={startGuestMode} className="liquid-glass-btn w-full py-3 text-xs tracking-widest flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" /> ENTER AS GUEST / DEMO
            </button>
            <button
              onClick={signIn}
              className="rounded-xl border border-primary/30 bg-black/40 py-2.5 text-xs tracking-wider text-muted-foreground transition hover:border-primary hover:text-foreground"
            >
              Sign in with Google Account
            </button>
          </div>

          {authError && <p className="mt-4 text-xs text-destructive">{authError}</p>}

          <div className="mt-8 pt-4 border-t border-primary/10 w-full flex items-center justify-between text-[10px] text-muted-foreground/60 tracking-widest">
            <span>STARK INDUSTRIES SEC-9</span>
            <span>EDITH X1 TACTICAL</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="hud-bg flex h-screen flex-col overflow-hidden">
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onChange={saveSettings}
          onClose={() => setShowSettings(false)}
          onPreview={(v) => speak("Good day, sir. All neural fallback subsystems are operational.", v)}
        />
      )}

      {showDiagnostics && (
        <DiagnosticPanel
          fallbackKeys={settings.fallback_keys}
          onClose={() => setShowDiagnostics(false)}
        />
      )}

      {/* Liquid Glass Top Navigation Bar */}
      <header className="liquid-navbar z-20 flex items-center gap-3 px-5 py-3">
        <div className="flex items-center gap-3">
          <LiquidCore size={38} active={loading} ambient={ambientActive && phase === "idle"} />
          <div>
            <div className="jarvis-title text-sm sm:text-base font-bold tracking-widest text-primary drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]">
              E.D.I.T.H.
            </div>
            <div className="flex items-center gap-1.5 text-[10px] tracking-wider text-muted-foreground">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${loading ? "bg-amber-400 animate-pulse" : ambientActive ? "bg-cyan-400 animate-ping" : "bg-emerald-400"}`} />
              {loading ? "PROCESSING..." : ambientActive ? "AMBIENT ACTIVITY" : isGuest ? "GUEST MODE" : "ONLINE"}
            </div>
          </div>
        </div>

        {/* Fallback Keys Health Badge */}
        <div className="hidden md:flex items-center gap-1.5 ml-4">
          <div className="liquid-badge text-[10px]">
            <KeyRound className="h-3 w-3 text-primary" />
            <span>{totalKeys} KEYS ACTIVE</span>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 text-xs tracking-wider">
          {/* Diagnostics Button */}
          <button
            onClick={() => setShowDiagnostics(true)}
            className="liquid-glass-pill flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-primary transition"
            title="Telemetry & Connection Diagnostics"
          >
            <Activity className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span className="hidden sm:inline">DIAGNOSTICS</span>
          </button>

          {/* Network Pill */}
          <button
            onClick={() => setShowNet(!showNet)}
            className="liquid-glass-pill hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-primary transition"
            aria-label="EDITH NETWORK status"
          >
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                net.status === "connected"
                  ? "bg-green-400"
                  : net.status === "connecting"
                  ? "animate-pulse bg-yellow-400"
                  : "bg-red-500"
              }`}
            />
            NET {net.status === "connected" ? "SYNCED" : net.status === "connecting" ? "CONNECTING" : "OFFLINE"}
          </button>

          {/* Liquid Mode Switcher Pill */}
          <div className="liquid-glass-pill flex items-center p-0.5">
            <button
              onClick={() => {
                if (mode === "voice") stopConvo();
                setMode("voice");
              }}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                mode === "voice"
                  ? "bg-primary text-black shadow-[0_0_12px_rgba(56,189,248,0.6)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <AudioLines className="h-3 w-3" /> VOICE
            </button>
            <button
              onClick={() => {
                if (mode === "voice") stopConvo();
                setMode("text");
              }}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                mode === "text"
                  ? "bg-primary text-black shadow-[0_0_12px_rgba(56,189,248,0.6)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-3 w-3" /> TEXT
            </button>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="liquid-glass-pill flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-primary transition"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">SETTINGS</span>
          </button>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              title="Clear transcript"
              className="liquid-glass-pill flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-destructive transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Sign Out / Exit Guest */}
          <button
            onClick={() => {
              if (session) supabase.auth.signOut();
              setIsGuest(false);
            }}
            title="Sign out / Exit"
            className="liquid-glass-pill flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-primary transition"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Network Diagnostics Dropdown */}
      {showNet && (
        <div className="liquid-glass border-b border-primary/20 px-5 py-3 text-xs backdrop-blur-2xl z-10 animate-fade-in">
          <div className="mx-auto flex max-w-3xl flex-col gap-2">
            <div className="tracking-widest text-primary flex items-center justify-between">
              <span>EDITH NETWORK PROTOCOL — {net.status.toUpperCase()}</span>
              <span className="text-[10px] text-muted-foreground">{net.tools.length} TOOLS MOUNTED</span>
            </div>
            {net.tools.length > 0 && (
              <div className="text-muted-foreground text-[11px]">
                Available tools: {net.tools.map((t) => t.name).join(", ")}
              </div>
            )}
            {net.misconfigured.map((t) => (
              <div key={t.name} className="text-yellow-400 text-[11px]">
                ⚠ {t.name}: {t.reason} {t.setup}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIN VIEWPORT: VOICE OR TEXT */}
      {mode === "voice" ? (
        <section className="flex flex-1 flex-col items-center justify-between overflow-hidden px-6 py-6 text-center relative">
          {/* Top HUD Telemetry cards */}
          <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div
              onClick={() => setShowDiagnostics(true)}
              className="liquid-glass-card rounded-2xl p-3 text-left cursor-pointer hover:border-primary/60 transition"
            >
              <span className="hud-label text-[9px] block mb-1">NEURAL FAILOVER POOL</span>
              <div className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
                <span>{totalKeys} KEYS STANDBY</span>
              </div>
            </div>

            <div className="liquid-glass-card rounded-2xl p-3 text-left">
              <span className="hud-label text-[9px] block mb-1">CORE STATUS</span>
              <div className="text-xs font-semibold text-primary">
                {phase === "listening"
                  ? "TRANSCRIBING AUDIO"
                  : phase === "thinking"
                  ? "GENERATING TACTICAL RESPONSE"
                  : phase === "speaking"
                  ? "SYNTHESIZING SPEECH"
                  : ambientActive
                  ? "AMBIENT MONITOR ACTIVE"
                  : "READY FOR VOCAL PROMPT"}
              </div>
            </div>

            <div className="liquid-glass-card rounded-2xl p-3 text-left hidden sm:block">
              <span className="hud-label text-[9px] block mb-1">VOICE THRESHOLD</span>
              <div className="text-xs font-semibold text-cyan-300 flex items-center justify-between">
                <span>{Math.round((settings.mic_threshold ?? 0.12) * 100)}% GATE</span>
                <span className="text-[10px] text-muted-foreground font-normal">{settings.voice}</span>
              </div>
            </div>
          </div>

          {/* Central Reactor Core Interactive Orb */}
          <div className="my-auto flex flex-col items-center justify-center gap-6">
            <button
              onClick={convo ? stopConvo : startConvo}
              aria-label={convo ? "End conversation" : "Start talking"}
              className="rounded-full transition-transform hover:scale-105 active:scale-95 focus:outline-none"
            >
              <LiquidCore
                size={260}
                reactive
                active={phase === "thinking" || phase === "speaking"}
                ambient={ambientActive && phase === "idle"}
              />
            </button>

            {ambientActive && phase === "idle" && (
              <div className="ambient-pulse-badge flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-400/40 bg-sky-400/10 text-[10px] text-cyan-300 font-mono tracking-widest">
                <Radio className="h-3 w-3 text-cyan-400 animate-pulse" />
                <span>AMBIENT MONITOR: BACKGROUND ACTIVITY DETECTED</span>
              </div>
            )}

            <div className="liquid-glass-pill px-6 py-2 text-xs tracking-[0.3em] font-semibold text-primary shadow-[0_0_20px_rgba(56,189,248,0.3)]">
              {phase === "listening"
                ? "● LISTENING TO USER..."
                : phase === "thinking"
                ? "◆ PROCESSING COMMAND..."
                : phase === "speaking"
                ? "▲ VOCALIZING REPLY..."
                : "TAP THE CORE TO ACTIVATE"}
            </div>

            {messages.length > 0 && (
              <div className="liquid-glass-card max-w-lg rounded-2xl px-5 py-3 text-xs leading-relaxed text-muted-foreground border-primary/20 backdrop-blur-xl">
                <span className="text-[10px] tracking-widest text-primary block mb-1">LAST TRANSMISSION</span>
                <p className="line-clamp-3">
                  {messages[messages.length - 1]!.content.replace(/[*_#`]/g, "")}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3">
              {phase === "listening" && (
                <button
                  onClick={() => void finishTurn()}
                  className="liquid-glass-btn px-4 py-2 text-xs"
                >
                  TRANSCRIBE NOW
                </button>
              )}
              {convo && (
                <button
                  onClick={stopConvo}
                  className="liquid-glass-btn border-rose-500/50 text-rose-400 hover:bg-rose-500/20 px-4 py-2 text-xs flex items-center gap-1.5"
                  aria-label="End conversation"
                >
                  <Square className="h-3.5 w-3.5 fill-current" /> STOP
                </button>
              )}
            </div>

            {voiceError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive">
                <ShieldAlert className="h-4 w-4" /> {voiceError}
              </div>
            )}
          </div>

          <div className="text-[10px] tracking-[0.25em] text-muted-foreground/60 pb-2">
            STARK INDUSTRIES • E.D.I.T.H. X1 TACTICAL INTERFACE
          </div>
        </section>
      ) : (
        /* TEXT / TRANSCRIPT VIEW */
        <>
          <section className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {messages.length === 0 && (
                <div className="animate-fade-in mt-12 flex flex-col items-center text-center">
                  <div className="animate-float mb-4">
                    <LiquidCore size={140} ambient={ambientActive} />
                  </div>
                  <h3 className="text-base font-semibold tracking-wider text-primary">
                    E.D.I.T.H. STANDBY
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground max-w-sm">
                    Good day, sir. All neural subsystems and {totalKeys} API keys are online. How may I assist you today?
                  </p>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] p-4 transition-all ${
                    m.role === "user" ? "liquid-msg-user self-end" : "liquid-msg-ai self-start"
                  }`}
                >
                  <div className="mb-1 text-[10px] font-semibold tracking-widest text-primary/80">
                    {m.role === "user" ? "YOU" : "E.D.I.T.H."}
                  </div>
                  {m.role === "assistant" ? (
                    <div className="md text-sm leading-relaxed text-foreground/95">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                      {m.content}
                    </p>
                  )}
                  {m.role === "assistant" && m.network && <TaskPanel network={m.network} />}
                  {m.role === "assistant" && (
                    <button
                      onClick={() => speak(m.content)}
                      className="mt-2 flex items-center gap-1 text-[10px] tracking-widest text-muted-foreground hover:text-primary transition"
                    >
                      <Volume2 className="h-3 w-3" /> PLAY VOICE REPLY
                    </button>
                  )}
                </div>
              ))}

              {loading && (
                <div className="liquid-msg-ai self-start p-4">
                  <span className="typing">
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </section>

          {/* Floating Liquid Glass Input Bar */}
          <form onSubmit={send} className="liquid-glass border-t border-primary/20 p-4 z-10">
            <div className="mx-auto flex max-w-3xl items-center gap-2">
              <button
                type="button"
                onClick={toggleMic}
                disabled={loading || transcribing}
                aria-label={recording ? "Stop recording" : "Speak"}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all ${
                  recording
                    ? "border-rose-500 bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse"
                    : "border-primary/40 bg-primary/10 text-primary hover:border-primary hover:bg-primary/20"
                }`}
              >
                {transcribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : recording ? (
                  <Square className="h-4 w-4 fill-current" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={recording ? "Listening to your voice, sir..." : "Type a tactical query or command..."}
                className="liquid-glass-input min-w-0 flex-1 px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />

              <button
                disabled={loading || !input.trim()}
                className="liquid-glass-btn flex h-10 items-center justify-center gap-1.5 px-4 text-xs disabled:opacity-40"
              >
                <span>SEND</span>
                <SendHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>
            {voiceError && (
              <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-destructive">
                {voiceError}
              </p>
            )}
          </form>
        </>
      )}
    </main>
  );
}

export default Index;
