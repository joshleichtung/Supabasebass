export default function DrumsIcon({ size = 64, color = '#ff006e' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Kick drum */}
      <circle cx="32" cy="32" r="14" stroke={color} strokeWidth="2.5" fill="none" />
      <circle cx="32" cy="32" r="8" stroke={color} strokeWidth="1.5" opacity="0.4" />

      {/* Hi-hat */}
      <path
        d="M20 18C20 18 22 16 24 16C26 16 28 18 28 18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 20C20 20 22 18 24 18C26 18 28 20 28 20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Snare */}
      <path
        d="M42 24C42 26 40 28 38 28C36 28 34 26 34 24C34 22 36 20 38 20C40 20 42 22 42 24Z"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />

      {/* Drumsticks */}
      <path
        d="M16 48L22 42"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M48 48L42 42"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Glow rings */}
      <circle cx="32" cy="32" r="18" stroke={color} strokeWidth="1" opacity="0.2" />
      <circle cx="32" cy="32" r="22" stroke={color} strokeWidth="0.5" opacity="0.1" />
    </svg>
  )
}
