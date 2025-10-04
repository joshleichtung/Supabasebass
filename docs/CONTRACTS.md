# Event Contracts (Human Readable)

See `app/realtime/contracts.ts` for Zod schemas that enforce these at runtime.

## transport:state
```json
{ "type": "transport:state", "payload": { "isPlaying": true, "bpm": 90, "barStartHost": 123456.7 } }
```

## transport:pulse
```json
{ "type": "transport:pulse", "payload": { "hostNow": 123456.7, "barIndex": 12 } }
```

## instr:update
```json
{ "type": "instr:update", "payload": { "instrument": "bass", "params": {"x":0.6, "y":0.3, "fx": {"stutter": false}}, "ts": 1700000000000 } }
```

## prog:set (stretch)
```json
{ "type": "prog:set", "payload": { "bar": 8, "rn": "V", "durationBars": 1, "ts": 1700000000000 } }
```
