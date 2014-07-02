var errorResponses = require('./errors.js'),
  formatItem = require('./itemFormatter.js');

module.exports = exports = function (core, parameters, router) {
  router.get('/:id', function (request, response) {
    request.model[parameters.modelName]
      .findById(request.params.id)
      .exec(function (error, itemFound) {
        if (error) {
          throw error;
        } else {
          if (itemFound) {
            response.status(200);
            formatItem(itemFound, core, request, response);
          } else {
            errorResponses.error404(response);
          }
        }
      });
  })
};