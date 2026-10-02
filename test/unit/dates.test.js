import { describe, it, expect } from 'vitest';
import {
  ordinal,
  fmtDate,
  toISODate,
  isValidISODate,
  addDays,
  daysDiff,
  buildCountdown,
  sortEvents,
} from '../../public/js/dates.js';

const NOW = new Date(2026, 9, 2, 15, 30); // 2 Oct 2026, mid-afternoon local time

describe('ordinal', () => {
  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
    [11, '11th'],
    [12, '12th'],
    [13, '13th'],
    [21, '21st'],
    [22, '22nd'],
    [31, '31st'],
  ])('%i -> %s', (n, expected) => expect(ordinal(n)).toBe(expected));
});

describe('fmtDate', () => {
  it('formats an ISO date without timezone drift', () => {
    expect(fmtDate('2026-01-01')).toBe('January 1st, 2026');
    expect(fmtDate('2026-12-31')).toBe('December 31st, 2026');
  });
});

describe('toISODate / addDays', () => {
  it('round-trips local dates', () => {
    expect(toISODate(NOW)).toBe('2026-10-02');
    expect(toISODate(addDays(NOW, 30))).toBe('2026-11-01');
    expect(toISODate(addDays(NOW, -2))).toBe('2026-09-30');
  });
});

describe('daysDiff', () => {
  it('counts whole days ignoring the time of day', () => {
    expect(daysDiff('2026-10-02', NOW)).toBe(0);
    expect(daysDiff('2026-10-03', NOW)).toBe(1);
    expect(daysDiff('2026-10-01', NOW)).toBe(-1);
  });

  it('is not thrown off by a DST change', () => {
    // Spans the late-October clock change in Europe and the early-November one in the US.
    expect(daysDiff('2026-11-15', NOW)).toBe(44);
  });
});

describe('buildCountdown', () => {
  const cd = (date) => buildCountdown(date, NOW);

  it('handles today and the past', () => {
    expect(cd('2026-10-02')).toEqual({ num: '—', unit: 'today' });
    expect(cd('2026-10-01')).toEqual({ num: 1, unit: 'day ago' });
    expect(cd('2026-09-25')).toEqual({ num: 7, unit: 'days ago' });
  });

  it('uses days up to two weeks', () => {
    expect(cd('2026-10-03')).toEqual({ num: 1, unit: 'day' });
    expect(cd('2026-10-16')).toEqual({ num: 14, unit: 'days' });
  });

  it('uses weeks (plus days) up to 89 days', () => {
    expect(cd('2026-10-23')).toEqual({ num: 3, unit: 'weeks' });
    expect(cd('2026-10-24')).toEqual({ num: 3, unit: 'weeks + 1 day' });
  });

  it('uses months then years', () => {
    expect(cd('2027-03-02')).toEqual({ num: 5, unit: 'months' });
    expect(cd('2027-10-02')).toEqual({ num: '1.0', unit: 'year' });
    expect(cd('2028-10-02')).toEqual({ num: '2.0', unit: 'years' });
  });
});

describe('sortEvents', () => {
  it('puts upcoming events first (soonest first), then past (most recent first)', () => {
    const events = [
      { id: 'far', date: '2027-01-01' },
      { id: 'old', date: '2026-01-01' },
      { id: 'soon', date: '2026-10-05' },
      { id: 'recent', date: '2026-09-30' },
      { id: 'today', date: '2026-10-02' },
    ];
    expect(sortEvents(events, NOW).map((e) => e.id)).toEqual(['today', 'soon', 'far', 'recent', 'old']);
  });

  it('does not mutate its input', () => {
    const events = [{ date: '2027-01-01' }, { date: '2026-10-05' }];
    sortEvents(events, NOW);
    expect(events[0].date).toBe('2027-01-01');
  });
});

describe('isValidISODate', () => {
  it('accepts real dates with four-digit years', () => {
    expect(isValidISODate('2026-10-02')).toBe(true);
    expect(isValidISODate('2028-02-29')).toBe(true);
    expect(isValidISODate('9999-12-31')).toBe(true);
  });

  it('rejects years that are not four digits', () => {
    expect(isValidISODate('202677-01-05')).toBe(false);
    expect(isValidISODate('0026-01-05')).toBe(false);
    expect(isValidISODate('0999-01-05')).toBe(false);
  });

  it('rejects impossible or malformed dates', () => {
    expect(isValidISODate('2027-02-29')).toBe(false);
    expect(isValidISODate('2026-13-01')).toBe(false);
    expect(isValidISODate('2026-1-5')).toBe(false);
    expect(isValidISODate('')).toBe(false);
  });
});
