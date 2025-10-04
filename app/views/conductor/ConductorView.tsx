import React from 'react'
export default function ConductorView(){
  return (
    <div className="conductor">
      <div className="badges">
        <span>Tempo: 90</span>
        <span>Key: C Ionian</span>
      </div>
      <div className="playhead" />
      <div className="tiles">
        <div className="tile bass">Bass</div>
        <div className="tile drums">Drums</div>
        <div className="tile harmony">Harmony</div>
        <div className="tile melody">Melody</div>
      </div>
    </div>
  )
}
