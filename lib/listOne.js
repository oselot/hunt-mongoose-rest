var errorResponses = require('./errors.js'),
  formatItem = require('./itemFormatter.js');

module.exports = exports = function (core, parameters, router) {
  router.get('/', function (request, response) {
    request.model[parameters.modelName]
      .findById(request.params.id)
      .exec(function (error, itemFound) {
        if (error) {
          throw error;
        } else {
          if (itemFound) {
            formatItem(itemFound, core, request, response);
          } else {
            errorResponses.error404(response);
          }
        }
      });
  })
};