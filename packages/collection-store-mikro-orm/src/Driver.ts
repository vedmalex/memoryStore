import {
  Configuration,
  DatabaseDriver,
  EntityData,
  EntityDictionary,
  EntityName,
  FilterQuery,
  FindOptions,
  QueryResult,
} from '@mikro-orm/core'
import { CollectionStoreConnection } from './Connection'
import { CollectionStorePlatform } from './Platform'
import { Item } from 'collection-store'

import { debug } from 'debug'
const log = debug('driver')

export class CollectionStoreDriver extends DatabaseDriver<CollectionStoreConnection> {
  protected override readonly platform = new CollectionStorePlatform()
  protected override readonly connection = new CollectionStoreConnection(
    this.config,
  )
  constructor(config: Configuration) {
    log('constructor', arguments)
    super(config, ['collection-store'])
  }
  override async find<T extends object>(
    entityName: string,
    where: FilterQuery<T>,
  ): Promise<EntityData<T>[]> {
    log('find', arguments)
    if (this.metadata.find(entityName)?.virtual) {
      return this.findVirtual(entityName, where, {})
    }

    const res = await this.connection.db
      .collection<T>(entityName)
      ?.find(where as any)
    if (res) {
      return res.reduce((res, cur) => {
        res.push(cur)
        return res
      }, [] as EntityData<T>[])
    } else {
      return []
    }
  }
  override async findOne<T extends object>(
    entityName: string,
    where: FilterQuery<T>,
  ): Promise<EntityData<T> | null> {
    if (this.metadata.find(entityName)?.virtual) {
      const [item] = await this.findVirtual(
        entityName,
        where,
        {} as FindOptions<T, any, any, any>,
      )
      /* istanbul ignore next */
      return item ?? null
    }
    log('findOne', arguments)
    const res = await this.connection.db
      .collection<T>(entityName)
      ?.findFirst(where as any)
    if (res) {
      return res
    } else {
      return null
    }
  }

  override async connect(): Promise<CollectionStoreConnection> {
    log('connect', arguments)
    await this.connection.connect()
    return this.connection
  }
  override async nativeInsert<T extends Item>(
    entityName: string,
    data: EntityDictionary<T>,
  ): Promise<QueryResult<T>> {
    log('nativeInsert', arguments)
    const meta = this.metadata.find(entityName)
    const pk = meta?.getPrimaryProps()[0].fieldNames[0] ?? 'id'
    const res = await this.connection.db.collection<T>(entityName)?.create(data)
    return {
      insertId: res?.[pk],
      affectedRows: 1,
      row: { [pk]: res?.[pk] },
    }
  }

  override async nativeInsertMany<T extends Item>(
    entityName: string,
    data: EntityDictionary<T>[],
  ): Promise<QueryResult<T>> {
    log('nativeInsertMany', arguments)
    const res = data.map((d) => {
      return this.nativeInsert(entityName, d)
    })
    const result = (await Promise.allSettled(res)).reduce(
      (res, cur) => {
        if (cur.status === 'fulfilled') {
          res.affectedRows += 1
          res.insertedIds?.push(cur.value.insertId)
          res.rows!.push(cur.value.row!)
          res.insertId = cur.value.insertId
        } else {
        }
        return res
      },
      { insertIds: [], affectedRows: 0, rows: [] } as unknown as QueryResult<T>,
    )
    return result
  }

  override async nativeUpdate<T extends Item>(
    entityName: string,
    where: FilterQuery<T>,
    data: EntityDictionary<T>,
  ): Promise<QueryResult<T>> {
    log('nativeUpdate', arguments)
    const meta = this.metadata.find(entityName)
    const pk = meta?.getPrimaryProps()[0].fieldNames[0] ?? '_id'
    const res = await this.connection.db
      .collection<T>(entityName)
      ?.update(where as any, data)!
    return {
      insertId: res[0][pk],
      affectedRows: 1,
    }
  }

  override async nativeDelete<T extends Item>(
    entityName: string,
    where: FilterQuery<T>,
  ): Promise<QueryResult<T>> {
    log('nativeDelete', arguments)
    const meta = this.metadata.find(entityName)
    const pk = meta?.getPrimaryProps()[0].fieldNames[0] ?? '_id'
    const res = await this.connection.db
      .collection<T>(entityName)
      ?.remove(where as any)!
    return {
      insertId: res[0]?.[pk],
      affectedRows: res.length,
    }
  }

  override async count<T extends Item>(
    entityName: string,
    where: FilterQuery<T>,
  ): Promise<number> {
    log('count', arguments)
    const res = await this.find(entityName, where)
    return res.length
  }

  override async findVirtual<T extends object>(
    entityName: string,
    where: FilterQuery<T>,
    options: FindOptions<T, any, any, any>,
  ): Promise<EntityData<T>[]> {
    log('findVirtual', arguments)
    const meta = this.metadata.find(entityName)!

    if (meta.expression instanceof Function) {
      const em = this.createEntityManager<CollectionStoreDriver>()
      return meta.expression(em, where, options as any) as any
    }

    return super.findVirtual(entityName, where, options)
  }
  // extra operations
  async first(entityName: EntityName<any>): Promise<any> {
    return this.getConnection('read').first(entityName)
  }
  async last(entityName: EntityName<any>): Promise<any> {
    return this.getConnection('read').last(entityName)
  }
  async lowest(entityName: EntityName<any>, key: string): Promise<any> {
    return this.getConnection('read').lowest(entityName, key)
  }
  async greatest(entityName: EntityName<any>, key: string): Promise<any> {
    return this.getConnection('read').greatest(entityName, key)
  }
  async oldest(entityName: EntityName<any>): Promise<any> {
    return this.getConnection('read').oldest(entityName)
  }
  async latest(entityName: EntityName<any>): Promise<any> {
    return this.getConnection('read').latest(entityName)
  }
  async findById(entityName: EntityName<any>, id: any) {
    return this.getConnection('read').findById(entityName, id)
  }
  async findBy(entityName: EntityName<any>, key: string, id: any) {
    return this.getConnection('read').findBy(entityName, key, id)
  }
  async findFirstBy(entityName: EntityName<any>, key: string, id: any) {
    return this.getConnection('read').findFirstBy(entityName, key, id)
  }
  async findLastBy(entityName: EntityName<any>, key: string, id: any) {
    return this.getConnection('read').findLastBy(entityName, key, id)
  }
}
