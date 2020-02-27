const aoinan = require('aoinan');
const societyData = require('./data.json');
const firost = require('firost');
const he = require('he');
const jsdom = require('jsdom');
const path = require('path');
const _ = require('golgoth/lib/_');
const pMap = require('golgoth/lib/pMap');

module.exports = {
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
   * Used to cleanup the list of NPCs from any known Location
   * @returns {Array} Array of all locations
   **/
  allLocations() {
    if (firost.cache.has(this.locationCacheKey)) {
      return firost.cache.read(this.locationCacheKey);
    }

    const manualLocations = [
      "Asad's Keep",
      'Abraxas, misspelled "Abraxus" in this scenario',
      'Docks Absalom',
      'Doorway to the Red Star',
      'Plane of Fire',
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
   * @param {number} seasonPage Name of page listing all scenarios of the season
   * @returns {Array} List of all scenarios of the season
   **/
  async scenariosFromSeason(seasonPage) {
    const allPages = _.keys(await aoinan.category(seasonPage));
    const scenarioPages = _.reject(allPages, value => {
      return _.endsWith(value, 'summary') || _.startsWith(value, 'Year of');
    });
    const allScenariosData = await pMap(scenarioPages, async pageName => {
      try {
        const scenario = await this.scenario(pageName);
        return scenario;
      } catch (err) {
        throw firost.error(
          'EXTRACTION_ERROR',
          `Error with ${pageName}: ${err.message}`
        );
      }
    });
    return _.compact(allScenariosData);
  },
  /**
   * Scenario metadata
   * @param {string} pageName Page name
   * @returns {object} Scenario metadata
   **/
  async scenario(pageName) {
    const wikiPage = await aoinan.page(pageName);
    // Skipping scenarios not yet released
    if (!this.isReleased(wikiPage)) {
      return null;
    }

    const infobox = this.infobox(wikiPage);
    const paizoUrl = infobox.website;
    const paizoPage = await this.paizoPage(paizoUrl);

    const data = {
      title: pageName,
      slug: _.camelCase(pageName),
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
      seasonIndex: this.seasonIndex(wikiPage),
      ruleVersion: this.ruleVersion(wikiPage),
    };

    firost.pulse.emit('scenario', data);
    return data;
  },
  /**
   * Check if the scenario is marked as Coming Soon
   * @param {object} wikiPage Page instance
   * @returns {boolean} True if released, false if Coming Soon
   **/
  isReleased(wikiPage) {
    const firstParagraph = wikiPage
      .doc()
      .paragraphs()[0]
      .text();
    return !_.includes(firstParagraph, 'is expected to be released');
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
   * DOM version of the webpage on the Paizo website
   * @param {string} websiteUrl Url of the webpage
   * @returns {object} DOM representation of the page
   **/
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
   * @returns {number} Scenario index
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
   * Season index
   * Note: The best source of truth is the infobox, but sometimes it is
   * easier not parseable, or contains several seasons as the scenario might
   * have been release as a limited edition, then officially released again
   * In that case we try to parse the title. This can also fail for special
   * events, we then fallback to guessing the seasonIndex from the pubcode.
   * @param {object} wikiPage Page instance
   * @returns {number} Season index
   **/
  seasonIndex(wikiPage) {
    const fromSeries = this.seasonIndexFromSeries(wikiPage);
    if (!_.isNull(fromSeries)) {
      return fromSeries;
    }
    const fromTitle = this.seasonIndexFromTitle(wikiPage);
    if (!_.isNull(fromTitle)) {
      return fromTitle;
    }
    const fromPubcode = this.seasonIndexFromPubcode(wikiPage);
    if (!_.isNull(fromPubcode)) {
      return fromPubcode;
    }
    return 'ERROR';
  },
  /**
   * Season index, read from the infobox
   * @param {object} wikiPage Page instance
   * @returns {number} Season index
   **/
  seasonIndexFromSeries(wikiPage) {
    // We can't read the infobox directly as any link in it will be
    // converted, and some special links will get garbled. We need to
    // manually parse until we find the right line
    const seriesLines = _.find(wikiPage.raw.split('\n'), line => {
      return line.match(/^\| *series *=/);
    });
    const series = seriesLines.split('=')[1];
    const pattern = /Season (\d*) scenarios/g;
    const matches = _.uniq(series.match(pattern));
    if (!matches) {
      return null;
    }
    // More than one match, it means it's part of several season, we
    // reject it
    if (matches.length > 1) {
      return null;
    }
    return _.chain(matches)
      .first()
      .replace('Season ', '')
      .replace(' scenarios', '')
      .parseInt()
      .value();
  },
  /**
   * Season index, read from the title
   * @param {object} wikiPage Page instance
   * @returns {number} Season index
   **/
  seasonIndexFromTitle(wikiPage) {
    const infobox = this.infobox(wikiPage);
    const title = _.get(infobox, 'title');
    const pattern = /.*#(?<seasonIndex>\d*)?-\d*:.*/;
    const matches = title.match(pattern);
    const seasonIndex = _.get(matches, 'groups.seasonIndex');
    if (seasonIndex) {
      return _.parseInt(seasonIndex);
    }
    return null;
  },
  /**
   * Season index, read from the pubcode
   * @param {object} wikiPage Page instance
   * @returns {number} Season index
   **/
  seasonIndexFromPubcode(wikiPage) {
    const infobox = this.infobox(wikiPage);
    const pubcode = _.get(infobox, 'pubcode');
    const pattern = /PZOPSS(?<seasonIndex>\d{2}).*/;
    const matches = pubcode.match(pattern);
    const seasonIndex = _.get(matches, 'groups.seasonIndex');
    if (seasonIndex) {
      return _.parseInt(seasonIndex);
    }
    return null;
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
      levels.push(_.parseInt(value));
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
        return _.get(template, 'quote', _.get(template, 'text', ''));
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
   * @returns {number|null} Rating (out of 5). Null if no such rating
   **/
  rating(paizoPage) {
    const selector = 'meta[itemprop="ratingValue"]';
    const element = paizoPage.querySelector(selector);
    if (!element) {
      return null;
    }
    const value = element.content;
    return _.chain(value)
      .split('/')
      .first()
      .thru(parseFloat)
      .value();
  },
  /**
   * Return the rule version used in the scenario
   * @param {object} wikiPage Page instance
   * @returns {number} 1 for D&D 3.5, PF2 for Pathfinder 2
   **/
  ruleVersion(wikiPage) {
    const infobox = this.infobox(wikiPage);
    const hashes = {
      'D&D 3.5': 1,
      PFRPG: 1,
      PF2: 2,
    };
    return hashes[infobox.rules];
  },
  /**
   * Wrapper around the ./data.json export, to be able to mock it in testes
   * @returns {object} Exported data object
   */
  __data() {
    return societyData;
  },
};
