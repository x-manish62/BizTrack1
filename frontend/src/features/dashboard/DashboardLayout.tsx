import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Box, ChevronDown, CircleHelp, LayoutDashboard, LogOut, Menu, ShoppingBag, ShoppingCart, Store, History } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { supabase } from '../../lib/supabase'
import { initials } from '../../lib/format'

export default function DashboardLayout(){
 const {user}=useAuth();const navigate=useNavigate();const [open,setOpen]=useState(false)
 const meta=user?.user_metadata||{};const name=meta.full_name||user?.email?.split('@')[0]||'Admin'
 async function logout(){await supabase.auth.signOut();navigate('/login')}
 const links=[{to:'/',label:'Overview',icon:LayoutDashboard,end:true},{to:'/items',label:'Items',icon:Box},{to:'/purchases',label:'Purchases',icon:ShoppingBag},{to:'/sales',label:'Sales',icon:ShoppingCart},{to:'/purchase-history',label:'Purchase History',icon:History},{to:'/sales-history',label:'Sales History',icon:History}]
 return <div className="app-shell"><aside className={`sidebar ${open?'sidebar-open':''}`}><div className="brand sidebar-brand"><span className="brand-mark"><Store size={20}/></span><span>Biz<span>Track</span></span></div><div className="workspace-label">WORKSPACE</div><nav>{links.map(l=><NavLink key={l.to} to={l.to} end={l.end} onClick={()=>setOpen(false)} className={({isActive})=>`nav-link ${isActive?'active':''}`}><l.icon size={18}/>{l.label}</NavLink>)}</nav><div className="sidebar-bottom"><div className="help-card"><CircleHelp size={18}/><div><b>Need a hand?</b><span>Keep your records clear.</span></div></div><button className="nav-link logout" onClick={logout}><LogOut size={18}/> Sign out</button></div></aside><div className="main-area"><header className="topbar"><button className="mobile-menu" onClick={()=>setOpen(!open)}><Menu/></button><div className="breadcrumb">Workspace <span>/</span> <b>Business overview</b></div><div className="top-user"><div className="avatar">{initials(name)}</div><div className="user-name"><b>{name}</b><span>Shop administrator</span></div><ChevronDown size={15}/></div></header><main className="page-content"><Outlet/></main></div></div>
}



