import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from './AuthLayout'

const isEmail = (s) => /\S+@\S+\.\S+/.test(s)

const PartnerLogin = () => {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const validateForm = () => {
    if (!isEmail(form.email)) {
      toast.error('Enter a valid email address')
      return false
    }
    if (!form.password) {
      toast.error('Password is required')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const res = await fetch('/api/auth/partner/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(form)
      // })
      // const data = await res.json()

      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('Signed in successfully!')
      // TODO: Redirect to dashboard
    } catch (err) {
      toast.error(err.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout brand="Zomish Partners" leftEmoji="👨‍🍳🏬">
      <div className="form-header">
        <h2>Partner Sign in</h2>
        <p className="muted">Manage your outlet and orders</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Email</span>
          <input 
            name="email" 
            value={form.email} 
            onChange={handleChange} 
            placeholder="owner@restaurant.com" 
            disabled={loading}
            required 
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input 
            type="password" 
            name="password" 
            value={form.password} 
            onChange={handleChange} 
            placeholder="••••••••" 
            disabled={loading}
            required 
          />
        </label>

        <button type="submit" className="btn primary" disabled={loading} style={{opacity: loading ? 0.6 : 1}}>
          {loading ? '⏳ Signing in...' : 'Sign In'}
        </button>

        <div className="form-foot">
          <Link to="/auth/partner/register" className="link">Create partner account</Link>
          <button type="button" className="btn ghost" onClick={() => toast.error('Feature coming soon')} disabled={loading}>Forgot?</button>
        </div>
      </form>
    </AuthLayout>
  )
}

export default PartnerLogin