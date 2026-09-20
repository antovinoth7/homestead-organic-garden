import {
  buildLocation,
  locationKey,
  parseLocation,
} from '../../utils/locationHelpers';

describe('parseLocation', () => {
  it('splits "Parent - Child"', () => {
    expect(parseLocation('Home farm - Bed 3')).toEqual({ parent: 'Home farm', child: 'Bed 3' });
  });

  it('keeps everything after the first separator as the child', () => {
    expect(parseLocation('Home farm - North - Bed 3')).toEqual({
      parent: 'Home farm',
      child: 'North - Bed 3',
    });
  });

  it('treats a bare name as a parent with no child', () => {
    expect(parseLocation('Home farm')).toEqual({ parent: 'Home farm', child: '' });
  });

  it('trims surrounding whitespace on both parts', () => {
    expect(parseLocation('  Home farm  -  Bed 3  ')).toEqual({
      parent: 'Home farm',
      child: 'Bed 3',
    });
  });

  it.each([
    ['empty string', ''],
    ['null', null],
    ['undefined', undefined],
  ])('returns empty parts for %s', (_label, value) => {
    expect(parseLocation(value)).toEqual({ parent: '', child: '' });
  });
});

describe('buildLocation', () => {
  it('joins both parts', () => {
    expect(buildLocation('Home farm', 'Bed 3')).toBe('Home farm - Bed 3');
  });

  it('emits whichever part is present when the other is empty', () => {
    expect(buildLocation('Home farm', '')).toBe('Home farm');
    expect(buildLocation('', 'Bed 3')).toBe('Bed 3');
    expect(buildLocation('', '')).toBe('');
  });

  it('round-trips a child containing the separator', () => {
    const original = 'Home farm - North - Bed 3';
    const { parent, child } = parseLocation(original);
    expect(buildLocation(parent, child)).toBe(original);
  });
});

describe('locationKey', () => {
  it('is case- and whitespace-insensitive', () => {
    expect(locationKey('  Home Farm ')).toBe(locationKey('home farm'));
  });

  it('maps blank values to an empty key', () => {
    expect(locationKey(null)).toBe('');
    expect(locationKey(undefined)).toBe('');
    expect(locationKey('   ')).toBe('');
  });
});
