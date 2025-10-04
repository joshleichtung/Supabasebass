import * as Tone from 'tone'
import { bassNoteFor } from './engine' // Existing stub

export class BassEngine {
  private synth: Tone.MonoSynth
  private volume: Tone.Volume
  private lastNote = 48 // C2
  private isPlaying = false
  private params = { x: 0.5, y: 0.5 }
  private lastTriggerTime = 0
  private minTriggerInterval = 0.01 // Minimum 10ms between triggers

  constructor(muted = false) {
    // Create volume node for muting control
    this.volume = new Tone.Volume(muted ? -Infinity : -8).toDestination()

    // Create bass synth - connect to volume node
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
    }).connect(this.volume)
  }

  /**
   * Start the engine (call after user interaction)
   */
  async start() {
    await Tone.start()
    this.isPlaying = true
    console.log('Bass engine started')
  }

  /**
   * Stop the engine
   */
  stop() {
    this.isPlaying = false
    this.synth.triggerRelease()
  }

  /**
   * Update XY parameters
   */
  setParams(x: number, y: number) {
    this.params = { x, y }
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
      // Silently ignore timing conflicts when multiple schedulers are running
      console.debug('Bass note scheduling conflict (expected with multiple windows):', e)
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
    this.volume.dispose()
  }
}
