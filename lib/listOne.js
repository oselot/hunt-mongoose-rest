module.export = exports = function(core, parameters, request, response){
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
              request.restPermissions.fieldsToRead.map(function (field) {
                ret[field] = itemFound.get('' + field); //to respect virtuals
              });
              ret.id = itemFound.id;
              response.json({'status': 'Ok', 'data': ret})
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
}