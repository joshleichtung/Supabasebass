// Centralized channel name helpers
export function channelNames(roomId: string) {
  return {
    presence: `room:${roomId}:presence`,
    transport: `room:${roomId}:transport`,
    bass: `room:${roomId}:bass`,
    drums: `room:${roomId}:drums`,
    harmony: `room:${roomId}:harmony`,
    melody: `room:${roomId}:melody`,
    progression: `room:${roomId}:progression`,
  } as const
}

export type ChannelKeys = keyof ReturnType<typeof channelNames>;
