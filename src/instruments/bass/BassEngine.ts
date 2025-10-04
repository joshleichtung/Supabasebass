import * as Tone from 'tone'
import { bassNoteFor } from './engine' // Existing stub

export class BassEngine {
  private synth: Tone.MonoSynth
  private lastNote = 48 // C2
  private isPlaying = false
  private params = { x: 0.5, y: 0.5 }

  constructor() {
    // Create bass synth
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
    }).toDestination()

    this.synth.volume.value = -8
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

    // Trigger note
    this.synth.triggerAttackRelease(freq, '16n', time, 0.8)
  }

  /**
   * Get current synth for volume/routing
   */
  getSynth() {
    return this.synth
  }

  /**
   * Cleanup
   */
  dispose() {
    this.synth.dispose()
  }
}
