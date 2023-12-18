import { Item } from '../../types/Item'
import Collection from '../collection'

export function remove_index<T extends Item>(
  collection: Collection<T>,
  val: any,
) {
  collection.removes.forEach((item) => item(val))
}
