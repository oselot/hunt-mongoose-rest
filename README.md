Config
==============================
Parameters

-  `mountPoint` - string, see [http://expressjs.com/4x/api.html#router](http://expressjs.com/4x/api.html#router)
-  `modelName` - string
-  `ownerId` - parameter, that represents owners' id of this Entity, if it equals request.user.id, that the user authorized is owner
-  `Permissions` - hash, where keys are roles



```javascript

   {
    "nobody":{
      "canAccess":false,
    },
    "user":{
        "canAccess":true,
        "fieldsToShow":['name','notes'], //fields to show on /api/v1/:modelName
        "filter": function(parameters, user) {
           parameters.owner = user.id
        },
        "fieldsToRead":['name','notes'], //fields to show on /api/v1/:modelName/:id
        "fieldsToEdit":['notes'], //fields to be acceppted on POST /api/v1/:modelName or PUT /api/v1/:modelName/:id
        "canCreate": function(user, cb){
          cb(null, false);
        },
        "canUpdate": function(user, item, cb){
          cb(null, false);
        },
       "canRead":function(user, item, cb){
          cb(null, true);
       },
        "canDelete": function(user, item, cb){
           cb(null,  (item.owner === user.id) ? true : false);
        },
        "preSave": function(user, item, cb){
            item.owner = user.id;
            console.log(user.displayName+' updates '+item.id);
            cb(null, true);
        },
        "postSave": function(user, item, cb){
            console.log(user.displayName+' updated '+item.id);
            cb(null);
        },
    },
    "root":{
       "canAccess":false,
       "fieldsToShow":['name','notes','owner'],
       "fieldsToRead":['name','notes','owner'],
       "fieldsToEdit":['name','notes','owner'],
       "filter": false,
       "canCreate": function(user, cb){
         cb(null, true);
       },
       "canRead":function(user, item, cb){
         cb(null, true);
       },
       "canUpdate": function(user, item, cb){
         cb(null, true);
       },
       "canDelete": function(user, item, cb){
         cb(null, true);
       },
       "preSave": function(user, item, cb){
          cb(null, true);
       },
       "postSave": function(user, item, cb){
          cb(null);
       },
   }
   }


```
