---

### `docs/CODE_SUGGESTIONS.md`
```markdown
# Key Code Suggestions (Reference Snippets)

## 1) Supabase Realtime hook
```ts
import { createClient } from '@supabase/supabase-js'
export const sb = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!)

export function joinRoom(roomId: string, userId: string) {
  const ch = sb.channel(`room:${roomId}`, { config: { presence: { key: userId } } })
  ch.on('presence', { event: 'sync' }, () => {/* render presence */})
  ch.on('broadcast', { event: 'transport:state' }, ({ payload }) => applyTransport(payload))
  ch.on('broadcast', { event: 'transport:pulse' }, ({ payload }) => updateClock(payload))
  ch.on('broadcast', { event: 'instr:update' }, ({ payload }) => applyParams(payload))
  ch.subscribe(status => { if (status === 'SUBSCRIBED') ch.track({ userId }) })
  return ch
}