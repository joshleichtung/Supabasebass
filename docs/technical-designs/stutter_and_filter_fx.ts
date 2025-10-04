// Filter: one global BiquadFilterNode with Q≈10, frequency mapped 200..8000 Hz by a macro knob
filter.frequency.value = 200 + macro*7800

// Stutter: schedule rapid retriggers into a short DelayNode
if (stutter) {
  const t = audio.currentTime
  for (let i=0;i<4;i++) scheduleStep(t + i*(60/bpm)/2) // 1/8s
}
