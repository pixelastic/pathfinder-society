import helper from '../lib/helper.js';
import firost from 'firost';
import os from 'os';
import { _, pMap } from 'golgoth';

(async function() {
  const maxSeasons = 10;
  helper.init();

  firost.pulse.on('scenario', data => {
    const seasonIndex = _.padStart(data.seasonIndex, '2', '0');
    const scenarioIndex = _.padStart(data.scenarioIndex, '2', '0');
    console.info(`S${seasonIndex}E${scenarioIndex}: ${data.title}`);
  });

  const allScenarios = {};
  await pMap(
    _.range(0, maxSeasons),
    async seasonIndex => {
      const scenarios = await helper.scenariosFromSeason(seasonIndex);
      _.each(scenarios, scenario => {
        const key = _.chain(scenario.title)
          .startCase()
          .replace(/ /g, '')
          .camelCase()
          .value();
        allScenarios[key] = scenario;
      });
    },
    { concurrency: os.cpus().length }
  );

  await firost.writeJson(allScenarios, './lib/data.json');
})();
