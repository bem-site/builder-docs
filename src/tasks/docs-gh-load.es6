import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import vow from 'vow';
import builderCore from 'bs-builder-core';
import DocsBaseGithub from './docs-gh-base';

export default class DocsLoadGithub extends DocsBaseGithub {

    static getLoggerName() {
        return module;
    }

    /**
     * Return task human readable description
     * @returns {string}
     */
    static getName() {
        return 'docs load from gh';
    }

    /**
     * Loads content from github via github API
     * @param {Object} repoInfo - gh file object path settings
     * @param {Object} headers - gh api headers
     * @returns {Promise}
     * @private
     */
    _getContentFromGh(repoInfo, headers){
        return new Promise((resolve, reject) => {
            this.getAPI().getContent(repoInfo, headers, (error, result) => {
                if (error) {
                    this.logger
                        .error('GH: %s', error.message)
                        .error('Error occur while loading content from:')
                        .error('host: => %s', repoInfo.host)
                        .error('user: => %s', repoInfo.user)
                        .error('repo: => %s', repoInfo.repo)
                        .error('ref:  => %s', repoInfo.ref)
                        .error('path: => %s', repoInfo.path);
                    return reject(error);
                }
                resolve(result);
            });
        });
    }

    /**
     * Synchronize docs for all page language version
     * @param {Model} model - data model
     * @param {Object} page - page model object
     * @param {Array} languages - array of languages
     * @returns {*|Promise.<T>}
     * @private
     */
    processPage(model, page, languages) {
        return vow.allResolved(languages.map((language, index) => {
            var repoInfo = this.getCriteria(page, language);

            // Проверяем на наличие правильного поля contentFile
            // это сделано потому, что предварительный фильтр мог сработать
            // для страниц у которых только часть из языковых версий удовлетворяла критерию
            if (!repoInfo) {
                return vow.resolve();
            }


            // сначала нужно проверить информацию в кеше
            // там есть etag и sha загруженного файла
            this.logger.debug(`Load doc file for language: => ${language} and page with url: => ${page.url}`);
            return this.readFileFromCache(path.join(page.url, language + '.json'))
                .then(content => {
                    return JSON.parse(content);
                })
                .then(cache => {
                    cache = cache || {};
                    // выполняется запрос на gh
                    return this._getContentFromGh(repoInfo, this.getHeadersByCache(cache))
                        .then((result) => {

                            // если запрос был послан с header содержащим meta etag
                            // и данные не менялись то возвращается 304 статус
                            // берем данные из кеша
                            if (result.meta.status === '304 Not Modified') {
                                this.logger.verbose('Document was not changed: %s', page.url);
                                return Promise.resolve(path.join(page.url, cache.fileName));
                            }

                            // дополнительная проверка изменения в файле путем сравнения sha сум
                            if(cache.sha === result.sha) {
                                return Promise.resolve(path.join(page.url, cache.fileName));
                            }

                            if(!cache.sha) {
                                this.logger.debug('Doc added: %s %s %s', page.url, language, page[language].title);
                                model.getChanges().pages.addAdded({ type: 'doc', url: page.url, title: page[language].title });
                            }else {
                                this.logger.debug('Doc modified: %s %s %s', page.url, language, page[language].title);
                                model.getChanges().pages.addModified({ type: 'doc', url: page.url, title: page[language].title });
                            }

                            // меняем/добавляем данные в кеш
                            cache.etag = result.meta.etag;
                            cache.sha = result.sha;

                            var content = new Buffer(result.content, 'base64').toString(),
                                ext = result.name.split('.').pop(),
                                fileName = language + '.' + ext,
                                filePath = path.join(page.url, fileName);

                            cache.fileName = fileName;

                            // записываем файл мета-данных и файл с контентом в кеш
                            return vow.all([
                                this.writeFileToCache(path.join(page.url, language + '.json'), JSON.stringify(cache, null, 4)),
                                this.writeFileToCache(filePath, content)
                            ]).then(() => {
                                return filePath;
                            });
                        })
                        .then((filePath) => {
                            // добавляем соответствующее поле в модель
                            page[language]['contentFile'] = filePath;
                            return filePath;
                        });
                });
        })).then(() => {
            return page;
        });
    }
}

