import { demoPlaylists } from './helpers.js';

const SESSION_KEY = 'educast_session_v1';
const REG_KEY = 'educast_register_draft_v1';
const LOCAL_TRACKS_KEY = 'educast_local_tracks_v1';
const API_BASE_KEY = 'educast_api_base_v1';
const SAVED_IDS_KEY = 'educast_saved_ids_v2';
const SUBSCRIPTIONS_KEY = 'educast_subscriptions_v1';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readSessionJson(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeSessionJson(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function loadSession() {
  return readJson(SESSION_KEY, null);
}

export function saveSession(session) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  writeJson(SESSION_KEY, session);
}

export function loadRegistrationDraft() {
  return readSessionJson(REG_KEY, null);
}

export function saveRegistrationDraft(draft) {
  if (!draft) {
    sessionStorage.removeItem(REG_KEY);
    return;
  }
  writeSessionJson(REG_KEY, draft);
}

export function clearRegistrationDraft() {
  sessionStorage.removeItem(REG_KEY);
}

export function loadLocalTracks() {
  return readSessionJson(LOCAL_TRACKS_KEY, []);
}

export function saveLocalTracks(tracks) {
  writeSessionJson(LOCAL_TRACKS_KEY, Array.isArray(tracks) ? tracks : []);
}

export function addLocalTrack(track) {
  const tracks = loadLocalTracks();
  tracks.unshift(track);
  saveLocalTracks(tracks);
  return tracks;
}

export function clearLocalTracks() {
  sessionStorage.removeItem(LOCAL_TRACKS_KEY);
}

export function loadApiBase() {
  return localStorage.getItem(API_BASE_KEY) || '';
}

export function saveApiBase(value) {
  if (!value) {
    localStorage.removeItem(API_BASE_KEY);
    return;
  }
  localStorage.setItem(API_BASE_KEY, value);
}

export function loadSavedIds() {
  return readJson(SAVED_IDS_KEY, []);
}

export function saveSavedIds(ids) {
  writeJson(SAVED_IDS_KEY, Array.isArray(ids) ? [...new Set(ids.map(String))] : []);
}

export function loadSubscriptions() {
  return readJson(SUBSCRIPTIONS_KEY, []);
}

export function saveSubscriptions(items) {
  writeJson(SUBSCRIPTIONS_KEY, Array.isArray(items) ? [...new Set(items.map(String))] : []);
}

function routeName(pathname) {
  if (pathname === '/') return 'home';
  if (pathname === '/start') return 'start';
  if (pathname === '/search') return 'search';
  if (pathname === '/login') return 'login';
  if (pathname === '/register') return 'register';
  if (pathname === '/verify') return 'verify';
  if (pathname === '/upload') return 'upload';
  if (pathname === '/profile') return 'profile';
  if (pathname === '/lectures') return 'lectures';
  if (pathname === '/saved' || pathname === '/library') return 'saved';
  if (pathname === '/playlists') return 'playlists';
  if (pathname.startsWith('/playlist/')) return 'playlist';
  if (pathname.startsWith('/podcast/')) return 'podcast';
  return 'not-found';
}

function routeParams(pathname) {
  if (pathname.startsWith('/podcast/')) {
    return { id: pathname.split('/')[2] || '' };
  }
  if (pathname.startsWith('/playlist/')) {
    return { id: pathname.split('/')[2] || '' };
  }
  return {};
}

const registrationDraft = loadRegistrationDraft();

export const state = {
  route: {
    name: routeName(window.location.pathname),
    path: window.location.pathname,
    search: new URLSearchParams(window.location.search),
    params: routeParams(window.location.pathname)
  },
  session: loadSession(),
  ui: {
    menuOpen: false,
    filterOpen: false,
    homeQuery: '',
    homeSubject: '',
    homeLevel: '',
    homeTags: [],
    settingsOpen: false,
    downloadingId: '',
    registerStep: registrationDraft ? 'verify' : 'init',
    registerDraft: registrationDraft,
    connectionHint: '',
    recentVoteId: '',
    uploadFlow: {
      status: 'idle',
      step: -1,
      progress: 0,
      error: '',
      fileName: '',
      result: ''
    },
    savedIds: loadSavedIds(),
    subscriptions: loadSubscriptions()
  },
  data: {
    home: [],
    popular: [],
    recommended: [],
    detail: null,
    comments: [],
    saved: [],
    mine: [],
    playlists: demoPlaylists,
    localTracks: loadLocalTracks()
  },
  loading: {
    home: true,
    detail: false,
    saved: false,
    mine: false,
    playlists: false,
    auth: false,
    upload: false
  },
  error: null,
  player: {
    current: null,
    playing: false,
    currentTime: 0,
    duration: 0,
    volume: 0.9,
    loading: false,
    error: ''
  },
  apiBase: loadApiBase()
};

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn(state));
}

export function setState(patch) {
  Object.assign(state, patch);
  notify();
}

export function patchState(section, patch) {
  state[section] = { ...state[section], ...patch };
  notify();
}

export function patchUi(patch) {
  state.ui = { ...state.ui, ...patch };
  notify();
}

export function resetTransientUi() {
  state.ui.menuOpen = false;
  state.ui.filterOpen = false;
  state.ui.settingsOpen = false;
  state.error = null;
  notify();
}

export function setSession(session) {
  state.session = session;
  saveSession(session);
  notify();
}

export function clearSession() {
  state.session = null;
  saveSession(null);
  notify();
}

export function setRegistrationDraft(draft) {
  state.ui.registerDraft = draft;
  state.ui.registerStep = draft ? 'verify' : 'init';
  saveRegistrationDraft(draft);
  notify();
}

export function clearRegistrationFlow() {
  state.ui.registerStep = 'init';
  state.ui.registerDraft = null;
  clearRegistrationDraft();
  notify();
}

export function setApiBase(value) {
  state.apiBase = value;
  saveApiBase(value);
  notify();
}

export function setSavedIds(ids) {
  state.ui.savedIds = [...new Set((ids || []).map(String))];
  saveSavedIds(state.ui.savedIds);
  notify();
}

export function toggleSavedId(id) {
  const key = String(id);
  const exists = state.ui.savedIds.includes(key);
  const next = exists ? state.ui.savedIds.filter((item) => item !== key) : [...state.ui.savedIds, key];
  setSavedIds(next);
  return !exists;
}

export function setSubscriptions(items) {
  state.ui.subscriptions = [...new Set((items || []).map(String))];
  saveSubscriptions(state.ui.subscriptions);
  notify();
}

export function toggleSubscription(author) {
  const key = String(author || '').trim();
  if (!key) return false;
  const exists = state.ui.subscriptions.includes(key);
  const next = exists ? state.ui.subscriptions.filter((item) => item !== key) : [...state.ui.subscriptions, key];
  setSubscriptions(next);
  return !exists;
}

export function setUploadFlow(patch) {
  state.ui.uploadFlow = { ...state.ui.uploadFlow, ...patch };
  notify();
}
