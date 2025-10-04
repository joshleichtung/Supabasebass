// Bass instrument engine stub
export function bassNoteFor(x:number, y:number, key='C', mode='ionian', rn='I', prev=48){
  // x controls density externally; y controls complexity
  // Return MIDI note number for next trigger based on y
  const scale = {ionian:[0,2,4,5,7,9,11], dorian:[0,2,3,5,7,9,10]}[mode]||[0,2,4,5,7,9,11]
  const degreeMap:any = {I:0,ii:1,iii:2,IV:3,V:4,vi:5,vii:6,i:0}
  const keyMap:any = {C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11}
  const rootPc = (keyMap[key] + scale[degreeMap[rn]??0])%12
  const pools = [
    [0,7,12],
    [0,4,7,12],
    [0,2,4,5,7,9,12]
  ]
  const idx = y<0.34?0: y<0.67?1:2
  const candidates = pools[idx].map(o=> rootPc + 36 + o) // around C2..C4
  return candidates.reduce((best,c)=> Math.abs(c-prev)<Math.abs(best-prev)?c:best, candidates[0])
}
