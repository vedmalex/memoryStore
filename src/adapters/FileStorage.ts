import { ValueType, BPlusTree } from 'b-pl-tree'
import { StoredIList } from './StoredIList'
import { Item } from '../Item'
import fs from 'fs-extra'
import pathlib from 'path'
import { IList } from '../interfaces/IList'
import { Collection } from 'src'

export class FileStorage<T extends Item, K extends ValueType>
  implements IList<T> {
  //  хранить промисы типа кэширование данных к которым был доступ, и которые не обновлялись
  // а на обновление выставлять новый промис
  // таким образом данные всегда будут свежими... если нет другого читателя писателя файлов
  // можно использовать библиотеку для монитроинга за файлами
  tree: BPlusTree<string, K> = new BPlusTree(32, true)
  get folder(): string {
    return this.collection.path
  }
  constructor(private keyField?: string) {}
  exists: Promise<boolean>
  collection: Collection<T>
  construct() {
    return new FileStorage<T, K>()
  }

  init(collection: Collection<T>): IList<T> {
    this.collection = collection
    if (this.keyField && !this.collection.indexDefs[this.keyField].unique) {
      throw new Error(`key field ${this.keyField} is not unique`)
    }
    this.exists = fs
      .ensureDir(this.folder)
      .then((_) => true)
      .catch((_) => false)
    return this
  }
  async clone(): Promise<IList<T>> {
    if (this.exists) {
      const res = new FileStorage<T, K>()
      BPlusTree.deserialize(res.tree, BPlusTree.serialize(this.tree))
      return res
    } else {
      throw new Error('folder not found')
    }
  }
  persist(): StoredIList {
    return {
      keyField: this.keyField,
      counter: this._counter,
      tree: BPlusTree.serialize(this.tree),
    }
  }

  load(obj: StoredIList): IList<T> {
    this._counter = obj.counter
    // prefer name that in configuration
    this.keyField = !obj.keyField
      ? this.keyField
      : this.keyField
      ? this.keyField
      : obj.keyField
    BPlusTree.deserialize(this.tree, obj.tree)
    return this
  }

  get forward() {
    return {
      [Symbol.asyncIterator](): AsyncIterator<T> {
        return this.toArray()
      },
    }
  }

  get backward() {
    return {
      [Symbol.asyncIterator](): AsyncIterator<T> {
        return this.toArrayReverse()
      },
    }
  }

  async *toArray() {
    if (await this.exists) {
      const it = this.tree.each()(this.tree)
      for (const path of it) {
        yield await fs.readJSON(this.get_path(path.value))
      }
    } else {
      throw new Error('folder not found')
    }
  }

  async *toArrayReverse() {
    if (await this.exists) {
      const it = this.tree.each(false)(this.tree)
      for (const path of it) {
        yield await fs.readJSON(this.get_path(path.value))
      }
    } else {
      throw new Error('folder not found')
    }
  }

  private key_filename(key: ValueType) {
    return `${key.toString()}.json`
  }

  private set_path(key: ValueType) {
    return pathlib.join(this.folder, this.key_filename(key))
  }

  private get_path(value: string) {
    return pathlib.join(this.folder, value)
  }

  async reset(): Promise<void> {
    if (await this.exists) {
      await fs.remove(this.folder)
      this.tree.reset()
      this.exists = fs
        .ensureDir(this.folder)
        .then((_) => true)
        .catch((_) => false)
    } else {
      throw new Error('folder not found')
    }
  }
  async get(key: K): Promise<T> {
    if (await this.exists) {
      const currentKey = this.tree.findFirst(key)
      return fs.readJSON(this.get_path(currentKey))
    } else {
      throw new Error('folder not found')
    }
  }

  async set(key: K, item: T): Promise<T> {
    if (await this.exists) {
      this._counter++
      // checkif exists
      // берем новый ключ
      const uid = this.keyField
        ? item[this.keyField]
          ? item[this.keyField]
          : key
        : key

      // пишем в файл
      await fs.writeJSON(this.set_path(uid), item)
      // вставляем в хранилище
      this.tree.insert(key, this.key_filename(uid))
      return item
    } else {
      throw new Error('folder not found')
    }
  }

  async update(key: K, item: T): Promise<T> {
    if (await this.exists) {
      // checkif exists
      // версионность
      // ищем текущее название файла
      const currentkey = this.tree.findFirst(key)
      // записываем значение в файл
      await fs.writeJSON(this.get_path(currentkey), item)
      return item
    } else {
      throw new Error('folder not found')
    }
  }

  async delete(key: K): Promise<T> {
    if (await this.exists) {
      const value = this.tree.findFirst(key)
      const item = await fs.readJSON(this.get_path(value))
      this.tree.remove(key)
      await fs.unlink(this.get_path(value))
      return item
    } else {
      throw new Error('folder not found')
    }
  }

  _counter: number = 0
  get counter(): number {
    return this._counter
  }
  get length(): number {
    return this.tree.size
  }
}
