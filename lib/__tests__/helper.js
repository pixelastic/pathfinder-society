import module from '../helper';
import aoinan from 'aoinan';

describe('helper', () => {
  beforeAll(() => {
    module.init('./fixtures');
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

      expect(actual).toContain('Drandle Dreng');
      expect(actual).toContain('Deris Marlinchen');
      expect(actual).toContain('Cassiel Marlinchen');
      expect(actual).toContain('Major Colson Maldris');
      expect(actual).toContain('Grishan Maldris');
      expect(actual).toContain('Tri-Towers Yard'); // This one shouldn't be here ideally...
      expect(actual).toContain('Junia Dacilane');
      expect(actual).toContain('Miranda Dacilane');
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
    });
    it('All the Gods Beyond', async () => {
      const input = 'All the Gods Beyond';

      const actual = await module.scenario(input);

      expect(actual.backcover).toContain('scheme—one');
    });
  });
});
