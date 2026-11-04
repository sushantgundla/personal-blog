// @ts-nocheck -- describe/test/expect come from lib/atlas/__tests__/globals.mjs
// at run time (npm run atlas:test) and have no type declarations here.
import { CAPITAL_TIMEZONES, capitalTimezone } from '../capital-timezones';
import { BY_ISO3, ISO_COUNTRIES } from '../iso-countries';

/** The four with no capital city at all — see the file header. */
const NO_CAPITAL = ['ATA', 'BVT', 'HMD', 'UMI'];

describe('CAPITAL_TIMEZONES', () => {
  test('every zone name is one the IANA database (via Intl) accepts', () => {
    const invalid: string[] = [];
    for (const [iso3, zone] of Object.entries(CAPITAL_TIMEZONES)) {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: zone });
      } catch {
        invalid.push(`${iso3}: ${zone}`);
      }
    }
    expect(invalid).toEqual([]);
  });

  test('covers every country in the ISO table except the four with no capital', () => {
    const missing = ISO_COUNTRIES.map((c) => c.iso3).filter((iso3) => !CAPITAL_TIMEZONES[iso3]);
    expect(missing.sort()).toEqual([...NO_CAPITAL].sort());
  });

  test('has no key the ISO table does not know', () => {
    const unknown = Object.keys(CAPITAL_TIMEZONES).filter((iso3) => !BY_ISO3[iso3]);
    expect(unknown).toEqual([]);
  });

  test('keeps the half- and quarter-hour capitals the longitude guess got wrong', () => {
    const offsetOn = (zone: string) =>
      new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'shortOffset' })
        .formatToParts(new Date('2026-01-15T12:00:00Z'))
        .find((p) => p.type === 'timeZoneName')?.value;
    expect(offsetOn(CAPITAL_TIMEZONES.IND)).toBe('GMT+5:30');
    expect(offsetOn(CAPITAL_TIMEZONES.NPL)).toBe('GMT+5:45');
    expect(offsetOn(CAPITAL_TIMEZONES.AFG)).toBe('GMT+4:30');
  });
});

describe('capitalTimezone', () => {
  test('is case-insensitive, because dossier URLs are lowercase', () => {
    expect(capitalTimezone('ind')).toBe('Asia/Kolkata');
    expect(capitalTimezone('IND')).toBe('Asia/Kolkata');
  });

  test('returns null for empty, missing and capital-less codes', () => {
    expect(capitalTimezone(null)).toBeNull();
    expect(capitalTimezone(undefined)).toBeNull();
    expect(capitalTimezone('')).toBeNull();
    expect(capitalTimezone('ATA')).toBeNull();
    expect(capitalTimezone('ZZZ')).toBeNull();
  });
});
