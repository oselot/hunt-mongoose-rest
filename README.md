Config
==============================

Abstract Mongoose to REST interface CRUD. In MVC paradigm  this module is a way
to generate view (as JSON object) and controller for this particular model.
It is nodejs implementation of awesome module of (http://www.symfony-project.org/plugins/sfDoctrineRestGeneratorPlugin)
This work is inspired by [http://www.restapitutorial.com/](http://www.restapitutorial.com/)


Parameters

-  `mountPoint` - string, see [http://expressjs.com/4x/api.html#router](http://expressjs.com/4x/api.html#router), default is `/api/v1/modelName`
-  `modelName` - string, see [http://huntjs.herokuapp.com/documentation/model.html](http://huntjs.herokuapp.com/documentation/model.html)
-  `statics` - array of [static Active Record methods](http://mongoosejs.com/docs/guide.html#statics) exported to rest api
-  `methods` - array of [instance Active Record methods](http://mongoosejs.com/docs/guide.html#methods) exported to rest api



Model requirements
==============================

For example, we have standard [http://mongoosejs.com/](mongoosejs) model of `Articles`


1) The model have to be dependency injected to request.model.Article. It is like this

```javascript

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
      return core.mongoConnection.model('Article', ArticleSchema);
    });

```
The `owner` field is one-to-many relation to owners

2) The model have to have static method `canCreate` to find out if this particular user can create Articles

```javascript

ArticleSchema.statics.canCreate = function(user, callback){
    if(user) { //only authorized user can create new article
      callback(null, true, 'author');
    } else {
      callback(null, false);
    }
};

```

The `callback` has this syntax - function(error, canCreate, ownerIdName){...}
The `canCreate` is boolean. True means this user can create new record.
The `ownerIdName` is the model field name, that have to be populated with current
user id as an owner/author of this particular item. For our case - `author`. Default os `owner`.

3) The model have to have static method `listFilter`, that returns the mongoose query item
 filter with parameters need to find out items, readable by this particular user

```javascript

ArticleSchema.statics.listFilter = function(user, callback){
    if(user) {
      if(user.root) {
        callback(null, {}, ['name','content','author'], ['author']);
        //root can list all documents, and all document fields, and field of author is populated
      } else {
        callback(null, {'owner':user._id}, ['name','content']); //non root user can see documents, where he/she is an owner
      }
    } else {
      callback(null, false); //non authorized user cannot list anything!
    }
};

```

The `callback` has this syntax function(error, filterObj, arrayOfGettersToShow, arrayOfGettersToPopulate)

4) The model have to have instance method `canRead`, that performs ACL check for this particular document

```javascript

ArticleSchema.methods.canRead = function(user, callback){
    if(user) {
      if(user.root) {
        callback(null, true, ['name','content','author'], ['author']); //root can list all fields, with populating author
      } else {
        callback(null, this.author == user.id, ['name','content']); //non root user can see documents, where he/she is an owner
      }
    } else {
      callback(null, false); //non authorized user cannot read anything!
    }
};

```

The callback has this syntax.
function(error, canRead, arrayOfReadablePaths, arrayOfPathsToPopulate){};

`canRead` is boolean
`arrayOfReadablePaths` is array of Mongoose instance paths (not fields, because we can query the virtuals here),
that have to be readable by current user. If this array is omitted, all fields are shown!

`arrayOfPathsToPopulate` is array of Mongoose instance pathes, that have to be populated by relations -
[http://mongoosejs.com/docs/populate.html](http://mongoosejs.com/docs/populate.html).
If this array is omitted, no population is done


5) The model have to have instance method `canEdit`, that performs ACL check for this particular document

```javascript

ArticleSchema.methods.canUpdate = function(user, callback){
    if(user) {
      if(user.root) {
        callback(null, true, ['name','content','owner']); //root can list all documents and all document fields, with populating author
      } else {
        callback(null, this.owner == user.id, ['name','content']);
        //non root user can edit `name` and `content` of
        //documents, where he/she is an owner
      }
    } else {
      callback(null, false); //non authorized user cannot edit anything!
    }
};

```

The callback has this syntax - function(error, canEdit, arrayOfEditableFields){}

6) The model have to have instance method `canDelete`

```javascript

ArticleSchema.methods.canDelete = function(user, callback){
    var document = this;
    if(user) {
      if(user.root) {
        callback(null, true); //root can delete every document
      } else {
        callback(null, document.owner == user.id);
        //non root user can delete documents, where he/she is an owner
      }
    } else {
      callback(null, false); //non authorized user cannot edit anything!
    }
};

```

7) Other behavior of model have to be implemented by pre and post hooks and middlewares
[http://mongoosejs.com/docs/middleware.html](http://mongoosejs.com/docs/middleware.html)

8) Non restfull calls can be implemented like this

POST /api/v1/article/:id/subcribe

Will call the instance method `subscribe` of Article with id of `:id`.
With this parameters

article.subscribe(request.user, request.body, function(error, payload) {});
where
`request.user` is current user performing the request
`request.body` is parameters send to this method
and `payload` is response to user
