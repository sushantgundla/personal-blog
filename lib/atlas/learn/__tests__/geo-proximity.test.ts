// @ts-nocheck -- see the note at the top of questions.test.ts: no runner is
// wired into this project yet, but the assertions below are runner-ready.
import { describeMissProximity, missProximityLine } from '../geo-proximity';

describe('describeMissProximity', () => {
  test('a click on a bordering country is "neighbour"', () => {
    expect(describeMissProximity('DEU', ['DEU', 'BEL'], 'Europe', 'Europe')).toBe('neighbour');
  });

  test('a click in the same region, not bordering, is "same-region"', () => {
    expect(describeMissProximity('ESP', ['DEU', 'BEL'], 'Europe', 'Europe')).toBe('same-region');
  });

  test('a click elsewhere entirely is "far"', () => {
    expect(describeMissProximity('AUS', ['DEU', 'BEL'], 'Europe', 'Oceania')).toBe('far');
  });

  test('a neighbour beats a region match when both are true', () => {
    expect(describeMissProximity('BEL', ['BEL'], 'Europe', 'Europe')).toBe('neighbour');
  });

  test('a null region on either side never claims a region match', () => {
    expect(describeMissProximity('XXX', [], null, 'Europe')).toBe('far');
    expect(describeMissProximity('XXX', [], 'Europe', null)).toBe('far');
  });
});

describe('missProximityLine', () => {
  test('names both countries for a neighbour miss', () => {
    const line = missProximityLine('neighbour', 'Belgium', 'France', 'Europe');
    expect(line).toContain('Belgium');
    expect(line).toContain('France');
  });

  test('names the shared region for a same-region miss', () => {
    expect(missProximityLine('same-region', 'Spain', 'France', 'Europe')).toContain('Europe');
  });

  test('never claims a distance or a direction it cannot back up', () => {
    for (const proximity of ['neighbour', 'same-region', 'far'] as const) {
      const line = missProximityLine(proximity, 'Spain', 'France', 'Europe');
      expect(line).not.toMatch(/\d+\s*(km|mi|miles|kilometres)/i);
    }
  });
});
