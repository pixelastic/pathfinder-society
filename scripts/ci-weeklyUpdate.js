import firost from 'firost';
import { _, dayjs } from 'golgoth';
import Octokit from '@octokit/rest';

const module = {
  dataPath: 'lib/data.json',
  branchName: 'weeklyUpdate',
  octokit: new Octokit({ auth: process.env.GITHUB_TOKEN }),

  async initGit() {
    await firost.run('git config --global user.email "tim@pixelastic.com"');
    await firost.run('git config --global user.name "Pixelastic"');
  },

  async branchExists() {
    const { stdout: allBranches } = await firost.run('git branch -l', {
      stdout: false,
    });
    return _.includes(allBranches, this.branchName);
  },

  async switchToBranch() {
    await firost.run(`git checkout ${this.branchName}`, { stdout: false });
    firost.consoleSuccess(`Switched to branch ${this.branchName}`);
  },

  async createBranch() {
    await firost.run(`git checkout -b ${this.branchName}`, { stdout: false });
    firost.consoleSuccess(`Created branch ${this.branchName}`);
  },

  async pushBranch() {
    await firost.run(
      `git push --no-verify --force --set-upstream origin ${this.branchName}`
    );
    firost.consoleSuccess('Branch pushed');
  },

  async hasChanges() {
    const gitDiff = await firost.run('git diff --name-only', { stdout: false });
    return _.includes(gitDiff.stdout, this.dataPath);
  },

  async commitFile() {
    const currentDate = dayjs().format('YYYY-MM-DD');

    await firost.run(`git add ${this.dataPath}`);
    await firost.run(
      `git commit --no-verify --message "chore(update):\\ Weekly\\ update\\ (${currentDate})"`
    );
    firost.consoleSuccess(`Updated ${this.dataPath} file committed`);
  },

  async createPR() {
    try {
      const result = await this.octokit.pulls.create({
        owner: 'pixelastic',
        repo: 'pathfinder-society',
        title: 'Weekly update',
        body: [
          'This is an automated PR including the latest changes from the Wiki',
          'Merging this PR will automatically release a new patch version of the module',
        ].join('\n'),
        head: 'weeklyUpdate',
        base: 'master',
      });
      const prUrl = result.data.html_url;
      firost.consoleSuccess(`Pull Request created: ${prUrl}`);
    } catch (err) {
      // This can fail if the PR already exists, but we can safely ignore that as
      // the force push will update it
      const errorReason = _.get(err, 'errors[0].message');
      if (_.startsWith(errorReason, 'A pull request already exists for')) {
        firost.consoleInfo('Pull Request already exists, overwriting content');
        return;
      }
      throw err;
    }
  },

  async createIssue(err) {
    console.info('This should create an issue');
    console.info(err);
  },

  success() {
    process.exit(0);
  },
  failure() {
    process.exit(1);
  },

  async run() {
    // Init git credentials
    await this.initGit();

    // Move to the correct branch. Create it if does not exist
    if (await this.branchExists()) {
      await this.switchToBranch();
    } else {
      await this.createBranch();
    }

    // Try to regenerate, or file an issue if fails
    try {
      await firost.run('yarn run regenerate');
    } catch (err) {
      await this.createIssue(err);
      return this.failure();
    }

    // Stop early if no changes
    if (!(await this.hasChanges())) {
      firost.consoleInfo('No changes this week, stopping');
      return this.success();
    }

    // Commit, push and create a PR with the changes
    await this.commitFile();
    await this.pushBranch();
    await this.createPR();
  },
};

(async function() {
  try {
    await module.run();
  } catch (err) {
    module.failure();
  }
})();
