import { supabase } from './supabase'
import { generateShortCode } from '../utils/short-code'
import type { Room, Transport, Progression } from '../types/room'

/**
 * Create a new room with a short code
 */
export async function createRoom(): Promise<{ room: Room; code: string }> {
  const code = generateShortCode()

  // Create room
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({ name: code })
    .select()
    .single()

  if (roomError || !room) {
    console.error('Failed to create room:', roomError)
    throw new Error('Failed to create room')
  }

  // Create default transport
  const { error: transportError } = await supabase
    .from('transport')
    .insert({
      room_id: room.id,
      bpm: 90,
      key_root: 'C',
      scale_mode: 'ionian',
      bar_start: new Date().toISOString(),
      is_playing: true,
    })

  if (transportError) {
    console.error('Failed to create transport:', transportError)
    throw new Error('Failed to create transport')
  }

  // Create default progression (I-IV-V-I in C)
  const defaultProgression: Omit<Progression, 'room_id'>[] = [
    { bar: 0, rn: 'I', duration_bars: 1 },
    { bar: 1, rn: 'IV', duration_bars: 1 },
    { bar: 2, rn: 'V', duration_bars: 1 },
    { bar: 3, rn: 'I', duration_bars: 1 },
  ]

  const { error: progressionError } = await supabase
    .from('progression')
    .insert(defaultProgression.map(p => ({ ...p, room_id: room.id })))

  if (progressionError) {
    console.error('Failed to create progression:', progressionError)
  }

  return { room, code }
}

/**
 * Join an existing room by code
 */
export async function joinRoom(code: string): Promise<{ room: Room; transport: Transport; progression: Progression[] } | null> {
  // Find room by name (which is the code)
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select()
    .eq('name', code)
    .single()

  if (roomError || !room) {
    console.error('Room not found:', code, roomError)
    return null
  }

  // Load transport
  const { data: transport, error: transportError } = await supabase
    .from('transport')
    .select()
    .eq('room_id', room.id)
    .single()

  if (transportError || !transport) {
    console.error('Transport not found:', transportError)
    return null
  }

  // Load progression
  const { data: progression, error: progressionError } = await supabase
    .from('progression')
    .select()
    .eq('room_id', room.id)
    .order('bar', { ascending: true })

  if (progressionError) {
    console.error('Failed to load progression:', progressionError)
  }

  return {
    room,
    transport,
    progression: progression || [],
  }
}

/**
 * Load instrument params for a room
 */
export async function loadInstrumentParams(roomId: string, instrument: 'bass' | 'drums' | 'harmony' | 'melody') {
  const { data, error } = await supabase
    .from('instrument_params')
    .select()
    .eq('room_id', roomId)
    .eq('instrument', instrument)
    .maybeSingle()

  if (error) {
    console.error('Failed to load instrument params:', error)
    return null
  }

  return data
}

/**
 * Save instrument params (debounced on caller side)
 */
export async function saveInstrumentParams(
  roomId: string,
  instrument: 'bass' | 'drums' | 'harmony' | 'melody',
  params: { x: number; y: number; fx?: Record<string, unknown> }
) {
  const { error } = await supabase
    .from('instrument_params')
    .upsert({
      room_id: roomId,
      instrument,
      params,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Failed to save instrument params:', error)
  }
}

/**
 * Update transport state
 */
export async function updateTransport(
  roomId: string,
  updates: Partial<Omit<Transport, 'room_id'>>
) {
  const { error } = await supabase
    .from('transport')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('room_id', roomId)

  if (error) {
    console.error('Failed to update transport:', error)
  }
}
