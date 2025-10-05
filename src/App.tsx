import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingView from './views/LandingView'
import BassView from './views/BassView'
import DrumsView from './views/DrumsView'
import StageView from './views/StageView'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingView />} />
        <Route path="/bass" element={<BassView />} />
        <Route path="/drums" element={<DrumsView />} />
        <Route path="/stage" element={<StageView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
