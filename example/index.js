var hunt = require('hunt'),
  hrw = require('./../index.js'),
  Hunt = hunt({
    'huntKey':true,
    'mongoUrl':'mongodb://localhost/hrw_dev'
  });

Hunt.extendModel('Article', function(core){
  var ArticleSchema = new core.mongoose.Schema({
    'name': {type: String, unique: true},
    'content': String,
    'author':  { type: core.mongoose.Schema.Types.ObjectId, ref: 'User' }
  });

  ArticleSchema.index({
    name: 1
  });
//this step is very important - bind mongoose model to current mongo database connection
// and assign it to collection in mongo database


  ArticleSchema.statics.doSmth = function(user, payload, callback){
    callback(null, {
      'user':user,
      'payload':payload
    });
  };

  ArticleSchema.methods.doSmth = function(user, payload, callback){
    callback(null, {
      'article': this,
      'user':user,
      'payload':payload
    });
  };


  ArticleSchema.statics.canCreate = function(user, callback){
    if(user){ //only authorized user can create new article
      callback(null, true, 'author');
    } else {
      callback(null, false);
    }
  };

  ArticleSchema.statics.listFilter = function(user, callback){
    if(user) {
      if(user.root) {
        callback(null, {}); //root can list all documents!
      } else {
        callback(null, {'owner':user._id}); //non root user can see documents, where he/she is an owner
      }
    } else {
      callback(null, false); //non authorized user cannot list anything!
    }
  };

  ArticleSchema.methods.canRead = function(user, callback){
    if(user) {
      if(user.root) {
        callback(null, true, ['name','content','owner'], ['owner']); //root can list all documents and all document fields, with populating author
      } else {
        callback(null, this.owner === user._id, ['name','content']); //non root user can see documents, where he/she is an owner
      }
    } else {
      callback(null, false); //non authorized user cannot read anything!
    }
  };

  ArticleSchema.methods.canEdit = function(user, callback){
    if(user) {
      if(user.root) {
//root can list all documents and all document fields, with populating author
        callback(null, true, ['name','content','owner']);
      } else {
        callback(null, this.owner === user._id, ['name','content']);
//non root user can edit `name` and `content` of
//documents, where he/she is an owner
      }
    } else {
      callback(null, false); //non authorized user cannot edit anything!
    }
  };

  ArticleSchema.methods.canDelete = function(user, callback){
    var document = this;
    if(user) {
      if(user.root) {
        callback(null, true); //root can delete every document
      } else {
        callback(null, document.owner === user._id);
//non root user can delete documents, where he/she is an owner
      }
    } else {
      callback(null, false); //non authorized user cannot edit anything!
    }
  };


  return core.mongoConnection.model('Article', ArticleSchema);
});

hrw(Hunt, { 'modelName': 'Article'});

Hunt.once('start', function(evnt){
  Hunt.async.parallel({
    'userRoot': function(cb){
      Hunt.model.User.create({
        'root':true,
        'apiKey': Hunt.rack()
      }, cb);
    },
    'userNonRoot': function(cb){
      Hunt.model.User.create({
        'root':false,
        'name':{
          'familyName': 'Васильев',
          'middleName': 'Алексей',
          'givenName': 'Артёмович'
        },
        'apiKey': Hunt.rack()
      }, cb);
    }
  },function(error, obj){
    if(error) {
      throw error;
    } else {
      Hunt.model.Article.findOneAndUpdate(
        { 'name': 'Книжка о хрущике' },
        {
          'name': 'Книжка о хрущике',
          'content':'Мучной хрущик дышит жопой',
          'owner':obj.userNonRoot._id
        },
        { 'upsert': true },
        function(error, articleCreated){
          if(error){
            throw error;
          } else {
            console.log('Access API as ROOT\n http://localhost:3000/api/v1/trophy?huntKey='+obj.userRoot.apiKey);
            console.log('Access API as LIMITED\n user http://localhost:3000/api/v1/article?huntKey='+obj.userNonRoot.apiKey);
            console.log('Article created', articleCreated);
          }
        });
    }
  });
});

Hunt.startWebServer();