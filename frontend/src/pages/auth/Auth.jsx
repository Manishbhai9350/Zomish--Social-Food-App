import React, { useState } from 'react'
import '../../App.css' // using same CSS file

// Simple validation helper
const isEmail = (s) => /\S+@\S+\.\S+/.test(s)

const Auth = () => {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: ''
  })
  const toggle = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'))
    setForm({ name: '', email: '', password: '', confirm: '' })
  }
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isEmail(form.email)) {
      alert('Please enter a valid email')
      return
    }
    if (mode === 'register' && form.password !== form.confirm) {
      alert('Passwords do not match')
      return
    }
    // Placeholder: wire to API / auth logic
    alert(`${mode === 'login' ? 'Logged in' : 'Registered'} (demo)`)
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-left">
          <h1 className="brand">Zomish</h1>
          <p className="tagline">Taste the city — curated food for every mood.</p>
          <div className="hero-food">🍜🍕🥗</div>
        </div>

        <div className="auth-right">
          <div className="form-header">
            <h2>{mode === 'login' ? 'Welcome back' : 'Create an account'}</h2>
            <p className="muted">{mode === 'login' ? 'Sign in to continue ordering' : 'Join and discover local favorites'}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label className="field">
                <span>Full Name</span>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Your fullname" required />
              </label>
            )}

            <label className="field">
              <span>Email</span>
              <input name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
            </label>

            <label className="field">
              <span>Password</span>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
            </label>

            <button type="submit" className="btn primary">{mode === 'login' ? 'Sign In' : 'Create Account'}</button>

            {mode === 'login' ? (
              <div className="form-foot">
                <button type="button" className="btn ghost" onClick={() => alert('Forgot password flow (demo)')}>Forgot password?</button>
                <p>New here? <button type="button" className="link" onClick={toggle}>Create account</button></p>
              </div>
            ) : (
              <div className="form-foot">
                <p>Already have an account? <button type="button" className="link" onClick={toggle}>Sign in</button></p>
              </div>
            )}
          </form>
        </div>
      </div>
      <footer className="auth-footer">Delivery • Pickup • Offers</footer>
    </div>
  )
}

export default Auth