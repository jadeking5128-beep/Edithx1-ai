import { useEffect, useRef } from "react";
import { audioLevel } from "@/lib/audio-level";

type ArcReactorCoreProps = {
  size?: number;
  active?: boolean;
  reactive?: boolean;
  ambient?: boolean;
  state?: "idle" | "listening" | "thinking" | "speaking" | "error";
  onClick?: () => void;
};

export function ArcReactorCore({
  size = 280,
  active = false,
  reactive = true,
  ambient = false,
  state = "idle",
  onClick,
}: ArcReactorCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rot1Ref = useRef<SVGGElement | null>(null);
  const rot2Ref = useRef<SVGGElement | null>(null);
  const plasmaCoreRef = useRef<HTMLDivElement | null>(null);

  // Audio-reactive RAF loop driving rotations, canvas soundwave bars, and coil flaring
  useEffect(() => {
    let animId = 0;
    let angle1 = 0;
    let angle2 = 0;
    let smoothLevel = 0;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(64, time - lastTime);
      lastTime = time;

      const target = audioLevel.value;
      smoothLevel += (target - smoothLevel) * 0.25;

      // Base rotation speeds depending on state
      const speedMult =
        state === "thinking"
          ? 2.8
          : state === "speaking"
          ? 1.5
          : state === "listening"
          ? 1.2
          : ambient
          ? 0.7
          : 0.35;

      const deltaAngle = (0.04 * speedMult + smoothLevel * 0.12) * dt;
      angle1 = (angle1 + deltaAngle) % 360;
      angle2 = (angle2 - deltaAngle * 0.65) % 360;

      if (rot1Ref.current) {
        rot1Ref.current.style.transform = `rotate(${angle1}deg)`;
      }
      if (rot2Ref.current) {
        rot2Ref.current.style.transform = `rotate(${angle2}deg)`;
      }

      // Drive canvas soundwave reticle
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          const cx = w / 2;
          const cy = h / 2;
          const numBars = 36;
          const baseRadius = w * 0.38;
          const maxBarHeight = w * 0.12;

          for (let i = 0; i < numBars; i++) {
            const theta = (i / numBars) * Math.PI * 2 + (angle1 * Math.PI) / 180;
            const variance = Math.sin(i * 1.5 + time * 0.005) * 0.5 + 0.5;
            const barH = 3 + smoothLevel * maxBarHeight * variance + (active ? 6 : 0);

            const x1 = cx + Math.cos(theta) * baseRadius;
            const y1 = cy + Math.sin(theta) * baseRadius;
            const x2 = cx + Math.cos(theta) * (baseRadius + barH);
            const y2 = cy + Math.sin(theta) * (baseRadius + barH);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineWidth = 2;

            if (state === "thinking") {
              ctx.strokeStyle = `rgba(245, 158, 11, ${0.4 + smoothLevel * 0.6})`;
            } else if (state === "error") {
              ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + smoothLevel * 0.5})`;
            } else {
              ctx.strokeStyle = `rgba(56, 189, 248, ${0.35 + smoothLevel * 0.65})`;
            }
            ctx.stroke();
          }
        }
      }

      // Central plasma scale and glow
      if (plasmaCoreRef.current) {
        const scale = 1 + smoothLevel * 0.22 + (active ? 0.08 : 0);
        const brightness = 1 + smoothLevel * 0.85;
        plasmaCoreRef.current.style.transform = `scale(${scale})`;
        plasmaCoreRef.current.style.filter = `brightness(${brightness})`;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [state, active, ambient, reactive]);

  const isThinking = state === "thinking";
  const isError = state === "error";
  const glowColor = isThinking
    ? "rgba(245, 158, 11, 0.65)"
    : isError
    ? "rgba(239, 68, 68, 0.65)"
    : "rgba(0, 229, 255, 0.65)";

  const accentColor = isThinking ? "#f59e0b" : isError ? "#ef4444" : "#00e5ff";

  return (
    <div
      onClick={onClick}
      className={`arc-reactor-wrapper relative flex items-center justify-center select-none cursor-pointer transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] ${
        ambient ? "ambient-core-active" : ""
      }`}
      style={{
        width: size,
        height: size,
        filter: `drop-shadow(0 0 35px ${glowColor})`,
      }}
    >
      {/* 4 Precision Tactical HUD Corner Brackets */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-sky-400/60 pointer-events-none" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-sky-400/60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-sky-400/60 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-sky-400/60 pointer-events-none" />

      {/* Degree Compass Ticks */}
      <div className="absolute top-1 text-[9px] font-mono tracking-widest text-sky-400/70 font-bold">
        000°
      </div>
      <div className="absolute bottom-1 text-[9px] font-mono tracking-widest text-sky-400/70 font-bold">
        180°
      </div>
      <div className="absolute right-1 text-[9px] font-mono tracking-widest text-sky-400/70 font-bold">
        090°
      </div>
      <div className="absolute left-1 text-[9px] font-mono tracking-widest text-sky-400/70 font-bold">
        270°
      </div>

      {/* Audio Reactive Waveform Canvas Ring */}
      <canvas
        ref={canvasRef}
        width={size * 1.5}
        height={size * 1.5}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Main Vector Arc Reactor Assembly */}
      <svg
        viewBox="0 0 300 300"
        className="w-full h-full overflow-visible"
        style={{ transformOrigin: "center center" }}
      >
        <defs>
          <filter id="arc-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="plasma-emitter" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="35%" stopColor={accentColor} stopOpacity="0.9" />
            <stop offset="70%" stopColor="#0369a1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Circular Scale Track */}
        <circle
          cx="150"
          cy="150"
          r="140"
          fill="none"
          stroke="rgba(56, 189, 248, 0.15)"
          strokeWidth="1.5"
        />
        <circle
          cx="150"
          cy="150"
          r="132"
          fill="none"
          stroke="rgba(56, 189, 248, 0.3)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />

        {/* Rotating Outer Gyroscopic Ring 1 */}
        <g ref={rot1Ref} style={{ transformOrigin: "150px 150px" }}>
          <circle
            cx="150"
            cy="150"
            r="120"
            fill="none"
            stroke="rgba(14, 165, 233, 0.5)"
            strokeWidth="3.5"
            strokeDasharray="60 30 90 20"
          />
          <circle
            cx="150"
            cy="150"
            r="115"
            fill="none"
            stroke={accentColor}
            strokeWidth="1.5"
            strokeDasharray="15 45"
            filter="url(#arc-glow)"
          />
        </g>

        {/* Counter-Rotating Gyroscopic Ring 2 */}
        <g ref={rot2Ref} style={{ transformOrigin: "150px 150px" }}>
          <circle
            cx="150"
            cy="150"
            r="102"
            fill="none"
            stroke="rgba(56, 189, 248, 0.4)"
            strokeWidth="2"
            strokeDasharray="40 15 20 15"
          />
          <circle
            cx="150"
            cy="150"
            r="94"
            fill="none"
            stroke={accentColor}
            strokeWidth="1"
            strokeDasharray="6 8"
          />
        </g>

        {/* 10 Radial Arc Reactor Induction Coils */}
        <g transform="translate(150, 150)">
          {[...Array(10)].map((_, i) => {
            const angle = i * 36;
            return (
              <g key={i} transform={`rotate(${angle})`}>
                <rect
                  x="-7"
                  y="-84"
                  width="14"
                  height="22"
                  rx="3"
                  fill="rgba(15, 23, 42, 0.85)"
                  stroke="rgba(56, 189, 248, 0.5)"
                  strokeWidth="1.2"
                />
                <line x1="-5" y1="-78" x2="5" y2="-78" stroke="#38bdf8" strokeWidth="1" />
                <line x1="-5" y1="-73" x2="5" y2="-73" stroke="#38bdf8" strokeWidth="1" />
                <line x1="-5" y1="-68" x2="5" y2="-68" stroke="#38bdf8" strokeWidth="1" />
                <circle
                  cx="0"
                  cy="-88"
                  r="2.5"
                  fill={accentColor}
                  filter="url(#arc-glow)"
                />
              </g>
            );
          })}
        </g>

        {/* Middle Core Reticle Chamber */}
        <circle
          cx="150"
          cy="150"
          r="54"
          fill="rgba(7, 11, 24, 0.9)"
          stroke="rgba(56, 189, 248, 0.4)"
          strokeWidth="2"
        />

        {/* Hexagonal Crystal Housing */}
        <polygon
          points="150,105 189,127 189,173 150,195 111,173 111,127"
          fill="none"
          stroke={accentColor}
          strokeWidth="2"
          filter="url(#arc-glow)"
        />

        <polygon
          points="150,115 180,132 180,168 150,185 120,168 120,132"
          fill="none"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="1"
        />
      </svg>

      {/* Central High-Intensity Plasma Emitter Core */}
      <div
        ref={plasmaCoreRef}
        className="absolute inset-[36%] rounded-full flex items-center justify-center pointer-events-none transition-all duration-100"
        style={{
          background: `radial-gradient(circle at 45% 40%, #ffffff 0%, ${accentColor} 45%, rgba(2, 132, 199, 0.3) 75%, transparent 100%)`,
          boxShadow: `0 0 35px ${glowColor}, inset 0 0 20px #ffffff`,
        }}
      >
        <div className="w-4 h-4 rounded-full bg-white shadow-[0_0_15px_#ffffff]" />
      </div>

      {/* Specular Lens Reflection */}
      <div
        className="absolute inset-[15%] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 50%)",
        }}
      />
    </div>
  );
}
