var hunt = require('hunt'),
  hrw = require('./../index.js'),
  model = require('./../example/model/article.model.js'),
  populateDb = require('./../example/lib/populateDatabase.js'),
  should = require('should'),
  Hunt,
  rootKey = 'i_am_root',
  articleId,
  request = require('request');


function isArticle(a) {
  a.name.should.be.a.String;
  a.content.should.be.a.String;
}


describe('Testing REST api as root', function () {
  before(function (done) {
    Hunt = hunt({
      'port': 3002,
      'disableCsrf': true,
      'huntKey': true,
      'mongoUrl': 'mongodb://localhost/hrw_dev'
    });

    Hunt.extendModel('Article', model);

    hrw(Hunt, { 'modelName': 'Article'});

    Hunt.once('start', function (evnt) {
      populateDb(Hunt, done);
    });

    Hunt.startWebServer();
  });

  it('returns list of articles for GET /', function (done) {
    request({
        'method': 'GET',
        'url': 'http://localhost:' + Hunt.config.port + '/api/v1/article',
        'headers': {'huntKey': rootKey},
        'json': true
      },
      function (error, response, body) {
        if (error) {
          done(error);
        } else {
          response.statusCode.should.be.equal(200);
          body.status.should.be.equal('Ok');
          body.data.should.be.an.Array;
          body.data.map(isArticle);
          done();
        }
      });
  });

  it('creates article for POST /', function (done) {
    request({
        'method': 'POST',
        'url': 'http://localhost:' + Hunt.config.port + '/api/v1/article',
        'headers': {'huntKey': rootKey},
        'form': {
          'name': 'Da book'+Date.now(),
          'content': 'some content',
        },
        'json': true
      },
      function (error, response, body) {
        if (error) {
          done(error);
        } else {
          response.statusCode.should.be.equal(201);
          body.status.should.be.equal('Ok');
          body.data.name.should.be.equal('Da book');
          body.data.content.should.be.equal('some content');
          body.data.id.should.be.a.String;
          articleId = body.data.id;
          done();
        }
      });
  });

  it('returns article needed for GET /:id', function (done) {
    request({
        'method': 'GET',
        'url': 'http://localhost:' + Hunt.config.port + '/api/v1/article/' + articleId,
        'headers': {'huntKey': rootKey},
        'json': true
      },
      function (error, response, body) {
        if (error) {
          done(error);
        } else {
          response.statusCode.should.be.equal(200);
          body.status.should.be.equal('Ok');
          body.data.name.should.be.equal('Da book');
          body.data.content.should.be.equal('some content');
          body.data.id.should.be.a.equal(articleId);
          done();
        }
      });
  });
/*/
  it('returns unauthorized for PUT /:id', function (done) {
    request({
        'method': 'PUT',
        'url': 'http://localhost:' + Hunt.config.port + '/api/v1/article/53b43aded6202872e0e3371f',
        'form': {
          'name': 'Da book',
          'content': 'some content'
        },
        'json': true
      },
      function (error, response, body) {
        if (error) {
          done(error);
        } else {
          response.statusCode.should.be.equal(401);
          body.status.should.be.equal('Error');
          body.errors.should.be.an.Array;
          body.errors.length.should.be.equal(1);
          body.errors[0].code.should.be.equal(401);
          body.errors[0].message.should.be.equal('Authorization required!');
          done();
        }
      });
  });

  it('returns unauthorized for DELETE /:id', function (done) {
    request({
        'method': 'DELETE',
        'url': 'http://localhost:' + Hunt.config.port + '/api/v1/article/53b43aded6202872e0e3371f',
        'json': true
      },
      function (error, response, body) {
        if (error) {
          done(error);
        } else {
          response.statusCode.should.be.equal(401);
          body.status.should.be.equal('Error');
          body.errors.should.be.an.Array;
          body.errors.length.should.be.equal(1);
          body.errors[0].code.should.be.equal(401);
          body.errors[0].message.should.be.equal('Authorization required!');
          done();
        }
      });
  });
//*/
});