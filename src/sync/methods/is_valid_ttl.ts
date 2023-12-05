import { Item } from '../../types/Item'
import CollectionSync, { ttl_key } from '../collection'

export function is_valid_ttl<T extends Item>(
  collection: CollectionSync<T>,
  item?: T,
) {
  if (item) {
    if (item[ttl_key]) {
      const now = Date.now()
      return now - item[ttl_key] <= collection.ttl
    } else {
      return true
    }
  } else {
    return false
  }
}
