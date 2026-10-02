import { describe, it, expect } from 'vitest';
import { sampleEvents } from '../../public/js/samples.js';
import { daysDiff } from '../../public/js/dates.js';
import { addTag, collectTags } from '../../public/js/tags.js';

const COLORS = ['cc-cream', 'cc-sage', 'cc-sky', 'cc-rose', 'cc-lavender', 'cc-amber', 'cc-slate', 'cc-mint'];

// Includes year ends, a leap day and DST changes.
const DATES = [
  new Date(2026, 9, 2, 15, 30),
  new Date(2026, 11, 25, 9, 0),
  new Date(2026, 11, 31, 23, 59),
  new Date(2028, 1, 29, 12, 0),
  new Date(2027, 2, 28, 1, 30),
];

describe.each(DATES)('sampleEvents on %s', (now) => {
  const events = sampleEvents(now);

  it('are all in the future', () => {
    for (const ev of events) expect(daysDiff(ev.date, now)).toBeGreaterThan(0);
  });

  it('cover near, mid and long term', () => {
    const diffs = events.map((ev) => daysDiff(ev.date, now));
    expect(diffs.filter((d) => d <= 14).length).toBeGreaterThanOrEqual(2);
    expect(diffs.filter((d) => d > 14 && d < 180).length).toBeGreaterThanOrEqual(2);
    expect(diffs.filter((d) => d >= 180).length).toBeGreaterThanOrEqual(2);
  });

  it('have normalised tags, with several in use to show off filtering', () => {
    for (const ev of events) expect(ev.tags.reduce(addTag, [])).toEqual(ev.tags);
    expect(collectTags(events).length).toBeGreaterThanOrEqual(3);
  });

  it('have unique ids, titles and valid colours', () => {
    expect(new Set(events.map((e) => e.id)).size).toBe(events.length);
    expect(events.every((e) => e.title && COLORS.includes(e.color))).toBe(true);
    expect(events.every((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date))).toBe(true);
  });
});
