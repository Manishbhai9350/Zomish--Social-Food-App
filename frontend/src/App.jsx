import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthSelect from './pages/auth/AuthSelect'
import UserLogin from './pages/auth/UserLogin'
import UserRegister from './pages/auth/UserRegister'
import PartnerLogin from './pages/auth/PartnerLogin'
import PartnerRegister from './pages/auth/PartnerRegister'
import './App.css'
import Auth from './pages/auth/Auth'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<AuthSelect />} />
        <Route path="/auth/user/login" element={<UserLogin />} />
        <Route path="/auth/user/register" element={<UserRegister />} />
        <Route path="/auth/partner/login" element={<PartnerLogin />} />
        <Route path="/auth/partner/register" element={<PartnerRegister />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App