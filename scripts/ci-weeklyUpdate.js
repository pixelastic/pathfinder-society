const consoleError = require('firost/lib/consoleError');
const consoleInfo = require('firost/lib/consoleInfo');
const consoleSuccess = require('firost/lib/consoleSuccess');
const dayjs = require('golgoth/dayjs');
const run = require('firost/lib/run');
const write = require('firost/lib/write');
const _ = require('golgoth/lodash');
const { Octokit } = require('@octokit/rest');

const weeklyUpdate = {
  githubUser: 'pixelastic',
  githubRepo: 'pathfinder-society',
  dataPath: 'lib/data.json',
  octokit: new Octokit({ auth: process.env.GITHUB_TOKEN }),
  async run() {
    await this.configureGit();
    await this.configureNpm();
    await this.updateData();

    if (!(await this.hasChanges())) {
      consoleInfo('No new data fetched since last run, stopping now');
      return this.success();
    }

    await this.commitAndPushChanges();
    await this.releaseNewPackage();
    await this.indexToAlgolia();
    consoleSuccess('New data pushed, released and indexed in Algolia');
  },
  /**
   * Recrawl the wiki and update the local records
   **/
  async updateData() {
    await run('yarn run regenerate');
  },
  /**
   * Check if the records have changed
   * @returns {boolean} True if records changed
   **/
  async hasChanges() {
    const gitDiff = await run('git diff --name-only', { stdout: false });
    return _.includes(gitDiff.stdout, this.dataPath);
  },
  /**
   * Commit changes to the repo and push them
   **/
  async commitAndPushChanges() {
    // Commit changes
    const currentDate = dayjs().format('YYYY-MM-DD');
    await run(`git add ${this.dataPath}`);
    await run(
      `git commit --no-verify --message "chore(update): Weekly update (${currentDate})" --message "[skip ci]"`,
      { shell: true }
    );

    // Push changes
    await run('git push --set-upstream origin master');
  },
  /**
   * Release a new patch version
   **/
  async releaseNewPackage() {
    await run('yarn run release patch');
  },
  /**
   * Re-index data to Algolia
   **/
  async indexToAlgolia() {
    await run('yarn run indexing');
  },
  /**
   * Create an issue with the build error
   * @param {object} err Error object
   **/
  async createIssue(err) {
    const errorDetails = err.toString();
    await this.octokit.issues.create({
      owner: this.githubUser,
      repo: this.githubRepo,
      title: 'Weekly update failing',
      body: [
        'The weekly update has failed with the following error:',
        '```',
        errorDetails,
        '```',
        `More details on ${process.env.CIRCLE_BUILD_URL}`,
      ].join('\n'),
    });
  },
  async configureGit() {
    const isCircleCI = process.env.CIRCLECI;
    if (!isCircleCI) {
      return;
    }
    const gitName = process.env.GIT_USER_NAME;
    const gitEmail = process.env.GIT_USER_EMAIL;
    await run(`git config user.email "${gitEmail}"`);
    await run(`git config user.name "${gitName}"`);
  },
  /**
   * Write a ~/.npmrc with the token
   **/
  async configureNpm() {
    const isCircleCI = process.env.CIRCLECI;
    if (!isCircleCI) {
      return;
    }
    const npmRcPath = '~/.npmrc';
    const token = process.env.NPM_TOKEN;
    const content = `//registry.npmjs.org/:_authToken=${token}`;
    await write(content, npmRcPath);
  },
  success() {
    process.exit(0);
  },
  failure() {
    process.exit(1);
  },
};

(async function () {
  try {
    await weeklyUpdate.run();
  } catch (err) {
    consoleError(err);
    await weeklyUpdate.createIssue(err);
    return weeklyUpdate.failure();
  }
})();
