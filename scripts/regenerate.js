import helper from '../build/helper.js';
import firost from 'firost';
import { _, pMap } from 'golgoth';

(async function() {
  helper.init();

  const allScenarios = {};
  await pMap(_.range(0, 11), async seasonIndex => {
    const scenarios = await helper.scenariosFromSeason(seasonIndex);
    _.each(scenarios, scenario => {
      const key = _.chain(scenario.title)
        .startCase()
        .replace(/ /g, '')
        .camelCase()
        .value();
      allScenarios[key] = scenario;
    });
  });

  await firost.writeJson(allScenarios, './lib/data.json');
})();
