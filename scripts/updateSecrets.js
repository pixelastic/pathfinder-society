import firost from 'firost';
import { _ } from 'golgoth';
(async function() {
  // This will replace all the secrets with the real values in the build folder
  const rawSecrets = await firost.readJson('./lambda/secrets.json');
  const updatedSecrets = _.transform(
    rawSecrets,
    (result, value, key) => {
      result[key] = process.env[key];
    },
    {}
  );
  await firost.writeJson(updatedSecrets, './dist-lambda/secrets.json');
})();
