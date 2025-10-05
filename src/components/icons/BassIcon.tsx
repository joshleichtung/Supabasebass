export default function BassIcon({ size = 64, color = '#4361ee' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bass guitar body */}
      <path
        d="M45 25C45 30.5 40.5 35 35 35C29.5 35 25 30.5 25 25C25 19.5 29.5 15 35 15C40.5 15 45 19.5 45 25Z"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Neck */}
      <path
        d="M35 15L35 5"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Strings */}
      <path
        d="M32 8L32 20M38 8L38 20"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Sound hole */}
      <circle cx="35" cy="25" r="4" stroke={color} strokeWidth="1.5" opacity="0.4" />
      {/* Glow effect */}
      <circle cx="35" cy="25" r="12" stroke={color} strokeWidth="1" opacity="0.2" />
      <circle cx="35" cy="25" r="16" stroke={color} strokeWidth="0.5" opacity="0.1" />
    </svg>
  )
}
