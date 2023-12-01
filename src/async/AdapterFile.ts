import Collection from './collection'
import decamelize from 'decamelize'
import { Item } from '../types/Item'
import fs from 'fs-extra'
import pathLib from 'path'
import { IStorageAdapter } from './IStorageAdapter'

export default class AdapterFile<T extends Item> implements IStorageAdapter<T> {
  file: string
  path: string
  collection: Collection<T>
  clone(): AdapterFile<T> {
    return new AdapterFile<T>()
  }
  /**
   * @param file only relative file name
   */
  constructor(file?: string) {
    this.file = file
  }

  init(collection: Collection<T>): this {
    this.collection = collection
    if (!this.file) {
      this.file = `${decamelize(collection.model)}.json`
    }
    this.path = pathLib.join(collection.path, this.file)
    return this
  }

  async restore(name?: string): Promise<any> {
    let path = this.path
    if (name) {
      const p = pathLib.parse(this.path)
      p.name = name
      delete p.base
      path = pathLib.format(p)
    }
    await fs.ensureFile(path)
    return fs.readJSON(path)
  }

  async store(name: string) {
    let path = this.path
    if (name) {
      const p = pathLib.parse(this.path)
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
