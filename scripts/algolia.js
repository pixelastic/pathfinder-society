const indexing = require('algolia-indexing').default;
const data = require('../lib/data.json');

(async function() {
  const credentials = {
    appId: process.env.ALGOLIA_APP_ID,
    apiKey: process.env.ALGOLIA_API_KEY,
    indexName: 'gamemaster_society',
  };
  const settings = {
    searchableAttributes: [
      'title',
      'locations',
      'backcover',
      'authors',
      'npcs',
    ],
    attributesForFaceting: [
      'levels',
      'ruleVersion',
      'searchable(authors)',
      'searchable(locations)',
      'searchable(npcs)',
      'seasonIndex',
    ],
    customRanking: [
      'desc(ruleVersion)',
      'desc(rating)',
      'desc(seasonIndex)',
      'desc(scenarioIndex)',
      'asc(price)',
    ],
  };

  indexing.verbose();
  indexing.config({
    batchMaxSize: 100,
  });
  await indexing.fullAtomic(credentials, data, settings);
})();
