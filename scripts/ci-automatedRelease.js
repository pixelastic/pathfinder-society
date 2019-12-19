const module = {
  async run() {
    // Check if merged branch is weeklyUpdate
    console.info({ ...process.env });
  },
};

(async function() {
  try {
    await module.run();
  } catch (err) {
    module.failure();
  }
})();
