// Runs against the Firestore emulator: npm run test:rules (needs Java).
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const VALID = { title: 'Summer holiday', date: '2027-07-12', color: 'cc-sky' };

let env;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-daymeadow',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'users/alice/events/e1'), VALID));
});

const as = (uid) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();

describe('ownership', () => {
  it('lets a user read, update and delete their own events', async () => {
    const db = as('alice');
    await assertSucceeds(getDoc(doc(db, 'users/alice/events/e1')));
    await assertSucceeds(updateDoc(doc(db, 'users/alice/events/e1'), { ...VALID, title: 'Renamed' }));
    await assertSucceeds(deleteDoc(doc(db, 'users/alice/events/e1')));
  });

  it("blocks access to another user's events", async () => {
    const db = as('bob');
    await assertFails(getDoc(doc(db, 'users/alice/events/e1')));
    await assertFails(setDoc(doc(db, 'users/alice/events/e2'), VALID));
    await assertFails(deleteDoc(doc(db, 'users/alice/events/e1')));
  });

  it('blocks signed-out access', async () => {
    const db = as(null);
    await assertFails(getDoc(doc(db, 'users/alice/events/e1')));
    await assertFails(setDoc(doc(db, 'users/alice/events/e2'), VALID));
  });

  it('blocks everything outside users/{uid}/events', async () => {
    const db = as('alice');
    await assertFails(setDoc(doc(db, 'users/alice'), { name: 'x' }));
    await assertFails(setDoc(doc(db, 'other/doc'), { a: 1 }));
  });
});

describe('event validation', () => {
  const create = (data) => setDoc(doc(as('alice'), 'users/alice/events/new'), data);

  it('accepts what the app writes, including an empty title', async () => {
    await assertSucceeds(create(VALID));
    await assertSucceeds(create({ ...VALID, title: '' }));
  });

  it('rejects missing or extra fields', async () => {
    await assertFails(create({ date: VALID.date, color: VALID.color }));
    await assertFails(create({ ...VALID, admin: true }));
  });

  it('rejects malformed values', async () => {
    await assertFails(create({ ...VALID, title: 'x'.repeat(101) }));
    await assertFails(create({ ...VALID, title: 42 }));
    await assertFails(create({ ...VALID, date: '12/07/2027' }));
    await assertFails(create({ ...VALID, color: 'red' }));
  });

  it('validates updates too', async () => {
    const ref = doc(as('alice'), 'users/alice/events/e1');
    await assertFails(updateDoc(ref, { color: 'red' }));
    await assertFails(updateDoc(ref, { extra: 1 }));
  });
});
