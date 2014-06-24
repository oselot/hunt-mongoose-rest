router.delete('/:id', function (request, response) {
  request.model[parameters.modelName].findById(request.params.id, function (error, itemFound) {
    if (error) {
      throw error;
    } else {
      if (itemFound) {
        request.restPermissions.canDelete(request.user, itemFound, function (error, canDelete) {
          if (error) {
            throw error;
          } else {
            if (canDelete) {
              request.model[parameters.modelName].remove({'id': itemFound.id}, function (error) {
                if (error) {
                  throw error;
                } else {
                  response.status(202);
                  response.json({
                    'status': 'deleted'
                  });
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