export type Item = {
  id: string
  shop_id: string
  name: string
  quantity: number
  default_price: number | null
  description: string | null
  is_archived: boolean
  created_at: string
}