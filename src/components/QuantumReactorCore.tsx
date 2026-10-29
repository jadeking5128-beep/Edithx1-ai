import { useEffect, useRef, useState } from "react";
import { audioLevel } from "@/lib/audio-level";

type Props = {
  size?: number;
  active?: boolean;
  reactive?: boolean;
  ambient?: boolean;
  state?: "idle" | "listening" | "thinking" | "speaking";
  onClick?: () => void;
};

export function QuantumReactorCore({
  size = 280,
  active = false,
  reactive = true,
  ambient = false,
  state = "idle",
  onClick,
}: Props) {
  const [level, setLevel] = useState(0);
  const [rot1, setRot1] = useState(0);
  const [rot2, setRot2] = useState(0);
  const [rot3, setRot3] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const smoothedLevel = useRef<number>(0);

  useEffect(() => {
    let a1 = 0;
    let a2 = 0;
    let a3 = 0;

    const loop = (t: number) => {
      const dt = Math.min(50, t - lastTimeRef.current);
      lastTimeRef.current = t;

      const raw = reactive ? audioLevel.value : 0;
      smoothedLevel.current += (raw - smoothedLevel.current) * 0.25;
      const smooth = smoothedLevel.current;
      setLevel(smooth);

      // Dynamic rotation speeds based on reactor state
      let speedMultiplier = 1;
      if (state === "thinking") speedMultiplier = 4.5;
      else if (state === "speaking") speedMultiplier = 2.2;
      else if (state === "listening") speedMultiplier = 1.4;
      else if (ambient) speedMultiplier = 0.8;

      const baseSpeed = 0.015 * speedMultiplier + smooth * 0.8;
      a1 = (a1 + baseSpeed * dt) % 360;
      a2 = (a2 - baseSpeed * 1.6 * dt) % 360;
      a3 = (a3 + baseSpeed * 2.8 * dt) % 360;

      setRot1(a1);
      setRot2(a2);
      setRot3(a3);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [reactive, state, ambient]);

  // Color scheme based on state
  const isThinking = state === "thinking";
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";

  const primaryColor = isThinking ? "#fbbf24" : isListening ? "#38bdf8" : isSpeaking ? "#67e8f9" : ambient ? "#22d3ee" : "#38bdf8";
  const secondaryColor = isThinking ? "#f59e0b" : "#0284c7";
  const coreGlow = isThinking ? "rgba(251, 191, 36, 0.7)" : ambient ? "rgba(34, 211, 238, 0.6)" : "rgba(56, 189, 248, 0.65)";

  // Generate 36 radial frequency spectrum bars around the reactor perimeter
  const numBars = 36;
  const bars = Array.from({ length: numBars }, (_, i) => {
    const angle = (i * 360) / numBars;
    const rad = (angle * Math.PI) / 180;
    // Base radius from center
    const rBase = 118;
    // Modulate bar length with sound level and position
    const wave = Math.sin((i / numBars) * Math.PI * 4 + rot1 * 0.05);
    const barHeight = 4 + level * 28 * Math.max(0.15, Math.abs(wave)) + (ambient ? 3 : 0);

    const x1 = 150 + Math.cos(rad) * rBase;
    const y1 = 150 + Math.sin(rad) * rBase;
    const x2 = 150 + Math.cos(rad) * (rBase + barHeight);
    const y2 = 150 + Math.sin(rad) * (rBase + barHeight);

    return { id: i, x1, y1, x2, y2, angle };
  });

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex items-center justify-center select-none cursor-pointer group transition-transform duration-300 hover:scale-[1.03]"
      style={{ width: size, height: size }}
    >
      {/* Volumetric Refractive Backing & Ambient Glow */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${coreGlow} 0%, rgba(2, 132, 199, 0.15) 45%, transparent 72%)`,
          filter: `blur(${ambient ? "28px" : "20px"})`,
          transform: `scale(${1 + level * 0.35 + (ambient ? 0.08 : 0) + (isHovered ? 0.05 : 0)})`,
          opacity: ambient ? 0.95 : 0.8,
        }}
      />

      {/* Main High-Precision SVG Tactical Arc Reactor */}
      <svg
        viewBox="0 0 300 300"
        className="w-full h-full drop-shadow-[0_0_24px_rgba(56,189,248,0.4)] overflow-visible"
      >
        <defs>
          {/* Specular Liquid Glass Gradient */}
          <linearGradient id="stark-specular" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="30%" stopColor="#7dd3fc" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#0284c7" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.5" />
          </linearGradient>

          {/* Glowing Plasma Singularity */}
          <radialGradient id="plasma-singularity" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="25%" stopColor={primaryColor} stopOpacity="0.95" />
            <stop offset="60%" stopColor={secondaryColor} stopOpacity="0.65" />
            <stop offset="90%" stopColor="#070b18" stopOpacity="0.8" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Tri-Core Flux Gradient */}
          <linearGradient id="flux-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.9" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.4" />
          </linearGradient>

          {/* Precision Blur Filter */}
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. OUTER RADIAL FREQUENCY SPECTRUM BARS */}
        <g opacity={0.85}>
          {bars.map((b) => (
            <line
              key={b.id}
              x1={b.x1}
              y1={b.y1}
              x2={b.x2}
              y2={b.y2}
              stroke={primaryColor}
              strokeWidth={1.75}
              strokeLinecap="round"
              opacity={0.4 + level * 0.6}
            />
          ))}
        </g>

        {/* 2. OUTER AZIMUTH TELEMETRY COMPASS RING */}
        <circle
          cx="150"
          cy="150"
          r="115"
          fill="none"
          stroke="rgba(56, 189, 248, 0.22)"
          strokeWidth="1.5"
        />

        {/* 4 Cardinal HUD Targets */}
        {[0, 90, 180, 270].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const cx = 150 + Math.cos(rad) * 115;
          const cy = 150 + Math.sin(rad) * 115;
          return (
            <g key={deg}>
              <circle cx={cx} cy={cy} r="3" fill="#070b18" stroke={primaryColor} strokeWidth="1.5" />
              <circle cx={cx} cy={cy} r="1" fill={primaryColor} />
            </g>
          );
        })}

        {/* 3. ROTATING TACTICAL VERNIER RING (Clockwise) */}
        <g transform={`rotate(${rot1} 150 150)`}>
          <circle
            cx="150"
            cy="150"
            r="102"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1.5"
            strokeDasharray="4 8 16 8 32 12"
            opacity={0.75}
          />
          {/* Vernier scale indicator notch */}
          <path
            d="M 150 45 L 153 52 L 147 52 Z"
            fill={primaryColor}
            filter="url(#neon-glow)"
          />
          <path
            d="M 150 255 L 153 248 L 147 248 Z"
            fill={primaryColor}
            filter="url(#neon-glow)"
          />
        </g>

        {/* 4. COUNTER-ROTATING COLIMATOR IRIS (Counter-Clockwise) */}
        <g transform={`rotate(${rot2} 150 150)`}>
          <circle
            cx="150"
            cy="150"
            r="88"
            fill="none"
            stroke="rgba(125, 211, 252, 0.3)"
            strokeWidth="2"
            strokeDasharray="24 16"
          />
          {/* 8 Mechanical Collimator Jaws */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x = 150 + Math.cos(rad) * 88;
            const y = 150 + Math.sin(rad) * 88;
            return (
              <g key={angle} transform={`rotate(${angle} 150 150)`}>
                <rect
                  x="146"
                  y="57"
                  width="8"
                  height="10"
                  rx="1.5"
                  fill="#0b1329"
                  stroke={primaryColor}
                  strokeWidth="1"
                />
                <circle cx="150" cy="62" r="1.5" fill="#ffffff" />
              </g>
            );
          })}
        </g>

        {/* 5. INNER QUANTUM FLUX ROTOR (High Velocity during activity) */}
        <g transform={`rotate(${rot3} 150 150)`}>
          <circle
            cx="150"
            cy="150"
            r="70"
            fill="none"
            stroke={primaryColor}
            strokeWidth="2.5"
            strokeDasharray="38 12"
            filter="url(#neon-glow)"
          />
          {/* Tri-Core equilateral magnetic brackets */}
          {[0, 120, 240].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 150 150)`}>
              <path
                d="M 150 78 L 158 92 L 142 92 Z"
                fill="url(#flux-gradient)"
                opacity="0.9"
              />
            </g>
          ))}
        </g>

        {/* 6. OPTIC IRIS CASING (Frosted Glass Ring) */}
        <circle
          cx="150"
          cy="150"
          r="54"
          fill="rgba(7, 11, 24, 0.75)"
          stroke="url(#stark-specular)"
          strokeWidth="2"
        />

        {/* 7. CENTRAL ARC SINGULARITY (PLASMA CORE) */}
        <g transform={`scale(${1 + level * 0.25 + (isHovered ? 0.06 : 0)})`} transform-origin="150 150">
          {/* Quantum Hex Core Chassis */}
          <polygon
            points="150,110 185,130 185,170 150,190 115,170 115,130"
            fill="rgba(14, 165, 233, 0.15)"
            stroke={primaryColor}
            strokeWidth="1.75"
            strokeDasharray="8 4"
          />

          {/* Central Pulsing Plasma Sphere */}
          <circle
            cx="150"
            cy="150"
            r={34 + level * 10}
            fill="url(#plasma-singularity)"
            filter="url(#neon-glow)"
          />

          {/* Center Intense White-Hot Singularity Point */}
          <circle
            cx="150"
            cy="150"
            r="11"
            fill="#ffffff"
            className="animate-pulse"
          />

          {/* Micro-Crosshair Alignment Reticle */}
          <line x1="135" y1="150" x2="142" y2="150" stroke={primaryColor} strokeWidth="1.5" />
          <line x1="158" y1="150" x2="165" y2="150" stroke={primaryColor} strokeWidth="1.5" />
          <line x1="150" y1="135" x2="150" y2="142" stroke={primaryColor} strokeWidth="1.5" />
          <line x1="150" y1="158" x2="150" y2="165" stroke={primaryColor} strokeWidth="1.5" />
        </g>

        {/* 8. Specular Lens Highlight Reflection */}
        <ellipse
          cx="135"
          cy="130"
          rx="22"
          ry="12"
          transform="rotate(-25 135 130)"
          fill="#ffffff"
          opacity="0.35"
          pointerEvents="none"
        />
      </svg>
    </div>
  );
}
