var errorResponses = require('./errors.js'),
  formatItem = require('./itemFormatter.js');

module.exports = exports = function (core, parameters, router) {
  router.post('/', function (request, response) {
    request.model[parameters.modelName].canCreate(request.user, function (error, canCreate, ownerFieldName) {
      if (error) {
        throw error;
      } else {
        if (canCreate) {
          var item = new request.model[parameters.modelName](request.body); //todo - not sure. setters are better?
          ownerFieldName = ownerFieldName || 'owner';
          item[ownerFieldName] = request.user._id;
          item.save(function (error, itemCreated) {
            if (error) {
              throw error;
            } else {
              response.status(201);
              response.set('Location', parameters.mountPoint + '/' + itemCreated.id);
              formatItem(itemCreated, core, request, response);
            }
          });
        } else {
          if (request.user) {
            errorResponses.error403(response);
          } else {
            errorResponses.error401(response);
          }
        }
      }
    });
  });
};