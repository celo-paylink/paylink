import { Route, Routes } from 'react-router'
import HomePage from './pages/Home'
import NotFoundPage from './pages/NotFound'
import DashboardPage from './pages/Dashboard'
import CreatePaylinkPage from './pages/Create'
import ClaimHome from './pages/ClaimHome'
import Claim from './pages/Claim'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<CreatePaylinkPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />

      <Route path="claim">
        <Route index element={<ClaimHome />} />
        <Route path=":claimCode" element={<Claim />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
