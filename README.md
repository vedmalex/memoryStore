#collection-store

It is simple and effective in-memory object store
can be used both on browser and server side.

for usage please see tests.

features:

- ttl: each item can have ttl;
- indexes: collection can have multiple indexes;
- schema: collection must have schema for all indexed items;
- simple CRUD.
- simple persistence
- extensible persistence.
- serialize/load schema within storage

## find

можно добавить валидацию
можно добавить интеграцию с удаленным хранилищем через хранилище
можно добавить graphql
можно добавить полнотекстовый поиск

можно использовать как структурированные логи для приложения

[x] чистить пустые индексные записи для Array
интегрировать с filter
и плотнее с lodash
[x] уровень хранения сделать адаптером, а не отдельным классом
кастомные индексы
    туда же можно включить сохранение в firebase

[x] предварительная обработка ключевых полей, функция,
[x] ignoreCase
[x] возможность строгой типизации коллекций с бонусами в ts - intellisence для индексов

[] поиск по нескольким ключам
[] сложные индексы(более двух полей)
[] fuzzy поиск по коллекциям

[] интегрировать с google spreadsheet

сделать сервер для работы с библиотекой в смысле сдлать программу сервер

посмотреть lunr.js для поиска по индексам
сделать индексы btree ... для поиска больше меньше и прочее

// https://medium.com/swlh/binary-search-tree-in-javascript-31cb74d8263b

// https://medium.com/swlh/key-value-pair-database-internals-18f52c36bb70
// https://medium.com/swlh/guide-to-database-storage-engines-2b188bd3e9e3

использоваь splay-tree
https://github.com/w8r/splay-tree
чел пишет алгоритмы сам
использовать статический поиск без расширения staticFind

  для поиска использовать FlexSearch.js


  поддержка русского языка https://github.com/alex-shpak/hugo-book/issues/80

поиск: сделать дерево простых значений, как хэш таблиц
для множественного поиска использовать два и более индексов
проверять unique/non unique
в узлах хранить ссылки на ключи, массив или один
сделать сериализацию: сохранение и восстанровление индекса из/в JSON
сделать индекс для lunr.js

сделать сериализацию и десериализацию rotate

можно сделать дополнительные адаптеры для работы с базами данных, тогда такая локальная коллекция будет загружаться в начале работы и сохраняться в конце.
можно сделать чтото типа транзакий или логгирования
- проблемы с перекрестными обновлениями нужно отрабатывать как конфликты
- можно придумать механизмавтоматической подгрузки данных в коллекцию по определенному запросу
- вопросы с индексами: можно как-то придумать как лазить по вложенным структурам в typescript
  - https://stackoverflow.com/questions/58434389/typescript-deep-keyof-of-a-nested-object

[x] вспомнить где лежит библиотека filter
- [x] оттуда можно взять преобразование всего чего нужно... была в библиотеках oda
-

вводим типы ключевых полей
- объекты сериализуются в строку, все
  - если(!) хранить в нативном формате
    - тогда надо будет чтобы как-то определять чем мы сериализовали
      - в виде пар значений
      -
- для поиска по интервалам и прочее
  - два основных типа:
    - строка
    - число
    - дата == строка и число
    - boolean = True/False или 1/0
  - нужны быстрые операции пересечения
    - это можно сделать на хэшах
      - преобразуем по известному алогритму в строку
      - пересечение
      - объединение
      - разница справа
      - разница слева



вставка элементов, с проверкой, на sparse
если sparce, тогда нужно вставлять, если нет, то не нужно

[x]list заменить на persistence adapter

[x] rotation сделать с переносом всех файлов в другую директорию, а не просто метаданных

сделать адаптер для redis

[x] путь к диреткории с файлами указывать, сейчас удален

проверка коллекции на консистентность:
вдруг файл был удален или добавлен новый
 только для

!!! все операции обновления делать только над копиями данных, чтобы не изменять состояние базы без явного обновления...

counter для первичных ключей не обновляется!!!

- [x]хранить как-то ключ по которому сохранялся объект, служебная информация
  - решено через получение ключа по id в tree
- история изменений (audit) https://habr.com/ru/post/101544/
- версия данных
  - для конкурентного изменения данных
  - выдавать ошибку версии
- [x] валидация и поля со значениями по-умлочанию
  - все можно сделать в одном через схему
- загрузка и восстановление индексов после инициализации? посмотреть
- сурогатные ключи и комбинированные уникальные и первичные с многими полями
  - просто выбираем ключи и ставим между ними ":"
  - задаем очередность полей ключа
  - это полезно для версионных структур данных

!!! сделать адаптер для mem-fs, redis, mongodb, gitfs, firebase, firestore, googlesheet


весионность: инкрементировать версию и записывать патч, в файл с историей