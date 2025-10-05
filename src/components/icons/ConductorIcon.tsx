export default function ConductorIcon({ size = 64, color = '#06ffa5' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Waveform visualization */}
      <path
        d="M8 32L12 28L16 36L20 20L24 44L28 16L32 40L36 24L40 38L44 26L48 34L52 30L56 32"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Grid lines */}
      <path
        d="M8 20H56M8 32H56M8 44H56"
        stroke={color}
        strokeWidth="0.5"
        opacity="0.2"
      />

      {/* Outer frame */}
      <rect
        x="6"
        y="10"
        width="52"
        height="44"
        stroke={color}
        strokeWidth="2"
        fill="none"
        rx="4"
      />

      {/* Glow effect */}
      <rect
        x="4"
        y="8"
        width="56"
        height="48"
        stroke={color}
        strokeWidth="1"
        opacity="0.2"
        rx="6"
      />
      <rect
        x="2"
        y="6"
        width="60"
        height="52"
        stroke={color}
        strokeWidth="0.5"
        opacity="0.1"
        rx="8"
      />
    </svg>
  )
}
