import { describe, it, expect } from 'vitest';
import {
  MAX_TAGS,
  MAX_TAG_LENGTH,
  normalizeTag,
  addTag,
  removeTag,
  eventTags,
  collectTags,
  filterByTag,
} from '../../public/js/tags.js';

describe('normalizeTag', () => {
  it('trims, lowercases, strips leading # and collapses spaces', () => {
    expect(normalizeTag('  Travel ')).toBe('travel');
    expect(normalizeTag('#Family')).toBe('family');
    expect(normalizeTag('Day   out')).toBe('day out');
  });

  it(`caps length at ${MAX_TAG_LENGTH}`, () => {
    expect(normalizeTag('x'.repeat(40))).toHaveLength(MAX_TAG_LENGTH);
  });
});

describe('addTag / removeTag', () => {
  it('adds normalised tags and ignores blanks and duplicates', () => {
    let tags = addTag([], 'Travel');
    tags = addTag(tags, 'travel');
    tags = addTag(tags, '  ');
    tags = addTag(tags, '#');
    expect(tags).toEqual(['travel']);
  });

  it(`stops at ${MAX_TAGS} tags`, () => {
    let tags = [];
    for (let i = 0; i < MAX_TAGS + 2; i++) tags = addTag(tags, `t${i}`);
    expect(tags).toHaveLength(MAX_TAGS);
  });

  it('removes a tag', () => {
    expect(removeTag(['a', 'b'], 'a')).toEqual(['b']);
  });
});

describe('eventTags', () => {
  it('treats events saved before tags existed as untagged', () => {
    expect(eventTags({ title: 'Old', date: '2026-01-01', color: 'cc-sky' })).toEqual([]);
  });

  it('ignores malformed values', () => {
    expect(eventTags({ tags: 'travel' })).toEqual([]);
    expect(eventTags({ tags: ['travel', 3, '', null] })).toEqual(['travel']);
  });
});

describe('collectTags / filterByTag', () => {
  const events = [{ id: 'a', tags: ['travel', 'family'] }, { id: 'b', tags: ['travel'] }, { id: 'c' }];

  it('lists each tag in use once, alphabetically', () => {
    expect(collectTags(events)).toEqual(['family', 'travel']);
  });

  it('filters by tag, or returns everything without one', () => {
    expect(filterByTag(events, 'travel').map((e) => e.id)).toEqual(['a', 'b']);
    expect(filterByTag(events, 'family').map((e) => e.id)).toEqual(['a']);
    expect(filterByTag(events, null)).toBe(events);
  });
});
