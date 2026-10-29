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
  Zap,
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
import { ArcReactorCore } from "@/components/ArcReactorCore";
import { EdithLogo } from "@/components/EdithLogo";
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
      // Graceful fallback for open access
    }
  },
  head: () => ({
    meta: [
      { title: "EDITH X1 — Tactical Defense & Intelligence" },
      { name: "description", content: "Augmented-Reality Tactical Assistant // E.D.I.T.H. X1" },
      { property: "og:title", content: "E.D.I.T.H. Tactical AI" },
      { property: "og:description", content: "Augmented-Reality Tactical Assistant // E.D.I.T.H. X1" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Msg = { role: "user" | "assistant"; content: string; network?: NetworkPayload | undefined };

const LOCAL_STORAGE_SETTINGS_KEY = "edith_user_settings_v2";
const LOCAL_STORAGE_CHAT_KEY = "edith_guest_messages_v2";

export function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(true);
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
        // Microphone access deferred or blocked
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
          setVoiceError("I didn't hear anything, sir. Tap the Arc Reactor to resume.");
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
      setVoiceError(e instanceof Error ? e.message : "Voice processing error.");
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
    } catch {
      // High-fidelity client-side voice fallback when satellite audio beam is offline
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.05;
        u.pitch = 0.95;

        // Try to pick a natural English voice if available
        const voices = window.speechSynthesis.getVoices();
        const engVoice = voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Siri") || v.name.includes("Daniel")));
        if (engVoice) u.voice = engVoice;

        let pulseTimer = 0;
        u.onstart = () => {
          setPhase("speaking");
          pulseTimer = window.setInterval(() => {
            audioLevel.value = 0.45 + Math.random() * 0.45;
            audioLevel.source = "ai";
          }, 80);
        };

        u.onend = u.onerror = () => {
          clearInterval(pulseTimer);
          audioLevel.value = 0;
          audioLevel.source = "idle";
          if (convoRef.current) {
            setPhase("listening");
            void listen();
          } else {
            setPhase("idle");
          }
        };

        window.speechSynthesis.speak(u);
      } else {
        if (!ac.signal.aborted) setVoiceError("Audio synthesis error.");
      }
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
        if (!dead) setNet((n) => ({ ...n, status: "disconnected", error: "Network check failed" }));
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
        { role: "assistant", content: `Tactical directive issue: ${msg}` },
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
      <main className="stealth-carbon-bg flex min-h-screen items-center justify-center">
        <EdithLogo size={140} glow audioPulse={0.5} />
      </main>
    );
  }

  if (!session && !isGuest) {
    return (
      <main className="stealth-carbon-bg flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="ios-liquid-card max-w-md w-full p-8 flex flex-col items-center shadow-2xl">
          <div className="mb-6">
            <EdithLogo size={140} glow audioPulse={0.3} />
          </div>

          <h1 className="jarvis-title text-3xl sm:text-4xl tracking-widest text-primary drop-shadow-[0_0_20px_rgba(0,229,255,0.7)]">
            E.D.I.T.H. X1
          </h1>
          <p className="mt-2 text-xs tracking-[0.25em] text-cyan-300 font-semibold font-mono">
            STARK SEC-9 // IOS 27 LIQUID GLASS HUD
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground/80 max-w-xs font-mono">
            Gemini 3.5 Flash neural engine with 4-key automated failover cascade.
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-950/40 px-3 py-1 text-[11px] text-cyan-300 font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
            <span>Cascade Pool: {totalKeys} Keys Armed</span>
          </div>

          <div className="mt-8 flex flex-col gap-3 w-full">
            <button onClick={startGuestMode} className="ios-liquid-btn w-full py-3.5 text-xs tracking-widest flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" /> INITIALIZE TACTICAL INTERFACE
            </button>
            <button
              onClick={signIn}
              className="ios-liquid-pill py-2.5 text-xs tracking-wider text-muted-foreground hover:text-foreground font-mono"
            >
              Authenticate via Google Cloud
            </button>
          </div>

          {authError && <p className="mt-4 text-xs text-destructive font-mono">{authError}</p>}

          <div className="mt-8 pt-4 border-t border-primary/20 w-full flex items-center justify-between text-[10px] text-muted-foreground/60 tracking-widest font-mono">
            <span>STARK INDUSTRIES SEC-9</span>
            <span>EDITH X1 TACTICAL</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="stealth-carbon-bg flex h-screen flex-col overflow-hidden">
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

      {/* Top iOS 27 Liquid Glass Nav Dock */}
      <header className="ios-liquid-dock z-20 flex items-center gap-3 px-5 py-3">
        <div className="flex items-center gap-3">
          <EdithLogo size={38} audioPulse={loading ? 0.9 : ambientActive ? 0.6 : 0.15} />
          <div>
            <div className="jarvis-title text-sm sm:text-base font-bold tracking-widest text-primary drop-shadow-[0_0_12px_rgba(0,229,255,0.7)] flex items-center gap-2">
              <span>E.D.I.T.H. X1</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border border-sky-400/40 bg-sky-950/40 text-cyan-300">
                GEMINI 3.5
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] tracking-wider text-muted-foreground font-mono">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  loading
                    ? "bg-amber-400 animate-pulse"
                    : ambientActive
                    ? "bg-cyan-400 animate-ping"
                    : "bg-emerald-400"
                }`}
              />
              {loading
                ? "PROCESSING DIRECTIVE..."
                : ambientActive
                ? "AMBIENT ROOM SENSE"
                : isGuest
                ? "STANDALONE HUD"
                : "STARK SEC-9 ONLINE"}
            </div>
          </div>
        </div>

        {/* Fallback Keys Health Badge */}
        <div className="hidden md:flex items-center gap-1.5 ml-4">
          <div className="ios-liquid-pill px-3 py-1 text-[10px] font-mono flex items-center gap-1.5">
            <KeyRound className="h-3 w-3 text-primary" />
            <span>{totalKeys} KEYS CASCADE READY</span>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 text-xs tracking-wider">
          {/* Diagnostics Button */}
          <button
            onClick={() => setShowDiagnostics(true)}
            className="ios-liquid-pill flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] text-muted-foreground hover:text-primary transition font-mono"
            title="Telemetry & Connection Diagnostics"
          >
            <Activity className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span className="hidden sm:inline">TELEMETRY</span>
          </button>

          {/* Network Pill */}
          <button
            onClick={() => setShowNet(!showNet)}
            className="ios-liquid-pill hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] text-muted-foreground hover:text-primary transition font-mono"
            aria-label="EDITH NETWORK status"
          >
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                net.status === "connected"
                  ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"
                  : net.status === "connecting"
                  ? "animate-pulse bg-yellow-400"
                  : "bg-red-500"
              }`}
            />
            NET {net.status === "connected" ? "SYNCED" : net.status === "connecting" ? "LINKING" : "OFFLINE"}
          </button>

          {/* Tactical Mode Switcher Pill */}
          <div className="ios-liquid-pill flex items-center p-0.5">
            <button
              onClick={() => {
                if (mode === "voice") stopConvo();
                setMode("voice");
              }}
              className={`flex items-center gap-1 px-3.5 py-1 rounded-full text-[11px] font-semibold transition-all font-mono ${
                mode === "voice"
                  ? "bg-primary text-black shadow-[0_0_15px_rgba(0,229,255,0.8)]"
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
              className={`flex items-center gap-1 px-3.5 py-1 rounded-full text-[11px] font-semibold transition-all font-mono ${
                mode === "text"
                  ? "bg-primary text-black shadow-[0_0_15px_rgba(0,229,255,0.8)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-3 w-3" /> TEXT
            </button>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="ios-liquid-pill flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] text-muted-foreground hover:text-primary transition font-mono"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">SETTINGS</span>
          </button>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              title="Clear transcript"
              className="ios-liquid-pill flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-destructive transition"
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
            className="ios-liquid-pill flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-primary transition"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Network Diagnostics Dropdown */}
      {showNet && (
        <div className="ios-liquid-card mx-4 my-2 px-5 py-3 text-xs backdrop-blur-2xl z-10 animate-fade-in font-mono">
          <div className="mx-auto flex max-w-3xl flex-col gap-2">
            <div className="tracking-widest text-primary flex items-center justify-between">
              <span>EDITH NETWORK PROTOCOL — {net.status.toUpperCase()}</span>
              <span className="text-[10px] text-muted-foreground">{net.tools.length} MODULES ARMED</span>
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
          {/* Top iOS Liquid Glass Telemetry Cards */}
          <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div
              onClick={() => setShowDiagnostics(true)}
              className="ios-liquid-card p-3.5 text-left cursor-pointer hover:border-primary/60 transition"
            >
              <span className="hud-label text-[9px] block mb-1 text-sky-400 font-mono">
                NEURAL POOL // CASCADE
              </span>
              <div className="text-xs font-semibold text-primary flex items-center gap-1.5 font-mono">
                <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
                <span>{totalKeys} KEYS STANDBY</span>
              </div>
            </div>

            <div className="ios-liquid-card p-3.5 text-left">
              <span className="hud-label text-[9px] block mb-1 text-sky-400 font-mono">
                ARC REACTOR STATUS
              </span>
              <div className="text-xs font-semibold text-cyan-300 font-mono">
                {phase === "listening"
                  ? "INGESTING ACOUSTIC TELEMETRY"
                  : phase === "thinking"
                  ? "COMPUTING NEURAL RESPONSE..."
                  : phase === "speaking"
                  ? "SYNTHESIZING AUDIO BEAM"
                  : ambientActive
                  ? "PASSIVE SENSOR PULSE"
                  : "STANDBY // READY FOR DIRECTIVE"}
              </div>
            </div>

            <div className="ios-liquid-card p-3.5 text-left hidden sm:block">
              <span className="hud-label text-[9px] block mb-1 text-sky-400 font-mono">
                MIC GATE SENSITIVITY
              </span>
              <div className="text-xs font-semibold text-primary flex items-center justify-between font-mono">
                <span>{Math.round((settings.mic_threshold ?? 0.12) * 100)}% THRESHOLD</span>
                <span className="text-[10px] text-muted-foreground font-normal">{settings.voice}</span>
              </div>
            </div>
          </div>

          {/* Central Holographic Arc Reactor Assembly with Embedded Logo */}
          <div className="my-auto flex flex-col items-center justify-center gap-6">
            <ArcReactorCore
              size={300}
              reactive
              active={phase === "thinking" || phase === "speaking"}
              ambient={ambientActive && phase === "idle"}
              state={phase}
              onClick={convo ? stopConvo : startConvo}
            />

            {ambientActive && phase === "idle" && (
              <div className="ios-liquid-pill flex items-center gap-1.5 px-4 py-1 text-[10px] text-cyan-300 font-mono tracking-widest shadow-[0_0_20px_rgba(0,229,255,0.4)]">
                <Radio className="h-3 w-3 text-cyan-400 animate-pulse" />
                <span>AMBIENT SONAR: ROOM ACTIVITY DETECTED</span>
              </div>
            )}

            <div className="ios-liquid-pill px-6 py-2.5 text-xs tracking-[0.3em] font-semibold text-primary shadow-[0_0_25px_rgba(0,229,255,0.45)] font-mono">
              {phase === "listening"
                ? "● INGESTING COMMAND... SPEAK FREELY"
                : phase === "thinking"
                ? "◆ GEMINI 3.5 FLASH COMPUTING..."
                : phase === "speaking"
                ? "▲ VOCAL TRANSMISSION IN PROGRESS"
                : "TAP THE ARC REACTOR TO ACTIVATE"}
            </div>

            {messages.length > 0 && (
              <div className="ios-liquid-card max-w-lg px-5 py-3.5 text-xs leading-relaxed text-muted-foreground">
                <span className="text-[10px] tracking-widest text-primary block mb-1 font-mono font-bold">
                  LAST TACTICAL TRANSMISSION
                </span>
                <p className="line-clamp-3 font-mono text-foreground/90">
                  {messages[messages.length - 1]!.content.replace(/[*_#`]/g, "")}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3">
              {phase === "listening" && (
                <button
                  onClick={() => void finishTurn()}
                  className="ios-liquid-btn px-5 py-2.5 text-xs font-mono"
                >
                  TRANSCRIBE DIRECTIVE
                </button>
              )}
              {convo && (
                <button
                  onClick={stopConvo}
                  className="ios-liquid-btn border-rose-500/50 text-rose-400 hover:bg-rose-500/20 px-5 py-2.5 text-xs flex items-center gap-1.5 font-mono"
                  aria-label="End conversation"
                >
                  <Square className="h-3.5 w-3.5 fill-current" /> DISENGAGE
                </button>
              )}
            </div>

            {voiceError && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/15 px-4 py-2 text-xs text-destructive font-mono">
                <ShieldAlert className="h-4 w-4" /> {voiceError}
              </div>
            )}
          </div>

          <div className="text-[10px] tracking-[0.25em] text-muted-foreground/60 pb-2 font-mono">
            STARK INDUSTRIES SEC-9 // E.D.I.T.H. X1 TACTICAL CONSOLE
          </div>
        </section>
      ) : (
        /* TEXT / TRANSCRIPT VIEW */
        <>
          <section className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {messages.length === 0 && (
                <div className="animate-fade-in mt-12 flex flex-col items-center text-center">
                  <div className="mb-4">
                    <EdithLogo size={150} glow audioPulse={0.3} />
                  </div>
                  <h3 className="text-base font-semibold tracking-wider text-primary font-mono">
                    E.D.I.T.H. X1 // TACTICAL STANDBY
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground max-w-sm font-mono leading-relaxed">
                    Good day, sir. Gemini 3.5 Flash neural subsystems and {totalKeys} API keys are online. How may I assist you today?
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
                  <div className="mb-1 text-[10px] font-semibold tracking-widest text-primary/80 font-mono">
                    {m.role === "user" ? "COMMANDER (YOU)" : "E.D.I.T.H. X1"}
                  </div>
                  {m.role === "assistant" ? (
                    <div className="md text-sm leading-relaxed text-foreground/95">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground font-mono">
                      {m.content}
                    </p>
                  )}
                  {m.role === "assistant" && m.network && <TaskPanel network={m.network} />}
                  {m.role === "assistant" && (
                    <button
                      onClick={() => speak(m.content)}
                      className="mt-2 flex items-center gap-1 text-[10px] tracking-widest text-muted-foreground hover:text-primary transition font-mono"
                    >
                      <Volume2 className="h-3 w-3" /> TRANSMIT AUDIO
                    </button>
                  )}
                </div>
              ))}

              {loading && (
                <div className="liquid-msg-ai self-start p-4">
                  <div className="flex items-center gap-2 text-xs text-cyan-300 font-mono">
                    <Zap className="h-3.5 w-3.5 animate-bounce" />
                    <span>Gemini 3.5 Flash synthesizing response...</span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </section>

          {/* Floating iOS Liquid Glass Input Dock */}
          <form onSubmit={send} className="ios-liquid-dock p-4 z-10">
            <div className="mx-auto flex max-w-3xl items-center gap-2">
              <button
                type="button"
                onClick={toggleMic}
                disabled={loading || transcribing}
                aria-label={recording ? "Stop recording" : "Speak"}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all ${
                  recording
                    ? "border-rose-500 bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.8)] animate-pulse"
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
                placeholder={recording ? "Acoustic ingestion active... speak directive" : "Transmit tactical directive to E.D.I.T.H..."}
                className="ios-liquid-input min-w-0 flex-1 px-5 py-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none font-mono"
              />

              <button
                disabled={loading || !input.trim()}
                className="ios-liquid-btn flex h-11 items-center justify-center gap-1.5 px-5 text-xs disabled:opacity-40 font-mono"
              >
                <span>TRANSMIT</span>
                <SendHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>
            {voiceError && (
              <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-destructive font-mono">
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
