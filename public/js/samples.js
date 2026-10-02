import { addDays, toISODate } from './dates.js';

// Shown while signed out. Dated relative to today so they are always upcoming,
// spread to show off every countdown style: days, weeks, months and years.
const SAMPLES = [
  // Near term
  { title: 'Payday', inDays: 3, color: 'cc-amber', tags: ['money'] },
  { title: 'Gig at Manchester Apollo', inDays: 9, color: 'cc-lavender', tags: ['music', 'friends'] },
  // Mid term
  { title: 'Fell race in Keswick', inDays: 40, color: 'cc-sage', tags: ['running'] },
  { title: 'Weekend in Whitby', inDays: 75, color: 'cc-sky', tags: ['travel'] },
  { title: "Nana's 90th", inDays: 130, color: 'cc-rose', tags: ['family'] },
  // Long term
  { title: 'Two weeks in Japan', inDays: 220, color: 'cc-mint', tags: ['travel'] },
  { title: 'The wedding', inDays: 500, color: 'cc-cream', tags: ['family'] },
];

export function sampleEvents(now = new Date()) {
  return SAMPLES.map((s, i) => ({
    id: `sample-${i + 1}`,
    title: s.title,
    date: toISODate(addDays(now, s.inDays)),
    color: s.color,
    tags: s.tags,
  }));
}
