router.put('/:id', function (request, response) {
  request.model[parameters.modelName].findById(request.params.id, function (error, itemFound) {
    if (error) {
      throw error;
    } else {
      if (itemFound) {
        request.restPermissions.canUpdate(request.user, itemFound, function (error, canUpdate) {
          if (error) {
            throw error;
          } else {
            if (canUpdate) {
              request.restPermissions.fieldsToEdit.map(function (field) {
                itemFound.set('' + field); //to respect virtuals
              });

              core.async.series([
                function (cb) {
                  request.restPermissions.preSave(request.user, itemFound, cb);
                },
                function (cb) {
                  itemFound.save(cb);
                },
                function (cb) {
                  request.postSave.preSave(request.user, itemFound, cb);
                }
              ], function (error) {
                if (error) {
                  throw error;
                } else {
                  response.status(202);
                  var ret = {};
                  request.restPermissions.fieldsToRead.map(function (field) {
                    ret[field] = itemFound.get('' + field); //to respect virtuals
                  });
                  response.json({'data': ret})
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