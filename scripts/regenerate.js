import helper from '../build/helper.js';
import firost from 'firost';

(async function() {
  helper.init();

  const pages = await helper.category('Season_0_scenarios');

  await firost.writeJson(pages, './lib/data.json');
})();
