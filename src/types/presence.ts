export interface PresenceState {
  user_id: string
  name: string
  instrument: 'bass' | 'drums' | 'harmony' | 'melody' | 'stage' | null
  joined_at: string
  is_host: boolean
}

export interface TransportClock {
  hostNow: number  // Host's performance.now() value
  barIndex: number // Current bar number
  barStartHost: number // Host's performance.now() when bar started
  bpm: number
  isPlaying: boolean
}
