import { get } from 'lodash'
import { IndexDef } from '../IndexDef'
import { Item } from '../Item'
import { Dictionary } from '../hash'
import { BPlusTree, ValueType } from 'b-pl-tree'
import Collection from '../collection'
import { ensure_indexed_value } from './ensure_indexed_value'
import { get_value } from './get_value'
import { validate_indexed_value_for_insert } from './validate_indexed_value_for_insert'
import { validate_indexed_value_for_update } from './validate_indexed_value_for_update'

export function build_index<T extends Item>(
  collection: Collection<T>,
  indexList: Dictionary<IndexDef<T>>,
) {
  for (const key in indexList) {
    const {
      auto = false,
      unique = false,
      sparse = false,
      required = false,
      ignoreCase,
    } = indexList[key]

    let { gen, process } = indexList[key]

    if (auto && !gen) {
      gen = collection.genCache['autoIncIdGen']
    }
    if (ignoreCase) {
      process = (value: any) =>
        value?.toString ? value.toString().toLowerCase() : value
    }

    if (!key) {
      throw new Error(`key is required field for index`)
    }

    collection.indexDefs[key] = {
      key,
      auto,
      unique,
      gen,
      sparse,
      required,
      ignoreCase,
      process,
    }

    if (collection.indexes.hasOwnProperty(key)) {
      throw new Error(`index with key ${key} already exists`)
    }

    const insert = (item: T) => {
      const value = ensure_indexed_value(
        item,
        key,
        collection,
        gen,
        auto,
        process,
      )
      const [valid, message] = validate_indexed_value_for_insert(
        collection,
        value,
        key,
        sparse,
        required,
        unique,
      )
      if (!valid) throw new Error(message)
      if (!(sparse && value == null)) {
        return (record_link: ValueType) =>
          collection.indexes[key].insert(
            value !== undefined ? value : null,
            record_link,
          )
      }
    }

    const update = (ov: T, nv: T, index_payload: number) => {
      const valueOld = ensure_indexed_value(
        ov,
        key,
        collection,
        gen,
        auto,
        process,
      )
      const valueNew = get_value(nv, key, process)
      if (valueNew != null) {
        const [valid, message] = validate_indexed_value_for_update(
          collection,
          valueNew,
          key,
          sparse,
          required,
          unique,
          ov[collection.id],
        )
        if (!valid) throw new Error(message)
        if (valueOld !== valueNew) {
          if (unique) {
            collection.indexes[key].remove(valueOld)
          } else {
            collection.indexes[key].removeSpecific(valueOld, (pointer) =>
              key != collection.id ? pointer == ov[collection.id] : true,
            )
          }
          collection.indexes[key].insert(
            valueNew !== undefined ? valueNew : null,
            index_payload,
          )
        }
      } else {
        if (unique) {
          collection.indexes[key].remove(valueOld)
        } else {
          collection.indexes[key].removeSpecific(valueOld, (pointer) =>
            key != collection.id ? pointer == ov[collection.id] : true,
          )
        }
      }
    }
    const remove = (item) => {
      console.log(
        key,
        collection.indexes[key].removeSpecific(
          get(item, key) ?? null,
          (pointer) =>
            key != collection.id ? pointer == item[collection.id] : true,
        ),
      )
    }
    const ensure = async (rebuild: boolean) => {
      if (!collection.indexes.hasOwnProperty(key)) {
        collection.indexes[key] = new BPlusTree<any, number>()
        if (rebuild && collection.list.length > 0) {
          for await (const item of collection.list.forward) {
            insert(item)(item[this.id])
          }
        }
      }
    }

    collection.ensures.push(ensure)
    collection.inserts.push(insert)
    collection.updates.push(update)
    collection.removes.push(remove)
  }
}

// удалять и обновлять по первичноу ключу, на который есть ссылка
// надо искать по ключу и проверять через each соответствие значения и только после этого передавать на удаление
