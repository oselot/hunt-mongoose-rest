var errorResponses = require('./errors.js');

module.exports = exports = function (core, parameters, router) {
  router.post('/method', function (request, response) {
    var methodName = request.body.method;
    delete request.body.method;
    var payload = request.body,
      toCall = request.model[parameters.modelName][methodName];
//verify, that this is actually a static method, not mongoose Active Record Call

    //todo - validation, so we can't call create,find,and other static mongoose methods?


    if (toCall === 'function') {
      toCall(request.user, payload, function(error, msg){
        if(error){
          throw error;
        } else {
          response.status(202);//accepted
          response.json(msg);
        }
      });
    } else {
      errorResponses.error404('Unknown static method');
    }
  });
};