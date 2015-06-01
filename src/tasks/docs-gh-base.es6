import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import vow from 'vow';
import builderCore from 'bs-builder-core';
import GitHub from '../github';

export default class DocsBaseGithub extends builderCore.tasks.Base {

    constructor(baseConfig, taskConfig) {
        super(baseConfig, taskConfig);

        var ghOptions = _.extend({ token: taskConfig.token }, baseConfig.getLoggerSettings());
        this.api = new GitHub(ghOptions);
    }

    static getLoggerName() {
        return module;
    }

    static getName() {
        return 'docs base github operations';
    }

    /**
     * Returns url pattern for http urls of gh sources
     * @returns {RegExp}
     * @private
     */
    static getGhUrlPattern() {
        // Например: https://github.com/bem/bem-method/tree/bem-info-data/method/index/index.en.md
        return /^https?:\/\/(.+?)\/(.+?)\/(.+?)\/(tree|blob)\/(.+?)\/(.+)/;
    }

    /**
     * Returns github API class instance
     * @returns {Github}
     * @private
     */
    getAPI() {
        return this.api;
    }

    /**
     * Returns parsed repository info for language version of page. Otherwise returns false
     * @param {Object} page - page model object
     * @param {String} lang - language
     * @returns {Object|false}
     * @private
     */
    getGhSource(page, lang) {
        var sourceUrl,
            repoInfo;

        //1. page должен иметь поле {lang}
        //2. page[lang] должен иметь поле 'sourceUrl'
        //3. page[lang].sourceUrl должен матчится на регулярное выражение из _getGhUrlPattern()
        //4. если хотя бы одно из условий не выполняется, то вернется false

        if (!page[lang]) {
            return false;
        }

        sourceUrl = page[lang].sourceUrl
        if (!sourceUrl) {
            return false;
        }

        repoInfo = sourceUrl.match(this.constructor.getGhUrlPattern());
        if (!repoInfo) {
            return false;
        }

        return {
            host: repoInfo[1],
            user: repoInfo[2],
            repo: repoInfo[3],
            ref:  repoInfo[5],
            path: repoInfo[6]
        };
    }

    /**
     * Returns pages with anyone language version satisfy _hasMdFile function criteria
     * @param {Array} pages - model pages
     * @param {Array} languages - configured languages array
     * @returns {Array} filtered array of pages
     * @private
     */
    getPagesWithGHSources(pages, languages) {
        // здесь происходит поиск страниц в модели у которых
        // хотя бы одна из языковых версий удовлетворяет критерию из функции _getGhSource
        return pages.filter(page => {
            return languages.some(lang => {
                return this.getGhSource(page, lang);
            });
        });
    }

    /**
     * Creates header object from cached etag
     * @param {Object} cache object
     * @returns {{If-None-Match: *}}
     * @private
     */
    getHeadersByCache(cache) {
        return (cache && cache.etag) ? { 'If-None-Match': cache.etag } : null;
    }

    /**
     * Reads file from cache folder
     * @param {String} filePath - path to file (relative to cache folder)
     * @returns {Promise}
     */
    readFileFromCache(filePath){
        var o = { encoding: 'utf-8' },
            basePath = this.getBaseConfig().getCacheFolder();

        return new Promise((resolve) => {
            fs.readFile(path.join(basePath, filePath), o, (error, content) => {
                resolve(content || "{}");
            });
        });
    }

    /**
     * Process single page for all page language version
     * @param {Model} model - data model
     * @param {Object} page - page model object
     * @param {Array} languages - array of languages
     * @returns {*|Promise.<T>}
     * @private
     */
    processPage(model, page, languages) {
        return Promise.resolve(page);
    }

    /**
     * Performs task
     * @returns {Promise}
     */
    run(model) {
        this.beforeRun(this.name);

        var PORTION_SIZE = 5,
            languages = this.getBaseConfig().getLanguages(), //массив языков

            // фильтруем страницы c гихабовыми ссылками на ресурсы
            pagesWithGHSources = this._getPagesWithGHSources(model.getPages(), languages),

            //делим полученный массив на порции. Это необходимо для того, чтобы не
            //посылать кучу запросов за 1 раз, что ведет к ошибкам соединения
            portions = _.chunk(pagesWithGHSources, PORTION_SIZE),

            //для каждой порции выполняем _syncDoc для всех страниц в порции
            //после синхронизации переходим к следующей порции
            processPages = portions.reduce((prev, portion, index) => {
                prev = prev.then(() => {
                    this.logger.debug('Synchronize portion of pages in range %s - %s',
                        index * PORTION_SIZE, (index + 1) * PORTION_SIZE);
                    return vow.allResolved(portion.map((page) => {
                        return this.processPage(model, page, languages);
                    }));
                });
                return prev;
            }, vow.resolve());

        return processPages.then(() => {
            return Promise.resolve(model);
        });
    }
}


