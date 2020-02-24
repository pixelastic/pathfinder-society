const firost = require('firost');

(async function() {
  try {
    // Release a new version to npm
    await firost.run('yarn run release patch');

    // Re-indexing on the Algolia index
    await firost.run('yarn run algolia');

    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
})();
