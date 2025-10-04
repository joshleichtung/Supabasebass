const lookahead = 0.025, scheduleAhead = 0.12
let nextNoteTime = 0
function scheduler() {
  const now = audio.currentTime
  while (nextNoteTime < now + scheduleAhead) {
    scheduleStep(nextNoteTime)
    nextNoteTime += (60/bpm)/4 // 16ths
  }
  setTimeout(scheduler, lookahead*1000)
}
