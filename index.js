var assert = require('assert');

module.exports = exports = function (Hunt, parameters) {
  if (parameters.modelName && Hunt.model[parameters.modelName]) {

    parameters.mountPoint = parameters.mountPoint || '/api/v1/' + parameters.modelName;
    parameters.ownerId = parameters.ownerId || 'owner';
    assert.ok(parameters.permissions, 'HRW: permissions have to be set!');
    assert.ok(parameters.permissions.nobody, 'HRW: permissions.nobody have to be set!');
    assert.ok(parameters.permissions.user, 'HRW: permissions.user have to be set!');
    assert.ok(parameters.permissions.root, 'HRW: permissions.root have to be set!');

    for (var x in parameters.permissions) {
      var perm = parameters.permissions[x];
      assert.fail(perm.canAccess === undefined, 'HRW: permissions.' + x + '.canAccess is not set!');
      if (perm.canAccess) {
        assert.ok(Array.isArray(perm.fieldsToShow), 'HRW: permissions.' + x + '.fieldsToShow is not array of fields!');
        assert.ok(Array.isArray(perm.fieldsToEdit), 'HRW: permissions.' + x + '.fieldsToEdit is not array of fields!');

        if (perm.filter !== undefined) {
          assert.ok(typeof perm.filter === "function", 'HRW: permissions.' + x + '.filter is not a function(parameters, user){} !');
        } else {
          perm.filter = function (parameters, user) {/* it is ok) */
          };
        }

        assert.ok(typeof perm.canCreate === "function", 'HRW: permissions.' + x + '.canCreate is not a function(user, cb){} !');

        ['canRead', 'canDelete', 'preSave', 'postSave'].map(function (f) {
          assert.ok(typeof perm[f] === "function", 'HRW: permissions.' + x + '.' + f + ' is not a function(user, item, cb){} !');
        });

      } else {
        //who cares?
      }
    }

    Hunt.extendApp(function (core) {
      var router = core.express.Router();

//access control middleware
//todo think on fieldsToShow, fieldsToEdit, filter etc importing to request for each role


      router.use(function (request, response, next) {
        if (request.user) {
          if (request.permissions.user.canAccess) {
            next();
          } else {
            var canAccess = false;

            if (request.user.root) { //root is root
              canAccess = true;
            } else {
              for (var x in parameters.permissions) {
                if (['nobody', 'user', 'root'].indexOf(x) === -1) {
                  if (request.user.roles[x] && !canAccess) {
                    canAccess = parameters.permissions[x].canAccess ? true : false;
                  }
                }
              }
            }

            if (canAccess) {
              next();
            } else {
              response.status(403);
              response.json({
                'status': 'Error',
                'errors': [
                  {
                    'code': 403,
                    'message': 'Access denied!'
                  }
                ]
              });
            }
          }
        } else {
          if (parameters.permissions.nobody.canAccess) {
            next();
          } else {
            response.status(401);
            response.json({
              'status': 'Error',
              'errors': [
                {
                  'code': 401,
                  'message': 'Authorization required!'
                }
              ]
            });
          }
        }
      });

      router.get('/', function(request,response){
        var filter = request.query,
          page = (request.query.page && request.query.page>0) || 1,
          sort = request.query.sort || '-_id',
          itemsPerPage  = (request.query.itemsPerPage && request.query.itemsPerPage>0) || 10,
          skip = page * itemsPerPage,
          limit = itemsPerPage;

        parameters.filter(filter);

        core.async.parallel({
          'data': function(cb){
            request.model[parameters.modelName]
              .find(filter)
              .skip(skip)
              .limit(limit)
              .sort(sort)
              .exec(function(error, itemsFound){
                if(error){
                  throw error;
                } else {
                  itemsFound.map(function(item){
                    

                  });
                }
              });
          },
          'metadata': function(cb){
            request.model[parameters.modelName]
              .count(filter)
              .exec(function(error, itemsCount){
                if(error){
                  cb(error);
                } else {
                  cb(null, {
                    'page':page,
                    'itemsPerPage':itemsPerPage,
                    'numberOfPages': Math.floor(itemsCount/itemsPerPage),
                    'count':itemsCount
                  });
                }
              });
          }
        }, function(error, retObj){
          response.json(retObj);
        });
      });

      router.get('/:id', function(request,response){});

      router.post('/', function(request,response){});

      router.put('/:id', function(request,response){});

      router.delete('/:id', function(request,response){});

      core.app.use(parameters.mountPoint, router);
    });
  } else {
    throw new Error('HRW: modelName is not defined or not exist!');
  }
};
