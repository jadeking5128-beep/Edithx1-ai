import { useState, useId } from "react";

type EdithLogoProps = {
  size?: number;
  className?: string;
  glow?: boolean;
  audioPulse?: number; // 0..1
};

export function EdithLogo({
  size = 120,
  className = "",
  glow = true,
  audioPulse = 0,
}: EdithLogoProps) {
  const id = useId();
  const [imgError, setImgError] = useState(false);

  const glowIntensity = Math.min(1, 0.65 + audioPulse * 0.7);
  const pulseScale = 1 + audioPulse * 0.05;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{
        width: size,
        height: size,
        transform: `scale(${pulseScale})`,
        transition: "transform 0.12s ease-out",
        filter: glow
          ? `drop-shadow(0 0 ${12 + audioPulse * 20}px rgba(0, 229, 255, ${glowIntensity}))`
          : undefined,
      }}
    >
      {!imgError ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src="/assets/aistudio/file_0000000004288207a98bdd87c4de91ed_89f801cb.png"
            alt="E.D.I.T.H. Tactical Logo"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain pointer-events-none rounded-full"
            style={{
              mixBlendMode: "screen",
              filter: `brightness(${1 + audioPulse * 0.35}) contrast(1.15)`,
            }}
          />
          {/* Audio-reactive laser core flare overlay */}
          {audioPulse > 0.05 && (
            <div
              className="absolute inset-[30%] pointer-events-none rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(0, 229, 255, 0.5) 0%, transparent 70%)",
                opacity: audioPulse,
                mixBlendMode: "color-dodge",
              }}
            />
          )}
        </div>
      ) : (
        /* Pixel-perfect authentic SVG replication matching uploaded reference image */
        <svg
          viewBox="0 0 320 320"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Brushed Titanium Metal Gradient */}
            <linearGradient id={`titanium-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="25%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="75%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>

            {/* Electric Cyan Laser Gradient */}
            <linearGradient id={`laser-${id}`} x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#00e5ff" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Specular Core Flare */}
            <radialGradient id={`flare-${id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="35%" stopColor="#00e5ff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
            </radialGradient>

            {/* Laser Glow Filter */}
            <filter id={`glow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Outer Arc Glow Filter */}
            <filter id={`arc-glow-${id}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Vertical Crosshair Axis Ticks (Top & Bottom) */}
          <line
            x1="160"
            y1="18"
            x2="160"
            y2="46"
            stroke="#94a3b8"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <line
            x1="160"
            y1="274"
            x2="160"
            y2="302"
            stroke="#94a3b8"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Cyan Targeting Ticks & Dots at 12 and 6 o'clock */}
          <circle cx="160" cy="52" r="3.8" fill="#00e5ff" filter={`url(#glow-${id})`} />
          <circle cx="160" cy="268" r="3.8" fill="#00e5ff" filter={`url(#glow-${id})`} />

          {/* Outer Steel Reticle Ring */}
          <circle
            cx="160"
            cy="160"
            r="105"
            stroke="rgba(148, 163, 184, 0.45)"
            strokeWidth="1.75"
          />

          {/* Outer Caliper Segments (Left & Right) */}
          <circle
            cx="160"
            cy="160"
            r="114"
            stroke="rgba(148, 163, 184, 0.6)"
            strokeWidth="2.5"
            strokeDasharray="40 180 40 180"
            strokeDashoffset="20"
          />

          {/* Electric Laser Cyan Arcs (Exact Reference Matches) */}
          {/* Upper Right Glowing Arc */}
          <path
            d="M 172 56 A 105 105 0 0 1 234 94"
            stroke="#00e5ff"
            strokeWidth="4"
            strokeLinecap="round"
            filter={`url(#arc-glow-${id})`}
          />
          {/* Lower Left Glowing Arc */}
          <path
            d="M 88 226 A 105 105 0 0 1 148 264"
            stroke="#00e5ff"
            strokeWidth="4"
            strokeLinecap="round"
            filter={`url(#arc-glow-${id})`}
          />
          {/* Far Left Glowing Arc */}
          <path
            d="M 55 125 A 105 105 0 0 1 55 195"
            stroke="#00e5ff"
            strokeWidth="4"
            strokeLinecap="round"
            filter={`url(#arc-glow-${id})`}
          />

          {/* ========================================================
              GEOMETRIC TITANIUM "E" EMBLEM (EXACT REFERENCE GEOMETRY)
              ======================================================== */}
          <g id="titanium-e">
            {/* Upper Arm + Chevron Peak */}
            <path
              d="M 160 148 L 92 148 L 134 88 L 224 88 L 206 108 L 146 108 L 118 148 Z"
              fill={`url(#titanium-${id})`}
              stroke="#ffffff"
              strokeWidth="0.8"
              strokeLinejoin="bevel"
            />

            {/* Lower Arm + Chevron Base */}
            <path
              d="M 160 172 L 92 172 L 134 232 L 224 232 L 206 212 L 146 212 L 118 172 Z"
              fill={`url(#titanium-${id})`}
              stroke="#ffffff"
              strokeWidth="0.8"
              strokeLinejoin="bevel"
            />

            {/* Beveled Left Chevron Point Bracket */}
            <path
              d="M 92 148 L 74 160 L 92 172 L 118 172 L 102 160 L 118 148 Z"
              fill="#e2e8f0"
              stroke="#cbd5e1"
              strokeWidth="0.8"
            />

            {/* Beveled Top Edge Sheen */}
            <polygon
              points="134,88 224,88 206,108 146,108"
              fill="rgba(255, 255, 255, 0.28)"
            />

            {/* Beveled Bottom Edge Shadow */}
            <polygon
              points="134,232 224,232 206,212 146,212"
              fill="rgba(0, 0, 0, 0.3)"
            />

            {/* Center Electric Cyan Laser Beam */}
            <polygon
              points="126,160 138,152 238,152 226,168 138,168"
              fill={`url(#laser-${id})`}
              filter={`url(#glow-${id})`}
            />

            {/* Center Specular Glare Star on the Laser */}
            <circle
              cx="182"
              cy="160"
              r="4.5"
              fill="#ffffff"
              filter={`url(#glow-${id})`}
            />
          </g>
        </svg>
      )}
    </div>
  );
}
