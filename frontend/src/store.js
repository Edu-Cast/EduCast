const SESSION_KEY = 'educast_session_v1';
const REG_KEY = 'educast_register_draft_v1';
const LOCAL_TRACKS_KEY = 'educast_local_tracks_v1';
const API_BASE_KEY = 'educast_api_base_v1';

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
    homeQuery: '',
    homeSubject: '',
    homeLevel: '',
    registerStep: loadRegistrationDraft() ? 'verify' : 'init',
    registerDraft: loadRegistrationDraft(),
    connectionHint: ''
  },
  data: {
    home: [],
    popular: [],
    detail: null,
    comments: [],
    saved: [],
    mine: [],
    localTracks: loadLocalTracks()
  },
  loading: {
    home: true,
    detail: false,
    saved: false,
    mine: false,
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
    loading: false
  },
  apiBase: loadApiBase()
};

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setState(patch) {
  Object.assign(state, patch);
  listeners.forEach((fn) => fn(state));
}

export function patchState(section, patch) {
  state[section] = { ...state[section], ...patch };
  listeners.forEach((fn) => fn(state));
}

export function resetTransientUi() {
  state.ui.menuOpen = false;
  state.error = null;
  listeners.forEach((fn) => fn(state));
}

export function setSession(session) {
  state.session = session;
  saveSession(session);
  listeners.forEach((fn) => fn(state));
}

export function clearSession() {
  state.session = null;
  saveSession(null);
  listeners.forEach((fn) => fn(state));
}

export function setRegistrationDraft(draft) {
  state.ui.registerDraft = draft;
  state.ui.registerStep = draft ? 'verify' : 'init';
  saveRegistrationDraft(draft);
  listeners.forEach((fn) => fn(state));
}

export function clearRegistrationFlow() {
  state.ui.registerStep = 'init';
  state.ui.registerDraft = null;
  clearRegistrationDraft();
  listeners.forEach((fn) => fn(state));
}

export function setApiBase(value) {
  state.apiBase = value;
  saveApiBase(value);
  listeners.forEach((fn) => fn(state));
}

function routeName(pathname) {
  if (pathname === '/') return 'home';
  if (pathname === '/login') return 'login';
  if (pathname === '/register') return 'register';
  if (pathname === '/verify') return 'verify';
  if (pathname === '/upload') return 'upload';
  if (pathname === '/profile') return 'profile';
  if (pathname === '/library') return 'library';
  if (pathname.startsWith('/podcast/')) return 'podcast';
  return 'not-found';
}

function routeParams(pathname) {
  if (pathname.startsWith('/podcast/')) {
    return { id: pathname.split('/')[2] || '' };
  }
  return {};
}
