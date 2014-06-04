var hunt = require('hunt'),
  hrw = require('./../index.js'),
  Hunt = hunt({
    'huntKey':true,
    'mongoUrl':'mongodb://localhost/hrw_dev'
  });

Hunt.extendModel('Trophy', function(core){
  var TrophySchema = new core.mongoose.Schema({
    'name': {type: String, unique: true},
    'scored': Boolean,
    'owner':  { type: core.mongoose.Schema.Types.ObjectId, ref: 'User' }
  });

  TrophySchema.index({
    name: 1
  });
//this step is very important - bind mongoose model to current mongo database connection
// and assign it to collection in mongo database
  return core.mongoConnection.model('Trophy', TrophySchema);
});

var permissions = {
    'nobody':{
      'canAccess':false,
    },
    'user':{
      'canAccess':true,
      'fieldsToShow':['name','scored'], //fields to show on /api/v1/:modelName
      'filter': function(parameters, user) {
         parameters.owner = user.id
      },
      'fieldsToRead':['name','scored'], //fields to show on /api/v1/:modelName/:id
      'fieldsToEdit':['scored'], //fields to be acceppted on POST /api/v1/:modelName or PUT /api/v1/:modelName/:id
      'canCreate': function(user, cb){
        cb(null, false);
      },
      'canUpdate': function(user, item, cb){
        cb(null, false);
      },
      'canRead':function(user, item, cb){
        cb(null, true);
      },
      'canDelete': function(user, item, cb){
         cb(null,  (item.owner === user.id) ? true : false);
      },
      'preSave': function(user, item, cb){
          item.owner = user.id;
          console.log(user.displayName+' updates '+item.id);
          cb(null, true);
      },
      'postSave': function(user, item, cb){
          console.log(user.displayName+' updated '+item.id);
          cb(null);
      }
    },
    'root':{
       'canAccess':false, //it is ignored for root
       'fieldsToShow':['name','scored','owner'],
       'fieldsToRead':['name','scored','owner'],
       'fieldsToEdit':['name','scored','owner'],
       'filter': function(parameters, user){

        },
       'canCreate': function(user, cb){
         cb(null, true);
       },
       'canRead':function(user, item, cb){
         cb(null, true);
       },
       'canUpdate': function(user, item, cb){
         cb(null, true);
       },
       'canDelete': function(user, item, cb){
         cb(null, true);
       },
       'preSave': function(user, item, cb){
          cb(null, true);
       },
       'postSave': function(user, item, cb){
          cb(null);
       },
   }

};

hrw(Hunt, { 'modelName': 'Trophy', 'permissions': permissions });

Hunt.once('start', function(evnt){
  Hunt.async.parallel({
    'userRoot': function(cb){
      Hunt.model.User.create({
        'root':true,
        'apiKey': Hunt.rack()
      }, cb);
    },
    'trophy': function(cb){
      Hunt.model.Trophy.findOneAndUpdate(
        { 'name': 'Vasya' },
        { 'name': 'Vasya', 'scored':true },
        { 'upsert': true },
        cb);
    }
  },function(error, obj){
    if(error) {
      throw error;
    } else {
      console.log('Trophy created: #'+obj.trophy.id+' '+obj.trophy.name);
      console.log('Access API\n http://localhost:3000/api/v1/trophy?huntKey='+obj.userRoot.apiKey);
    }
  });
});

Hunt.startWebServer();