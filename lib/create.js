var errorResponses = require('./errors.js');

function formatDocument(doc, fieldsToShow) {
  if (Array.isArray(fieldsToShow) && fieldsToShow.length > 0) {
    var ret = {};
    fieldsToShow.map(function (getter) {
      ret[getter] = doc.get(getter);
    });
    return ret;
  } else {
    return doc;
  }
}


module.export = exports = function (core, parameters, request, response) {
  request.model[parameters.modelName].canCreate(request.user, function(error, canCreate, ownerFieldName){
    if(error){
      throw error;
    } else {
      if(canCreate){
        var item = new request.model[parameters.modelName](request.body);
        ownerFieldName = ownerFieldName || 'owner';
        item[ownerFieldName] = request.user._id;
        item.save(function(error, itemsSaved){
          if(error){
            throw error;
          } else {
            var itemFound = itemsSaved[0];
            itemFound.canRead(request.user, function (error, canRead, fieldsToShow, fieldsToPopulate) {
              if (error) {
                throw error;
              } else {
                if (canRead) {
                  if (Array.isArray(fieldsToPopulate) && fieldsToPopulate.length > 0) {
                    core.async.each(fieldsToPopulate, //todo probably eachSeries? https://github.com/caolan/async#eacha
                      function (getter, cb) {
                        if (typeof getter === 'String') {
                          itemFound.populate(getter, cb)
                        } else {
                          cb(new Error('fieldsToPopulate getter ' + getter + ' is not a string!'));
                        }
                      }, function (error) {
                        if (error) {
                          throw error;
                        } else {
                          response.status(201);
                          response.json({'status': 'Ok', 'data': formatDocument(itemFound, fieldsToShow)});
                        }
                      });
                  } else {
                    response.status(201);
                    response.json({'status': 'Ok', 'data': formatDocument(itemFound, fieldsToShow)});
                  }
                } else {
                  errorResponses.error403(response);
                }
              }
            });
          }
        });
      } else {
        errorResponses.error403(response);
      }
    }
  });
};