import { ValueType } from 'b-pl-tree'
import { get, set, unset, cloneDeep } from 'lodash'
import { StoredIList } from './StoredIList'
import { Item } from '../Item'
import { IList } from '../interfaces/IList'
import Collection from '../collection'
import { diff } from 'jsondiffpatch'
import { entity_create, entity_update } from '../interfaces/StorageAdapter'
import {
  IStoredRecord,
  is_stored_record,
  entity_delete,
} from '../interfaces/StorageAdapter'

export class List<T extends Item> implements IList<T> {
  hash: { [key: string]: T | IStoredRecord<T> } = {}
  _counter: number = 0
  _count: number = 0
  collection: Collection<T>
  exists: Promise<boolean> = Promise.resolve(true)

  init(collection: Collection<T>): IList<T> {
    this.collection = collection
    return this as IList<T>
  }

  async clone(): Promise<IList<T>> {
    const list = new List<T>()
    list.load(this.persist())
    return list
  }

  async get(key: ValueType) {
    const item = get(this.hash, String(key))
    let result: T
    if (is_stored_record<T>(item)) {
      result = cloneDeep(item.data)
      if (!this.collection.audit) {
        set(this.hash, String(key), result)
      }
    } else {
      result = cloneDeep(item)
    }
    return result
  }

  get counter() {
    return this._counter
  }

  get length() {
    return this._count
  }

  set length(len) {
    if (len === 0) {
      this.reset()
    }
  }

  async set(_key: ValueType, item: T) {
    if (this.collection.validator?.(item) ?? true) {
      let result: T | IStoredRecord<T>
      if (this.collection.audit) {
        result = entity_create(
          item[this.collection.id],
          cloneDeep(item),
          this.collection.validation,
        )
      } else {
        result = cloneDeep(item)
      }
      set(this.hash, this._counter, result)
      this._counter++
      this._count++
      return is_stored_record(item) ? item.data : item
    } else {
      throw new Error('Validation error')
    }
  }

  async update(_key: ValueType, item: T) {
    if (this.collection.validator?.(item) ?? true) {
      let result: T = item
      const record = get(this.hash, item[this.collection.id])
      if (this.collection.audit) {
        let res: T | IStoredRecord<T>
        if (!is_stored_record(record)) {
          res = entity_create(
            item[this.collection.id],
            item,
            this.collection.validation,
          )
        } else {
          res = entity_update(record, cloneDeep(item))
        }
        set(this.hash, item[this.collection.id], res)
        result = res.data
      } else {
        set(this.hash, item[this.collection.id], cloneDeep(result))
      }
      return result
    } else {
      throw new Error('Validation error')
    }
  }

  async delete(i: ValueType) {
    const item = get(this.hash, i.toString())
    let result: T
    if (is_stored_record<T>(item)) {
      entity_delete(item)
      result = cloneDeep(item.data)
      this._count--
    } else {
      unset(this.hash, i.toString())
      this._count--
      result = cloneDeep(item)
    }
    return result
  }

  async reset() {
    this._count = 0
    this._counter = 0
    this.hash = {}
  }

  get keys() {
    return Object.keys(this.hash)
  }

  load(obj: StoredIList): IList<T> {
    this.hash = obj.hash
    this._count = obj._count
    this._counter = obj._counter
    return this
  }

  construct() {
    return new List<T>()
  }

  persist(): StoredIList {
    return {
      _count: this._count,
      _counter: this._counter,
      hash: this.hash,
    }
  }

  get forward(): AsyncIterable<T> {
    return {
      [Symbol.asyncIterator]() {
        return this.toArray()
      },
    }
  }
  get backward(): AsyncIterable<T> {
    return {
      [Symbol.asyncIterator]() {
        return this.toArrayReverse()
      },
    }
  }

  async *toArray() {
    for (const key of this.keys) {
      yield get(this.hash, key)
    }
  }
  async *toArrayReverse() {
    for (const key of this.keys.reverse()) {
      yield get(this.hash, key)
    }
  }
}
