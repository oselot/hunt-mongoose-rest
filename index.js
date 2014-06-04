var assert = require('assert');

module.exports = exports = function(Hunt, parameters){
  if(parameters.modelName && Hunt.model[parameters.modelName]){

    parameters.mountPoint = parameters.mountPoint || '/api/v1/'+parameters.modelName;
    parameters.ownerId = parameters.ownerId || 'owner';
    assert.ok(parameters.permissions,'HRW: permissions have to be set!');
    assert.ok(parameters.permissions.nobody,'HRW: permissions.nobody have to be set!');
    assert.ok(parameters.permissions.user,'HRW: permissions.user have to be set!');
    assert.ok(parameters.permissions.root,'HRW: permissions.root have to be set!');
    
    for(var x in parameters.permissions){
      var perm = parameters.permissions[x];
      assert.fail(perm.canAccess === undefined, 'HRW: permissions.'+x+'.canAccess is not set!');
      if(perm.canAccess) {
        assert.ok(Array.isArray(perm.fieldsToShow), 'HRW: permissions.'+x+'.fieldsToShow is not array of fields!');
        assert.ok(Array.isArray(perm.fieldsToEdit), 'HRW: permissions.'+x+'.fieldsToEdit is not array of fields!');

        if(perm.filter !== undefined){
          assert.ok(typeof perm.filter === "function", 'HRW: permissions.'+x+'.filter is not a function(parameters, user){} !');
        } else {
          perm.filter = function(parameters, user) {/* it is ok) */};
        }

        assert.ok(typeof perm.canCreate === "function", 'HRW: permissions.'+x+'.canCreate is not a function(user, cb){} !');

        ['canRead','canDelete','preSave','postSave'].map(function(f){
          assert.ok(typeof perm[f] === "function", 'HRW: permissions.'+x+'.'+f+' is not a function(user, item, cb){} !');
        });

      } else {
        //who cares?
      }
    }

    Hunt.extendApp(function(core){
      var router = core.express.Router();
//access control middleware
      router.use(function(request,response,next){

      });



    });
  } else {
    throw new Error('HRW: modelName is not defined or not exist!');
  }
};
