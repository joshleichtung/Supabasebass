import * as Tone from 'tone'
import { morphPattern, DrumPattern } from './engine' // Existing stub

export class DrumsEngine {
  private kick: Tone.MembraneSynth
  private snare: Tone.NoiseSynth
  private hihat: Tone.MetalSynth
  private filter: Tone.Filter
  private delay: Tone.FeedbackDelay
  private isPlaying = false
  private params = { x: 0.5, y: 0.5, stutter: false, filterAmount: 0, delayAmount: 0 }
  private currentPattern: DrumPattern = { kick: [], snare: [], hat: [] }
  private stutterBuffer: Array<{ type: 'kick' | 'snare' | 'hat'; time: number }> = []
  private lastKickTime = 0
  private lastSnareTime = 0
  private lastHatTime = 0
  private minTriggerInterval = 0.005 // Minimum 5ms between triggers per drum

  constructor(muted = false) {
    // Create kick drum
    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
    })

    // Create snare
    this.snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
    })

    // Create hi-hat
    this.hihat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    })

    // Create filter for FX
    this.filter = new Tone.Filter({
      type: 'lowpass',
      frequency: 20000,
      rolloff: -24
    })

    // Create delay for FX
    this.delay = new Tone.FeedbackDelay({
      delayTime: '8n',
      feedback: 0,
      wet: 0,
    })

    // Route through filter then delay
    this.kick.connect(this.filter)
    this.snare.connect(this.filter)
    this.hihat.connect(this.filter)
    this.filter.connect(this.delay)
    this.delay.toDestination()

    // Set volumes - mute for visualization-only (instrument views), audible for stage
    if (muted) {
      this.kick.volume.value = -Infinity
      this.snare.volume.value = -Infinity
      this.hihat.volume.value = -Infinity
    } else {
      this.kick.volume.value = -8
      this.snare.volume.value = -10
      this.hihat.volume.value = -20
    }
  }

  /**
   * Start the engine
   */
  async start() {
    await Tone.start()
    this.isPlaying = true
    this.currentPattern = morphPattern(this.params.x, this.params.y)
  }

  /**
   * Stop the engine
   */
  stop() {
    this.isPlaying = false
  }

  /**
   * Update XY parameters and FX
   */
  setParams(x: number, y: number, stutter = false, filterAmount = 0, delayAmount = 0) {
    this.params = { x, y, stutter, filterAmount, delayAmount }
    this.currentPattern = morphPattern(x, y) // Pass both X and Y for density and groove

    // Update filter cutoff based on filterAmount - smooth ramp to avoid clicks
    const minFreq = 200
    const maxFreq = 20000
    const targetFreq = minFreq + (maxFreq - minFreq) * (1 - filterAmount)
    this.filter.frequency.rampTo(targetFreq, 0.05) // 50ms smooth ramp

    // Update delay based on delayAmount
    this.delay.set({
      wet: delayAmount * 0.5, // Max 50% wet
      feedback: delayAmount * 0.6, // Max 60% feedback
    })
  }

  /**
   * Schedule drum hits
   */
  scheduleHit(time: number, stepIndex: number) {
    if (!this.isPlaying) return

    const step = stepIndex % 16
    const { stutter } = this.params

    const hitTime = time

    // Kick
    if (this.currentPattern.kick[step]) {
      // Prevent rapid triggers
      if (hitTime - this.lastKickTime >= this.minTriggerInterval) {
        try {
          this.kick.triggerAttackRelease('C1', '8n', hitTime)
          this.lastKickTime = hitTime
        } catch (e) {
          // Silently ignore conflicts
        }

        if (stutter) {
          this.stutterBuffer.push({ type: 'kick', time: hitTime })
        }
      }
    }

    // Snare - ghost notes are quieter (positions 4, 12 and others)
    if (this.currentPattern.snare[step]) {
      // Prevent rapid triggers
      if (hitTime - this.lastSnareTime >= this.minTriggerInterval) {
        // Main backbeat (positions 4, 12) at full volume, others are ghosts
        const isBackbeat = step === 4 || step === 12
        const velocity = isBackbeat ? 1.0 : 0.4 // Ghost notes much quieter
        try {
          this.snare.triggerAttackRelease('8n', hitTime, velocity)
          this.lastSnareTime = hitTime
        } catch (e) {
          // Silently ignore conflicts
        }

        if (stutter) {
          this.stutterBuffer.push({ type: 'snare', time: hitTime })
        }
      }
    }

    // Hi-hat - vary velocity for natural feel
    if (this.currentPattern.hat[step]) {
      // Prevent rapid triggers
      if (hitTime - this.lastHatTime >= this.minTriggerInterval) {
        const velocity = 0.4 + Math.random() * 0.3 // Vary hi-hat velocity
        try {
          this.hihat.triggerAttackRelease('32n', hitTime, velocity)
          this.lastHatTime = hitTime
        } catch (e) {
          // Silently ignore conflicts
        }

        if (stutter) {
          this.stutterBuffer.push({ type: 'hat', time: hitTime })
        }
      }
    }

    // Stutter effect: retrigger recent hits at 1/8th note
    if (stutter && this.stutterBuffer.length > 0) {
      const eighthNote = (60 / (Tone.getTransport().bpm.value || 90)) / 2
      this.stutterBuffer.forEach(({ type, time: originalTime }) => {
        if (hitTime - originalTime < eighthNote) {
          const stutterTime = hitTime + eighthNote / 8

          if (type === 'kick') {
            this.kick.triggerAttackRelease('C1', '32n', stutterTime, 0.5)
          } else if (type === 'snare') {
            this.snare.triggerAttackRelease('32n', stutterTime, 0.5)
          } else if (type === 'hat') {
            this.hihat.triggerAttackRelease('64n', stutterTime, 0.3)
          }
        }
      })

      // Clear old buffer entries
      this.stutterBuffer = this.stutterBuffer.filter(
        ({ time: t }) => hitTime - t < eighthNote * 2
      )
    }
  }

  /**
   * Get nodes for visualization
   */
  getNodes() {
    return {
      kick: this.kick,
      snare: this.snare,
      hihat: this.hihat,
      filter: this.filter,
    }
  }

  /**
   * Cleanup
   */
  dispose() {
    this.kick.dispose()
    this.snare.dispose()
    this.hihat.dispose()
    this.filter.dispose()
    this.delay.dispose()
  }
}
