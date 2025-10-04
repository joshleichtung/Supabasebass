import * as Tone from 'tone'
import { bassNoteFor } from './engine' // Existing stub

export class BassEngine {
  private synth: Tone.MonoSynth
  private volume: Tone.Volume
  private autoWah: Tone.AutoWah
  private filter: Tone.Filter
  private delay: Tone.FeedbackDelay
  private lastNote = 48 // C2
  private isPlaying = false
  private params = { x: 0.5, y: 0.5 }
  private lastTriggerTime = 0
  private minTriggerInterval = 0.01 // Minimum 10ms between triggers

  // FX state
  private fxState = {
    autoWah: false,
    filterAmount: 0,
    delayAmount: 0,
  }

  constructor(muted = false) {
    // Create volume node for muting control
    this.volume = new Tone.Volume(muted ? -Infinity : -8).toDestination()

    // Create effects chain
    this.autoWah = new Tone.AutoWah({
      baseFrequency: 100,
      octaves: 6,
      sensitivity: 0,
      Q: 2,
      gain: 2,
      follower: {
        attack: 0.3,
        release: 0.5,
      },
    })

    this.filter = new Tone.Filter({
      type: 'lowpass',
      frequency: 20000, // Fully open by default
      Q: 1,
    })

    this.delay = new Tone.FeedbackDelay({
      delayTime: '8n',
      feedback: 0,
      wet: 0,
    })

    // Create bass synth - connect through effects chain
    this.synth = new Tone.MonoSynth({
      oscillator: {
        type: 'sawtooth'
      },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.3,
        release: 0.8
      },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.5,
        release: 0.8,
        baseFrequency: 100,
        octaves: 3.5
      }
    })
      .connect(this.autoWah)
      .connect(this.filter)
      .connect(this.delay)
      .connect(this.volume)
  }

  /**
   * Start the engine (call after user interaction)
   */
  async start() {
    await Tone.start()
    this.isPlaying = true
  }

  /**
   * Stop the engine
   */
  stop() {
    this.isPlaying = false
    this.synth.triggerRelease()
  }

  /**
   * Update XY parameters and FX
   */
  setParams(x: number, y: number, fx?: {
    autoWah?: boolean
    filterAmount?: number
    delayAmount?: number
  }) {
    this.params = { x, y }

    if (fx) {
      // Auto-wah toggle
      if (fx.autoWah !== undefined && fx.autoWah !== this.fxState.autoWah) {
        this.fxState.autoWah = fx.autoWah
        this.autoWah.set({ sensitivity: fx.autoWah ? -40 : 0 })
      }

      // Filter sweep (0 = open, 1 = closed)
      if (fx.filterAmount !== undefined && fx.filterAmount !== this.fxState.filterAmount) {
        this.fxState.filterAmount = fx.filterAmount
        const filterFreq = 20000 * (1 - fx.filterAmount) + 200 * fx.filterAmount
        this.filter.set({ frequency: filterFreq })
      }

      // Delay amount (0 = off, 1 = max)
      if (fx.delayAmount !== undefined && fx.delayAmount !== this.fxState.delayAmount) {
        this.fxState.delayAmount = fx.delayAmount
        this.delay.set({
          wet: fx.delayAmount * 0.5, // Max 50% wet
          feedback: fx.delayAmount * 0.6, // Max 60% feedback
        })
      }
    }
  }

  /**
   * Schedule a note at a specific time
   * @param time - Tone.js context time
   * @param stepIndex - 0-15 (sixteenth note index)
   * @param keyRoot - Current key
   * @param scaleMode - Current scale mode
   * @param romanNumeral - Current chord
   */
  scheduleNote(
    time: number,
    stepIndex: number,
    keyRoot: string,
    scaleMode: string,
    romanNumeral: string
  ) {
    if (!this.isPlaying) return

    const { x, y } = this.params

    // Density control (X axis)
    // At x=0, play on 1 and 9 (sparse)
    // At x=1, play on all 16ths (constant)
    const densityThreshold = Math.pow(x, 2) // Exponential curve
    const sparsePattern = [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0] // 1 and 9
    const densPattern = Array(16).fill(1) // All 16ths

    // Interpolate between patterns
    const shouldPlay = Math.random() < (
      sparsePattern[stepIndex] * (1 - densityThreshold) +
      densPattern[stepIndex] * densityThreshold
    )

    if (!shouldPlay) return

    // Note selection (Y axis controls complexity)
    const midiNote = bassNoteFor(x, y, keyRoot, scaleMode, romanNumeral, this.lastNote, stepIndex)
    this.lastNote = midiNote

    // Convert MIDI to frequency
    const freq = Tone.Frequency(midiNote, 'midi').toFrequency()

    // Prevent rapid triggers - ensure minimum time between notes
    if (time - this.lastTriggerTime < this.minTriggerInterval) {
      return
    }

    // Trigger note - wrap in try-catch to handle timing conflicts
    try {
      this.synth.triggerAttackRelease(freq, '16n', time, 0.8)
      this.lastTriggerTime = time
    } catch (e) {
      // Silently ignore timing conflicts
    }
  }

  /**
   * Get synth for visualization
   */
  getSynth() {
    return this.synth
  }

  /**
   * Cleanup
   */
  dispose() {
    this.synth.dispose()
    this.autoWah.dispose()
    this.filter.dispose()
    this.delay.dispose()
    this.volume.dispose()
  }
}
