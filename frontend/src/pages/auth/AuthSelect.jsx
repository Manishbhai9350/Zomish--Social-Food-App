import React from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from './AuthLayout'

const UserIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="16" r="8" fill="var(--accent)" />
    <path d="M8 40c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const PartnerIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="10" width="36" height="28" rx="2" fill="none" stroke="var(--accent)" strokeWidth="2" />
    <path d="M6 18h36M18 18v20M30 18v20" stroke="var(--accent)" strokeWidth="2" />
    <circle cx="12" cy="14" r="1.5" fill="var(--accent)" />
    <circle cx="18" cy="14" r="1.5" fill="var(--accent)" />
    <circle cx="24" cy="14" r="1.5" fill="var(--accent)" />
  </svg>
)

const AuthCard = ({ icon: Icon, title, desc, toLogin, toRegister }) => (
  <div style={{
    padding: '24px',
    borderRadius: 'var(--radius)',
    background: `linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,154,60,0.04))`,
    border: '1px solid rgba(255,107,53,0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    transition: 'all 0.3s ease'
  }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
    <div style={{display:'flex',alignItems:'center',gap:12}}>
      <Icon />
      <div>
        <h3 style={{margin:0,fontSize:'18px',color:'#222'}}>{title}</h3>
        <p style={{margin:0,fontSize:'13px',color:'var(--muted)'}}>{desc}</p>
      </div>
    </div>

    <div style={{display:'flex',gap:8}}>
      <Link to={toLogin} className="btn primary" style={{flex:1,textAlign:'center',textDecoration:'none'}}>Login</Link>
      <Link to={toRegister} className="btn" style={{flex:1,textAlign:'center',textDecoration:'none',background:'transparent',border:'1.5px solid rgba(255,107,53,0.3)',color:'var(--accent)'}}>Register</Link>
    </div>
  </div>
)

const AuthSelect = () => {
  return (
    <AuthLayout>
      <div style={{display:'grid',gap:16}}>
        <AuthCard 
          icon={UserIcon} 
          title="User" 
          desc="Order food, save favorites" 
          toLogin="/auth/user/login" 
          toRegister="/auth/user/register" 
        />
        <AuthCard 
          icon={PartnerIcon} 
          title="Food Partner" 
          desc="Manage your outlet & orders" 
          toLogin="/auth/partner/login" 
          toRegister="/auth/partner/register" 
        />
      </div>
    </AuthLayout>
  )
}

export default AuthSelect