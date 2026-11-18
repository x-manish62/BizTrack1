import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { useAuth } from '../auth/useAuth'
import type { Item } from './types'
import { localDb } from '../../offline/db'

export function useItems(){
 const {user}=useAuth();const [items,setItems]=useState<Item[]>([]);const [loading,setLoading]=useState(true)
 async function load(){
  setLoading(true)
  if(isSupabaseConfigured && user){
   const {data,error}=await supabase.from('items').select('*').order('created_at',{ascending:false})
   if(error) throw error
   setItems((data||[]) as Item[])
   await localDb.items.bulkPut((data||[]) as Item[])
  }else{setItems(await localDb.items.toArray())}
  setLoading(false)
 }
 useEffect(()=>{load().catch(()=>setLoading(false))},[user?.id])
 async function addItem(input:{name:string;default_price:number|null;description:string|null}){
  if(isSupabaseConfigured && user){
   const {data:profile}=await supabase.from('profiles').select('active_shop_id').eq('id',user.id).single()
   if(!profile?.active_shop_id)throw new Error('Your shop is not approved or assigned yet.')
   const {data,error}=await supabase.from('items').insert({...input,shop_id:profile.active_shop_id}).select().single()
   if(error)throw error;setItems(p=>[data as Item,...p]);await localDb.items.put(data as Item)
  }else{
   const item:Item={...input,id:crypto.randomUUID(),shop_id:'local-demo',is_archived:false,created_at:new Date().toISOString()}
   await localDb.items.put(item);setItems(p=>[item,...p])
  }
 }
 async function updateItem(id:string,input:Partial<Pick<Item,'name'|'default_price'|'description'>>){
  if(isSupabaseConfigured){const {data,error}=await supabase.from('items').update(input).eq('id',id).select().single();if(error)throw error;setItems(p=>p.map(x=>x.id===id?data as Item:x));await localDb.items.put(data as Item)}
  else{await localDb.items.update(id,input);setItems(p=>p.map(x=>x.id===id?{...x,...input}:x))}
 }
 async function archiveItem(id:string){await updateArchive(id,true)}
 async function restoreItem(id:string){await updateArchive(id,false)}
 async function updateArchive(id:string,value:boolean){
  if(isSupabaseConfigured){const {data,error}=await supabase.from('items').update({is_archived:value}).eq('id',id).select().single();if(error)throw error;setItems(p=>p.map(x=>x.id===id?data as Item:x));await localDb.items.put(data as Item)}
  else{await localDb.items.update(id,{is_archived:value});setItems(p=>p.map(x=>x.id===id?{...x,is_archived:value}:x))}
 }
 async function deleteItem(id:string){
  if(isSupabaseConfigured){const {error}=await supabase.from('items').delete().eq('id',id);if(error)throw new Error(error.message);setItems(p=>p.filter(x=>x.id!==id));await localDb.items.delete(id)}
  else{await localDb.items.delete(id);setItems(p=>p.filter(x=>x.id!==id))}
 }
 return {items,loading,addItem,updateItem,archiveItem,restoreItem,deleteItem,reload:load}
}
