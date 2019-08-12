import helper from '../build/helper.js';
import firost from 'firost';

(async function() {
  helper.init();

  const page = await helper.page('Black Waters');
  console.info(page);

  await firost.writeJson([page], './lib/data.json');
})();
