import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from './AuthLayout'

const isEmail = (s) => /\S+@\S+\.\S+/.test(s)
const isValidPassword = (p) => p.length >= 6
const isValidName = (n) => n.trim().length >= 2

const UserRegister = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const validateForm = () => {
    if (!isValidName(form.name)) {
      toast.error('Name must be at least 2 characters')
      return false
    }
    if (!isEmail(form.email)) {
      toast.error('Enter a valid email address')
      return false
    }
    if (!isValidPassword(form.password)) {
      toast.error('Password must be at least 6 characters')
      return false
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match')
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
      // const res = await fetch('/api/auth/user/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(form)
      // })
      // const data = await res.json()

      // Demo: simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('Account created! Redirecting...')
      // TODO: Redirect to login or dashboard
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout brand="Zomish" leftEmoji="🍛🍔🍣">
      <div className="form-header">
        <h2>Create an account</h2>
        <p className="muted">Join and discover local favorites</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Full Name</span>
          <input 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            placeholder="Your fullname" 
            disabled={loading}
            required 
          />
        </label>

        <label className="field">
          <span>Email</span>
          <input 
            name="email" 
            value={form.email} 
            onChange={handleChange} 
            placeholder="you@example.com" 
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

        <label className="field">
          <span>Confirm Password</span>
          <input 
            type="password" 
            name="confirm" 
            value={form.confirm} 
            onChange={handleChange} 
            placeholder="Repeat password" 
            disabled={loading}
            required 
          />
        </label>

        <button type="submit" className="btn primary" disabled={loading} style={{opacity: loading ? 0.6 : 1}}>
          {loading ? '⏳ Creating account...' : 'Create Account'}
        </button>

        <div className="form-foot">
          <Link to="/auth/user/login" className="link">Already have an account? Sign in</Link>
        </div>
      </form>
    </AuthLayout>
  )
}

export default UserRegister