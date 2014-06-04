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
        for (var x in parameters.permissions) {
          if (request.user && request.user.root === true && x === 'root') {
            request.restPermissions = parameters.permissions.root;
            return next();
          }

          if (request.user && request.user.roles && request.user.roles[x] === true) {
            request.restPermissions = parameters.permissions[x];
            return next();
          }

          if (request.user && x === 'user') {
            request.restPermissions = parameters.permissions.user;
            return next();
          }

          if (x === 'nobody' && !request.user) {
            if (parameters.permissions.nobody.canAccess) {
              request.restPermissions = parameters.permissions.nobody;
              return next();
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
              return;
            }
          }

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
      });

      router.get('/', function (request, response) {
        var filter = request.query,
          page = (request.query.page && request.query.page > 0) || 1,
          sort = request.query.sort || '-_id',
          itemsPerPage = (request.query.itemsPerPage && request.query.itemsPerPage > 0) || 10,
          skip = page * itemsPerPage,
          limit = itemsPerPage;

        request.restPermissions.filter(filter);

        core.async.parallel({
          'data': function (cb) {
            request.model[parameters.modelName]
              .find(filter)
              .skip(skip)
              .limit(limit)
              .sort(sort)
              .exec(function (error, itemsFound) {
                if (error) {
                  throw error;
                } else {
                  cb(null, itemsFound.map(function (item) {
                    var ret = {};
                    request.restPermissions.fieldsToShow.map(function (field) {
                      ret[field] = item.get('' + field); //to respect virtuals
                    });
                    return ret;
                  }));
                }
              });
          },
          'metadata': function (cb) {
            request.model[parameters.modelName]
              .count(filter)
              .exec(function (error, itemsCount) {
                if (error) {
                  cb(error);
                } else {
                  cb(null, {
                    'page': page,
                    'itemsPerPage': itemsPerPage,
                    'numberOfPages': Math.floor(itemsCount / itemsPerPage),
                    'count': itemsCount
                  });
                }
              });
          }
        }, function (error, retObj) {
          response.json(retObj);
        });
      });

      router.get('/:id', function (request, response) {
        var filter = {};
        request.restPermissions.filter(filter);

        request.model[parameters.modelName].findById(request.params.id, function (error, itemFound) {
          if (error) {
            throw error;
          } else {
            if (itemFound) {
              request.restPermissions.canRead(request.user, itemFound, function (error, canRead) {
                if (error) {
                  throw error;
                } else {
                  if (canRead) {
                    response.status(200);
                    var ret = {};
                    request.restPermissions.fieldsToShow.map(function (field) {
                      ret[field] = itemFound.get('' + field); //to respect virtuals
                    });
                    response.json({'data': ret})
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
              });
            } else {
              response.status(404);
              response.json({
                'status': 'Error',
                'errors': [
                  {
                    'code': 404,
                    'message': 'Item of kind "' + parameters.modelName + '" with ID of "' + request.params.id + '" do not exists!'
                  }
                ]
              });
            }
          }
        });
      });

      router.post('/', function (request, response) {
        request.restPermissions.canCreate(request.user, function(error, canCreate){
          if(error){
            throw error;
          } else {
            if(canCreate){
              //todo

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
        });
      });

      router.put('/:id', function (request, response) {
      });

      router.delete('/:id', function (request, response) {
      });

      router.use(function (error, request, response, next) {
//http://mongoosejs.com/docs/validation.html
        if (error.name === 'ValidationError') {
          response.status(400);
          var errs = [];
          for (var x in error.errors) {
            errs.push({
              'code': 400,
              'message': error.errors[x].message,
              'field': error.errors[x].path,
              'value': error.errors[x].value
            });
          }
          response.json({
            "status": "Error",
            "errors": errs
          });
        } else {
          next(error); // ;-)
        }
      });

      core.app.use(parameters.mountPoint, router);
    });
  } else {
    throw new Error('HRW: modelName is not defined or not exist!');
  }
};
