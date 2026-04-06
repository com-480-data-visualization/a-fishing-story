import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Home from './pages/Home'
import About from './pages/About'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/map" element={<Home />} />
      <Route path="/about" element={<About />} />
    </Routes>
  )
}

export default App
