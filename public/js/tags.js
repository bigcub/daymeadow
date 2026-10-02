// Pure tag helpers. Limits must match isValidTags in firestore.rules.

export const MAX_TAGS = 5;
export const MAX_TAG_LENGTH = 24;

export function normalizeTag(raw) {
  return String(raw).trim().replace(/^#+/, '').replace(/\s+/g, ' ').toLowerCase().slice(0, MAX_TAG_LENGTH).trim();
}

export function addTag(tags, raw) {
  const tag = normalizeTag(raw);
  if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return tags;
  return [...tags, tag];
}

export function removeTag(tags, tag) {
  return tags.filter((t) => t !== tag);
}

// Events saved before tags existed have no tags field.
export function eventTags(event) {
  return Array.isArray(event.tags) ? event.tags.filter((t) => typeof t === 'string' && t) : [];
}

export function collectTags(events) {
  return [...new Set(events.flatMap(eventTags))].sort();
}

export function filterByTag(events, tag) {
  return tag ? events.filter((e) => eventTags(e).includes(tag)) : events;
}
