const helper = require('../lib/helper.js');
const firost = require('firost');
const _ = require('golgoth/lodash');
const pMap = require('golgoth/pMap');

(async function () {
  helper.init();

  firost.pulse.on('scenario', (data) => {
    const seasonIndex = _.padStart(data.seasonIndex, '2', '0');
    const scenarioIndex = _.padStart(data.scenarioIndex, '2', '0');
    console.info(`S${seasonIndex}E${scenarioIndex}: ${data.title}`);
  });

  const allScenarios = {};
  const seasonPages = [
    'Season_0_scenarios',
    'Season_1_scenarios',
    'Season_2_scenarios',
    'Season_3_scenarios',
    'Season_4_scenarios',
    'Season_5_scenarios',
    'Season_6_scenarios',
    'Season_7_scenarios',
    'Season_8_scenarios',
    'Season_9_scenarios',
    'Season_10_scenarios',
    'Season_1_(2E)_scenarios',
  ];
  try {
    await pMap(seasonPages, async (seasonPage) => {
      const scenarios = await helper.scenariosFromSeason(seasonPage);
      _.each(scenarios, (scenario) => {
        const key = _.chain(scenario.title)
          .startCase()
          .replace(/ /g, '')
          .camelCase()
          .value();
        allScenarios[key] = scenario;
      });
    });
  } catch (err) {
    firost.consoleError(`[${err.code}]: ${err.message}`);
    process.exit(1);
  }

  await firost.writeJson(allScenarios, './lib/data.json');
})();
