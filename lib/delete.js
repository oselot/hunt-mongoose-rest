var errorResponses = require('./errors.js'),
  formatItem = require('./itemFormatter.js');

module.exports = exports = function (core, parameters, router) {
  router.put('/:id', function (request, response) {
    request.model[parameters.modelName].findById(request.params.id, function (error, itemFound) {
      if (error) {
        throw error;
      } else {
        if (itemFound) {
          itemFound.canDelete(request.user, function(error, canDelete){
            if(error){
              throw error;
            } else {
              if(canDelete){
                itemFound.remove(function(error){
                  if(error){
                    throw error;
                  } else {
                    response.status(200);
                    response.json({'status':'deleted'});
                  }
                });
              } else {
                if(request.user){
                  errorResponses.error403(response);
                } else {
                  errorResponses.error401(response);
                }
              }
            }
          });
        } else {
          errorResponses.error404(response);
        }
      }
    });
  });
};
