exports.error404 = function(response){
  response.status(404);
  response.json({
    'status': 'Error',
    'errors': [
      {
        'code': 404,
        'message': 'Not found!'
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
