var errorResponses = require('./errors.js');

module.exports = exports = function (core, parameters, router) {
  router.post('/method/:id', function(request, response){
    response.send('ok');
  });
};