// Firebase wiring. On localhost the app talks to the local emulators under a
// demo project, so development can never read or write live data.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {
  getAuth,
  connectAuthEmulator,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import {
  getAnalytics,
  isSupported as analyticsSupported,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js';

const LIVE_CONFIG = {
  apiKey: 'AIzaSyBDA_fUZyx0oC5ZKpNJ3ZThOSXQImnhvOk',
  authDomain: 'daymeadow-55cc0.firebaseapp.com',
  projectId: 'daymeadow-55cc0',
  storageBucket: 'daymeadow-55cc0.firebasestorage.app',
  messagingSenderId: '991701305214',
  appId: '1:991701305214:web:7ab2de77a683c41fea552f',
  measurementId: 'G-6XFMKDNW2Z',
};

// Must match the project the emulators run under (see package.json scripts).
const DEMO_CONFIG = { apiKey: 'demo-key', authDomain: 'localhost', projectId: 'demo-daymeadow' };

export const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);

const app = initializeApp(isLocal ? DEMO_CONFIG : LIVE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

if (isLocal) {
  connectAuthEmulator(auth, `http://${location.hostname}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, location.hostname, 8080);
} else {
  analyticsSupported().then((ok) => ok && getAnalytics(app));
}

const provider = new GoogleAuthProvider();

// Only these fields are stored; firestore.rules rejects anything else.
// Untagged events keep the original { title, date, color } shape.
function toDoc({ title, date, color, tags = [] }) {
  return tags.length ? { title, date, color, tags } : { title, date, color };
}

function eventsCol(uid) {
  return collection(db, 'users', uid, 'events');
}

function eventDoc(uid, id) {
  return doc(db, 'users', uid, 'events', id);
}

export function signIn() {
  return signInWithPopup(auth, provider);
}

export function signOut() {
  return fbSignOut(auth);
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// Streams the user's events; returns an unsubscribe function.
export function watchEvents(uid, onChange, onError) {
  return onSnapshot(eventsCol(uid), (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);
}

export function addEvent(uid, data) {
  return addDoc(eventsCol(uid), toDoc(data));
}

export function updateEvent(uid, id, data) {
  // Clear tags explicitly; updateDoc would otherwise keep the old ones.
  return updateDoc(eventDoc(uid, id), { tags: deleteField(), ...toDoc(data) });
}

export function deleteEvent(uid, id) {
  return deleteDoc(eventDoc(uid, id));
}
