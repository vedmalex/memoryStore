import 'jest'
import { List, Item } from '../collection';
import Collection from '../collection.node';

interface ChildItem extends Item {
  name: string
  age: string
}

describe('hreplacer', () => {

  describe('list', () => {
    it('run', () => {
      let list = new List();
      list.push({ obje: 1 });
      list.push({ obje: 2 });
      list.push({ obje: 3 });
      list.push({ obje: 4 });
      list.push(10);

      let k: string = ''
      expect(() => {
        for (let item of list.keys) {
          k+= item
        }
        expect(k).toBe('01234')
      }).not.toThrow()

    });
  });

  describe('collectionTTL', () => {

    beforeEach(() => {
      let c1 = new Collection({ name: 'items', ttl: '100ms', id: 'name' });
      c1.create({ name: 'Some', age: 12 });
      c1.create({ name: 'Another', age: 13 });
      c1.create({ name: 'SomeOneElse', age: 12 });
      c1.create({ name: 'Anybody', age: 12 });
      c1.persist();
    });

    it('exists before ttl-ends', () => {
      let c1 = new Collection({ name: 'items' });
      c1.load();
      expect(c1.list.length).toBe(4);

    });

    it('didn\'t exists after ttl-ends', (done) => {
      let c1 = new Collection({ name: 'items' });
      setTimeout(() => {
        c1.load();
        expect(c1.list.length).toBe(0);
        c1.create({ name: 'Some', age: 12 });
        c1.create({ name: 'Another', age: 13 });
        c1.create({ name: 'SomeOneElse', age: 12 });
        c1.create({ name: 'Anybody', age: 12 });
        c1.persist();
        expect(c1.list.length).toBe(4);
        done();
      }, 300);
    });
  });

  describe('collection', () => {

    beforeEach(() => {
      let c1 = new Collection({ name: 'items' });
      c1.create({ name: 'Some', age: 12 });
      c1.create({ name: 'Another', age: 13 });
      c1.create({ name: 'SomeOneElse', age: 12 });
      c1.create({ name: 'Anybody', age: 12 });
      c1.persist();
    });

    it('default autoinc works', () => {
      let c1 = new Collection({ name: 'items' });
      c1.load();

      expect(c1.list.get(0).id).toBe(0);
      expect(c1.list.get(1).id).toBe(1);
      expect(c1.list.get(2).id).toBe(2);
      expect(c1.list.get(3).id).toBe(3);

      expect(c1.indexes.id[0]).toBe(0);
      expect(c1.indexes.id[1]).toBe(1);
      expect(c1.indexes.id[2]).toBe(2);
      expect(c1.indexes.id[3]).toBe(3);
    });

    it('has different configurations', () => {

      let col1 = new Collection({ name: 'testOne', id: 'name', auto: false });

      expect({ id: col1.id, auto: col1.auto, gen: col1.indexDefs.name.gen }).toMatchObject({
        id: 'name', auto: false, gen: 'autoIncIdGen'
      });

      let col11 = new Collection({ name: 'testOne' });

      expect({ id: col11.id, auto: col11.auto, gen: col11.indexDefs.id.gen }).toMatchObject({
        id: 'id', auto: true, gen: 'autoIncIdGen'
      });

      let gen2 = (item, model, initial) => {
        return item.name + model + initial;
      };

      let col2 = new Collection({
        name: 'testTwo',
        id: 'name',
        idGen: gen2
      });

      expect({ id: col2.id, auto: col2.auto, gen: col2.indexDefs.name.gen }).toMatchObject({
        id: 'name', auto: true, gen: gen2.toString()
      });

      let col3 = new Collection({ name: 'testThree', id: 'name', auto: false });

      expect(() => col3.push({ some: 1, other: 2 })).toThrow();

      let col4 = new Collection({ name: 'testFour', id: { name: 'name', auto: false } });

      expect({ id: col4.id, auto: col4.auto, gen: col4.indexDefs.name.gen }).toMatchObject({
        id: 'name', auto: false, gen: 'autoIncIdGen'
      });

    });

    it('has unique index', () => {
      let c1 = new Collection({ name: 'items' });
      c1.load();
      expect(() => c1.push({ id: 0, name: 'some' })).toThrow();
    });

    it('must have constructor', () => {
      expect(() => new Collection()).toThrow();
      expect(() => new Collection({ name: 'name' })).not.toThrow();
      let collection = new Collection({ name: 'SomeName' });
      expect(collection.list.length).toBe(0);
      expect(Object.keys(collection.indexes.id).length).toBe(0);
    });

    it('creates item', () => {

      let c1 = new Collection({ name: 'items0' });
      // c1.load();
      c1.create({ name: 'Some', age: 12 });
      c1.persist();
      c1.load();
      expect(c1.list.length).toBe(1);
      expect(Object.keys(c1.indexes.id).length).toBe(1);

    });

    it('resets the collection, not the storage', () => {
      let c1 = new Collection({ name: 'items8' });
      c1.create({ name: 'Some', age: 12 });
      c1.create({ name: 'Another', age: 13 });
      c1.create({ name: 'SomeOneElse', age: 12 });
      c1.create({ name: 'Anybody', age: 12 });
      c1.persist();
      expect(c1.list.length).toBe(4);
      expect(Object.keys(c1.indexes.id).length).toBe(4);
      c1.reset();
      expect(c1.list.length).toBe(0);
      expect(Object.keys(c1.indexes.id).length).toBe(0);
      c1.load();
      expect(c1.list.length).toBe(4);
      expect(Object.keys(c1.indexes.id).length).toBe(4);
      c1.reset();
      c1.persist();
      c1.load();
      expect(c1.list.length).toBe(0);
      expect(Object.keys(c1.indexes.id).length).toBe(0);
    });

    it('allow update key fields', () => {
      let c1 = new Collection({ name: 'items' });
      c1.load();
      expect(c1.list.length).toBe(4);
      c1.update({ id: 0, age: 12 }, { id: 10, class: 5 });
      c1.persist();
      expect(c1.findById(0)).toBe(undefined);
      expect(c1.findById(10)).not.toBe(undefined);
    });

    it('find findOne findById', () => {
      let c1 = new Collection({ name: 'items' });
      c1.load();
      expect(c1.list.length).toBe(4);
      expect(c1.find({ age: 12 }).length).toBe(3);
      expect(c1.find({ age: 13 }).length).toBe(1);
      expect(c1.find(i => i.age == 13).length).toBe(1);
      expect(c1.findOne({ age: 13 })).toMatchObject({ name: 'Another', age: 13, id: 1 });
      expect(c1.findOne(i => i.age == 13)).toMatchObject({ name: 'Another', age: 13, id: 1 });
      expect(c1.findById(1)).toMatchObject({ name: 'Another', age: 13, id: 1 });
    });

    it('update undateOne updateWithId', () => {
      let c1 = new Collection<ChildItem>({ name: 'items' });
      c1.load();
      expect(c1.list.length).toBe(4);
      c1.update({ age: 12 }, { class: 5 });
      c1.persist();
      c1.load();
      expect(c1.find({ class: 5 }).length).toBe(3);
      c1.update({ age: 13 }, { class: 6 });
      c1.persist();
      c1.load();
      expect(c1.find({ class: 6 }).length).toBe(1);
      c1.updateWithId(0, { name: '!!!' });
      c1.persist();
      c1.load();
      expect(c1.findById(0).name).toBe('!!!');
    });

    it('remove removeOne removeWithId', () => {
      let c1 = new Collection({ name: 'items' });
      c1.load();
      expect(c1.list.length).toBe(4);
      c1.removeOne({ age: 12 });
      expect(c1.list.length).toBe(3);
      c1.persist();
      c1.load();
      expect(c1.find({ age: 12 }).length).toBe(2);
      c1.remove(i => i.age == 12);
      expect(c1.list.length).toBe(1);
      c1.persist();
      c1.load();
      expect(c1.find({ age: 12 }).length).toBe(0);
      expect(c1.find(i => i.age = 13).length).toBe(1);
      c1.removeWithId(1);
      c1.persist();
      c1.load();
      expect(c1.find(i => i.age = 13).length).toBe(0);
    });

    it('continue id after removing and etc', () => {
      let c1 = new Collection({ name: 'items' });
      c1.load();
      c1.removeWithId(3);
      c1.removeWithId(1);
      let nv = c1.create({ age: 100, class: 100 });
      expect(nv.id).toBe(4);
      c1.persist();
    });

  });

  describe('collection indexes', () => {
    beforeEach(() => {
      let c1 = new Collection({
        name: 'items', id: '_id', indexList: [{
          key: 'name',
        }, {
          key: 'age'
        }
        ]
      });
      c1.create({ name: 'Some', age: 12 });
      c1.create({ name: 'Another', age: 13 });
      c1.create({ name: 'Another', age: 12 });
      c1.create({ name: 'SomeOneElse', age: 11 });
      c1.create({ name: 'SomeOneElse', age: 14 });
      c1.create({ name: 'Anybody', age: 13 });
      c1.create({ name: 'Anybody', age: 1 });
      c1.create({ name: 'Anybody', age: 12 });
      c1.persist();
    });

    it('restore all collection state', () => {
      let c1 = new Collection({ name: 'items' });
      expect(c1.id).toBe('id');
      c1.load();
      expect(c1.id).toBe('_id');
      expect(c1.indexDefs.id).toBe(undefined);
      expect(c1.indexDefs._id).not.toBe(undefined);
      expect(c1.indexDefs.name).not.toBe(undefined);
      expect(c1.indexDefs.age).not.toBe(undefined);
      expect(c1.indexes.id).toBe(undefined);
      expect(c1.indexes._id).not.toBe(undefined);
      expect(c1.indexes.name).not.toBe(undefined);
      expect(c1.indexes.age).not.toBe(undefined);
    });

    it('findBy index keys', () => {
      let c1 = new Collection({ name: 'items' });
      c1.load();

      let byName = c1.findBy('name', 'Anybody');
      expect(byName.length).toBe(3);
      let byAge = c1.findBy('age', 12);
      expect(byAge.length).toBe(3);
      let byId = c1.findBy('_id', 1);
      expect(byId.length).toBe(1);

    });

  });

});

// доделать тесты для node + web и можно делать проект...
// посмотреть может быть можно и нужно использовать версию с Map вместо hash
// индексы храняться в hash не по значению а по строкам... это может упростить
// работы кодогенерации...
//

// нужно хранить объекты для кодогенерации и иметь возможность обращаться
// к ним по определенным полям...
