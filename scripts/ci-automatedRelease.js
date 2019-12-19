const release = {
  async run() {
    // Check if merged branch is weeklyUpdate
    console.info({ ...process.env });
  },
};

(async function() {
  try {
    await release.run();
  } catch (err) {
    release.failure();
  }
})();
