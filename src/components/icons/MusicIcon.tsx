export default function MusicIcon({ size = 48, color = '#06ffa5' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Musical note */}
      <path
        d="M18 34C18 36.2 16.2 38 14 38C11.8 38 10 36.2 10 34C10 31.8 11.8 30 14 30C16.2 30 18 31.8 18 34Z"
        fill={color}
        opacity="0.6"
      />
      <path
        d="M38 28C38 30.2 36.2 32 34 32C31.8 32 30 30.2 30 28C30 25.8 31.8 24 34 24C36.2 24 38 25.8 38 28Z"
        fill={color}
        opacity="0.6"
      />
      <path
        d="M18 10V34M30 6V28"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M18 10C18 10 24 8 30 6"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Glow */}
      <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="0.5" opacity="0.1" />
    </svg>
  )
}
