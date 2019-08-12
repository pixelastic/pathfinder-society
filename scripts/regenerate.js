import helper from '../build/helper.js';
import firost from 'firost';
import { _, pMap } from 'golgoth';

(async function() {
  helper.init();

  const allScenarios = [];
  await pMap(_.range(0, 11), async seasonIndex => {
    const scenarios = await helper.scenariosFromSeason(seasonIndex);
    allScenarios.push(...scenarios);
  });

  await firost.writeJson(allScenarios, './lib/data.json');
})();
