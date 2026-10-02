import { MONTHS, WEEKDAYS, ordinal, fmtDate, toISODate, addDays, buildCountdown, sortEvents } from './dates.js';
import * as fb from './firebase.js';

const $ = (id) => document.getElementById(id);

const COLORS = ['cc-cream', 'cc-sage', 'cc-sky', 'cc-rose', 'cc-lavender', 'cc-amber', 'cc-slate', 'cc-mint'];

// ── State ──────────────────────────────────────────────────────────────────
let events = [];
let editingId = null;
let selectedColor = 'cc-cream';
let pendingDeleteId = null;
let currentUser = null;
let currentView = 'meadow';
let unwatchEvents = null;
let bannerDismissed = false;

// Shown while signed out; dated relative to today so they never go stale.
function sampleEvents(now = new Date()) {
  const inDays = (n) => toISODate(addDays(now, n));
  const nextAnnual = (month, day) => {
    const thisYear = new Date(now.getFullYear(), month - 1, day);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return toISODate(thisYear >= today ? thisYear : new Date(now.getFullYear() + 1, month - 1, day));
  };
  return [
    { id: 's1', title: 'Project deadline', date: inDays(6), color: 'cc-cream' },
    { id: 's2', title: "Mum's birthday", date: inDays(19), color: 'cc-rose' },
    { id: 's3', title: 'Half marathon', date: inDays(52), color: 'cc-sage' },
    { id: 's4', title: 'Summer holiday', date: inDays(130), color: 'cc-sky' },
    { id: 's5', title: 'Christmas', date: nextAnnual(12, 25), color: 'cc-amber' },
    { id: 's6', title: "New Year's Eve", date: nextAnnual(12, 31), color: 'cc-lavender' },
  ];
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Today card ─────────────────────────────────────────────────────────────
function renderToday() {
  const now = new Date();
  $('today-date').textContent = `${MONTHS[now.getMonth()]} ${ordinal(now.getDate())}`;
  $('today-weekday').textContent = `${WEEKDAYS[now.getDay()]}, ${now.getFullYear()}`;
  $('today-tz').textContent = Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' ');
}

// ── Grid ───────────────────────────────────────────────────────────────────
const EDIT_ICON = `<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 2L12 4.5 4.5 12H2V9.5L9.5 2Z"/></svg>`;
const DELETE_ICON = `<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg>`;

