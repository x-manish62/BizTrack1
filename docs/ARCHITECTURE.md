# BizTrack architecture notes

## Data isolation
Each shop-owned row includes `shop_id`. RLS is the security boundary; client-side filters are convenience only. Test two shops with different users before production.

## Item add / edit / remove
- Add: create a custom row in `items`.
- Edit: update name/default price/description.
- Remove: archive first. This preserves history.
- Restore: set `is_archived=false`.
- Permanent delete: allowed only if no purchase_items or sale_items reference the item. The UI catches database FK errors. For production, add a dedicated RPC that checks both references and logs the deletion.

## Financial records
Never delete posted payments to correct mistakes. Use a reversal/adjustment workflow. Build purchase/sale/payment RPCs with row locks, validation, idempotency keys and atomic writes before production.

## Offline
The current Dexie layer caches items. It is not yet a complete transaction sync engine. Implement an outbox queue and idempotent server RPCs before allowing offline financial entries.
