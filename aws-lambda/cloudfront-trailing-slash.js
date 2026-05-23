// CloudFront Function (viewer-request) for praca-magisterska.pl
// Converts S3-website's 302 trailing-slash redirect into a proper 301.
// Paths without trailing slash AND without a file extension → 301 to path + '/'.
// Files (anything containing '.' in the last segment) are passed through untouched.

function handler(event) {
  var req = event.request;
  var uri = req.uri;

  if (uri === '/' || uri.charAt(uri.length - 1) === '/') {
    return req;
  }

  var lastSeg = uri.substring(uri.lastIndexOf('/') + 1);
  if (lastSeg.indexOf('.') !== -1) {
    return req;
  }

  var qs = '';
  if (req.querystring) {
    var parts = [];
    for (var k in req.querystring) {
      var v = req.querystring[k];
      if (v.multiValue) {
        for (var i = 0; i < v.multiValue.length; i++) {
          parts.push(k + '=' + v.multiValue[i].value);
        }
      } else {
        parts.push(k + '=' + v.value);
      }
    }
    if (parts.length) qs = '?' + parts.join('&');
  }

  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: {
      'location': { value: uri + '/' + qs },
      'cache-control': { value: 'max-age=3600' }
    }
  };
}
