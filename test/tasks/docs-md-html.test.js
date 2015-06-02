var os = require('os'),
    fs = require('fs'),
    mockFs = require('mock-fs'),
    should = require('should'),
    Config = require('bs-builder-core/lib/config'),
    Model = require('bs-builder-core/lib/model/model'),
    DocsMdHtml = require('../../lib/tasks/docs-md-html');

describe('DocsMdHtml', function () {

    it('should return valid task name', function() {
        DocsMdHtml.getName().should.equal('docs markdown to html');
    });

    it('should return valid portion size', function () {
        DocsMdHtml.getPortionSize().should.equal(20);
    });

    describe('instance methods', function () {
        var config,
            task;

        before(function () {
            config = new Config('debug');
            task = new DocsMdHtml(config, {});
        });

        describe('getCriteria', function () {
            it('should return false on missed language version of page', function () {
                var page = { url: '/url1' };
                task.getCriteria(page, 'en').should.equal(false);
            });

            it('should return false on missed contentFile field for lang version of page', function () {
                var page = { url: '/url1', en: {} };
                task.getCriteria(page, 'en').should.equal(false);
            });

            it('should return false if contentFile value does not match regular expression', function () {
                var page = {
                    url: '/url1',
                    en: {
                        contentFile: '/foo/bar.json'
                    }
                };
                task.getCriteria(page, 'en').should.equal(false);
            });

            it('should return true if contentFile value matches regular expression', function () {
                var page = {
                    url: '/url1',
                    en: {
                        contentFile: '/foo/bar.md'
                    }
                };
                task.getCriteria(page, 'en').should.equal(true);
            });
        });

        describe('_mdToHtml', function () {
            var page = { url: '/url1'},
                language = 'en';

            it('should successfully parse markdown to html', function (done) {
                task._mdToHtml(page, language, '# Hello World').then(function (html) {
                    html.should.equal(
                        '<h1 id="hello-world"><a href="#hello-world" class="anchor"></a>Hello World</h1>\n');
                    done();
                });
            });

            it('should return  rejected promise on missed markdown source', function (done) {
                task._mdToHtml(page, language, null).catch(function (error) {
                    error.message.should.equal('Markdown string should be passed in arguments');
                    done();
                });
            });
        });
    });
});


