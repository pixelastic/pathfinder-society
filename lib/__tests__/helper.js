import module from '../helper';
import aoinan from 'aoinan';
import firost from 'firost';

describe('helper', () => {
  beforeEach(() => {
    module.init('./fixtures');
  });
  describe('allLocations', () => {
    beforeEach(() => {
      firost.cache.clear(module.locationCacheKey);
    });
    afterEach(() => {
      firost.cache.clear(module.locationCacheKey);
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
      jest.spyOn(module, '__data').mockReturnValue(mockData);

      const actual = module.allLocations();
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
      jest.spyOn(module, '__data').mockReturnValue(mockData);

      module.allLocations();
      module.allLocations();
      expect(module.__data).toHaveBeenCalledTimes(1);
    });
  });
  describe('url', () => {
    it('should return the whole url on the wiki', () => {
      const input = 'Among the Living';

      const actual = module.url(input);

      expect(actual).toEqual(
        'https://pathfinderwiki.com/wiki/Among_the_Living'
      );
    });
  });
  describe('infobox', () => {
    it('Black Waters', async () => {
      const input = await aoinan.page('Black Waters');

      const actual = module.infobox(input);

      expect(actual).toHaveProperty('binding', 'PDF');
    });
  });
  describe('authors', () => {
    describe('several numbered authors', () => {
      it('should create an array of them', () => {
        jest
          .spyOn(module, 'infobox')
          .mockReturnValue({ author1: 'foo', author2: 'bar' });

        const actual = module.authors();

        expect(actual).toEqual(['foo', 'bar']);
      });
      it('should exclude the author key', () => {
        jest.spyOn(module, 'infobox').mockReturnValue({
          author: 'foo and bar',
          author1: 'foo',
          author2: 'bar',
        });

        const actual = module.authors();

        expect(actual).toEqual(['foo', 'bar']);
      });
    });
  });
  describe('levels', () => {
    it('Black Waters: 1-5', async () => {
      const input = await aoinan.page('Black Waters');

      const actual = module.levels(input);

      expect(actual).toHaveProperty('min', 1);
      expect(actual).toHaveProperty('max', 5);
    });
  });
  describe('locations', () => {
    it('Black Waters', async () => {
      const input = await aoinan.page('Black Waters');

      const actual = module.locations(input);

      expect(actual).toContain('Precipice Quarter');
      expect(actual).toContain('Absalom');
      expect(actual).toContain('Drownyard');
    });
  });
  describe('npcs', () => {
    it('Black Waters', async () => {
      const input = await aoinan.page('Black Waters');

      const actual = module.npcs(input);

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

      const actual = module.npcs(input);

      expect(actual).toContain('Venture-Captain Ambrus Valson');
      expect(actual).toContain('Dremdhet Salhar');
      expect(actual).toContain('Pickled Imp');
      expect(actual).not.toContain('Ascendant Court');
      expect(actual).not.toContain('Ivy District');
      expect(actual).not.toContain('Absalom');
    });
    it('Fingerprints of the Fiend', async () => {
      const input = await aoinan.page('Fingerprints of the Fiend');

      const actual = module.npcs(input);

      expect(actual).toContain('Haliduras Karn');
    });
    it('The Absalom Initiation', async () => {
      const input = await aoinan.page('The Absalom Initiation');

      const actual = module.npcs(input);

      expect(actual).toEqual([]);
    });
    it('A Vision of Betrayal', async () => {
      const input = await aoinan.page('A Vision of Betrayal');

      const actual = module.npcs(input);

      expect(actual).not.toContain('* Absalom');
      expect(actual).not.toContain('Absalom');
      expect(actual).not.toContain('The Siphons');
    });
  });
  describe('price', () => {
    it('PDF: $3.99', () => {
      const input = 'PDF: $3.99';
      const expected = 3.99;

      jest.spyOn(module, 'infobox').mockReturnValue({ price: input });
      const actual = module.price();

      expect(actual).toEqual(expected);
    });
    it('PDF: Free', () => {
      const input = 'PDF: Free';
      const expected = 0;

      jest.spyOn(module, 'infobox').mockReturnValue({ price: input });
      const actual = module.price();

      expect(actual).toEqual(expected);
    });
  });
  describe('backcover', () => {
    it('Black Waters', async () => {
      const input = await aoinan.page('Black Waters');

      const actual = module.backcover(input);

      expect(actual).toMatch(/^The Pathfinder Society/);
    });
    it('Ruins of Bonekeep Level 3: The Wakening Tomb', async () => {
      const input = await aoinan.page(
        'Ruins of Bonekeep Level 3: The Wakening Tomb'
      );

      const actual = module.backcover(input);

      expect(actual).toEqual('');
    });
    it('All the Gods Beyond', async () => {
      const input = await aoinan.page('All the Gods Beyond');

      const actual = module.backcover(input);

      expect(actual).toContain('scheme—one');
    });
  });
  describe('scenarioIndex', () => {
    it('Pathfinder Society Scenario #6: Black Waters', () => {
      const input = 'Pathfinder Society Scenario #6: Black Waters';
      const expected = 6;

      jest.spyOn(module, 'infobox').mockReturnValue({ title: input });
      const actual = module.scenarioIndex();

      expect(actual).toEqual(expected);
    });
    it('Pathfinder Society Scenario #0-05: Mists of Mwangi', () => {
      const input = 'Pathfinder Society Scenario #0-05: Mists of Mwangi';
      const expected = 5;

      jest.spyOn(module, 'infobox').mockReturnValue({ title: input });
      const actual = module.scenarioIndex();

      expect(actual).toEqual(expected);
    });
    it('Pathfinder Society Scenario #3-SP: Blood Under Absalom', () => {
      const input = 'Pathfinder Society Scenario #3-SP: Blood Under Absalom';
      const expected = -1;

      jest.spyOn(module, 'infobox').mockReturnValue({ title: input });
      const actual = module.scenarioIndex();

      expect(actual).toEqual(expected);
    });
    it('Pathfinder Society Scenario Intro 1: First Steps, Part I: In Service to Lore', () => {
      const input =
        'Pathfinder Society Scenario Intro 1: First Steps, Part I: In Service to Lore';
      const expected = -1;

      jest.spyOn(module, 'infobox').mockReturnValue({ title: input });
      const actual = module.scenarioIndex();

      expect(actual).toEqual(expected);
    });
  });
  describe('scenario', () => {
    it('Black Waters', async () => {
      const input = 'Black Waters';

      const actual = await module.scenario(input);

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
      expect(actual).toHaveProperty('scenarioIndex', 6);
      expect(actual.backcover).toMatch(/^The Pathfinder Society/);
      expect(actual).toHaveProperty('levels.min', 1);
      expect(actual).toHaveProperty('levels.max', 5);
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
    });
    it('Blood Under Absalom', async () => {
      const input = 'Blood Under Absalom';

      const actual = await module.scenario(input);

      expect(actual).toHaveProperty('scenarioIndex', -1);
    });
    it('In Service to Lore', async () => {
      const input = 'In Service to Lore';

      const actual = await module.scenario(input);

      expect(actual).toHaveProperty('scenarioIndex', -1);
    });
    it('Ruins of Bonekeep Level 3: The Wakening Tomb', async () => {
      const input = 'Ruins of Bonekeep Level 3: The Wakening Tomb';

      const actual = await module.scenario(input);

      expect(actual).toHaveProperty('backcover', '');
    });
    it('A Vision of Betrayal', async () => {
      const input = 'A Vision of Betrayal';

      const actual = await module.scenario(input);

      expect(actual).toHaveProperty('price', 0);
      expect(actual.npcs).not.toContain('* Absalom');
      expect(actual.npcs).not.toContain('Absalom');
      expect(actual.npcs).not.toContain('The Siphons');
    });
    it('All the Gods Beyond', async () => {
      const input = 'All the Gods Beyond';

      const actual = await module.scenario(input);

      expect(actual.backcover).toContain('scheme—one');
    });
    it('Fingerprints of the Fiend', async () => {
      const input = 'Fingerprints of the Fiend';

      const actual = await module.scenario(input);

      expect(actual.npcs).toContain('Haliduras Karn');
    });
    it('The Absalom Initiation', async () => {
      const input = 'The Absalom Initiation';

      const actual = await module.scenario(input);

      expect(actual).toHaveProperty('npcs', []);
    });
  });
});
