import firost from 'firost';

const module = {
  async run() {
    // Release a new version to npm
    await firost.run('yarn run release patch');

    // Re-indexing on the Algolia index
    await firost.run('yarn run algolia');

    process.exit(0);
  },
};

(async function() {
  try {
    await module.run();
  } catch (err) {
    process.exit(1);
  }
})();
