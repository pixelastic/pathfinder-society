import aoinan from 'aoinan';
import { _, pMap, chalk } from 'golgoth';

export default {
  baseUrl: 'https://pathfinderwiki.com/wiki/',
  init(cacheLocation = './tmp/cache') {
    aoinan.init({
      server: 'pathfinderwiki.com',
      path: '/mediawiki',
      cacheLocation,
    });
  },
  async category(categoryName) {
    const allPages = _.keys(await aoinan.category(categoryName));
    const scenarioPages = _.reject(allPages, value => {
      return _.endsWith(value, 'summary');
    });
    return await pMap(scenarioPages, async pageName => {
      try {
        console.info(chalk.green(`Parsing ${pageName}`));
        return await this.page(pageName);
      } catch (err) {
        console.info(chalk.red(`Error with ${pageName}`));
        console.info(err);
      }
    });
  },
  async page(pageName) {
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
  infobox(page) {
    return page.infobox('adventure');
  },
  url(pageName) {
    const slug = aoinan.slug(pageName);
    return `${this.baseUrl}${slug}`;
  },
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
  price(page) {
    const infobox = this.infobox(page);
    return _.chain(infobox)
      .get('price')
      .replace('PDF: ', '')
      .replace('$', '')
      .thru(parseFloat)
      .value();
  },
  scenarioIndex(page) {
    const infobox = this.infobox(page);
    const title = infobox.title;
    const pattern = /.*#(\d-)?(?<index>\d*):.*/;
    const matches = title.match(pattern);
    return _.parseInt(matches.groups.index);
  },
  backcover(page) {
    return page.templates('quote')[0].quote;
  },
};
