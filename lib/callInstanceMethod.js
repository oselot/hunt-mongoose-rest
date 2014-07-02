var errorResponses = require('./errors.js');

module.exports = exports = function (core, parameters, router) {
  router.post(/^\/method\/([0-9a-fA-F]{24})$/, function(request, response){
    response.send('ok');
  });
};