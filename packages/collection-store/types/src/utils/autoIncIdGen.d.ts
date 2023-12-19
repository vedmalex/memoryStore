import { Item } from '../types/Item';
import { IList } from '../async/IList';
export declare function autoIncIdGen<T extends Item>(item: T, model: string, list: IList<T>): number;
