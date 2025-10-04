import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingView from './views/LandingView'
import BassView from './views/BassView'
import DrumsView from './views/DrumsView'
import ConductorView from './views/ConductorView'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingView />} />
        <Route path="/bass" element={<BassView />} />
        <Route path="/drums" element={<DrumsView />} />
        <Route path="/conductor" element={<ConductorView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
