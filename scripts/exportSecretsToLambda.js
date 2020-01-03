import firost from 'firost';
import dynamicSecrets from '../lambda/lib/secrets.js';

(async function() {
  const staticSecrets = JSON.stringify(dynamicSecrets);
  const jsContent = `module.exports = ${staticSecrets}`;
  await firost.write(jsContent, './dist-lambda/lib/secrets.js');
})();
