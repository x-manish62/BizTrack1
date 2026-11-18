import { useState } from 'react'
import { Link, } from 'react-router-dom'
import { ArrowLeft, Store } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'

export default function RegisterPage() {
 const [form,setForm]=useState({shop:'',name:'',username:'',email:'',phone:'',password:'',confirm:''})
 const [error,setError]=useState(''); const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false); //const navigate=useNavigate()
 const update=(key:keyof typeof form,value:string)=>setForm(p=>({...p,[key]:value}))
 async function submit(e:React.FormEvent){
  e.preventDefault();setError('');setMessage('')
  if(!isSupabaseConfigured){setError('Connect Supabase first using frontend/.env.local.');return}
  if(form.password.length<10){setError('Use a password with at least 10 characters.');return}
  if(form.password!==form.confirm){setError('Passwords do not match.');return}
  setBusy(true)
  try{
   const {data,error:signError}=await supabase.auth.signUp({email:form.email,password:form.password,options:{data:{full_name:form.name,shop_name:form.shop,username:form.username,phone:form.phone}}})
   if(signError)throw signError
   if(data.user) setMessage('Registration submitted. Verify your email if prompted. Your shop access remains pending Master Admin approval.')
  }catch(err){setError(err instanceof Error?err.message:'Registration failed.')}
  finally{setBusy(false)}
 }
 return <main className="simple-auth"><Link to="/login" className="back-link"><ArrowLeft size={16}/> Back to login</Link><div className="register-card"><div className="brand"><span className="brand-mark"><Store size={20}/></span><span>Biz<span>Track</span></span></div><div className="form-heading"><div className="eyebrow muted">GET STARTED</div><h2>Create your shop account</h2><p>Submit your details. Access starts after admin approval.</p></div>
 <form onSubmit={submit} className="form-stack">
 {([['shop','Shop / business name','e.g. Ramesh Traders'],['name','Owner full name','Your full name'],['username','Username','Choose a username'],['email','Email address','you@example.com'],['phone','Mobile number','+91…']] as const).map(([k,label,ph])=><div key={k}><label className="field-label">{label} *</label><input className="text-input" required value={form[k]} onChange={e=>update(k,e.target.value)} placeholder={ph}/></div>)}
 <div><label className="field-label">Password *</label><input className="text-input" type="password" required value={form.password} onChange={e=>update('password',e.target.value)} placeholder="At least 10 characters"/></div>
 <div><label className="field-label">Confirm password *</label><input className="text-input" type="password" required value={form.confirm} onChange={e=>update('confirm',e.target.value)} placeholder="Repeat password"/></div>
 {error&&<div className="alert error">{error}</div>}{message&&<div className="alert success">{message}</div>}
 <button className="primary-button" disabled={busy}>{busy?'Submitting…':'Submit registration'}</button>
 </form><p className="fine-print">By registering, you request access as a shop administrator. The Master Admin must approve your account.</p>
 </div></main>
}
