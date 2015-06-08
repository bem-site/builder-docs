require('./tasks/docs-base.test.js');
require('./tasks/docs-gh-base.test.js');
require('./tasks/docs-gh-load.test.js');
require('./tasks/docs-file-load.test.js');
require('./tasks/docs-md-html.test');

var index = require('../index');

it('should plug DocsGhLoad task', function () {
    index.tasks.DocsGhLoad.getName().should.equal('docs load from gh');
});

it('should plug DocsFileLoad task', function () {
    index.tasks.DocsFileLoad.getName().should.equal('docs load from file');
});

it('should plug DocsMdHtml task', function () {
    index.tasks.DocsMdHtml.getName().should.equal('docs markdown to html');
});
