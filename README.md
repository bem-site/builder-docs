# builder-docs
Plugin for bs-builder system which contains set of tasks for loading page source files
from different sources (github, filesystem, e.t.c) and tasks for converting content of files to html.

[![NPM version](http://img.shields.io/npm/v/builder-docs.svg?style=flat)](http://www.npmjs.org/package/builder-docs)
[![Coveralls branch](https://img.shields.io/coveralls/bem-site/builder-docs/master.svg)](https://coveralls.io/r/bem-site/builder-docs?branch=master)
[![Travis](https://img.shields.io/travis/bem-site/builder-docs.svg)](https://travis-ci.org/bem-site/builder-docs)
[![David](https://img.shields.io/david/bem-site/builder-docs.svg)](https://david-dm.org/bem-site/builder-docs)
[![David](https://img.shields.io/david/dev/bem-site/builder-docs.svg)](https://david-dm.org/bem-site/builder-docs#info=devDependencies)

Плагин для [bs-builder](https://www.npmjs.com/package/bs-builder-core) предназначенный для реализации загрузки 
контента для страниц в модели по описанным ссылкам с различных источников а также для последующего 
преобразования загруженного содержимого в html-формат.

![GitHub Logo](./logo.jpg)

## Установка

Пакет устанавливается как обычная npm зависимость
```
$ npm install --save bs-builder-docs
```

## Набор готовых задач сборки в пакете

### - [DocsLoadGithub](./src/tasks/docs-gh-load.es6)

Описание: Позволяет загружать произвольные файлы с гитхаба с использованием github API.
Для предотвращения превышения лимита запросов используется кеширование.

##### Опции задачи:
* {String} token - уникальный github токен для предназначенный для авторизации модуля, который 
работает с github API. Если данный параметр не будет указан, то число возможных запросов 
будет ограничено 60-ю запросами в час.

* {Boolean} updateDate - Опция, при включении которой, в модель будет дополнительно сохраняться 
информация о дате последнего изменения файла. (по умолчанию false)

* {Boolean} hasIssues - Опция, при включении которой, в модель будет дополнительно сохраняться
информация о наличии или отсутствии раздела issues в репозитории откуда был загружен файл. (по умолчанию false)

* {Boolean} getBranch - Опция, при включении которой, в модель будет дополнительно сохраняться
название ветки репозитория откуда был загружен файл. Если же файл был загружен с тега, то будет
сохранено имя основной ветки репозитория.

### - [DocsFileLoad](./src/tasks/docs-file-load.es6)

Описание: Позволяет загружать произвольные файлы с локальной файловой системы.

### - [DocsMdHtml](./src/tasks/docs-md-html.es6)

Описание: Позволяет преобразовывать загруженные `*.md` (markdown) файлы в html формат с помощью
модуля [bem-md-renderer](https://www.npmjs.com/package/bem-md-renderer).

## Тестирование

Запуск тестов с вычислением покрытия кода тестами с помощью инструмента [istanbul](https://www.npmjs.com/package/istanbul):
```
npm test
```

Проверка синтаксиса кода с помощью: 
[jshint](https://www.npmjs.com/package/jshint),
[eslint](https://www.npmjs.com/package/eslint),
[jscs](https://www.npmjs.com/package/jscs)

```
npm run codestyle
```

Особая благодарность за помощь в разработке:

* Ильченко Николай (http://github.com/tavriaforever)
* Константинова Гела (http://github.com/gela-d)
* Гриненко Владимир (http://github.com/tadatuta)
* Абрамов Андрей (https://github.com/blond)

Разработчик Кузнецов Андрей Серргеевич @tormozz48
Вопросы и предложения присылать по адресу: tormozz48@gmail.com
