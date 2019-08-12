import aoinan from 'aoinan';
import { _, pMap, chalk } from 'golgoth';

// TODO:
// - Rating (from Paizo website)
// - Cover picture url (from paizo)
// - Adventure levels
// - Locations
// - type (urban, etc)
// - factions
// - recurring factions/NPCs

export default {
  baseUrl: 'https://pathfinderwiki.com/wiki/',
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
   * Backcover description
   * @param {object} page Page instance
   * @returns {string} Backcover description
   **/
  backcover(page) {
    return _.chain(page.templates('quote'))
      .first()
      .get('quote', '')
      .value();
  },
};
