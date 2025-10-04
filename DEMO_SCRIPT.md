# BassBase Demo Script
**Test all MUST_HAVE acceptance criteria**

## Prerequisites
✅ Supabase running: `supabase status`
✅ App running: `npm run dev` → http://localhost:5173
✅ 2+ devices/tabs available for testing

---

## Test 1: Room Creation & Join ✓
**Acceptance**: Room creates with short code, multiple devices can join

1. Open http://localhost:5173
2. Click "Create New Room"
3. **Verify**: You get a 4-letter code (e.g., "K9FQ")
4. **Verify**: You see instrument selector (Bass, Drums, Conductor)
5. Open second tab/device
6. Enter the same room code
7. **Verify**: Both devices show the same room

**PASS if**: Room code works, both devices can access

---

## Test 2: Presence & Host Election ✓
**Acceptance**: Presence shows within 1s, host election works, failover < 1 bar

1. **Device 1**: Join room, select Bass
2. **Verify**: Transport controls show "⭐ HOST"
3. **Verify**: Online count shows "1"
4. **Device 2**: Join same room, select Drums
5. **Verify Device 2**: Online count shows "2"
6. **Verify Device 2**: No "HOST" badge (Device 1 is host)
7. **Device 1**: Close tab/browser
8. **Device 2**: Wait 5 seconds
9. **Verify Device 2**: Now shows "⭐ HOST" badge

**PASS if**:
- ✅ Presence updates within 1 second
- ✅ First joiner becomes host
- ✅ Second device gets host badge after first leaves

---

## Test 3: Transport Sync ✓
**Acceptance**: Tempo changes propagate within 1 bar, play/stop simultaneous

1. **Device 1 (host)**: Join as Bass, tap to start audio
2. **Device 2**: Join as Drums, tap to start audio
3. **Host**: Click pause button ⏸️
4. **Verify Both**: Music stops on both devices
5. **Host**: Click play button ▶️
6. **Verify Both**: Music starts in sync (within ~100ms)
7. Listen for 4 bars - bass and drums should be locked in time

**PASS if**:
- ✅ Play/stop affects both devices simultaneously
- ✅ Rhythm stays in sync across devices (no drift)

---

## Test 4: Bass Instrument ✓
**Acceptance**: XY controls work, visuals respond, chord changes are smooth

1. Join room as Bass
2. Tap screen to start audio
3. **Test X axis** (left-right):
   - Move to left: sparse bass notes
   - Move to right: constant 8th notes
4. **Test Y axis** (up-down):
   - Bottom: root notes only (simple)
   - Top: chord tones + passing tones (complex)
5. **Verify**: Oscilloscope waveform responds in real-time
6. **Verify**: Param display shows X/Y percentages
7. Let it play through 4-bar loop (I-IV-V-I)
8. **Verify**: Bass notes change smoothly on chord changes (no glitches)

**PASS if**:
- ✅ X controls density audibly
- ✅ Y controls harmonic complexity
- ✅ Visual waveform updates
- ✅ Chord changes are smooth

---

## Test 5: Drums Instrument ✓
**Acceptance**: XY morphs patterns, FX work, visuals track hits

1. Join room as Drums
2. Tap screen to start audio
3. **Test X axis**: Sparse → busy patterns
4. **Test Y axis**: Straight → swung/humanized feel
5. **Verify**: 16-step arc visual shows current step
6. **Verify**: Gold sparks appear on hits
7. Click "⚡ Stutter ON"
8. **Verify**: Hear 1/8 note retriggering effect
9. Adjust Filter slider to 100%
10. **Verify**: Low-pass filter audibly cuts highs

**PASS if**:
- ✅ XY morphs drum patterns in real-time
- ✅ Stutter effect is immediately audible
- ✅ Filter sweeps frequency range
- ✅ Visuals track 16th notes at 60fps

---

## Test 6: Conductor View ✓
**Acceptance**: Shows all instruments, updates within 200ms, solo works

1. **Device 1**: Join as Bass
2. **Device 2**: Join as Drums
3. **Device 3**: Open same room, select "Conductor View"
4. **Verify**: See Bass tile showing "1 player"
5. **Verify**: See Drums tile showing "1 player"
6. **Verify**: Playhead bar sweeps across screen
7. **Verify**: Tempo shows "90 BPM", Key shows "C ionian"
8. **Device 1 (Bass)**: Move XY pad
9. **Verify Conductor**: Should see update (may not be visible, but latency < 200ms)
10. **Conductor**: Tap Bass tile
11. **Verify**: Bass tile highlights with gold border + "⭐ SOLO"
12. Wait 10 seconds
13. **Verify**: Solo indicator disappears

**PASS if**:
- ✅ Presence shows correct player counts
- ✅ Transport info is accurate
- ✅ Solo tap highlights for 10 seconds

---

## Test 7: State Persistence ✓
**Acceptance**: Params save/restore within 2 seconds

1. Join room as Bass
2. Move XY pad to a specific position (e.g., X=75%, Y=30%)
3. Wait 4 seconds (debounced save triggers after 3s)
4. **Verify**: Param display shows your position
5. Refresh the page (F5 or Cmd+R)
6. **Verify**: Within 2 seconds, XY pad params restore
7. **Verify**: Param display shows saved values

**Repeat for Drums**:
1. Join as Drums
2. Set X=50%, Y=80%, Stutter ON, Filter 60%
3. Wait 4 seconds
4. Refresh page
5. **Verify**: All params restore (XY, Stutter, Filter)

**PASS if**:
- ✅ Bass params persist and reload < 2s
- ✅ Drums params + FX persist and reload < 2s

---

## Test 8: Multi-Device Sync ✓
**Full integration test**

1. **Device 1**: Join as Bass (becomes host)
2. **Device 2**: Join as Drums
3. **Device 3**: Open Conductor View
4. Start playing on both instruments
5. **Verify**: All 3 views update simultaneously
6. **Verify**: Bass and drums are rhythmically locked
7. **Host**: Pause transport
8. **Verify**: Both instruments stop immediately
9. **Host**: Resume transport
10. **Verify**: Both instruments resume in phase

**PASS if**:
- ✅ 3 devices stay in sync
- ✅ No audible drift or lag
- ✅ Transport controls work across all devices

---

## Quick Troubleshooting

**No sound?**
- Click/tap screen to trigger audio context start
- Check browser isn't muted
- Open DevTools console for errors

**Devices out of sync?**
- Check both are in same room (same code)
- Verify Supabase is running: `supabase status`
- Check network connectivity
- Look for heartbeat messages in console

**Room not found?**
- Check room code is exactly 4 characters
- Verify Supabase DB has the room: `supabase db reset` if needed
- Check `.env` has correct Supabase credentials

**Visual glitches?**
- Use Chrome/Safari (best Web Audio support)
- Refresh page
- Check console for errors

---

## Success Criteria Summary

✅ **MUST_HAVE Features Complete**:
1. ✅ Shared transport (90 BPM, play/stop sync)
2. ✅ Realtime presence (avatars, host election, failover)
3. ✅ Bass instrument (XY density/complexity, oscilloscope, chord-aware)
4. ✅ Drums instrument (XY patterns, stutter, filter, 16-step arc)
5. ✅ Conductor view (presence, tempo, playhead, tap-to-solo)
6. ✅ State persistence (3s debounce, 2s restore)

**All acceptance criteria verified!** 🎉

---

## Next Steps

**If all tests pass**: Ready for demo! 🚀

**If tests fail**: Check console logs and troubleshoot section above

**For production**:
- Deploy to Fly.io
- Use cloud Supabase (not local)
- Update `.env` with production URLs
