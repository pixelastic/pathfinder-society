import firost from 'firost';
import { _, dayjs } from 'golgoth';
import Octokit from '@octokit/rest';

(async function() {
  const dataPath = 'lib/data.json';
  const branchName = 'weeklyUpdate';
  const githubToken = process.env.GITHUB_TOKEN;
  const currentDate = dayjs().format('YYYY-MM-DD');

  // Init git
  await firost.run('git config --global user.email "tim@pixelastic.com"');
  await firost.run('git config --global user.name "Pixelastic"');

  // Create new branch
  const { stdout: currentBranches } = await firost.run('git branch -l', {
    stdout: false,
  });
  const branchExists = _.includes(currentBranches, branchName);
  if (!branchExists) {
    await firost.run(`git checkout -b ${branchName}`);
    firost.consoleSuccess(`Branch ${branchName} created`);
  } else {
    await firost.run(`git checkout ${branchName}`, { stdout: false });
    firost.consoleSuccess(`Switched to branch ${branchName}`);
  }

  // Regenerate the data.json file
  // await firost.run('yarn run regenerate');
  const data = await firost.readJson('./lib/data.json');
  data.foo = firost.uuid();
  await firost.writeJson(data, './lib/data.json');
  firost.consoleSuccess('Data regenerated');

  // Should stop if no changes
  const gitDiff = await firost.run('git diff --name-only', { stdout: false });
  if (!_.includes(gitDiff.stdout, dataPath)) {
    firost.consoleInfo('No changes this week, stopping');
    return;
  }

  // Commit file
  await firost.run(`git add ${dataPath}`);
  await firost.run(
    `git commit --no-verify --message "chore(update):\\ Weekly\\ update\\ (${currentDate})"`
  );
  firost.consoleSuccess('Updated data.json file committed');

  // Push the branch
  await firost.run(
    `git push --no-verify --force --set-upstream origin ${branchName}`
  );
  firost.consoleSuccess('Branch pushed');

  // Create a PR
  const octokit = new Octokit({
    auth: githubToken,
  });
  try {
    const result = await octokit.pulls.create({
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
})();
