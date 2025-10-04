// Drums pattern engine with density and groove variation
export type DrumPattern = { kick:number[], snare:number[], hat:number[] }

// DENSITY LEVELS (X axis: 0 = minimal, 1 = busy)

// Minimal: Just kick and snare backbeat
const minimal: DrumPattern = {
  kick: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],  // 1 and 3 (simple)
  snare:[0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],  // 2 and 4 (backbeat)
  hat:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]   // No hats
}

// Low: Add some kick variation
const low: DrumPattern = {
  kick: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0],  // Add 16th note kick
  snare:[0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],  // Same backbeat
  hat:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]   // Still no hats
}

// Medium: Add simple hi-hats (8th notes)
const medium: DrumPattern = {
  kick: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0],  // Same as low
  snare:[0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],  // Same backbeat
  hat:  [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0]   // 8th note hats
}

// High: Add ghost notes and more kick
const high: DrumPattern = {
  kick: [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],  // Syncopated kicks
  snare:[0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,1],  // Add ghost notes (quieter hits at position 8, 16)
  hat:  [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0]   // 8th note hats
}

// Busy: Complex patterns with 16th note hats
const busy: DrumPattern = {
  kick: [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],  // Syncopated funk
  snare:[0,0,0,0, 1,0,1,1, 0,0,0,0, 1,0,1,1],  // More ghost notes
  hat:  [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1]   // 16th note hats
}

// GROOVE VARIATIONS (Y axis: 0 = straight, 1 = funky)

// Straight groove variations
const straight_minimal = minimal
const straight_low = low
const straight_medium = medium
const straight_high = high
const straight_busy = busy

// Funky groove variations (more syncopation)
const funky_minimal: DrumPattern = {
  kick: [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,0],  // Add syncopation
  snare:[0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],  // Same backbeat
  hat:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]   // No hats
}

const funky_low: DrumPattern = {
  kick: [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,1,1,0],  // More syncopation
  snare:[0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],  // Add ghost
  hat:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]   // No hats
}

const funky_medium: DrumPattern = {
  kick: [1,0,0,1, 0,0,1,0, 1,0,0,0, 0,1,1,0],  // Syncopated
  snare:[0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,1],  // Ghost notes
  hat:  [1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1]   // Syncopated 8ths
}

const funky_high: DrumPattern = {
  kick: [1,0,0,1, 0,1,1,0, 1,0,0,1, 0,1,1,0],  // Funky syncopation
  snare:[0,0,0,0, 1,0,1,1, 0,0,0,0, 1,0,1,1],  // More ghosts
  hat:  [1,1,1,0, 1,1,1,0, 1,1,1,0, 1,1,1,0]   // Funky hat pattern
}

const funky_busy: DrumPattern = {
  kick: [1,0,0,1, 0,1,1,0, 1,0,0,1, 0,1,1,0],  // Maximum funk
  snare:[0,0,1,0, 1,0,1,1, 0,0,1,0, 1,0,1,1],  // Lots of ghosts
  hat:  [1,1,1,1, 1,0,1,1, 1,1,1,1, 1,0,1,1]   // Complex hats
}

/**
 * Morph between patterns based on X (density) and Y (groove variation)
 * X: 0 = minimal, 1 = busy
 * Y: 0 = straight, 1 = funky
 */
export function morphPattern(x: number, y: number): DrumPattern {
  const density = Math.min(1, Math.max(0, x))
  const groove = Math.min(1, Math.max(0, y))

  // Select patterns based on density (X)
  let straightPattern: DrumPattern
  let funkyPattern: DrumPattern

  if (density < 0.2) {
    straightPattern = straight_minimal
    funkyPattern = funky_minimal
  } else if (density < 0.4) {
    straightPattern = straight_low
    funkyPattern = funky_low
  } else if (density < 0.6) {
    straightPattern = straight_medium
    funkyPattern = funky_medium
  } else if (density < 0.8) {
    straightPattern = straight_high
    funkyPattern = funky_high
  } else {
    straightPattern = straight_busy
    funkyPattern = funky_busy
  }

  // Interpolate between straight and funky based on Y
  const lerp = (a: number[], b: number[]) =>
    a.map((v, i) => {
      const target = v * (1 - groove) + b[i] * groove
      return Math.random() < target ? 1 : 0
    })

  return {
    kick: lerp(straightPattern.kick, funkyPattern.kick),
    snare: lerp(straightPattern.snare, funkyPattern.snare),
    hat: lerp(straightPattern.hat, funkyPattern.hat),
  }
}
