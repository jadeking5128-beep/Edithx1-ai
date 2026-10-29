import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Activity, ShieldCheck, AlertTriangle, RefreshCw, KeyRound, Cpu, X, Zap } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { fetchAiDiagnostics } from "@/lib/diagnostics.functions";
import type { AiDiagnostics, LatencyPoint } from "@/lib/ai.server";

type Props = {
  fallbackKeys?: string[];
  onClose: () => void;
};

export function DiagnosticPanel({ fallbackKeys = [], onClose }: Props) {
  const [data, setData] = useState<AiDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<LatencyPoint | null>(null);

  const getDiagnostics = useServerFn(fetchAiDiagnostics);
  const chartRef = useRef<SVGSVGElement | null>(null);

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

  // Render D3 chart whenever data updates
  useEffect(() => {
    if (!data || !chartRef.current || data.latencyHistory.length === 0) return;

    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();

    const width = 520;
    const height = 180;
    const margin = { top: 20, right: 30, bottom: 30, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const history = data.latencyHistory;

    // Define X & Y scales
    const xScale = d3
      .scaleLinear()
      .domain([0, Math.max(1, history.length - 1)])
      .range([0, innerWidth]);

    const yMax = Math.max(500, (d3.max(history, (d) => d.latencyMs) ?? 300) * 1.25);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([innerHeight, 0]);

    // Create defs for cyan gradient fill and glow filter
    const defs = svg.append("defs");

    const gradient = defs
      .append("linearGradient")
      .attr("id", "latency-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#38bdf8")
      .attr("stop-opacity", 0.45);

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#0284c7")
      .attr("stop-opacity", 0.0);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Grid lines
    const yGrid = d3.axisLeft(yScale).ticks(4).tickSize(-innerWidth).tickFormat(() => "");
    g.append("g")
      .attr("class", "grid")
      .call(yGrid)
      .selectAll("line")
      .attr("stroke", "rgba(56, 189, 248, 0.12)")
      .attr("stroke-dasharray", "3,3");
    g.select(".grid .domain").remove();

    // Area generator
    const areaGenerator = d3
      .area<LatencyPoint>()
      .x((_, i) => xScale(i))
      .y0(innerHeight)
      .y1((d) => yScale(d.latencyMs))
      .curve(d3.curveMonotoneX);

    // Draw Area
    g.append("path")
      .datum(history)
      .attr("fill", "url(#latency-gradient)")
      .attr("d", areaGenerator);

    // Line generator
    const lineGenerator = d3
      .line<LatencyPoint>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d.latencyMs))
      .curve(d3.curveMonotoneX);

    // Draw Line
    g.append("path")
      .datum(history)
      .attr("fill", "none")
      .attr("stroke", "#38bdf8")
      .attr("stroke-width", 2.5)
      .attr("d", lineGenerator)
      .style("filter", "drop-shadow(0 0 8px rgba(56,189,248,0.7))");

    // Draw circles for data points
    g.selectAll(".dot")
      .data(history)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (_, i) => xScale(i))
      .attr("cy", (d) => yScale(d.latencyMs))
      .attr("r", (d, i) => (i === history.length - 1 ? 5 : 3.5))
      .attr("fill", (d) => (d.success ? "#38bdf8" : "#f43f5e"))
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseenter", (_, d) => setHoveredPoint(d))
      .on("mouseleave", () => setHoveredPoint(null));

    // X Axis
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat((d) => `T-${history.length - 1 - Number(d)}`);
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("fill", "rgba(148, 163, 184, 0.7)")
      .attr("font-size", "10px");
    g.select(".domain").attr("stroke", "rgba(56, 189, 248, 0.2)");

    // Y Axis (ms)
    const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat((d) => `${d}ms`);
    g.append("g")
      .call(yAxis)
      .selectAll("text")
      .attr("fill", "rgba(148, 163, 184, 0.7)")
      .attr("font-size", "10px");
  }, [data]);

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="liquid-glass relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-primary/30 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-primary/20 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            <div>
              <h2 className="jarvis-title text-base sm:text-lg">DIAGNOSTIC & TELEMETRY PANEL</h2>
              <p className="text-[10px] tracking-wider text-muted-foreground">
                REAL-TIME LATENCY, POOL STATUS & CONNECTION INTEGRITY
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadData()}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/25 bg-primary/10 text-xs text-primary hover:bg-primary/20 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">PING</span>
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
          <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin text-primary mb-2" />
            <span>Analyzing neural link telemetry...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Stat Gauges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="liquid-glass-card rounded-2xl p-3 text-left">
                <span className="hud-label text-[9px] block mb-1">HEALTH STATE</span>
                <div className="flex items-center gap-1.5">
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

              <div className="liquid-glass-card rounded-2xl p-3 text-left">
                <span className="hud-label text-[9px] block mb-1">ACTIVE KEY</span>
                <div className="text-xs font-bold text-primary flex items-center gap-1">
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>KEY #{data?.activeKeyIndex} OPERATING</span>
                </div>
              </div>

              <div className="liquid-glass-card rounded-2xl p-3 text-left">
                <span className="hud-label text-[9px] block mb-1">AVG LATENCY</span>
                <div className="text-xs font-bold text-cyan-300">
                  {data?.averageLatencyMs} <span className="text-[10px] font-normal text-muted-foreground">ms</span>
                </div>
              </div>

              <div className="liquid-glass-card rounded-2xl p-3 text-left">
                <span className="hud-label text-[9px] block mb-1">FAILOVER EVENTS</span>
                <div className="text-xs font-bold text-foreground">
                  {data?.failoverCount ?? 0} <span className="text-[10px] font-normal text-muted-foreground">switches</span>
                </div>
              </div>
            </div>

            {/* D3 Latency Chart */}
            <div className="liquid-glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold tracking-wider text-foreground">
                    RESPONSE LATENCY TELEMETRY (D3.JS)
                  </span>
                </div>
                {hoveredPoint ? (
                  <span className="text-[11px] text-primary font-mono bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    {hoveredPoint.latencyMs}ms • Key #{hoveredPoint.keyIndex}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">LATEST: {data?.currentLatencyMs}ms</span>
                )}
              </div>

              <div className="w-full flex justify-center overflow-x-auto">
                <svg
                  ref={chartRef}
                  viewBox="0 0 520 180"
                  className="w-full max-w-[520px] h-[180px] overflow-visible"
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground border-t border-primary/15 pt-2">
                <span>Min: {data?.minLatencyMs}ms</span>
                <span>Average: {data?.averageLatencyMs}ms</span>
                <span>Peak: {data?.maxLatencyMs}ms</span>
              </div>
            </div>

            {/* API Key Pool Breakdown */}
            <div className="liquid-glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold tracking-wider text-foreground">
                    GEMINI FAILOVER KEY POOL ({data?.totalKeys} KEYS)
                  </span>
                </div>
                <span className="liquid-badge text-[10px]">CASCADE READY</span>
              </div>

              <div className="space-y-2">
                {data?.keys.map((k) => {
                  const isCurrent = k.index === data.activeKeyIndex;
                  return (
                    <div
                      key={k.index}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                        isCurrent
                          ? "border-primary/60 bg-primary/15 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                          : "border-primary/15 bg-black/25"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold ${
                            isCurrent
                              ? "bg-primary text-black"
                              : "bg-slate-800 text-muted-foreground border border-slate-700"
                          }`}
                        >
                          #{k.index}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                            <span>{k.label}</span>
                            {isCurrent && (
                              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-primary text-black font-extrabold tracking-wider">
                                CURRENTLY ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground">
                            {k.masked} {k.lastUsed ? `• Last used ${k.lastUsed}` : ""}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
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
                            <AlertTriangle className="h-3 w-3" /> RATE LIMITED
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
