/* eslint-disable import/no-commonjs */
import { _, got } from 'golgoth';
import secrets from './lib/secrets';

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
 * Triggered on every pull request closed
 * @param {object} request The triggering event
 * @returns {object} Response object
 */
export async function handler(request) {
  const debug = [];

  const rawBody = _.get(request, 'body');
  if (_.isEmpty(rawBody)) {
    return success('No body passed');
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    return success(`Body is not JSON\n${rawBody}`);
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
  const circleCIUrl =
    'https://circleci.com/api/v2/project/github/pixelastic/pathfinder-society/pipeline';
  try {
    const a = got(circleCIUrl, {
      method: 'POST',
      headers: {
        'Circle-Token': secrets.CIRCLECI_TOKEN,
      },
      json: {
        parameters: {
          workflow_commit: false,
          workflow_automatedRelease: true,
        },
      },
    });
    console.info(a);

    await a;
  } catch (err) {
    console.info(err);
    console.info(err.body);
    console.info(err.request);
    throw err;
  }
  return success('CircleCI triggered');
}
