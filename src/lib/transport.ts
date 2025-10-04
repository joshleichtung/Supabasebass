/**
 * Transport and clock synchronization
 *
 * The host sends a heartbeat every 1 second with their performance.now() time.
 * Clients calculate an offset to sync their local clock to the host's clock.
 */

export interface TransportState {
  bpm: number
  keyRoot: string
  scaleMode: string
  isPlaying: boolean
  barStartHost: number // When the current bar started (in host time)
  barIndex: number // Current bar number
}

export class TransportClock {
  private hostOffset = 0 // Difference between host time and local time
  private lastSync = 0
  private readonly BEATS_PER_BAR = 4

  /**
   * Sync with host time from heartbeat
   */
  syncWithHost(hostNow: number) {
    const localNow = performance.now()
    this.hostOffset = hostNow - localNow
    this.lastSync = localNow
  }

  /**
   * Get current time in host's clock
   */
  getHostTime(): number {
    return performance.now() + this.hostOffset
  }

  /**
   * Calculate which bar we're in
   */
  getCurrentBar(state: TransportState): number {
    if (!state.isPlaying) return state.barIndex

    const hostNow = this.getHostTime()
    const elapsed = (hostNow - state.barStartHost) / 1000 // seconds
    const beatsPerSecond = state.bpm / 60
    const beatsPassed = elapsed * beatsPerSecond
    const barsPassed = Math.floor(beatsPassed / this.BEATS_PER_BAR)

    return state.barIndex + barsPassed
  }

  /**
   * Calculate beat position within current bar (0-3.999...)
   */
  getBeatInBar(state: TransportState): number {
    if (!state.isPlaying) return 0

    const hostNow = this.getHostTime()
    const elapsed = (hostNow - state.barStartHost) / 1000
    const beatsPerSecond = state.bpm / 60
    const beatsPassed = elapsed * beatsPerSecond

    return beatsPassed % this.BEATS_PER_BAR
  }

  /**
   * Calculate sixteenth note position (0-15.999...)
   */
  getSixteenthInBar(state: TransportState): number {
    return this.getBeatInBar(state) * 4
  }

  /**
   * Get time until next sixteenth note (for lookahead scheduling)
   */
  getTimeToNextSixteenth(state: TransportState): number {
    const sixteenth = this.getSixteenthInBar(state)
    const nextSixteenth = Math.ceil(sixteenth)
    const sixteenthsUntilNext = nextSixteenth - sixteenth
    const secondsPerBeat = 60 / state.bpm
    const secondsPerSixteenth = secondsPerBeat / 4

    return sixteenthsUntilNext * secondsPerSixteenth
  }

  /**
   * Check if we're synced (last sync within 5 seconds)
   */
  isSynced(): boolean {
    return (performance.now() - this.lastSync) < 5000
  }
}

/**
 * Generate heartbeat pulse data
 */
export function createHeartbeat(state: TransportState): {
  hostNow: number
  barIndex: number
  barStartHost: number
  bpm: number
  isPlaying: boolean
} {
  return {
    hostNow: performance.now(),
    barIndex: state.barIndex,
    barStartHost: state.barStartHost,
    bpm: state.bpm,
    isPlaying: state.isPlaying,
  }
}
