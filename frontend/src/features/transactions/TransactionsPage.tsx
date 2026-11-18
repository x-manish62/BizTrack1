
import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  RefreshCw,
  X,
} from 'lucide-react'

import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/useAuth'
import { money } from '../../lib/format'

type Props = {
  type: 'purchase' | 'sale'
}

type Item = {
  id: string
  name: string
  default_price: number | null
}

type Profile = {
  active_shop_id: string | null
  full_name: string | null
}

type Tx = {
  id: string
  transaction_no: string
  total_amount: number
  created_at: string
  party_name: string
  phone: string
  email: string
  item_name: string
  quantity: number
  unit_price: number
  paid: number
}

type Form = {
  partyName: string
  phone: string
  email: string
  itemName: string
  quantity: string
  unitPrice: string
  paid: string
  date: string
  paymentMethod: string
  address: string
  notes: string
}

const blankForm = (): Form => ({
  partyName: '',
  phone: '',
  email: '',
  itemName: '',
  quantity: '1',
  unitPrice: '',
  paid: '0',
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: 'Cash',
  address: '',
  notes: '',
})

export default function TransactionsPage({ type }: Props) {
  const purchase = type === 'purchase'

  const { user } = useAuth()

  const [shopId, setShopId] = useState<string | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [rows, setRows] = useState<Tx[]>([])
  const [form, setForm] = useState<Form>(blankForm())

  const [show, setShow] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const total =
    Math.max(0, Number(form.quantity || 0)) *
    Math.max(0, Number(form.unitPrice || 0))

  const paid = Math.min(
    total,
    Math.max(0, Number(form.paid || 0)),
  )

  const remaining = Math.max(0, total - paid)

  useEffect(() => {
    if (user) void initialize()
  }, [user?.id, type])

  async function initialize() {
    if (!user) return

    setLoading(true)
    setError('')

    const profileRes = await supabase
      .from('profiles')
      .select('active_shop_id,full_name')
      .eq('id', user.id)
      .single()

    if (profileRes.error) {
      setError(profileRes.error.message)
      setLoading(false)
      return
    }

    const profile = profileRes.data as Profile

    setShopId(profile.active_shop_id)

    if (!profile.active_shop_id) {
      setError('Your shop is not approved or assigned yet.')
      setLoading(false)
      return
    }

    const itemRes = await supabase
      .from('items')
      .select('id,name,default_price')
      .eq('shop_id', profile.active_shop_id)
      .eq('is_archived', false)
      .order('name')

    if (itemRes.error) {
      setError(itemRes.error.message)
    }

    setItems((itemRes.data || []) as Item[])

    await loadTransactions(profile.active_shop_id)

    setLoading(false)
  }

  async function loadTransactions(id: string) {
    const table = purchase ? 'purchases' : 'sales'

    const { data, error: loadError } = await supabase
      .from(table)
      .select('*')
      .eq('shop_id', id)
      .order('created_at', { ascending: false })

    if (loadError) {
      setError(loadError.message)
      return
    }

    const txs = (data || []) as any[]
    const txIds = txs.map(t => t.id)

    const itemTable = purchase ? 'purchase_items' : 'sale_items'
    const parentCol = purchase ? 'purchase_id' : 'sale_id'
    const payCol = purchase ? 'purchase_id' : 'sale_id'

    const [itemRes, payRes] = txIds.length
      ? await Promise.all([
          supabase
            .from(itemTable)
            .select('*')
            .in(parentCol, txIds),

          supabase
            .from('payments')
            .select('purchase_id,sale_id,amount')
            .eq('shop_id', id)
            .in(payCol, txIds),
        ])
      : [
          { data: [], error: null } as any,
          { data: [], error: null } as any,
        ]

    const txItems = itemRes.data || []
    const payments = payRes.data || []

    setRows(
      txs.map(t => {
        const detail = txItems.find(
          (x: any) => x[parentCol] === t.id,
        )

        const paidSum = payments
          .filter((p: any) => p[payCol] === t.id)
          .reduce(
            (s: number, p: any) => s + Number(p.amount),
            0,
          )

        return {
          id: t.id,
          transaction_no: t.transaction_no,
          total_amount: Number(t.total_amount),
          created_at: t.created_at,
          party_name: purchase ? t.seller_name : t.buyer_name,
          phone: purchase ? t.seller_phone : t.buyer_phone,
          email: purchase ? t.seller_email : t.buyer_email,
          item_name: detail?.item_name_snapshot || 'Item',
          quantity: Number(detail?.quantity || 1),
          unit_price: Number(detail?.unit_price || 0),
          paid: paidSum,
        }
      }),
    )
  }

  const filtered = useMemo(
    () =>
      rows.filter(r =>
        `${r.transaction_no} ${r.party_name} ${r.item_name} ${r.phone}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [rows, search],
  )

  function setField<K extends keyof Form>(key: K, value: Form[K]) {
    setForm(p => ({
      ...p,
      [key]: value,
    }))
  }

  // When the typed item matches an existing item,
  // automatically use its default price.
  function handleItemNameChange(name: string) {
    const matchedItem = items.find(
      item => item.name.toLowerCase() === name.trim().toLowerCase(),
    )

    setForm(p => ({
      ...p,
      itemName: name,
      unitPrice:
        matchedItem?.default_price != null
          ? String(matchedItem.default_price)
          : p.unitPrice,
    }))
  }

  // Find the existing item or create a new item
  // before saving the transaction.
  async function getOrCreateItemId() {
    if (!shopId) {
      throw new Error('Shop not found.')
    }

    const itemName = form.itemName.trim()

    const existingItem = items.find(
      item => item.name.toLowerCase() === itemName.toLowerCase(),
    )

    if (existingItem) {
      return existingItem.id
    }

    const { data, error: itemError } = await supabase
      .from('items')
      .insert({
        shop_id: shopId,
        name: itemName,
        default_price: Number(form.unitPrice || 0),
        is_archived: false,
      })
      .select('id,name,default_price')
      .single()

    if (itemError) {
      throw itemError
    }

    const newItem = data as Item

    setItems(previous => [...previous, newItem])

    return newItem.id
  }

  async function save() {
    if (!user || !shopId) return

    if (
      !form.partyName.trim() ||
      !form.itemName.trim() ||
      total <= 0
    ) {
      setError('Party name, item name and valid total are required.')
      return
    }

    if (Number(form.paid) < 0 || Number(form.paid) > total) {
      setError('Amount paid must be between 0 and total amount.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const itemId = await getOrCreateItemId()

      const { error: rpcError } = await supabase.rpc(
        'create_shop_transaction',
        {
          p_kind: type,
          p_party_name: form.partyName.trim(),
          p_phone: form.phone.trim(),
          p_email: form.email.trim(),
          p_address: form.address.trim(),
          p_item_id: itemId,
          p_quantity: Number(form.quantity),
          p_unit_price: Number(form.unitPrice),
          p_paid: paid,
          p_transaction_date: form.date,
          p_payment_method: form.paymentMethod,
          p_notes: form.notes.trim(),
        },
      )

      if (rpcError) throw rpcError

      setShow(false)
      setForm(blankForm())

      await loadTransactions(shopId)
    } catch (e: any) {
      setError(e.message || 'Transaction save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="content-wrap tx-page">
      <div className="page-title-row">
        <div>
          <div className="eyebrow muted">
            {purchase ? 'MONEY OUT' : 'MONEY IN'}
          </div>

          <h1>{purchase ? 'Purchases' : 'Sales'}</h1>

          <p>
            {purchase
              ? 'Record purchases and supplier balances.'
              : 'Record sales and customer balances.'}
          </p>
        </div>

        <button
          className="primary-button compact"
          onClick={() => {
            setError('')
            setForm(blankForm())
            setShow(true)
          }}
        >
          <Plus size={17} />
          Add {purchase ? 'purchase' : 'sale'}
        </button>
      </div>

      <section className="surface-card tx-card">
        <div className="toolbar">
          <div className="search-box">
            <Search size={17} />

            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by item, party or transaction…"
            />
          </div>

          <button
            className="filter-button"
            onClick={() => shopId && loadTransactions(shopId)}
            title="Refresh"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="empty-state">Loading transactions…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {purchase ? <ShoppingBag size={24} /> : <ShoppingCart size={24} />}
            </div>

            <b>No {purchase ? 'purchases' : 'sales'} recorded</b>

            <span>Saved transactions will show here.</span>

            <button
              className="small-primary"
              onClick={() => setShow(true)}
            >
              Create first {purchase ? 'purchase' : 'sale'}
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>DATE / NO.</th>
                  <th>PARTY</th>
                  <th>ITEM</th>
                  <th>TOTAL</th>
                  <th>PAID</th>
                  <th>REMAINING</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td>
                      {new Date(r.created_at).toLocaleDateString('en-IN')}
                      <small className="tx-sub">{r.transaction_no}</small>
                    </td>

                    <td>
                      {r.party_name}
                      <small className="tx-sub">{r.phone}</small>
                    </td>

                    <td>
                      {r.item_name}
                      <small className="tx-sub">
                        Qty {r.quantity} × {money(r.unit_price)}
                      </small>
                    </td>

                    <td>{money(r.total_amount)}</td>

                    <td>{money(r.paid)}</td>

                    <td>
                      <b
                        className={
                          r.total_amount - r.paid > 0
                            ? 'tx-due'
                            : 'tx-paid'
                        }
                      >
                        {money(Math.max(0, r.total_amount - r.paid))}
                      </b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {show && (
        <div
          className="modal-backdrop"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setShow(false)
          }}
        >
          <div className="modal-card tx-modal">
            <div className="modal-head">
              <div>
                <div className="eyebrow muted">TRANSACTION ENTRY</div>

                <h2>New {purchase ? 'purchase' : 'sale'}</h2>
              </div>

              <button
                className="icon-button"
                onClick={() => setShow(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="tx-form-grid">
              <label>
                {purchase ? 'Purchased From' : 'Sold To'} *

                <input
                  className="text-input"
                  value={form.partyName}
                  onChange={e => setField('partyName', e.target.value)}
                  placeholder="Party / person name"
                />
              </label>

              <label>
                Contact Number

                <input
                  className="text-input"
                  value={form.phone}
                  onChange={e => setField('phone', e.target.value)}
                  placeholder="Mobile number"
                  inputMode="tel"
                />
              </label>

              <label>
                Email ID

                <input
                  className="text-input"
                  type="email"
                  value={form.email}
                  onChange={e => setField('email', e.target.value)}
                  placeholder="Email (optional)"
                />
              </label>

              <label>
                Item Name *

                <input
                  className="text-input"
                  value={form.itemName}
                  onChange={e => handleItemNameChange(e.target.value)}
                  placeholder="Type item name"
                />
              </label>

              <label>
                Quantity

                <input
                  className="text-input"
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={form.quantity}
                  onChange={e => setField('quantity', e.target.value)}
                />
              </label>

              <label>
                Unit Price (₹)

                <input
                  className="text-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={e => setField('unitPrice', e.target.value)}
                />
              </label>

              <label>
                Date

                <input
                  className="text-input"
                  type="date"
                  value={form.date}
                  onChange={e => setField('date', e.target.value)}
                />
              </label>

              <label>
                Amount {purchase ? 'Paid' : 'Received'} (₹)

                <input
                  className="text-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.paid}
                  onChange={e => setField('paid', e.target.value)}
                />
              </label>

              <label>
                Payment Method

                <select
                  className="text-input"
                  value={form.paymentMethod}
                  onChange={e => setField('paymentMethod', e.target.value)}
                >
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                  <option>Card</option>
                  <option>Other</option>
                </select>
              </label>

              <label className="tx-full">
                Address (optional)

                <input
                  className="text-input"
                  value={form.address}
                  onChange={e => setField('address', e.target.value)}
                  placeholder="Party address"
                />
              </label>

              <label className="tx-full">
                Notes

                <input
                  className="text-input"
                  value={form.notes}
                  onChange={e => setField('notes', e.target.value)}
                  placeholder="Any extra detail"
                />
              </label>
            </div>

            <div className="tx-summary">
              <div>
                <span>Total</span>
                <b>{money(total)}</b>
              </div>

              <div>
                <span>{purchase ? 'Paid' : 'Received'}</span>
                <b>{money(paid)}</b>
              </div>

              <div className="due">
                <span>Remaining</span>
                <b>{money(remaining)}</b>
              </div>
            </div>

            {error && <div className="alert error">{error}</div>}

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setShow(false)}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={save}
                disabled={saving}
              >
                {saving
                  ? 'Saving…'
                  : `Save ${purchase ? 'purchase' : 'sale'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
