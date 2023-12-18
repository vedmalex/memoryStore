import { IndexDef, SerializedIndexDef } from '../types/IndexDef';
import { Item } from '../types/Item';
import { IdGeneratorFunction } from '../types/IdGeneratorFunction';
import { IdType } from '../types/IdType';
import { IStorageAdapter } from './IStorageAdapter';
import { IList } from './IList';
import { ZodType } from 'zod';
export interface ICollectionConfig<T extends Item> {
    root: string;
    name: string;
    list: IList<T>;
    adapter: IStorageAdapter<T>;
    ttl?: string | number | boolean;
    rotate?: string;
    audit?: boolean;
    validation?: ZodType<T>;
    id?: string | Partial<IdType<T>>;
    idGen?: string | IdGeneratorFunction<T>;
    auto?: boolean;
    indexList?: Array<IndexDef<T>>;
}
export interface ISerializedCollectionConfig {
    name: string;
    id: string;
    ttl?: string | number | boolean;
    rotate?: string;
    list: string;
    audit?: boolean;
    validation?: JSON;
    auto?: boolean;
    indexList?: Array<SerializedIndexDef>;
    adapter: string;
    root: string;
}
