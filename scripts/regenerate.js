import helper from '../lib/helper.js';
import firost from 'firost';
import os from 'os';
import { _, pMap, spinner } from 'golgoth';

(async function() {
  const maxSeasons = 10;
  helper.init();
  const progress = spinner(maxSeasons + 1);

  const allScenarios = {};
  await pMap(
    _.range(0, maxSeasons + 1),
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
      progress.tick(`Season ${seasonIndex}`);
    },
    { concurrency: os.cpus().length }
  );

  await firost.writeJson(allScenarios, './lib/data.json');
  progress.succeed('./lib/data.json updated');
})();
