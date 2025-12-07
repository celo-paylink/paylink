import { Route, Routes } from 'react-router'
import HomePage from './pages/Home'
import NotFoundPage from './pages/NotFound'
import DashboardPage from './pages/Dashboard'
import CreatePaylinkPage from './pages/Create'
import ClaimHome from './pages/ClaimHome'
import Claim from './pages/Claim'
import Reclaim from './pages/Reclaim'
import ReclaimHome from './pages/ReclaimHome'
import GridBackground from './components/grid-background'

function App() {
  return (
    <>
      <GridBackground gridSize={30} glowRadius={5} />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreatePaylinkPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="claim">
          <Route index element={<ClaimHome />} />
          <Route path=":claimCode" element={<Claim />} />
        </Route>

        <Route path="reclaim">
          <Route index element={<ReclaimHome />} />
          <Route path=":claimCode" element={<Reclaim />} />
        </Route>


        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App

