import { Item } from '../types/Item'
import { query } from '../query/query'
import CollectionMemory from '../collection-memory'
import { TraverseCondition } from './TraverseCondition'

export function* last_sync<T extends Item>(
  collection: CollectionMemory<T>,
  condition: TraverseCondition<T>,
): Generator<T> {
  if (typeof condition == 'object') condition = query(condition)
  for (const current of collection.list.backward) {
    if (condition(current)) {
      yield current
      return
    }
  }
}
