/**
 * Generate a short, human-friendly room code
 * Format: 4 uppercase letters/numbers (e.g., K9FQ, A2B7)
 */
export function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude ambiguous chars (0,O,1,I)
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/**
 * Validate a short code format
 */
export function isValidShortCode(code: string): boolean {
  return /^[A-Z0-9]{4}$/.test(code)
}
