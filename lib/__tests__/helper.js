const current = require('../helper');
const aoinan = require('aoinan');
const firost = require('firost');

describe('helper', () => {
  beforeEach(() => {
    current.init('./fixtures');
  });
  describe('allLocations', () => {
    beforeEach(() => {
      firost.cache.clear(current.locationCacheKey);
    });
    afterEach(() => {
      firost.cache.clear(current.locationCacheKey);
    });
    it('should return an array of all locations', () => {
      const mockData = {
        foo: {
          locations: ['foo', 'bar'],
        },
        bar: {
          locations: ['bar', 'baz'],
        },
      };
      jest.spyOn(current, '__data').mockReturnValue(mockData);

      const actual = current.allLocations();
      expect(actual).toContain('foo');
      expect(actual).toContain('bar');
      expect(actual).toContain('baz');
    });
    it('should return cached value on subsequent calls', () => {
      const mockData = {
        foo: {
          locations: ['foo', 'bar'],
        },
      };
      jest.spyOn(current, '__data').mockReturnValue(mockData);

      current.allLocations();
      current.allLocations();
      expect(current.__data).toHaveBeenCalledTimes(1);
    });
  });
  describe('url', () => {
    it('should return the whole url on the wiki', () => {
      const input = 'Among the Living';

      const actual = current.url(input);

      expect(actual).toEqual(
        'https://pathfinderwiki.com/wiki/Among_the_Living'
      );
    });
  });
  describe('infobox', () => {
    it('Black Waters', async () => {
      const input = await aoinan.page('Black Waters');

      const actual = current.infobox(input);

      expect(actual).toHaveProperty('binding', 'PDF');
    });
  });
  describe('authors', () => {
    describe('several numbered authors', () => {
      it('should create an array of them', () => {
        jest
          .spyOn(current, 'infobox')
          .mockReturnValue({ author1: 'foo', author2: 'bar' });

        const actual = current.authors();

        expect(actual).toEqual(['foo', 'bar']);
      });
      it('should exclude the author key', () => {
        jest.spyOn(current, 'infobox').mockReturnValue({
          author: 'foo and bar',
          author1: 'foo',
          author2: 'bar',
        });

        const actual = current.authors();

        expect(actual).toEqual(['foo', 'bar']);
      });
    });
  });
  describe('levels', () => {
    it('Black Waters: 1-5', async () => {
      const input = await aoinan.page('Black Waters');

      const actual = current.levels(input);

      expect(actual).toEqual([1, 2, 3, 4, 5]);
    });
    it("Serpents' Ire: 8", async () => {
      const input = await aoinan.page("Serpents' Ire");

      const actual = current.levels(input);

      expect(actual).toEqual([8]);
    });
    it('Death on the Ice: 5-9', async () => {
      const input = await aoinan.page('Death on the Ice');

      const actual = current.levels(input);

      expect(actual).toEqual([5, 6, 7, 8, 9]);
    });
  });
  describe('locations', () => {
    it('Black Waters', async () => {
      const input = await aoinan.page('Black Waters');

      const actual = current.locations(input);

      expect(actual).toContain('Precipice Quarter');
      expect(actual).toContain('Absalom');
      expect(actual).toContain('Drownyard');
    });
  });
  describe('npcs', () => {
    it('Black Waters', async () => {
      const input = await aoinan.page('Black Waters');

      const actual = current.npcs(input);

      expect(actual).toEqual([
        'Cassiel Marlinchen',
        'Deris Marlinchen',
        'Drandle Dreng',
        'Grishan Maldris',
        'Junia Dacilane',
        'Major Colson Maldris',
        'Miranda Dacilane',
      ]);
    });
    it('In Service to Lore', async () => {
      const input = await aoinan.page('In Service to Lore');

      const actual = current.npcs(input);

      expect(actual).toContain('Venture-Captain Ambrus Valson');
      expect(actual).toContain('Dremdhet Salhar');
      expect(actual).toContain('Pickled Imp');
      expect(actual).not.toContain('Ascendant Court');
      expect(actual).not.toContain('Ivy District');
      expect(actual).not.toContain('Absalom');
    });
    it('Fingerprints of the Fiend', async () => {
      const input = await aoinan.page('Fingerprints of the Fiend');

      const actual = current.npcs(input);

      expect(actual).toContain('Haliduras Karn');
    });
    it('The Absalom Initiation', async () => {
      const input = await aoinan.page('The Absalom Initiation');

      const actual = current.npcs(input);

      expect(actual).toEqual([]);
    });
    it('A Vision of Betrayal', async () => {
      const input = await aoinan.page('A Vision of Betrayal');

      const actual = current.npcs(input);

      expect(actual).not.toContain('* Absalom');
      expect(actual).not.toContain('Absalom');
      expect(actual).not.toContain('The Siphons');
    });
  });
  describe('price', () => {
    it('PDF: $3.99', () => {
      const input = 'PDF: $3.99';
      const expected = 3.99;

      jest.spyOn(current, 'infobox').mockReturnValue({ price: input });
      const actual = current.price();

      expect(actual).toEqual(expected);
    });
    it('PDF: Free', () => {
      const input = 'PDF: Free';
      const expected = 0;

      jest.spyOn(current, 'infobox').mockReturnValue({ price: input });
      const actual = current.price();

      expect(actual).toEqual(expected);
    });
  });
  describe('backcover', () => {
    it('Black Waters', async () => {
      const input = await aoinan.page('Black Waters');

      const actual = current.backcover(input);

      expect(actual).toMatch(/^The Pathfinder Society/);
    });
    it('Ruins of Bonekeep Level 3: The Wakening Tomb', async () => {
      const input = await aoinan.page(
        'Ruins of Bonekeep Level 3: The Wakening Tomb'
      );

      const actual = current.backcover(input);

      expect(actual).toEqual('');
    });
    it('All the Gods Beyond', async () => {
      const input = await aoinan.page('All the Gods Beyond');

      const actual = current.backcover(input);

      expect(actual).toContain('scheme—one');
    });
    it('Fate of the Fiend', async () => {
      const input = await aoinan.page('Fate of the Fiend');

      const actual = current.backcover(input);

      expect(actual).toContain('Years after');
    });
  });
  describe('scenarioIndex', () => {
    it('Pathfinder Society Scenario #6: Black Waters', () => {
      const input = 'Pathfinder Society Scenario #6: Black Waters';
      const expected = 6;

      jest.spyOn(current, 'infobox').mockReturnValue({ title: input });
      const actual = current.scenarioIndex();

      expect(actual).toEqual(expected);
    });
    it('Pathfinder Society Scenario #0-05: Mists of Mwangi', () => {
      const input = 'Pathfinder Society Scenario #0-05: Mists of Mwangi';
      const expected = 5;

      jest.spyOn(current, 'infobox').mockReturnValue({ title: input });
      const actual = current.scenarioIndex();

      expect(actual).toEqual(expected);
    });
    it('Pathfinder Society Scenario #3-SP: Blood Under Absalom', () => {
      const input = 'Pathfinder Society Scenario #3-SP: Blood Under Absalom';
      const expected = 0;

      jest.spyOn(current, 'infobox').mockReturnValue({ title: input });
      const actual = current.scenarioIndex();

      expect(actual).toEqual(expected);
    });
    it('Pathfinder Society Scenario Intro 1: First Steps, Part I: In Service to Lore', () => {
      const input =
        'Pathfinder Society Scenario Intro 1: First Steps, Part I: In Service to Lore';
      const expected = 0;

      jest.spyOn(current, 'infobox').mockReturnValue({ title: input });
      const actual = current.scenarioIndex();

      expect(actual).toEqual(expected);
    });
    it('Pathfinder Society Scenario #10-23: Passing the Torch Part 2: Who Speaks for the Ten', () => {
      const input =
        'Pathfinder Society Scenario #10-23: Passing the Torch Part 2: Who Speaks for the Ten';
      const expected = 23;

      jest.spyOn(current, 'infobox').mockReturnValue({ title: input });
      const actual = current.scenarioIndex();

      expect(actual).toEqual(expected);
    });
  });
  describe('coverUrl', () => {
    it('Black Waters', async () => {
      const paizoUrl = 'https://paizo.com/products/btpy8531';
      const paizoPage = await current.paizoPage(paizoUrl);

      const actual = current.coverUrl(paizoPage);

      expect(actual).toEqual(
        '//cdn.paizo.com/image/product/catalog/PZOP/PZOPSS0006E_500.jpeg'
      );
    });
    it('Death on the Ice', async () => {
      const paizoUrl = 'https://paizo.com/products/btpya1y2';
      const paizoPage = await current.paizoPage(paizoUrl);

      const actual = current.coverUrl(paizoPage);

      expect(actual).toEqual(
        '//cdn.paizo.com/image/product/catalog/PZOP/PZOPSS1003E.jpg'
      );
    });
  });
  describe('rating', () => {
    it('Black Waters', async () => {
      const paizoUrl = 'https://paizo.com/products/btpy8531';
      const paizoPage = await current.paizoPage(paizoUrl);

      const actual = current.rating(paizoPage);

      expect(actual).toEqual(4);
    });
    it('Death on the Ice', async () => {
      const paizoUrl = 'https://paizo.com/products/btpya1y2';
      const paizoPage = await current.paizoPage(paizoUrl);

      const actual = current.rating(paizoPage);

      expect(actual).toEqual(4.2);
    });
    it('Star-Crossed Voyages', async () => {
      const paizoUrl = 'https://paizo.com/products/btq021x5';
      const paizoPage = await current.paizoPage(paizoUrl);

      const actual = current.rating(paizoPage);

      expect(actual).toEqual(null);
    });
  });
  describe('ruleVersion', () => {
    it('Black Waters', async () => {
      const input = await aoinan.page('Black Waters');

      const actual = current.ruleVersion(input);

      expect(actual).toEqual(1);
    });
    it('All the Gods Beyond', async () => {
      const input = await aoinan.page('All the Gods Beyond');

      const actual = current.ruleVersion(input);

      expect(actual).toEqual(1);
    });
    it('The Absalom Initiation', async () => {
      const input = await aoinan.page('The Absalom Initiation');

      const actual = current.ruleVersion(input);

      expect(actual).toEqual(2);
    });
  });
  describe('seasonIndex', () => {
    it('Black Waters', async () => {
      const input = await aoinan.page('Black Waters');

      const actual = current.seasonIndex(input);

      expect(actual).toEqual(0);
    });
    it('Among the Dead', async () => {
      const input = await aoinan.page('Among the Dead');

      const actual = current.seasonIndex(input);

      expect(actual).toEqual(1);
    });
    it('A Vision of Betrayal', async () => {
      const input = await aoinan.page('A Vision of Betrayal');

      const actual = current.seasonIndex(input);

      expect(actual).toEqual(3);
    });
    it('Beacon Below', async () => {
      const input = await aoinan.page('Beacon Below');

      const actual = current.seasonIndex(input);

      expect(actual).toEqual(6);
    });
    it('The Midnight Mauler', async () => {
      const input = await aoinan.page('The Midnight Mauler');

      const actual = current.seasonIndex(input);

      expect(actual).toEqual(3);
    });
    it('The Paths We Choose', async () => {
      const input = await aoinan.page('The Paths We Choose');

      const actual = current.seasonIndex(input);

      expect(actual).toEqual(6);
    });
    it('Fate of the Fiend', async () => {
      const input = await aoinan.page('Fate of the Fiend');

      const actual = current.seasonIndex(input);

      expect(actual).toEqual(5);
    });
  });
  describe('isReleased', () => {
    it('Black Waters', async () => {
      const input = await aoinan.page('Black Waters');

      const actual = current.isReleased(input);

      expect(actual).toEqual(true);
    });
    it('Lost on the Spirit Road (Coming soon)', async () => {
      const input = await aoinan.page('Lost on the Spirit Road');

      const actual = current.isReleased(input);

      expect(actual).toEqual(false);
    });
    it("Serpents' Ire (Event special)", async () => {
      const input = await aoinan.page("Serpents' Ire");

      const actual = current.isReleased(input);

      expect(actual).toEqual(true);
    });
  });
  describe('scenario', () => {
    it('Black Waters', async () => {
      const input = 'Black Waters';

      const actual = await current.scenario(input);

      expect(actual).toHaveProperty('title', 'Black Waters');
      expect(actual).toHaveProperty(
        'url',
        'https://pathfinderwiki.com/wiki/Black_Waters'
      );
      expect(actual).toHaveProperty(
        'paizoUrl',
        'https://paizo.com/products/btpy8531'
      );
      expect(actual).toHaveProperty('pubcode', 'PZOPSS0006E');
      expect(actual).toHaveProperty('authors', [
        'Tim Connors',
        'Eileen Connors',
      ]);
      expect(actual).toHaveProperty('price', 3.99);
      expect(actual).toHaveProperty('seasonIndex', 0);
      expect(actual).toHaveProperty('scenarioIndex', 6);
      expect(actual.backcover).toMatch(/^The Pathfinder Society/);
      expect(actual).toHaveProperty('levels', [1, 2, 3, 4, 5]);
      expect(actual.locations).toContain('Precipice Quarter');
      expect(actual.locations).toContain('Absalom');
      expect(actual.locations).toContain('Drownyard');
      expect(actual.npcs).toContain('Drandle Dreng');
      expect(actual.npcs).toContain('Deris Marlinchen');
      expect(actual.npcs).toContain('Cassiel Marlinchen');
      expect(actual.npcs).toContain('Major Colson Maldris');
      expect(actual.npcs).toContain('Grishan Maldris');
      expect(actual.npcs).not.toContain('Tri-Towers Yard');
      expect(actual.npcs).toContain('Junia Dacilane');
      expect(actual.npcs).toContain('Miranda Dacilane');
      expect(actual).toHaveProperty(
        'coverUrl',
        '//cdn.paizo.com/image/product/catalog/PZOP/PZOPSS0006E_500.jpeg'
      );
      expect(actual).toHaveProperty('rating', 4);
    });
    it('Blood Under Absalom', async () => {
      const input = 'Blood Under Absalom';
      const actual = await current.scenario(input);

      expect(actual).toHaveProperty('scenarioIndex', 0);
    });
    it('In Service to Lore', async () => {
      const input = 'In Service to Lore';

      const actual = await current.scenario(input);

      expect(actual).toHaveProperty('scenarioIndex', 0);
    });
    it('Ruins of Bonekeep Level 3: The Wakening Tomb', async () => {
      const input = 'Ruins of Bonekeep Level 3: The Wakening Tomb';

      const actual = await current.scenario(input);

      expect(actual).toHaveProperty('backcover', '');
    });
    it('A Vision of Betrayal', async () => {
      const input = 'A Vision of Betrayal';

      const actual = await current.scenario(input);

      expect(actual).toHaveProperty('price', 0);
      expect(actual.npcs).not.toContain('* Absalom');
      expect(actual.npcs).not.toContain('Absalom');
      expect(actual.npcs).not.toContain('The Siphons');
    });
    it('All the Gods Beyond', async () => {
      const input = 'All the Gods Beyond';

      const actual = await current.scenario(input);

      expect(actual.backcover).toContain('scheme—one');
    });
    it('Fingerprints of the Fiend', async () => {
      const input = 'Fingerprints of the Fiend';

      const actual = await current.scenario(input);

      expect(actual.npcs).toContain('Haliduras Karn');
    });
    it('The Absalom Initiation', async () => {
      const input = 'The Absalom Initiation';

      const actual = await current.scenario(input);

      expect(actual).toHaveProperty('npcs', []);
    });
    it('Death on the Ice', async () => {
      const input = 'Death on the Ice';

      const actual = await current.scenario(input);

      expect(actual).toHaveProperty(
        'coverUrl',
        '//cdn.paizo.com/image/product/catalog/PZOP/PZOPSS1003E.jpg'
      );
      expect(actual).toHaveProperty('rating', 4.2);
    });
    it('Who Speaks for the Ten', async () => {
      const input = 'Who Speaks for the Ten';

      const actual = await current.scenario(input);

      expect(actual).toHaveProperty('scenarioIndex', 23);
    });
    it('Fate of the Fiend', async () => {
      const input = 'Fate of the Fiend';

      const actual = await current.scenario(input);

      expect(actual.backcover).toContain('Years after');
    });
    it('Beacon Below', async () => {
      const input = 'Beacon Below';

      const actual = await current.scenario(input);

      expect(actual).toHaveProperty('seasonIndex', 6);
    });
    it('Lost on the Spirit Road (Coming Soon)', async () => {
      const input = 'Lost on the Spirit Road';

      const actual = await current.scenario(input);

      expect(actual).toEqual(null);
    });
    it('Star-Crossed Voyages', async () => {
      const actual = await current.scenario(testName);

      expect(actual).toHaveProperty('rating', null);
    });
  });
});
