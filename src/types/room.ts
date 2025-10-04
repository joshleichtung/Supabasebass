export interface Room {
  id: string
  name: string
  created_at: string
}

export interface Transport {
  room_id: string
  bpm: number
  key_root: string
  scale_mode: string
  bar_start: string
  is_playing: boolean
  updated_at: string | null
}

export interface InstrumentParams {
  room_id: string
  instrument: 'bass' | 'drums' | 'harmony' | 'melody'
  params: {
    x: number
    y: number
    fx?: Record<string, unknown>
  }
  updated_at: string | null
}

export interface Progression {
  room_id: string
  bar: number
  rn: string
  duration_bars: number
}
