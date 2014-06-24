var errorResponses = require('./errors.js'),
  formatItem = require('./itemFormatter.js');

module.exports = exports = function (core, parameters, router) {
  router.post('/', function (request, response) {
    request.model[parameters.modelName].canCreate(request.user, function (error, canCreate, ownerFieldName) {
      if (error) {
        throw error;
      } else {
        if (canCreate) {
          var item = new request.model[parameters.modelName](request.body);
          ownerFieldName = ownerFieldName || 'owner';
          item[ownerFieldName] = request.user._id;
          item.save(function (error, itemsSaved) {
            if (error) {
              throw error;
            } else {
              var itemFound = itemsSaved[0];
              formatItem(itemFound, core, request, response);
            }
          });
        } else {
          errorResponses.error403(response);
        }
      }
    });
  })
};