
import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { useAuth } from '../auth/useAuth'
import type { Item } from './types'
import { localDb } from '../../offline/db'

export function useItems() {
  const { user } = useAuth()

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)

    try {
      if (isSupabaseConfigured && user) {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        const loadedItems = (data || []) as Item[]

        setItems(loadedItems)
        await localDb.items.bulkPut(loadedItems)
      } else {
        setItems(await localDb.items.toArray())
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch((error) => {
      console.error('Failed to load items:', error)
      setLoading(false)
    })
  }, [user?.id])

  async function addItem(
    input: {
      name: string
      quantity: number
      default_price: number | null
      description: string | null
    }
  ) {
    if (isSupabaseConfigured && user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('active_shop_id')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      if (!profile?.active_shop_id) {
        throw new Error('Your shop is not approved or assigned yet.')
      }

      const { data, error } = await supabase
        .from('items')
        .insert({
          ...input,
          shop_id: profile.active_shop_id
        })
        .select()
        .single()

      if (error) throw error

      const newItem = data as Item

      setItems((previous) => [newItem, ...previous])
      await localDb.items.put(newItem)
    } else {
      const item: Item = {
        ...input,
        id: crypto.randomUUID(),
        shop_id: 'local-demo',
        is_archived: false,
        created_at: new Date().toISOString()
      }

      await localDb.items.put(item)
      setItems((previous) => [item, ...previous])
    }
  }

  async function updateItem(
    id: string,
    input: Partial<
      Pick<Item, 'name' | 'quantity' | 'default_price' | 'description'>
    >
  ) {
    if (isSupabaseConfigured && user) {
      const { data, error } = await supabase
        .from('items')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const updatedItem = data as Item

      setItems((previous) =>
        previous.map((item) => item.id === id ? updatedItem : item)
      )

      await localDb.items.put(updatedItem)
    } else {
      await localDb.items.update(id, input)

      setItems((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, ...input } : item
        )
      )
    }
  }

  async function updateArchive(id: string, value: boolean) {
    if (isSupabaseConfigured && user) {
      const { data, error } = await supabase
        .from('items')
        .update({ is_archived: value })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const updatedItem = data as Item

      setItems((previous) =>
        previous.map((item) => item.id === id ? updatedItem : item)
      )

      await localDb.items.put(updatedItem)
    } else {
      await localDb.items.update(id, { is_archived: value })

      setItems((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, is_archived: value } : item
        )
      )
    }
  }

  async function archiveItem(id: string) {
    await updateArchive(id, true)
  }

  async function restoreItem(id: string) {
    await updateArchive(id, false)
  }

  async function deleteItem(id: string) {
    if (isSupabaseConfigured && user) {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)

      setItems((previous) => previous.filter((item) => item.id !== id))
      await localDb.items.delete(id)
    } else {
      await localDb.items.delete(id)
      setItems((previous) => previous.filter((item) => item.id !== id))
    }
  }

  return {
    items,
    loading,
    addItem,
    updateItem,
    archiveItem,
    restoreItem,
    deleteItem,
    reload: load
  }
}
