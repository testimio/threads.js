/*eslint-env node*/
/*
 * This file is only a stub to make './worker' resolve the './workerNode/worker' module.
 * Loading the browser worker into the browser bundle is done in the gulpfile by
 * configuring a browserify override.
 */

if (typeof process !== 'undefined' && process.arch !== 'browser' && 'pid' in process) {
  module.exports = require('./workerNode/worker');
} else {
  module.exports = require('./workerBrowser/worker');
}
