// Bass instrument engine stub
export function bassNoteFor(_x:number, y:number, key='C', mode='ionian', rn='I', _prev=48, stepIndex=0){
  // _x controls density externally (handled by caller); y controls complexity
  // Return MIDI note number for next trigger based on y
  const scale = {ionian:[0,2,4,5,7,9,11], dorian:[0,2,3,5,7,9,10]}[mode]||[0,2,4,5,7,9,11]
  const degreeMap:any = {I:0,ii:1,iii:2,IV:3,V:4,vi:5,vii:6,i:0}
  const keyMap:any = {C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11}
  const rootPc = (keyMap[key] + scale[degreeMap[rn]??0])%12

  // Define pools with more variety: root, fifth, octave, third, seventh
  // Pool 0 (simple): root, fifth, octave
  // Pool 1 (medium): add third
  // Pool 2 (complex): add seventh and scale steps
  const pools = [
    [0, 7, 12],                    // Simple: root, fifth, octave
    [0, 4, 7, 12],                 // Medium: add major third
    [0, 4, 7, 10, 11, 12]          // Complex: add minor 7th, major 7th
  ]

  const idx = y < 0.34 ? 0 : y < 0.67 ? 1 : 2
  const pool = pools[idx]

  // Create walking bass pattern based on stepIndex
  // Instead of always picking closest note, cycle through intervals
  const patternLength = pool.length
  const patternIndex = Math.floor(stepIndex / 4) % patternLength // Change every 4 steps

  // Get the interval to use from the pool
  const interval = pool[patternIndex]

  // Choose octave based on Y parameter and stepIndex
  // Lower Y = lower octave, higher Y = more octave variation
  const baseOctave = 36 // C2
  const octaveVariation = y > 0.7 ? (stepIndex % 8 < 4 ? 0 : 12) : 0 // Add octave jumps when complex

  const targetNote = rootPc + baseOctave + interval + octaveVariation

  return targetNote
}
