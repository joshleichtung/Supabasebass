// Drums pattern morph stub
export type DrumPattern = { kick:number[], snare:number[], hat:number[] }

const basic: DrumPattern = {
  kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
  snare:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
  hat:Array(16).fill(1)
}
const busy: DrumPattern = {
  kick:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
  snare:[0,0,1,0,0,1,0,1,0,0,1,0,0,1,0,1],
  hat:Array(16).fill(1).map((_,i)=> i%2?1:0)
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
