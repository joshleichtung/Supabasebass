// Drums pattern morph stub
export type DrumPattern = { kick:number[], snare:number[], hat:number[] }

// Basic groove - solid four-on-floor with syncopation
const basic: DrumPattern = {
  kick: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0],  // 1, 9, 15 - syncopated
  snare:[0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],  // 2 and 4 (backbeat)
  hat:  [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0]   // 8th notes
}

// Busy groove - more syncopation and variation
const busy: DrumPattern = {
  kick: [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],  // Syncopated funk pattern
  snare:[0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,1],  // Backbeat + ghost notes
  hat:  [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1]   // 16th notes
}

export function morphPattern(x:number): DrumPattern {
  const t = Math.min(1, Math.max(0, x))
  const lerp = (a:number[],b:number[]) => a.map((v,i)=> (Math.random() < (v*(1-t)+b[i]*t))?1:0)
  return {
    kick: lerp(basic.kick, busy.kick),
    snare: lerp(basic.snare, busy.snare),
    hat: lerp(basic.hat, busy.hat),
  }
}
