import { Paths } from 'src/types/Paths'
import { Item } from '../types/Item'
import CollectionMemory from '../collection-memory'
import { return_one_if_valid_sync } from './return_one_if_valid_sync'
import { ValueType } from 'b-pl-tree'

export function get_first_indexed_value_sync<T extends Item>(
  collection: CollectionMemory<T>,
  key: Paths<T>,
  value: ValueType,
): T {
  if (collection.indexes[key]) {
    const id = collection.indexes[key].findFirst(value)
    const result = id != null ? collection.list.get(id) : undefined
    return return_one_if_valid_sync(collection, result)
  }
}
