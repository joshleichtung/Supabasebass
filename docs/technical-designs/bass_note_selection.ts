const modes = { ionian:[0,2,4,5,7,9,11], dorian:[0,2,3,5,7,9,10] }
function pickBassNote(prev: number, keyRootMidi: number, mode='ionian', rn='I', complexity=0.3){
  const scale = modes[mode]
  const degreeMap:Record<string,number>={I:0,ii:1,iii:2,IV:3,V:4,vi:5,vii:6,i:0}
  const chordRoot = (keyRootMidi + scale[degreeMap[rn]??0])%12
  const chordTones = [0,4,7].map(i=> chordRoot + i) // major-ish; tweak per mode if needed
  const pool = complexity < 0.34 ? [0,7,12] : complexity < 0.67 ? [0,4,7,12] : [0,2,4,5,7,9,12]
  const candidates = pool.map(o=>chordRoot+o)
  return nearestTo(prev, candidates)
}
