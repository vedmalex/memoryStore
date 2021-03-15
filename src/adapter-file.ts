import Collection from './collection'
import decamelize from 'decamelize'
import { Item } from './Item'
import fs from 'fs-extra'
import pathLib from 'path'
import { StorageAdapter } from './interfaces/StorageAdapter'

export default class AdapterFile<T extends Item> implements StorageAdapter<T> {
  file: string
  collection: Collection<T>
  clone(): AdapterFile<T> {
    return new AdapterFile<T>()
  }
  constructor(path?: string) {
    this.file = path
  }

  init(collection: Collection<T>): this {
    this.collection = collection
    this.file = collection.path
    if (!this.file) {
      this.file = `${decamelize(collection.model)}.json`
    }
    return this
  }

  async restore(name?: string): Promise<any> {
    let path = this.file
    if (name) {
      const p = pathLib.parse(this.file)
      p.name = name
      delete p.base
      path = pathLib.format(p)
    }
    await fs.ensureFile(path)
    return fs.readJSON(path)
  }

  async store(name: string) {
    let path = this.file
    if (name) {
      const p = pathLib.parse(this.file)
      p.name = name
      delete p.base
      path = pathLib.format(p)
    }
    await fs.ensureFile(path)
    await fs.writeJSON(path, this.collection.store(), {
      spaces: 2,
    })
  }
}
