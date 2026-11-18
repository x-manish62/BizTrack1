
import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react'
import { useItems } from './useItems'
import type { Item } from './types'

export default function ItemsPage() {
  const { items, loading, addItem, updateItem, deleteItem } = useItems()

  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('0')
  const [error, setError] = useState('')

  const visibleItems = useMemo(
    () =>
      items.filter(
        item =>
          !item.is_archived &&
          item.name.toLowerCase().includes(search.toLowerCase())
      ),
    [items, search]
  )

  function openAdd() {
    setEditing(null)
    setName('')
    setQuantity('0')
    setError('')
    setModal(true)
  }

  function openEdit(item: Item) {
    setEditing(item)
    setName(item.name)
    setQuantity(String(item.quantity ?? 0))
    setError('')
    setModal(true)
  }

  async function saveItem(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Item name is required.')
      return
    }

    const qty = Number(quantity)

    if (!Number.isInteger(qty) || qty < 0) {
      setError('Enter a valid quantity.')
      return
    }

    try {
      if (editing) {
        await updateItem(editing.id, {
          name: name.trim(),
          quantity: qty,
        })
      } else {
        await addItem({
          name: name.trim(),
          quantity: qty,
          default_price: null,
          description: null,
        })
      }

      setModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item.')
    }
  }

  async function removeItem(item: Item) {
    if (!confirm(`Are you sure you want to remove "${item.name}"?`)) {
      return
    }

    try {
      await deleteItem(item.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not remove item.')
    }
  }

  const styles = {
    page: {
      padding: '28px',
      maxWidth: '1200px',
      margin: '0 auto',
      color: '#172033',
    } as React.CSSProperties,

    card: {
      background: '#ffffff',
      border: '1px solid #e5eaf1',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 18px rgba(15,23,42,0.04)',
    } as React.CSSProperties,

    button: {
      border: 'none',
      borderRadius: '10px',
      padding: '11px 16px',
      background: '#4f46e5',
      color: '#fff',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
    } as React.CSSProperties,

    input: {
      width: '100%',
      padding: '12px 14px',
      border: '1px solid #dbe2ea',
      borderRadius: '9px',
      outline: 'none',
      fontSize: '14px',
      boxSizing: 'border-box',
    } as React.CSSProperties,
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '25px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 8px' }}>
            Items
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>
            Manage your shop inventory.
          </p>
        </div>

        <button style={styles.button} onClick={openAdd}>
          <Plus size={18} />
          Add Item
        </button>
      </div>

      {/* Items Card */}
      <div style={styles.card}>
        {/* Search and Count */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px',
            marginBottom: '22px',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '19px' }}>All Items</h2>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>
              {visibleItems.length} items
            </p>
          </div>

          <div
            style={{
              position: 'relative',
              width: '260px',
              maxWidth: '100%',
            }}
          >
            <Search
              size={17}
              style={{
                position: 'absolute',
                left: '12px',
                top: '13px',
                color: '#94a3b8',
              }}
            />
            <input
              style={{ ...styles.input, paddingLeft: '38px' }}
              placeholder="Search items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '35px', textAlign: 'center', color: '#64748b' }}>
            Loading items...
          </div>
        ) : visibleItems.length === 0 ? (
          <div style={{ padding: '45px 15px', textAlign: 'center' }}>
            <Package size={40} color="#94a3b8" />
            <h3>{search ? 'No items found' : 'No items added yet'}</h3>
            <p style={{ color: '#64748b' }}>
              Add your first item to your inventory.
            </p>
            <button style={styles.button} onClick={openAdd}>
              <Plus size={17} />
              Add Item
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '650px',
              }}
            >
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Item Name', 'Quantity', 'Availability', 'Edit', 'Action'].map(
                    heading => (
                      <th
                        key={heading}
                        style={{
                          padding: '15px',
                          textAlign: 'left',
                          color: '#64748b',
                          fontSize: '12px',
                          fontWeight: 700,
                          borderBottom: '1px solid #e5eaf1',
                        }}
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {visibleItems.map(item => (
                  <tr key={item.id}>
                    <td style={{ padding: '16px', borderBottom: '1px solid #edf1f5' }}>
                      <strong>{item.name}</strong>
                    </td>

                    <td style={{ padding: '16px', borderBottom: '1px solid #edf1f5' }}>
                      {item.quantity ?? 0}
                    </td>

                    <td style={{ padding: '16px', borderBottom: '1px solid #edf1f5' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '5px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: (item.quantity ?? 0) > 0 ? '#dcfce7' : '#fee2e2',
                          color: (item.quantity ?? 0) > 0 ? '#166534' : '#991b1b',
                        }}
                      >
                        {(item.quantity ?? 0) > 0 ? 'Available' : 'Out of Stock'}
                      </span>
                    </td>

                    <td style={{ padding: '16px', borderBottom: '1px solid #edf1f5' }}>
                      <button
                        onClick={() => openEdit(item)}
                        title="Edit item"
                        style={{
                          border: '1px solid #dbe2ea',
                          background: '#fff',
                          padding: '8px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: '#4f46e5',
                        }}
                      >
                        <Pencil size={16} />
                      </button>
                    </td>

                    <td style={{ padding: '16px', borderBottom: '1px solid #edf1f5' }}>
                      <button
                        onClick={() => removeItem(item)}
                        title="Remove item"
                        style={{
                          border: '1px solid #fee2e2',
                          background: '#fff',
                          padding: '8px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: '#dc2626',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div
          onMouseDown={e => {
            if (e.target === e.currentTarget) setModal(false)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
          }}
        >
          <form
            onSubmit={saveItem}
            style={{
              width: '100%',
              maxWidth: '420px',
              background: '#fff',
              padding: '25px',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              {editing ? 'Edit Item' : 'Add New Item'}
            </h2>

            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Item Name
            </label>
            <input
              autoFocus
              style={styles.input}
              placeholder="Enter item name"
              value={name}
              onChange={e => setName(e.target.value)}
            />

            <label
              style={{
                display: 'block',
                margin: '18px 0 8px',
                fontWeight: 600,
              }}
            >
              Quantity
            </label>
            <input
              style={styles.input}
              type="number"
              min="0"
              step="1"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
            />

            {error && (
              <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '12px' }}>
                {error}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '25px',
              }}
            >
              <button
                type="button"
                onClick={() => setModal(false)}
                style={{
                  padding: '11px 16px',
                  border: '1px solid #dbe2ea',
                  borderRadius: '9px',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button type="submit" style={styles.button}>
                {editing ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
