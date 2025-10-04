// Zod-validated event contracts
import { z } from 'zod'

export const TransportState = z.object({
  type: z.literal('transport:state'),
  payload: z.object({
    isPlaying: z.boolean(),
    bpm: z.number().min(40).max(200),
    barStartHost: z.number() // seconds in host clock
  })
})

export const TransportPulse = z.object({
  type: z.literal('transport:pulse'),
  payload: z.object({
    hostNow: z.number(),
    barIndex: z.number().int().nonnegative()
  })
})

export const InstrumentUpdate = z.object({
  type: z.literal('instr:update'),
  payload: z.object({
    instrument: z.enum(['bass','drums','harmony','melody']),
    params: z.object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      fx: z.record(z.any()).optional()
    }),
    ts: z.number() // ms in host time
  })
})

export const ProgressionSet = z.object({
  type: z.literal('prog:set'),
  payload: z.object({
    bar: z.number().int().nonnegative(),
    rn: z.string(),
    durationBars: z.number().int().positive(),
    ts: z.number()
  })
})

export const AnyEvent = z.union([TransportState, TransportPulse, InstrumentUpdate, ProgressionSet])
export type AnyEvent = z.infer<typeof AnyEvent>
