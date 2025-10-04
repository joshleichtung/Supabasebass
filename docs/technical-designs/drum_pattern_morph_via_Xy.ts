const banks = {
  basic: { kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], snare:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0], hat:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]},
  busy:  { /* denser arrays */ }
}
function morph(a:number[], b:number[], t:number){ return a.map((v,i)=> Math.random() < (v*(1-t)+b[i]*t) ? 1:0) }
function patternFromXY(x:number,y:number){ 
  const p = {kick:morph(banks.basic.kick, banks.busy.kick, x), /* snare, hat similar */ }
  const swing = y*0.15  // 0..15% swing
  return { p, swing }
}
