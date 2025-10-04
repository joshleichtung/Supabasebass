# Stretch Goals (Ranked)

**Implement only after `APPROVED_CORE.md` exists.**

## Rank 1 — Harmony/Chords Instrument
- XY: progression movement (stay vs change) and brightness (triads → 7ths/9ths).
- “Vibe” presets (chill, hopeful, tense) mapped to roman-numeral templates.
- Writes a bar-quantized progression timeline; Bass/Lead follow it.

**Acceptance**: switching vibe updates progression on the next bar boundary; bass follows cleanly.

## Rank 2 — Melody/Lead Instrument
- XY: range and rhythmic complexity with scale-aware phrase generation.
- Visual: floating notes with trail decay.

**Acceptance**: phrases adapt to chords; no dissonant outliers unless Y is high.

## Rank 3 — Datadog RUM Panel (Sponsor)
- Integrate Browser RUM to show live sessions, error rate, and a synthetic error that is handled.

**Acceptance**: projector can open a small RUM dashboard showing at least sessions and one handled error.

## Rank 4 — Audience “Vibe Suggestions”
- Public `/cue` page: collect tags; aggregate into a chosen vibe and target tempo.
- Apply at the next 8-bar boundary to minimize disruption.

**Acceptance**: submitting tags changes vibe/tempo at boundary, not mid-bar.

## Rank 5 — Edge Function “Bounce 4 Bars”
- Render a 4-bar MP3 preview of the current session and return a shareable link.

**Acceptance**: function returns an mp3 playable in modern browsers within 10 seconds.

## Rank 6 — Room Directory and Soft Moderation
- Lobby listing for active rooms and a “lock instrument” toggle.

**Acceptance**: users can discover and join an unlocked instrument in a listed room.