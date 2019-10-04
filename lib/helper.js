import aoinan from 'aoinan';
import data from './data.json';
import firost from 'firost';
import he from 'he';
import jsdom from 'jsdom';
import path from 'path';
import { _, pMap, chalk } from 'golgoth';

export default {
  baseUrl: 'https://pathfinderwiki.com/wiki/',
  locationCacheKey: 'society.allLocations',
  cacheLocation: null,
  /**
   * Init the helper, must be called before any other calls
   * @param {string} cacheLocation Path where to save cached files
   **/
  init(cacheLocation = './tmp/cache') {
    this.cacheLocation = cacheLocation;
    aoinan.init({
      server: 'pathfinderwiki.com',
      path: '/mediawiki',
      cacheLocation: path.resolve(cacheLocation, 'wiki'),
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
    const allScenariosData = await pMap(scenarioPages, async pageName => {
      try {
        const scenario = await this.scenario(pageName);
        scenario.seasonIndex = seasonIndex;
        firost.pulse.emit('scenario', scenario);
        return scenario;
      } catch (err) {
        console.info(chalk.red(`Error with ${pageName}`));
        console.info(err);
      }
    });
    return allScenariosData;
  },
  /**
   * Scenario metadata
   * @param {string} pageName Page name
   * @returns {object} Scenario metadata
   **/
  async scenario(pageName) {
    const wikiPage = await aoinan.page(pageName);

    const infobox = this.infobox(wikiPage);
    const paizoUrl = infobox.website;
    const paizoPage = await this.paizoPage(paizoUrl);
    return {
      title: pageName,
      url: this.url(pageName),
      paizoUrl,
      coverUrl: this.coverUrl(paizoPage),
      rating: this.rating(paizoPage),
      pubcode: infobox.pubcode,
      authors: this.authors(wikiPage),
      backcover: this.backcover(wikiPage),
      levels: this.levels(wikiPage),
      locations: this.locations(wikiPage),
      npcs: this.npcs(wikiPage),
      price: this.price(wikiPage),
      scenarioIndex: this.scenarioIndex(wikiPage),
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
  async paizoPage(websiteUrl) {
    // Read from disk cache
    const basename = firost.urlToFilepath(websiteUrl);
    const cachePath = path.resolve(this.cacheLocation, 'paizo', basename);
    let htmlContent;
    if (await firost.exist(cachePath)) {
      htmlContent = await firost.read(cachePath);
    } else {
      htmlContent = await firost.download(websiteUrl, cachePath);
    }
    return new jsdom.JSDOM(htmlContent).window.document;
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
   * @param {object} wikiPage Page instance
   * @returns {Array} List of authors
   **/
  authors(wikiPage) {
    const infobox = this.infobox(wikiPage);
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
   * @param {object} wikiPage Page instance
   * @returns {number} Price
   **/
  price(wikiPage) {
    const infobox = this.infobox(wikiPage);
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
   * @param {object} wikiPage Page instance
   * @returns {number} Index
   **/
  scenarioIndex(wikiPage) {
    const infobox = this.infobox(wikiPage);
    const title = infobox.title;
    const pattern = /.*#(\d*-)?(?<index>\d*):.*/;
    const matches = title.match(pattern);
    const index = _.get(matches, 'groups.index', false);
    if (!index) {
      return 0;
    }
    return _.parseInt(matches.groups.index);
  },
  /**
   * Returns the min and max levels for the scenario
   * @param {object} wikiPage Page instance
   * @returns {object} { min, max }
   **/
  levels(wikiPage) {
    const overview = wikiPage.templates('adventure overview')[0];
    const levels = [];
    _.each(overview, (value, key) => {
      if (!_.startsWith(key, 'level')) {
        return;
      }
      levels.push(_.parseInt(_.replace(key, 'level', '')));
    });

    return levels;
  },
  /**
   * Returns the list of locations for the scenario
   * @param {object} wikiPage Page instance
   * @returns {Array} List of locations
   **/
  locations(wikiPage) {
    const overview = wikiPage.templates('adventure overview')[0];
    const locations = [];
    _.each(overview, (value, key) => {
      if (!_.startsWith(key, 'location')) {
        return;
      }
      locations.push(value);
    });
    return locations;
  },
  recurringNPCsWithTemplates(wikiPage) {
    // {{John Doe Appearances}} templates
    const templates = wikiPage.templates(/(.*) appearances/);
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
  recurringNPCsManual(wikiPage) {
    // Manual textual informations
    const section = _.first(wikiPage.sections(/Recurring characters/));
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
   * @param {object} wikiPage Page instance
   * @returns {Array} List of recurring NPCs
   **/
  npcs(wikiPage) {
    const manualEntries = this.recurringNPCsManual(wikiPage);
    const automatedEntries = this.recurringNPCsWithTemplates(wikiPage);
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
   * @param {object} wikiPage Page instance
   * @returns {string} Backcover description
   **/
  backcover(wikiPage) {
    return _.chain(wikiPage.templates('quote'))
      .first()
      .thru(template => {
        return template.quote || template.text || '';
      })
      .thru(he.decode)
      .value();
  },
  /**
   * Url of the cover page
   * @param {object} paizoPage JSDOM document of the page
   * @returns {string} Url of the image
   **/
  coverUrl(paizoPage) {
    const selector = '.product-image a,.product-purchase-block a';
    return paizoPage.querySelector(selector).href;
  },
  /**
   * Average rating of the module
   * @param {object} paizoPage JSDOM document of the page
   * @returns {number} Rating (out of 5)
   **/
  rating(paizoPage) {
    const selector = 'meta[itemprop="ratingValue"]';
    const value = paizoPage.querySelector(selector).content;
    return _.chain(value)
      .split('/')
      .first()
      .thru(parseFloat)
      .value();
  },
  /**
   * Wrapper around the ./data.json export, to be able to mock it in testes
   * @returns {object} Exported data object
   */
  __data() {
    return data;
  },
};
