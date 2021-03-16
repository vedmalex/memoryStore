import { Paths } from '../IndexDef'
import { Item } from '../Item'
import Collection from '../collection'
import { return_one_if_valid } from './return_one_if_valid'
import { ValueType } from 'b-pl-tree'

export async function get_last_indexed_value<T extends Item>(
  collection: Collection<T>,
  key: Paths<T>,
  value: ValueType,
): Promise<T> {
  if (collection.indexes[key]) {
    const id = collection.indexes[key].findLast(value)
    const result = id != null ? await collection.list.get(id) : undefined
    return return_one_if_valid(collection, result)
  }
}
