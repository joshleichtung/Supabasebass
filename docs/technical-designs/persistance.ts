const save = debounce(async (roomId:string, instrument:string, params:any) => {
  await sb.from('instrument_params').upsert({ room_id: roomId, instrument, params })
}, 3000)
