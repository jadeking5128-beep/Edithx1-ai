import { useEffect, useState } from "react";
import { Activity, ShieldCheck, AlertTriangle, RefreshCw, KeyRound, Cpu, X, Zap } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { fetchAiDiagnostics } from "@/lib/diagnostics.functions";
import type { AiDiagnostics, LatencyPoint } from "@/lib/ai.server";

type Props = {
  fallbackKeys?: string[];
  onClose: () => void;
};

// Monotone cubic path builder for smooth curve generation
function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1]!;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export function DiagnosticPanel({ fallbackKeys = [], onClose }: Props) {
  const [data, setData] = useState<AiDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<LatencyPoint | null>(null);

  const getDiagnostics = useServerFn(fetchAiDiagnostics);

  async function loadData() {
    try {
      setRefreshing(true);
      const res = await getDiagnostics({ data: { fallbackKeys } });
      setData(res);
    } catch (err) {
      console.error("Failed to load AI diagnostics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => void loadData(), 8000);
    return () => clearInterval(interval);
  }, []);

  const history = data?.latencyHistory ?? [];
  const width = 520;
  const height = 180;
  const margin = { top: 20, right: 30, bottom: 30, left: 45 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const maxLatency = Math.max(400, ...(history.map((p) => p.latencyMs) ?? [300])) * 1.25;

  const points = history.map((p, i) => {
    const x = margin.left + (i / Math.max(1, history.length - 1)) * innerWidth;
    const y = margin.top + innerHeight - (p.latencyMs / maxLatency) * innerHeight;
    return { x, y, point: p };
  });

  const linePath = buildSmoothPath(points);
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1]!.x} ${margin.top + innerHeight} L ${points[0]!.x} ${margin.top + innerHeight} Z`
      : "";

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="carbon-hud-card relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-sky-400/40 p-6 shadow-2xl bg-black/85"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sky-400/25 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            <div>
              <h2 className="jarvis-title text-base sm:text-lg">DIAGNOSTIC & TELEMETRY PANEL</h2>
              <p className="text-[10px] tracking-wider text-muted-foreground font-mono">
                REAL-TIME LATENCY, GEMINI 2.0 POOL & CONNECTION INTEGRITY
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadData()}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-sky-400/30 bg-sky-950/40 text-xs text-primary hover:bg-sky-900/40 transition disabled:opacity-50 font-mono"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">PING POOL</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close diagnostic panel"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 text-muted-foreground hover:border-primary hover:text-primary transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading && !data ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground font-mono">
            <RefreshCw className="h-6 w-6 animate-spin text-primary mb-2" />
            <span>Analyzing neural link telemetry...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Stat Gauges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="carbon-hud-card rounded-xl p-3 text-left">
                <span className="hud-label text-[9px] block mb-1 text-sky-400 font-mono">LINK INTEGRITY</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      data?.connectionHealth === "optimal"
                        ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.7)]"
                        : data?.connectionHealth === "degraded"
                        ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]"
                        : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]"
                    }`}
                  />
                  <span className="text-xs font-bold text-foreground tracking-wider">
                    {data?.connectionHealth.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="carbon-hud-card rounded-xl p-3 text-left">
                <span className="hud-label text-[9px] block mb-1 text-sky-400 font-mono">OPERATIONAL KEY</span>
                <div className="text-xs font-bold text-primary flex items-center gap-1 font-mono">
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>KEY #{data?.activeKeyIndex} ACTIVE</span>
                </div>
              </div>

              <div className="carbon-hud-card rounded-xl p-3 text-left">
                <span className="hud-label text-[9px] block mb-1 text-sky-400 font-mono">AVG LATENCY</span>
                <div className="text-xs font-bold text-cyan-300 font-mono">
                  {data?.averageLatencyMs} <span className="text-[10px] font-normal text-muted-foreground">ms</span>
                </div>
              </div>

              <div className="carbon-hud-card rounded-xl p-3 text-left">
                <span className="hud-label text-[9px] block mb-1 text-sky-400 font-mono">FAILOVER EVENTS</span>
                <div className="text-xs font-bold text-foreground font-mono">
                  {data?.failoverCount ?? 0} <span className="text-[10px] font-normal text-muted-foreground">cascades</span>
                </div>
              </div>
            </div>

            {/* Response Latency Telemetry Chart */}
            <div className="carbon-hud-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold tracking-wider text-foreground font-mono">
                    RESPONSE LATENCY TELEMETRY (REAL-TIME)
                  </span>
                </div>
                {hoveredPoint ? (
                  <span className="text-[11px] text-primary font-mono bg-sky-950/60 px-2 py-0.5 rounded border border-primary/30">
                    {hoveredPoint.latencyMs}ms • Key #{hoveredPoint.keyIndex}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground font-mono">LATEST: {data?.currentLatencyMs}ms</span>
                )}
              </div>

              <div className="w-full flex justify-center overflow-x-auto">
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  className="w-full max-w-[520px] h-[180px] overflow-visible"
                >
                  <defs>
                    <linearGradient id="latency-gradient-pure" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  {[0.25, 0.5, 0.75, 1].map((pct, i) => {
                    const y = margin.top + innerHeight * (1 - pct);
                    return (
                      <g key={i}>
                        <line
                          x1={margin.left}
                          y1={y}
                          x2={margin.left + innerWidth}
                          y2={y}
                          stroke="rgba(56, 189, 248, 0.12)"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={margin.left - 6}
                          y={y + 3}
                          fill="rgba(148, 163, 184, 0.6)"
                          fontSize="9"
                          fontFamily="monospace"
                          textAnchor="end"
                        >
                          {Math.round(maxLatency * pct)}ms
                        </text>
                      </g>
                    );
                  })}

                  {/* Shaded Area */}
                  {areaPath && <path d={areaPath} fill="url(#latency-gradient-pure)" />}

                  {/* Glowing Telemetry Line */}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#00e5ff"
                      strokeWidth="2.5"
                      style={{ filter: "drop-shadow(0 0 8px rgba(0, 229, 255, 0.75))" }}
                    />
                  )}

                  {/* Data Points */}
                  {points.map((pt, i) => (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r={i === points.length - 1 ? 5 : 3.5}
                      fill={pt.point.success ? "#00e5ff" : "#f43f5e"}
                      stroke="#0f172a"
                      strokeWidth="2"
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setHoveredPoint(pt.point)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}
                </svg>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground border-t border-primary/15 pt-2 font-mono">
                <span>Min: {data?.minLatencyMs}ms</span>
                <span>Average: {data?.averageLatencyMs}ms</span>
                <span>Peak: {data?.maxLatencyMs}ms</span>
              </div>
            </div>

            {/* API Key Pool Breakdown */}
            <div className="carbon-hud-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold tracking-wider text-foreground font-mono">
                    GEMINI FAILOVER KEY POOL ({data?.totalKeys} KEYS)
                  </span>
                </div>
                <span className="liquid-badge text-[10px] font-mono border-sky-400/40">CASCADE READY</span>
              </div>

              <div className="space-y-2">
                {data?.keys.map((k) => {
                  const isCurrent = k.index === data.activeKeyIndex;
                  return (
                    <div
                      key={k.index}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                        isCurrent
                          ? "border-sky-400/70 bg-sky-950/40 shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                          : "border-primary/15 bg-black/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold font-mono ${
                            isCurrent
                              ? "bg-primary text-black"
                              : "bg-slate-800 text-muted-foreground border border-slate-700"
                          }`}
                        >
                          #{k.index}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground flex items-center gap-2 font-mono">
                            <span>{k.label}</span>
                            {isCurrent && (
                              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-primary text-black font-extrabold tracking-wider font-mono">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground">
                            {k.masked} {k.lastUsed ? `• Last used ${k.lastUsed}` : ""}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 font-mono">
                        {k.status === "active" ? (
                          <span className="flex items-center gap-1 text-[11px] text-green-400 font-semibold bg-green-950/40 px-2 py-0.5 rounded-full border border-green-500/30">
                            <ShieldCheck className="h-3 w-3" /> ONLINE
                          </span>
                        ) : k.status === "standby" ? (
                          <span className="text-[11px] text-cyan-300 font-medium bg-cyan-950/30 px-2 py-0.5 rounded-full border border-cyan-500/20">
                            STANDBY
                          </span>
                        ) : k.status === "exhausted" ? (
                          <span className="flex items-center gap-1 text-[11px] text-rose-400 font-semibold bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-500/30">
                            <AlertTriangle className="h-3 w-3" /> EXHAUSTED
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-400 font-medium">UNCONFIGURED</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
