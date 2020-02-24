/* eslint-disable import/no-commonjs */
const _ = require('golgoth/lib/lodash');
const secrets = require('./lib/secrets');
const circleci = require('callirhoe/lib/circleci');
const sentry = require('callirhoe/lib/sentry');
sentry.init(secrets.SENTRY_DSN);
circleci.init(secrets.CIRCLECI_TOKEN);

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
async function handler(request) {
  let payload;
  try {
    payload = JSON.parse(request.body);
  } catch (err) {
    return success(`Body is not JSON\n${request.body}`);
  }
  const isMerged = _.get(payload, 'pull_request.merged');
  const baseBranch = _.get(payload, 'pull_request.base.ref');
  const isOnMaster = baseBranch === 'master';
  const prBranch = _.get(payload, 'pull_request.head.ref');
  const isWeeklyUpdate = prBranch === 'weeklyUpdate';

  const shouldTriggerRelease = !!(isMerged && isOnMaster && isWeeklyUpdate);

  if (!shouldTriggerRelease) {
    const debugData = `isMerged: ${isMerged}
baseBranch: ${baseBranch}
prBranch: ${prBranch}
shouldTriggerRelease: ${shouldTriggerRelease}`;
    return success(debugData);
  }

  // Trigger the pipeline to start the automated release
  await circleci.triggerPipeline('pixelastic/pathfinder-society', {
    workflow_commit: false,
    workflow_automatedRelease: true,
  });
}
exports.handler = sentry.wrapHandler(handler);
