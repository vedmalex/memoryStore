import { Item } from '../../types/Item';
import Collection from '../collection';
export declare function rebuild_indexes<T extends Item>(collection: Collection<T>): Promise<void>;
