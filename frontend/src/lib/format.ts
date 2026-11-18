export const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0))
export const initials = (name?: string | null) => (name || 'U').trim().split(/\s+/).slice(0,2).map(x => x[0]?.toUpperCase()).join('')
