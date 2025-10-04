import * as Tone from 'tone'
import { morphPattern, DrumPattern } from './engine' // Existing stub

export class DrumsEngine {
  private kick: Tone.MembraneSynth
  private snare: Tone.NoiseSynth
  private hihat: Tone.MetalSynth
  private filter: Tone.Filter
  private isPlaying = false
  private params = { x: 0.5, y: 0.5, stutter: false, filterAmount: 0 }
  private currentPattern: DrumPattern = { kick: [], snare: [], hat: [] }
  private stutterBuffer: Array<{ type: 'kick' | 'snare' | 'hat'; time: number }> = []

  constructor() {
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
      frequency: 200,
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

    // Route through filter
    this.kick.connect(this.filter)
    this.snare.connect(this.filter)
    this.hihat.connect(this.filter)
    this.filter.toDestination()

    // Set volumes
    this.kick.volume.value = -8
    this.snare.volume.value = -10
    this.hihat.volume.value = -20
  }

  /**
   * Start the engine
   */
  async start() {
    await Tone.start()
    this.isPlaying = true
    this.currentPattern = morphPattern(this.params.x)
    console.log('Drums engine started')
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
  setParams(x: number, y: number, stutter = false, filterAmount = 0) {
    this.params = { x, y, stutter, filterAmount }
    this.currentPattern = morphPattern(x)

    // Update filter cutoff based on filterAmount
    const minFreq = 200
    const maxFreq = 20000
    this.filter.frequency.value = minFreq + (maxFreq - minFreq) * (1 - filterAmount)
  }

  /**
   * Schedule drum hits
   */
  scheduleHit(time: number, stepIndex: number) {
    if (!this.isPlaying) return

    const step = stepIndex % 16
    const { y, stutter } = this.params

    // Apply swing/humanization (Y axis)
    // Higher Y = more humanization (random timing offset)
    const humanizationAmount = y * 0.03 // Up to 30ms
    const offset = (Math.random() - 0.5) * humanizationAmount

    const hitTime = time + offset

    // Kick
    if (this.currentPattern.kick[step]) {
      this.kick.triggerAttackRelease('C1', '8n', hitTime)

      if (stutter) {
        this.stutterBuffer.push({ type: 'kick', time: hitTime })
      }
    }

    // Snare
    if (this.currentPattern.snare[step]) {
      this.snare.triggerAttackRelease('8n', hitTime)

      if (stutter) {
        this.stutterBuffer.push({ type: 'snare', time: hitTime })
      }
    }

    // Hi-hat
    if (this.currentPattern.hat[step]) {
      const velocity = 0.3 + Math.random() * 0.4 // Vary hi-hat velocity
      this.hihat.triggerAttackRelease('32n', hitTime, velocity)

      if (stutter) {
        this.stutterBuffer.push({ type: 'hat', time: hitTime })
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
  }
}
