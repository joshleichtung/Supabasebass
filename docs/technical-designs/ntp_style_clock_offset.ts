async function measureOffset(send: (msg:any)=>void) {
  const samples:number[] = []
  for (let i=0;i<5;i++){
    const t0=performance.now()
    send({ type:'ping', payload:{ t0 } })
    const { t1, t2 } = await waitFor('pong') // host echoes back {t1=hostRecv, t2=hostSend}
    const t3=performance.now()
    const rtt=(t3-t0)-(t2-t1)
    const offset=((t1 - t0) + (t2 - t3))/2
    samples.push(offset)
  }
  return samples.sort((a,b)=>Math.abs(a)-Math.abs(b))[0]
}
