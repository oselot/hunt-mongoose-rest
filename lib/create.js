//create
router.post('/', function (request, response) {
  console.log(request.restPermissions);
  request.restPermissions.canCreate(request.user, function (error, canCreate) {
    if (error) {
      throw error;
    } else {
      if (canCreate) {
        var itemToBeCreated = new request.model[parameters.modelName];

        request.restPermissions.fieldsToEdit.map(function (field) {
          itemToBeCreated.set('' + field); //to respect virtuals
        });

        core.async.series([
          function (cb) {
            request.restPermissions.preSave(request.user, itemToBeCreated, cb);
          },
          function (cb) {
            itemFound.save(cb);
          },
          function (cb) {
            request.postSave.preSave(request.user, itemToBeCreated, cb);
          }
        ], function (error) {
          if (error) {
            throw error;
          } else {
            response.status(201);
            var ret = {};
            request.restPermissions.fieldsToRead.map(function (field) {
              ret[field] = itemToBeCreated.get('' + field); //to respect virtuals
            });
            response.json({'status': 'created', 'data': ret})
          }
        });
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