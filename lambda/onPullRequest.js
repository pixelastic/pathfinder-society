/* eslint-disable import/no-commonjs */
exports.handler = function(event, context, callback) {
  console.info(JSON.stringify(event, null, 2));
  console.info(JSON.stringify(context, null, 2));
  callback(null, {
    statusCode: 200,
    body: 'pouet',
  });
};
