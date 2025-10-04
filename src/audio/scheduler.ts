// Web Audio scheduler skeleton
export function createScheduler(audio: AudioContext, getBpm: ()=>number, scheduleStep: (time:number)=>void){
  let nextNoteTime = audio.currentTime
  const lookahead = 0.025
  const scheduleAhead = 0.12

  function tick(){
    const now = audio.currentTime
    const spb = 60 / getBpm()
    const stepDur = spb / 4 // 16ths
    while (nextNoteTime < now + scheduleAhead){
      scheduleStep(nextNoteTime)
      nextNoteTime += stepDur
    }
    setTimeout(tick, lookahead*1000)
  }
  tick()
}
