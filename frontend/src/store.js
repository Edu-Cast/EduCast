const SESSION_KEY = 'educast_session_v1';
const REG_KEY = 'educast_register_draft_v1';
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
    }
  },
  data: {
    home: [],
    popular: [],
    recommended: [],
    detail: null,
    comments: [],
    saved: [],
    mine: [],
    playlists: []
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

export function setUploadFlow(patch) {
  state.ui.uploadFlow = { ...state.ui.uploadFlow, ...patch };
  notify();
}