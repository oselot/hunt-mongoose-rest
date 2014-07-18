Hunt-Mongo-REST
==============================

[![Build Status](https://travis-ci.org/oselot/hunt-mongoose-rest.svg)](https://travis-ci.org/oselot/hunt-mongoose-rest)

Abstract Mongoose to REST interface CRUD. In MVC paradigm  this module is a way
to generate view (as JSON object) and controller for this particular model.
It is worth mention, that access control checks are performed via 
[static Active Record methods](http://mongoosejs.com/docs/guide.html#statics) and 
[instance Active Record methods](http://mongoosejs.com/docs/guide.html#methods) 
mongoose model against the current authenticated user.
It is nodejs implementation of awesome module of (http://www.symfony-project.org/plugins/sfDoctrineRestGeneratorPlugin)
This work is inspired by [http://www.restapitutorial.com/](http://www.restapitutorial.com/).
This module is intended to work with [HuntJS framework](https://huntjs.herokuapp.com/) of v 0.1.x branch.



Usage
==============================

```javascript

    var Hunt = require('hunt'),
      hrw = require('hunt-mongo-rest'),
      hunt = Hunt({
        'disableCsrf': true,
        'huntKey': true,
        'mongoUrl': 'mongodb://localhost/hrw_dev'
      });
      
    hunt.extendModel('Articles', function(core){
      var ArticleSchema = new core.mongoose.Schema({
        'name': { type: String, unique: true },
        'content': String,
        'author': { type: core.mongoose.Schema.Types.ObjectId, ref: 'User' }
      });
    
      ArticleSchema.index({
        'name': 1,
        'author': 1
      });
    
    //some statics method, corresponding to Active Record Collection
      ArticleSchema.statics.doSmth = function (user, payload, callback) {
        callback(null, {
          'user': user,
          'body': payload
        });
      };
    
    //some instance method, corresponding to this particular item of Active Record collection
      ArticleSchema.methods.doSmth = function (user, payload, callback) {
        callback(null, {
          'article': this,
          'user': user,
          'body': payload
        });
      };
    
    //ACL check for what fields can user list and filter     
      ArticleSchema.statics.canCreate = function (user, callback) {
        if (user) { 
    //only authorized user can create new article, the setter of `author` with current user's id is set
          callback(null, true, 'author');
        } else {
          callback(null, false);
        }
      };
    
    //ACL check for what fields can user list and filter 
      ArticleSchema.statics.listFilter = function (user, callback) {
        if (user) {
          if (user.root) {
    //root can list all documents!
            callback(null, {}, ['id', 'name', 'content', 'author'], ['author']);
          } else {
    //non root user can see documents, where he/she is an owner
            callback(null, {'author': user._id}, ['id', 'name', 'content']); 
          }
        } else {
    //non authorized user cannot list anything!
          callback(null, false); 
        }
      };

    //ACL check for readable fields
      ArticleSchema.methods.canRead = function (user, callback) {
        if (user) {
          if (user.root) {
    //root can list all documents and all document fields, with populating author
            callback(null, true, ['id', 'name', 'content', 'author'], ['author']);
          } else {
    //non root user can see documents, where he/she is an owner
            callback(null, (this.author == user.id), ['id', 'name', 'content']);
          }
        } else {
          callback(null, false); //non authorized user cannot read anything!
        }
      };
      
    //ACL check for ability to update some fields in this current document    
      ArticleSchema.methods.canUpdate = function (user, callback) {
        if (user) {
          if (user.root) {
    //root can edit all documents and all document fields
            callback(null, true, ['name', 'content', 'author']);
          } else {
    //non root user can edit `name` and `content` of
    //documents, where he/she is an owner
            callback(null, this.author == user.id, ['name', 'content']);
          }
        } else {
          callback(null, false); //non authorized user cannot edit anything!
        }
      };

    //ACL check for ability to delete this particular document
      ArticleSchema.methods.canDelete = function (user, callback) {
        var document = this;
        if (user) {
          if (user.root) {
    //root can delete every document
            callback(null, true); 
          } else {
    //non root user can delete documents, where he/she is an owner
            callback(null, document.author == user.id);
          }
        } else {
          callback(null, false); //non authorized user cannot edit anything!
        }
      };
      
      //some validations      
      ArticleSchema.path('author').validate(function (value, respond) {
        return core.model.User.findById(value, function (error, authorFound) {
          if (error) {
            throw error;
          } else {
            respond(authorFound ? true : false);
          }
        });
      }, 'Unable to find Author!');
        
      //this step is very important - bind mongoose model to current mongo database connection
      // and assign it to collection in mongo database
      return core.mongoConnection.model('Article', ArticleSchema);
    });

    //do some magic
    
    hrw(hunt, { 
      'mountPount' : '/api/v1/articles',
      'modelName': 'Article',
      'statics': ['doSmth'],
      'methods':['doSmth']
    });
    
    Hunt.startWebServer();
    
```


Configuration parameters
==============================

-  `mountPoint` - string, see [http://expressjs.com/4x/api.html#router](http://expressjs.com/4x/api.html#router), default is `/api/v1/modelName`
-  `modelName` - string, see [http://huntjs.herokuapp.com/documentation/model.html](http://huntjs.herokuapp.com/documentation/model.html)
-  `statics` - array of [static Active Record methods](http://mongoosejs.com/docs/guide.html#statics) exported to rest api
-  `methods` - array of [instance Active Record methods](http://mongoosejs.com/docs/guide.html#methods) exported to rest api

