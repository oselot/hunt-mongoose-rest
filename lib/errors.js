exports.error404 = function (response, message) {
  response.status(404);
  response.json({
    'status': 'Error',
    'errors': [
      {
        'code': 404,
        'message': message || 'Not found!'
      }
    ]
  });
};

exports.error403 = function (response, message) {
  response.status(403);
  response.json({
    'status': 'Error',
    'errors': [
      {
        'code': 403,
        'message': message || 'Access denied!'
      }
    ]
  });
};
