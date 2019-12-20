/* eslint-disable import/no-commonjs */
import { _ } from 'golgoth';

/**
 * Triggered on every pull request closed
 * @param {object} request The triggering event
 * @returns {object} Response object
 */
export async function handler(request) {
  const debug = [];

  const body = _.chain(request)
    .get('body')
    .thru(JSON.parse)
    .value();
  const isMerged = _.get(body, 'pull_request.merged');
  const baseBranch = _.get(body, 'pull_request.base.ref');
  const isOnMaster = baseBranch === 'master';
  const prBranch = _.get(body, 'pull_request.head.ref');
  const isWeeklyUpdate = prBranch === 'weeklyUpdate';

  const shouldTriggerRelease = isMerged && isOnMaster && isWeeklyUpdate;

  debug.push(`isMerged: ${isMerged}`);
  debug.push(`baseBranch: ${baseBranch}`);
  debug.push(`prBranch: ${prBranch}`);
  debug.push(`shouldTriggerRelease: ${shouldTriggerRelease}`);
  const displayDebug = debug.join('\n');

  console.info({ ...process.env });

  if (!shouldTriggerRelease) {
    console.info(displayDebug);
    return {
      statusCode: 200,
      body: displayDebug,
    };
  }

  // We ping CircleCI so it triggers a new release
  // steps:
  //   - run: 'curl -u $CIRCLECI_TOKEN: -d build_parameters[CIRCLE_JOB]=automatedRelease https://circleci.com/api/v1.1/project/github/pixelastic/pathfinder-society/tree/master'
}
