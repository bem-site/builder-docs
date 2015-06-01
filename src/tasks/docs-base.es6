import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import vow from 'vow';
import builderCore from 'bs-builder-core';
import GitHub from '../github';

export default class DocsBase extends builderCore.tasks.Base {

    static getLoggerName() {
        return module;
    }

    static getName() {
        return 'docs base operations';
    }

    static getPortionSize() {
        return 5;
    }

    /**
     * Returns criteria function base on page object and language
     * @param {Object} page - page model object
     * @param {String} lang - language
     * @returns {Object|false}
     * @private
     */
    getCriteria(page, lang) {
        return false;
    }

    /**
     * Returns pages with anyone language version satisfy getCriteria function criteria
     * @param {Array} pages - model pages
     * @param {Array} languages - configured languages array
     * @returns {Array} filtered array of pages
     * @private
     */
    getPagesByCriteria(pages, languages) {
        // здесь происходит поиск страниц в модели у которых
        // хотя бы одна из языковых версий удовлетворяет критерию из функции getCriteria
        return pages.filter(page => {
            return languages.some(lang => {
                return this.getCriteria(page, lang);
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

    processPages(model) {
        var portionSize = this.constructor.getPortionSize(),
            languages = this.getBaseConfig().getLanguages(), //массив языков

            // фильтруем страницы удовлетворяющие критерию
            pagesWithGHSources = this.getPagesByCriteria(model.getPages(), languages),

            //делим полученный массив на порции. Это необходимо для того, чтобы не
            //посылать кучу запросов за 1 раз (что ведет к ошибкам соединения)
            //или не превышать лимит открытых файлов на файловой системе
            portions = _.chunk(pagesWithGHSources, portionSize);

        //для каждой порции выполняем processPage для всех страниц в порции
        //после обработки переходим к следующей порции
        return portions.reduce((prev, portion, index) => {
            prev = prev.then(() => {
                this.logger.debug('process portion of pages in range %s - %s',
                    index * portionSize, (index + 1) * portionSize);
                return vow.allResolved(portion.map((page) => {
                    return this.processPage(model, page, languages);
                }));
            });
            return prev;
        }, vow.resolve());
    }

    /**
     * Performs task
     * @returns {Promise}
     */
    run(model) {
        this.beforeRun(this.name);

        return processPages(model).then(() => {
            return Promise.resolve(model);
        });
    }
}



