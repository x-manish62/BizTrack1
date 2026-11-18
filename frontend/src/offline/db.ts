import Dexie, { type Table } from 'dexie'
import type { Item } from '../features/items/types'
class BizTrackDB extends Dexie {
 items!: Table<Item,string>
 constructor(){super('BizTrackLocal');this.version(1).stores({items:'id, shop_id, name, is_archived, created_at'})}
}
export const localDb=new BizTrackDB()
