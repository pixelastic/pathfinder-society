/* eslint-disable import/no-commonjs */
/**
 * netlify-lambda automatically packages my functions through webpack.
 * Unfortunately, webpack was throwing warnings like this one:
 *
 * WARNING in ../node_modules/got/source/request-as-event-emitter.js 72:18-25
 * Critical dependency: require function is used in a way in which dependencies cannot be statically extracted
 *  @ ../node_modules/got/source/as-stream.js
 *  @ ../node_modules/got/source/create.js
 *  @ ../node_modules/got/source/index.js
 *  @ ../node_modules/golgoth/build/index.js
 *  @ ./onPullRequest.js
 *
 *  This was not preventing the actual lambda from running locally but was
 *  making reading the output close to impossible.
 *
 *  Turns out that got, loaded by golgoth has to use some tricks to work with
 *  webpack, and those tricks made the webpack compilation fail. The solution
 *  was to force webpack to not package got (as I don't use it, it's ok).
 *
 *  More info:
 *  Got bug: https://github.com/sindresorhus/got/issues/742
 *  Related Webpack issue: https://github.com/webpack/webpack/issues/8826
 *  Workaround: https://github.com/netlify/netlify-faunadb-example/issues/8
 **/

module.exports = {
  externals: ['got'],
};
