let hostId: string | null = null
let rtts: Record<string, number> = {}
function electHost(presence: any) {
  const ids = Object.keys(presence)
  hostId = ids.sort((a,b)=> (rtts[a]??Infinity)-(rtts[b]??Infinity))[0] ?? null
}
