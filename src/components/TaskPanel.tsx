import { CheckCircle2, XCircle, Loader2, ShieldQuestion, Circle } from "lucide-react";
import type { NetworkPayload } from "@/lib/jarvis.functions";

const STATUS_LABEL: Record<string, string> = {
  pending: "PENDING",
  running: "RUNNING",
  succeeded: "SUCCEEDED",
  failed: "FAILED",
  awaiting_client: "ACTION NEEDED IN BROWSER",
  awaiting_approval: "AWAITING APPROVAL",
  planning_required: "NEEDS A PLAN",
  partial: "PARTIALLY COMPLETE",
  cancelled: "CANCELLED",
};

function statusColor(st: string): string {
  if (st === "succeeded") return "text-green-400";
  if (st === "failed") return "text-destructive";
  if (st === "awaiting_approval" || st === "awaiting_client") return "text-yellow-400";
  return "text-primary";
}

function StepIcon({ status }: { status: string }) {
  if (status === "succeeded") return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-400" />;
  if (status === "failed") return <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />;
  if (status === "running") return <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />;
  if (status === "awaiting_approval") return <ShieldQuestion className="h-3.5 w-3.5 shrink-0 text-yellow-400" />;
  return <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
}

export function TaskPanel({ network }: { network: NetworkPayload }) {
  const steps = network.steps ?? [];
  const done = steps.filter((s) => s.status === "succeeded").length;
  const pct = steps.length ? Math.round((done / steps.length) * 100) : network.taskStatus === "succeeded" ? 100 : 0;
  const st = network.taskStatus ?? (network.error ? "failed" : "pending");
  return (
    <div className="mt-3 liquid-glass-card rounded-xl p-3.5 text-left text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="tracking-widest text-primary/80 font-medium">NETWORK TASK · {network.command}</span>
        <span className={`tracking-widest font-semibold ${statusColor(st)}`}>{STATUS_LABEL[st] ?? st.toUpperCase()}</span>
      </div>
      {steps.length > 0 && (
        <>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-black/40 border border-primary/20">
            <div className="h-full bg-gradient-to-r from-sky-400 to-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.8)] transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {steps.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-[11px]">
                <StepIcon status={s.status} />
                <span className="text-foreground font-medium">{s.tool}</span>
                <span className="text-muted-foreground">({s.status})</span>
                {s.error && <span className="text-destructive font-mono">— {s.error}</span>}
              </li>
            ))}
          </ul>
        </>
      )}
      {st === "awaiting_approval" && (
        <p className="mt-2 text-yellow-400">This task is waiting for approval on the EDITH NETWORK before it can continue.</p>
      )}
      {network.error && st !== "failed" && <p className="mt-2 text-destructive">{network.error}</p>}
    </div>
  );
}
