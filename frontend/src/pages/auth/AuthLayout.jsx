import React from 'react'
import '../../App.css'

const AuthLayout = ({ brand = 'Zomish', children, leftEmoji = '🍜🍕🥗', tagline }) => {
  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-left">
          <h1 className="brand">{brand}</h1>
          <p className="tagline">{tagline || 'Taste the city — curated food for every mood.'}</p>
          <div className="hero-food">{leftEmoji}</div>
        </div>

        <div className="auth-right">
          {children}
        </div>
      </div>
      <footer className="auth-footer">Delivery • Pickup • Offers</footer>
    </div>
  )
}

export default AuthLayout