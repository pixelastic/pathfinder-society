import aoinan from 'aoinan';
import he from 'he';
import { _, pMap, chalk } from 'golgoth';
import data from './data.json';
import firost from 'firost';

// TODO:
// - Rating (from Paizo website)
// - Cover picture url (from paizo)
// - type (urban, etc)
// - factions
// TODO: Create a hacky list of things that are supposed to be locations, and
// add them to the list

export default {
  baseUrl: 'https://pathfinderwiki.com/wiki/',
  locationCacheKey: 'society.allLocations',
  /**
   * Init the helper, must be called before any other calls
   * @param {string} cacheLocation Path where to save cached files
   **/
  init(cacheLocation = './tmp/cache') {
    aoinan.init({
      server: 'pathfinderwiki.com',
      path: '/mediawiki',
      cacheLocation,
    });
  },
  /**
   * Returns the list of all available locations in the current exported data
   * @returns {Array} Array of all locations
   **/
  allLocations() {
    if (firost.cache.has(this.locationCacheKey)) {
      return firost.cache.read(this.locationCacheKey);
    }

    const manualLocations = [
      'Abraxas, misspelled "Abraxus" in this scenario',
      'Docks Absalom',
      'The Siphons',
      'Tri-Towers Yard',
    ];
    const allLocations = _.chain(this.__data())
      .map('locations')
      .flatten()
      .uniq()
      .concat(manualLocations)
      .sort()
      .value();
    firost.cache.write(this.locationCacheKey, allLocations);
    return allLocations;
  },
  /**
   * All scenarios of a given season
   * @param {number} seasonIndex Season number
   * @returns {Array} List of all scenarios of the season
   **/
  async scenariosFromSeason(seasonIndex) {
    const allPages = _.keys(
      await aoinan.category(`Season_${seasonIndex}_scenarios`)
    );
    const scenarioPages = _.reject(allPages, value => {
      return _.endsWith(value, 'summary') || _.startsWith(value, 'Year of');
    });
    return await pMap(scenarioPages, async pageName => {
      try {
        const scenario = await this.scenario(pageName);
        scenario.seasonIndex = seasonIndex;
        return scenario;
      } catch (err) {
        console.info(chalk.red(`Error with ${pageName}`));
        // console.info(err);
      }
    });
  },
  /**
   * Scenario metadata
   * @param {string} pageName Page name
   * @returns {object} Scenario metadata
   **/
  async scenario(pageName) {
    const page = await aoinan.page(pageName);
    const infobox = this.infobox(page);
    return {
      title: pageName,
      url: this.url(pageName),
      paizoUrl: infobox.website,
      pubcode: infobox.pubcode,
      authors: this.authors(page),
      backcover: this.backcover(page),
      levels: this.levels(page),
      locations: this.locations(page),
      npcs: this.npcs(page),
      price: this.price(page),
      scenarioIndex: this.scenarioIndex(page),
    };
  },
  /**
   * Infobox of the page
   * @param {object} page Page instance
   * @returns {object} List of key/values of the Adventure infobox
   **/
  infobox(page) {
    return page.infobox('adventure');
  },
  /**
   * Wiki url
   * @param {string} pageName Name of the page
   * @returns {string} Url to the Wiki page
   **/
  url(pageName) {
    const slug = aoinan.slug(pageName);
    return `${this.baseUrl}${slug}`;
  },
  /**
   * List of authors
   * @param {object} page Page instance
   * @returns {Array} List of authors
   **/
  authors(page) {
    const infobox = this.infobox(page);
    // Numbered authors
    if (infobox.author1) {
      // Keep only "authorX" keys
      const authorKeys = _.filter(_.keys(infobox), key => {
        const pattern = /^author(\d+)$/;
        return pattern.test(key);
      });
      // Return matching values
      return _.transform(
        authorKeys,
        (result, keyName) => {
          result.push(infobox[keyName]);
        },
        []
      );
    }
  },
  /**
   * Price, in $
   * @param {object} page Page instance
   * @returns {number} Price
   **/
  price(page) {
    const infobox = this.infobox(page);
    return _.chain(infobox)
      .get('price')
      .replace('PDF: ', '')
      .replace('$', '')
      .replace('Free', '0')
      .thru(parseFloat)
      .value();
  },
  /**
   * Scenario index in the season
   * @param {object} page Page instance
   * @returns {number} Index
   **/
  scenarioIndex(page) {
    const infobox = this.infobox(page);
    const title = infobox.title;
    const pattern = /.*#(\d-)?(?<index>\d*):.*/;
    const matches = title.match(pattern);
    const index = _.get(matches, 'groups.index', false);
    if (!index) {
      return -1;
    }
    return _.parseInt(matches.groups.index);
  },
  /**
   * Returns the min and max levels for the scenario
   * @param {object} page Page instance
   * @returns {object} { min, max }
   **/
  levels(page) {
    const overview = page.templates('adventure overview')[0];
    const levels = [];
    _.each(overview, (value, key) => {
      if (!_.startsWith(key, 'level')) {
        return;
      }
      levels.push(_.parseInt(_.replace(key, 'level', '')));
    });

    return { min: _.min(levels), max: _.max(levels) };
  },
  /**
   * Returns the list of locations for the scenario
   * @param {object} page Page instance
   * @returns {Array} List of locations
   **/
  locations(page) {
    const overview = page.templates('adventure overview')[0];
    const locations = [];
    _.each(overview, (value, key) => {
      if (!_.startsWith(key, 'location')) {
        return;
      }
      locations.push(value);
    });
    return locations;
  },
  recurringNPCsWithTemplates(page) {
    // {{John Doe Appearances}} templates
    const templates = page.templates(/(.*) appearances/);
    return _.transform(
      templates,
      (result, template) => {
        const templateName = template.template;
        const npcName = _.chain(templateName)
          .replace(' appearances', '')
          .startCase()
          .value();
        result.push(npcName);
      },
      []
    );
  },
  recurringNPCsManual(page) {
    // Manual textual informations
    const section = _.first(page.sections(/Recurring characters/));
    if (!section) {
      return [];
    }
    const lines = _.compact(section.text().split('\n'));
    const regexp = /^\*+ (?<name>[^(]*)(.*)/;
    return _.transform(
      lines,
      (result, line) => {
        const matches = _.trim(line).match(regexp);
        if (!matches) {
          return;
        }
        result.push(_.trim(matches.groups.name));
      },
      []
    );
  },
  /**
   * Returns a list of all recurring NPCs
   * Note: This involves parsing manual wiki text as well as automated
   * templates. The list also contains a mix of locations and NPCs.
   * @param {object} page Page instance
   * @returns {Array} List of recurring NPCs
   **/
  npcs(page) {
    const manualEntries = this.recurringNPCsManual(page);
    const automatedEntries = this.recurringNPCsWithTemplates(page);
    const mergedList = _.concat(automatedEntries, manualEntries);
    // We remove any known location from the list
    const allLocations = this.allLocations();
    return _.chain(mergedList)
      .difference(allLocations)
      .sort()
      .value();
  },
  /**
   * Backcover description
   * @param {object} page Page instance
   * @returns {string} Backcover description
   **/
  backcover(page) {
    return _.chain(page.templates('quote'))
      .first()
      .get('quote', '')
      .thru(he.decode)
      .value();
  },
  __data() {
    return data;
  },
};
