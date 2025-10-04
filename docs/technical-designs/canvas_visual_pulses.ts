function pulse(x:number,y:number,color:string){
  sprites.push({x,y,r:4,alpha:1,color})
}
function render(){
  ctx.clearRect(0,0,w,h)
  sprites.forEach(s=>{
    ctx.globalAlpha=s.alpha
    ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fillStyle=s.color; ctx.fill()
    s.r+=0.8; s.alpha*=0.92
  })
  requestAnimationFrame(render)
}
