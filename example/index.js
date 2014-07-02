var hunt = require('hunt'),
  hrw = require('./../index.js'),
  Hunt = hunt({
    'disableCsrf': true,
    'huntKey': true,
    'mongoUrl': 'mongodb://localhost/hrw_dev'
  });

Hunt.extendModel('Article', require('./model/article.model.js'));

hrw(Hunt, { 'modelName': 'Article'});

Hunt.once('start', function (evnt) {
  require('./lib/populateDatabase.js')(Hunt);
});

Hunt.startWebServer();