function renderGrid() {
  const grid = $('grid');
  grid.querySelectorAll('.ev-card, .card-add').forEach((el) => el.remove());

  for (const ev of sortEvents(events)) {
    const cd = buildCountdown(ev.date);
    const color = COLORS.includes(ev.color) ? ev.color : 'cc-cream';
    const card = document.createElement('div');
    card.className = `card ev-card ${color}`;
    card.dataset.id = ev.id;
    card.innerHTML = `
      <div class="card-eyebrow">${esc(fmtDate(ev.date))}</div>
      <div class="card-mid">
        <div class="countdown-num">${esc(cd.num)}</div>
        <div class="countdown-unit">${esc(cd.unit)}</div>
      </div>
      <div class="card-bottom">
        <div class="card-title-text">${esc(ev.title || fmtDate(ev.date))}</div>
        <div class="card-controls">
          <button class="btn-icon" data-action="edit" title="Edit" aria-label="Edit event">${EDIT_ICON}</button>
          <button class="btn-icon" data-action="delete" title="Delete" aria-label="Delete event">${DELETE_ICON}</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  }

  const addCard = document.createElement('button');
  addCard.className = 'card card-add';
  addCard.dataset.action = 'new';
  addCard.setAttribute('aria-label', 'Add new event');
  addCard.innerHTML = `<div class="add-icon">+</div><div class="add-label">New event</div>`;
  grid.appendChild(addCard);

  if (currentView === 'calendar') renderCalendar();
}

function setEvents(next) {
  events = next;
  renderGrid();
}

// ── Theme ──────────────────────────────────────────────────────────────────
// The saved theme is applied by an inline script in <head> to avoid a flash.
function syncThemeButton() {
  const dark = document.documentElement.dataset.theme === 'dark';
  $('theme-toggle').textContent = dark ? '🌙' : '☀️';
}

function toggleTheme() {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // Storage unavailable (private mode); the theme still applies for this visit.
  }
  syncThemeButton();
}

// ── Modal ──────────────────────────────────────────────────────────────────
function openModal(id = null) {
  const ev = id && events.find((e) => e.id === id);
  editingId = ev ? id : null;
  $('modal-title').textContent = ev ? 'Edit event' : 'New event';
  $('inp-title').value = ev ? ev.title : '';
  $('inp-date').value = ev ? ev.date : '';
  setColor(ev ? ev.color : 'cc-cream');
  $('overlay').classList.add('open');
  setTimeout(() => $('inp-title').focus(), 80);
}

function closeModal() {
  $('overlay').classList.remove('open');
  editingId = null;
}

function setColor(cc) {
  selectedColor = COLORS.includes(cc) ? cc : 'cc-cream';
  document.querySelectorAll('.swatch').forEach((s) => {
    const active = s.dataset.cc === selectedColor;
    s.classList.toggle('active', active);
    s.setAttribute('aria-checked', String(active));
  });
}

async function saveEvent() {
  const title = $('inp-title').value.trim();
  const date = $('inp-date').value;
  const dateInput = $('inp-date');

  if (!date) {
    dateInput.focus();
    dateInput.style.borderColor = '#e06060';
    setTimeout(() => (dateInput.style.borderColor = ''), 1400);
    return;
  }

  const data = { title, date, color: selectedColor };
  const editing = editingId;

  if (currentUser) {
    // The Firestore listener re-renders with the change.
    try {
      if (editing) await fb.updateEvent(currentUser.uid, editing, data);
      else await fb.addEvent(currentUser.uid, data);
    } catch (err) {
      console.error('Save error:', err);
      showToast('Failed to save. Please try again.');
      return;
    }
  } else if (editing) {
    setEvents(events.map((e) => (e.id === editing ? { ...e, ...data } : e)));
  } else {
    setEvents([...events, { id: `local-${Date.now()}`, ...data }]);
  }

  showToast(editing ? 'Event updated' : 'Event added');
  closeModal();
}

// ── Delete confirm ─────────────────────────────────────────────────────────
function askDelete(id) {
  pendingDeleteId = id;
  $('confirm-overlay').classList.add('open');
}

function closeConfirm() {
  pendingDeleteId = null;
  $('confirm-overlay').classList.remove('open');
}

async function confirmDelete() {
  const id = pendingDeleteId;
  if (id === null) return;
  closeConfirm();

  if (currentUser) {
    try {
      await fb.deleteEvent(currentUser.uid, id);
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to remove. Please try again.');
      return;
    }
  } else {
    setEvents(events.filter((e) => e.id !== id));
  }
  showToast('Event removed');
}

// ── Toast ──────────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// ── View toggle ────────────────────────────────────────────────────────────
function switchView(view) {
  currentView = view;
  document.querySelectorAll('.view-toggle button').forEach((b) => {
    const active = b.dataset.view === view;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', String(active));
  });
  $('meadow-view').classList.toggle('active', view === 'meadow');
  $('calendar-view').classList.toggle('active', view === 'calendar');
  if (view === 'calendar') renderCalendar();
}

// ── Calendar ───────────────────────────────────────────────────────────────
const WDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderCalendar() {
  const container = $('calendar-view');
  container.replaceChildren();

  const now = new Date();
  const todayStr = toISODate(now);

  const eventsByDate = new Map();
  for (const ev of events) {
    if (!eventsByDate.has(ev.date)) eventsByDate.set(ev.date, []);
    eventsByDate.get(ev.date).push(ev);
  }

  // Current month through the last event's month (at least 4 months).
  const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
  let endMonth = new Date(now.getFullYear(), now.getMonth() + 3, 1);
  for (const ev of events) {
    const [y, m] = ev.date.split('-').map(Number);
    const evMonth = new Date(y, m - 1, 1);
    if (evMonth > endMonth) endMonth = evMonth;
  }

  while (cursor <= endMonth) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

    const monthEl = el('div', 'cal-month');
    monthEl.appendChild(el('div', 'cal-month-header', `${MONTHS[month]} ${year}`));

    const weekdaysEl = el('div', 'cal-weekdays');
    for (const label of WDAY_LABELS) weekdaysEl.appendChild(el('div', 'cal-weekday-label', label));
    monthEl.appendChild(weekdaysEl);

    const daysEl = el('div', 'cal-days');
    for (let i = 0; i < firstDay; i++) daysEl.appendChild(el('div', 'cal-day cal-day-empty'));

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = toISODate(new Date(year, month, d));
      const dayEl = el('div', 'cal-day');
      if (dateStr < todayStr) dayEl.classList.add('cal-past');
      else if (dateStr === todayStr) dayEl.classList.add('cal-today');
      dayEl.appendChild(el('div', 'cal-day-num', d));

      for (const ev of eventsByDate.get(dateStr) ?? []) {
        const cd = buildCountdown(ev.date);
        const color = COLORS.includes(ev.color) ? ev.color : 'cc-cream';
        const dotWrap = el('button', 'cal-event-dot');
        dotWrap.dataset.action = 'edit';
        dotWrap.dataset.id = ev.id;
        dotWrap.appendChild(el('div', `cal-dot cal-dot-${color.slice(3)}`));
        dotWrap.appendChild(el('div', 'cal-event-title', ev.title || fmtDate(ev.date)));
        dotWrap.appendChild(el('div', 'cal-tooltip', cd.num === '—' ? 'Today' : `${cd.num} ${cd.unit}`));
        dayEl.appendChild(dotWrap);
      }

      daysEl.appendChild(dayEl);
    }

    monthEl.appendChild(daysEl);
    container.appendChild(monthEl);
    cursor.setMonth(cursor.getMonth() + 1);
  }
}

// ── Auth ───────────────────────────────────────────────────────────────────
async function signIn() {
  try {
    await fb.signIn();
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      console.error('Sign-in error:', err);
      showToast('Sign-in failed. Please try again.');
    }
  }
}

async function signOut() {
  try {
    await fb.signOut();
    showToast('Signed out');
  } catch (err) {
    console.error('Sign-out error:', err);
  }
}

function showSignedIn(user) {
  $('signin-banner').hidden = true;
  $('header-signin').hidden = true;
  $('header-user').hidden = false;
  $('header-signout').hidden = false;
  $('user-name').textContent = user.displayName || user.email;
  $('user-avatar').src = user.photoURL || '';
  $('user-avatar').hidden = !user.photoURL;
}

function showSignedOut() {
  $('signin-banner').hidden = bannerDismissed;
  $('header-signin').hidden = false;
  $('header-user').hidden = true;
  $('header-signout').hidden = true;
}

// Grid rendering waits for the first auth callback to avoid a flash of sample events.
fb.watchAuth((user) => {
  unwatchEvents?.();
  unwatchEvents = null;
  currentUser = user;

  if (user) {
    showSignedIn(user);
    unwatchEvents = fb.watchEvents(user.uid, setEvents, (err) => {
      console.error('Failed to load events:', err);
      showToast('Could not load your events.');
    });
  } else {
    showSignedOut();
    setEvents(sampleEvents());
  }
});

// ── Wiring ─────────────────────────────────────────────────────────────────
const ACTIONS = {
  'sign-in': signIn,
  'sign-out': signOut,
  'dismiss-banner': () => {
    bannerDismissed = true;
    $('signin-banner').hidden = true;
  },
  'toggle-theme': toggleTheme,
  view: (target) => switchView(target.dataset.view),
  new: () => openModal(),
  edit: (target) => openModal(target.closest('[data-id]').dataset.id),
  delete: (target) => askDelete(target.closest('[data-id]').dataset.id),
  'close-modal': closeModal,
  'save-event': saveEvent,
  'pick-color': (target) => setColor(target.dataset.cc),
  'close-confirm': closeConfirm,
  'confirm-delete': confirmDelete,
};

document.addEventListener('click', (e) => {
  // Clicking the dimmed backdrop closes the dialog.
  if (e.target === $('overlay')) return closeModal();
  if (e.target === $('confirm-overlay')) return closeConfirm();

  const target = e.target.closest('[data-action]');
  if (target) ACTIONS[target.dataset.action]?.(target);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeConfirm();
    return;
  }
  if (e.key?.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if ($('overlay').classList.contains('open') || $('confirm-overlay').classList.contains('open')) return;
    e.preventDefault();
    openModal();
  }
});

// ── Init ───────────────────────────────────────────────────────────────────
syncThemeButton();
renderToday();

// Refresh countdowns at local midnight.
(function scheduleMidnightRefresh() {
  const now = new Date();
  const ms = addDays(now, 1) - now;
  setTimeout(() => {
    renderToday();
    renderGrid();
    scheduleMidnightRefresh();
  }, ms);
})();
