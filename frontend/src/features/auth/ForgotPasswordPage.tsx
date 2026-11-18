import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
export default function ForgotPasswordPage(){
 const [email,setEmail]=useState('');const [message,setMessage]=useState('');const [error,setError]=useState('')
 async function submit(e:React.FormEvent){e.preventDefault();setError('');setMessage('');if(!isSupabaseConfigured){setError('Configure Supabase first.');return}
 const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/login'})
 if(error)setError(error.message);else setMessage('If the address is registered, password reset instructions will be sent.')}
 return <main className="simple-auth"><div className="register-card"><Link to="/login">← Back to login</Link><div className="form-heading"><h2>Reset your password</h2><p>Enter your registered email address.</p></div><form className="form-stack" onSubmit={submit}><label className="field-label">Email address</label><input className="text-input" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/>{error&&<div className="alert error">{error}</div>}{message&&<div className="alert success">{message}</div>}<button className="primary-button">Send reset link</button></form></div></main>
}
