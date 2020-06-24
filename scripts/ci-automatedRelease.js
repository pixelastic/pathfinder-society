const run = require('firost/lib/run');

(async function() {
  try {
    // Release a new version to npm
    await run('yarn run release patch');

    // Re-indexing on the Algolia index
    await run('yarn run indexing');

    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
})();
