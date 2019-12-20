/* eslint-disable import/no-commonjs */
import { _ } from 'golgoth';

/**
 * Return a success response and log it
 * @param {string} body Body of the response
 * @returns {object} Response
 */
function success(body) {
  console.info(`✔ ${body}`);
  return {
    statusCode: 200,
    body,
  };
}
/**
 * Return a failure response and log it
 * @param {string} body Body of the response
 * @returns {object} Response
 */
function failure(body) {
  console.info(`✘ ${body}`);
  return {
    statusCode: 500,
    body,
  };
}

/**
 * Triggered on every pull request closed
 * @param {object} request The triggering event
 * @returns {object} Response object
 */
export async function handler(request) {
  const debug = [];
  return success(JSON.stringify(process.env, null, 2));

  const rawBody = _.get(request, 'body');
  if (_.isEmpty(rawBody)) {
    return failure('No body passed');
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    return failure(`Body is not JSON\n${rawBody}`);
  }
  const isMerged = _.get(body, 'pull_request.merged');
  const baseBranch = _.get(body, 'pull_request.base.ref');
  const isOnMaster = baseBranch === 'master';
  const prBranch = _.get(body, 'pull_request.head.ref');
  const isWeeklyUpdate = prBranch === 'weeklyUpdate';

  const shouldTriggerRelease = !!(isMerged && isOnMaster && isWeeklyUpdate);

  debug.push(`isMerged: ${isMerged}`);
  debug.push(`baseBranch: ${baseBranch}`);
  debug.push(`prBranch: ${prBranch}`);
  debug.push(`shouldTriggerRelease: ${shouldTriggerRelease}`);


  if (!shouldTriggerRelease) {
    const displayDebug = debug.join('\n');
    return success(displayDebug);
  }

  // We ping CircleCI so it triggers a new release
  // steps:
  //   - run: 'curl -u $CIRCLECI_TOKEN: -d build_parameters[CIRCLE_JOB]=automatedRelease https://circleci.com/api/v1.1/project/github/pixelastic/pathfinder-society/tree/master'
}
