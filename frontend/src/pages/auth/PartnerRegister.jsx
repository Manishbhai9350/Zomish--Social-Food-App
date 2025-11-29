import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from './AuthLayout'

const isEmail = (s) => /\S+@\S+\.\S+/.test(s)

const PartnerRegister = () => {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'', outlet:'' })
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isEmail(form.email)) return alert('Enter valid email')
    if (form.password !== form.confirm) return alert('Passwords do not match')
    // TODO: call partner register API
    alert('Partner registered (demo)')
  }

  return (
    <AuthLayout brand="Zomish Partners" leftEmoji="👨‍🍳🏬">
      <div className="form-header">
        <h2>Create partner account</h2>
        <p className="muted">Register your outlet and start receiving orders</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Owner / Manager Name</span>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Full name" required />
        </label>

        <label className="field">
          <span>Outlet Name</span>
          <input name="outlet" value={form.outlet} onChange={handleChange} placeholder="Outlet name" required />
        </label>

        <label className="field">
          <span>Business Email</span>
          <input name="email" value={form.email} onChange={handleChange} placeholder="business@outlet.com" required />
        </label>

        <label className="field">
          <span>Password</span>
          <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
        </label>

        <label className="field">
          <span>Confirm</span>
          <input type="password" name="confirm" value={form.confirm} onChange={handleChange} placeholder="Repeat password" required />
        </label>

        <button type="submit" className="btn primary">Create Account</button>

        <div className="form-foot">
          <Link to="/auth/partner/login" className="link">Already have an account? Sign in</Link>
        </div>
      </form>
    </AuthLayout>
  )
}

export default PartnerRegister