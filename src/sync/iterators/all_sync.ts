import { Item } from '../../types/Item'
import { query } from '../../query/query'
import CollectionSync from '../collection'
import { TraverseCondition } from '../../types/TraverseCondition'

export function* all_sync<T extends Item>(
  collection: CollectionSync<T>,
  condition: TraverseCondition<T>,
): Generator<T> {
  if (typeof condition == 'object') condition = query(condition)
  for (const current of collection.list.forward) {
    if (condition(current)) {
      yield current
    }
  }
}
