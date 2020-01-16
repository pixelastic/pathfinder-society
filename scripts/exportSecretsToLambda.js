import { netlify } from 'callirhoe';
import path from 'path';

(async function() {
  const source = path.resolve('./lambda/lib/secrets.js');
  const destination = './dist-lambda/lib/secrets.js';
  await netlify.freezeFile(source, destination);
})();
