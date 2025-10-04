# Quick Start - 60 Second Test

## 1. Start Everything
```bash
# Terminal 1: Supabase
supabase start

# Terminal 2: App
npm run dev
```

**Verify**:
- ✅ Supabase shows "running" at http://127.0.0.1:54321
- ✅ Vite shows "ready" at http://localhost:5173

---

## 2. Create Room (10 seconds)
1. Open http://localhost:5173
2. Click "Create New Room"
3. Copy the 4-letter code (e.g., "K9FQ")

---

## 3. Test Bass (20 seconds)
1. Click "🎸 Bass" button
2. **Tap screen** to start audio
3. Move finger/mouse around:
   - **Left-Right**: Sparse → Dense notes
   - **Up-Down**: Simple → Complex harmonies
4. **Listen**: Bass should play and respond
5. **See**: Waveform oscilloscope visual

**✅ PASS**: Bass plays and responds to touch

---

## 4. Test Drums in Second Tab (20 seconds)
1. Open **new tab**: http://localhost:5173
2. Enter your room code
3. Click "🥁 Drums" button
4. **Tap screen** to start audio
5. Move around XY pad
6. Click "⚡ Stutter ON" button
7. **Listen**: Both bass and drums playing together!

**✅ PASS**: Two instruments in sync!

---

## 5. Test Conductor (10 seconds)
1. Open **third tab** with same room code
2. Click "📺 Conductor View"
3. **See**: Bass tile (1 player), Drums tile (1 player)
4. **See**: Playhead sweeping across
5. Tap Bass tile → highlights in gold

**✅ PASS**: All devices synced!

---

## Success! 🎉

You now have:
- ✅ Multi-device realtime sync
- ✅ Two working instruments
- ✅ Conductor view

**Full test suite**: See `DEMO_SCRIPT.md`

---

## Troubleshooting

**No sound?**
→ Click/tap screen first (browser audio policy)

**"Room not found"?**
→ Run: `supabase db reset`

**Still stuck?**
→ Check console (F12) for errors
→ Verify both running: `supabase status` + `npm run dev`
