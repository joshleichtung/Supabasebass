export default function PauseIcon({ size = 32, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="9" y="6" width="5" height="20" fill={color} rx="1" />
      <rect x="18" y="6" width="5" height="20" fill={color} rx="1" />
    </svg>
  )
}
