const netlify = require('callirhoe/lib/netlify');
const path = require('path');

(async function() {
  const source = path.resolve('./lambda/lib/secrets.js');
  const destination = './dist-lambda/lib/secrets.js';
  await netlify.freezeFile(source, destination);
})();
