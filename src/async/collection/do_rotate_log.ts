import { Item } from '../../types/Item'
import Collection from '../collection'
import { copy_collection } from './copy_collection'

export async function do_rotate_log<T extends Item>(
  source: Collection<T>,
): Promise<void> {
  await copy_collection(`${source.model}.${new Date().toJSON()}`, source)

  await source.reset()
  await source.persist()
}
