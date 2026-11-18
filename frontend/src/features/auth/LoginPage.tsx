import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Store } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!isSupabaseConfigured) { setError('Supabase is not configured yet. Add your project URL and anon key in .env.local.'); return }
    if (!identifier.trim() || !password) { setError('Enter your email or mobile number and password.'); return }
    setBusy(true)
    try {
      // Supabase password login supports email or phone (when phone auth is configured).
      // Username/password requires a secure server-side authentication flow and is intentionally not emulated here.
      const credentials = identifier.includes('@')
        ? { email: identifier.trim(), password }
        : { phone: identifier.trim(), password }
      const { error: authError } = await supabase.auth.signInWithPassword(credentials)
      if (authError) throw authError
      navigate('/')
    } catch (err) { setError(err instanceof Error ? err.message : 'Login failed. Please try again.') }
    finally { setBusy(false) }
  }

  return <main className="auth-shell">
    <section className="auth-visual">
      <div className="brand brand-light"><span className="brand-mark"><Store size={21}/></span><span>Biz<span>Track</span></span></div>
      <div className="visual-copy"><div className="eyebrow"><span className="pulse-dot"/> BUSINESS, IN CONTROL</div><h1>Every detail.<br/><em>One clear view.</em></h1><p>Keep purchases, sales and payments organized — with a workspace made for your shop.</p>
        <div className="visual-stats"><div><strong>01</strong><span>Simple records</span></div><div><strong>02</strong><span>Clear balances</span></div><div><strong>03</strong><span>Your data</span></div></div>
      </div>
      <div className="visual-foot"><ShieldCheck size={16}/> Private workspace for authorized shop admins</div>
    </section>
    <section className="auth-panel"><div className="auth-card">
      <div className="mobile-brand brand"><span className="brand-mark"><Store size={20}/></span><span>Biz<span>Track</span></span></div>
      <div className="form-heading"><div className="form-icon"><LockKeyhole size={20}/></div><div className="eyebrow muted">YOUR WORKSPACE</div><h2>Welcome back</h2><p>Sign in to continue to your dashboard.</p></div>
      <form onSubmit={submit} className="form-stack">
        <label className="field-label">Email or mobile number</label>
        <div className="input-wrap"><Mail size={17}/><input autoComplete="username" value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="you@business.com or +91…" /></div>
        <div className="label-row"><label className="field-label">Password</label><Link to="/forgot-password">Forgot password?</Link></div>
        <div className="input-wrap"><LockKeyhole size={17}/><input type={show?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"/><button type="button" className="icon-button" onClick={()=>setShow(!show)} aria-label="Toggle password">{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div>
        <label className="check-row"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/> Keep me signed in on this device</label>
        {error && <div className="alert error">{error}</div>}
        <button className="primary-button" disabled={busy}>{busy?'Signing in…':'Sign in'} <ArrowRight size={17}/></button>
      </form>
      <div className="auth-divider"><span>NEW TO BIZTRACK?</span></div>
      <Link className="secondary-button" to="/register">Create a shop account</Link>
      <p className="fine-print">Access is available only to approved shop administrators.</p>
      {!isSupabaseConfigured && <div className="alert info">Setup mode: connect Supabase to activate real authentication.</div>}
    </div><div className="panel-footer">© {new Date().getFullYear()} BizTrack · Built for clearer business records</div></section>
  </main>
}
