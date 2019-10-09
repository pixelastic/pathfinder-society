/* eslint-disable import/no-commonjs */
const lintStagedConfig = require('aberlaas/build/configs/lintstaged.js');
module.exports = {
  ...lintStagedConfig,
  // Disable autofix of lib/data.json
  '*.json': 'true',
  '*.json,!lib/data.json': lintStagedConfig['*.json'],
};
