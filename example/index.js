var hunt = require('hunt'),
  hrw = require('./../index.js'),
  Hunt = hunt({
    'huntKey': true,
    'mongoUrl': 'mongodb://localhost/hrw_dev'
  });

Hunt.extendModel('Article', require('./model/article.model.js'));

hrw(Hunt, { 'modelName': 'Article'});

Hunt.once('start', function (evnt) {
  Hunt.async.parallel({
    'userRoot': function (cb) {
      Hunt.model.User.findOneAndUpdate({
        'apiKey': 'i_am_root'
      }, {
        'root': true
      }, {
        'upsert': true
      },
      cb);
    },
    'userNonRoot': function (cb) {
      Hunt.model.User.findOneAndUpdate({
        'apiKey': 'i_am_prep'
      }, {
        'root': false,
        'name': {
          'familyName': 'Васильев',
          'middleName': 'Алексей',
          'givenName': 'Артёмович'
        }
      }, {
        'upsert': true
      },
      cb);
    }
  }, function (error, obj) {
    if (error) {
      throw error;
    } else {
      Hunt.model.Article.findOneAndUpdate(
        { 'name': 'Книжка о хрущике' },
        {
          'name': 'Книжка о хрущике',
          'content': 'Мучной хрущик дышит жопой',
          'author': obj.userNonRoot._id
        },
        { 'upsert': true },
        function (error, articleCreated) {
          if (error) {
            throw error;
          } else {
            console.log('Access API as ROOT\n http://localhost:3000/api/v1/article?huntKey=' + obj.userRoot.apiKey);
            console.log('Access API as LIMITED\n user http://localhost:3000/api/v1/article?huntKey=' + obj.userNonRoot.apiKey);
            console.log('Article created', articleCreated);
          }
        }
      );
    }
  });
});

Hunt.startWebServer();