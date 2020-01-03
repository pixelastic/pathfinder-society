/* eslint-disable import/no-commonjs */
/**
 * netlify-lambda automatically packages my functions through webpack.
 *
 * Unfortunately, webpack is throwing unavoidable warnings when some dependency
 * is dynamically or conditionnaly loading other dependencies. Common packages
 * like got, included in golgoth, will throw warnings.
 *
 * One way to avoid it is to explictely tell webpack to not include those
 * dependencies in its packaging through the use of the "externals" config key.
 * When used, we need to specify the path to the module to use instead.
 *
 *  More info:
 *  Got bug: https://github.com/sindresorhus/got/issues/742
 *  Related Webpack issue: https://github.com/webpack/webpack/issues/8826
 *  Workaround: https://github.com/netlify/netlify-faunadb-example/issues/8
 **/
module.exports = {
  // This make reloading faster
  mode: 'development',
  devtool: 'inline-source-map',
  // This suppresses warnings about dynamic imports
  externals: {
    got: '../node_modules/golgoth/node_modules/got/dist/source/index.js',
  },
};
