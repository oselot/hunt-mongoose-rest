exports.error404 = function(response){
  response.status(404);
  response.json({
    'status': 'Error',
    'errors': [
      {
        'code': 404,
        'message': 'Object with this id do not exists!'
      }
    ]
  });
};

exports.error403 = function(response){
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
};
