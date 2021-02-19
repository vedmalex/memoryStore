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
  folder: string
  private folder_exists: Promise<boolean>
  collection: Collection<T>

  init(collection: Collection<T>): IList<T> {
    this.collection = collection
    this.folder = collection.model
    this.folder_exists = fs
      .ensureDir(collection.model)
      .then((_) => true)
      .catch((_) => false)
    return this
  }
  async clone(): Promise<IList<T>> {
    if (this.folder_exists.then()) {
      const res = new FileStorage<T, K>()
      BPlusTree.deserialize(res.tree, BPlusTree.serialize(this.tree))
      return res
    } else {
      throw new Error('folder not found')
    }
  }
  persist(): StoredIList {
    return {
      counter: this._counter,
      folder: this.folder,
      tree: BPlusTree.serialize(this.tree),
    }
  }

  load(obj: StoredIList): IList<T> {
    this._counter = obj.counter
    this.folder = obj.folder
    BPlusTree.deserialize(this.tree, obj.tree)
    return this
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return this.toArray()
  }

  async *toArray() {
    const it = this.tree.each()(this.tree)
    if (await this.folder_exists) {
      for (let path of it) {
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
    if (await this.folder_exists) {
      await fs.remove(this.folder)
      this.tree.reset()
    } else {
      throw new Error('folder not found')
    }
  }
  async get(key: K): Promise<T> {
    if (await this.folder_exists) {
      return await fs.readJSON(this.get_path(this.tree.findFirst(key)))
    } else {
      throw new Error('folder not found')
    }
  }

  async set(key: K, item: T): Promise<T> {
    if (await this.folder_exists) {
      // this._counter++
      await fs.writeJSON(this.set_path(key), item)
      this.tree.insert(key, this.key_filename(key))
      return item
    } else {
      throw new Error('folder not found')
    }
  }
  async delete(key: K): Promise<T> {
    if (await this.folder_exists) {
      const value = this.tree.findFirst(key)
      const item = await fs.readJSON(this.get_path(value))
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
