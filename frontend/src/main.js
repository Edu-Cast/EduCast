import './styles.css';
import { api } from './api.js';
import {
  state,
  setState,
  patchState,
  patchUi,
  subscribe,
  resetTransientUi,
  clearSession,
  setRegistrationDraft,
  clearRegistrationFlow,
  setUploadFlow
} from './store.js';
import {
  subjects,
  educationLevels,
  icons,
  escapeHtml,
  formatDuration,
  formatBytes,
  formatDate,
  formatTimeAgo,
  initials,
  byLabel,
  clamp,
  fallbackTags,
  subjectIcon,
  sortByScore,
  uniqueById,
  slugify,
  silentAudioUrl
} from './helpers.js';
import {
  navigate,
  syncRoute,
  isProtectedRoute,
  routePathToPodcast,
  routePathToPlaylist
} from './router.js';

const app = document.getElementById('app');
const audio = new Audio();
let selectedUploadFile = null;

const uploadSteps = [
  'Uploading file...',
  'Processing audio...',
  'Generating transcription...',
  'Analyzing content...',
  'Ready'
];

audio.volume = state.player.volume;
audio.preload = 'metadata';

function absoluteAudioUrl(src) {
  try {
    return new URL(src, window.location.href).href;
  } catch {
    return src;
  }
}

function audioErrorMessage() {
  const code = audio.error?.code;
  if (code === 1) return 'Playback was interrupted.';
  if (code === 2) return 'Audio file could not be loaded from the network.';
  if (code === 3) return 'Audio file format could not be decoded.';
  if (code === 4) return 'Audio source is unavailable or unsupported.';
  return 'Audio source is unavailable.';
}

function setAudioSource(item) {
  if (!item) throw new Error('Audio item does not exist.');
  const src = item.audioUrl || silentAudioUrl;
  const nextSrc = absoluteAudioUrl(src);
  if (audio.src !== nextSrc) {
    audio.src = src;
    audio.load();
  }
}

audio.addEventListener('timeupdate', () => {
  patchState('player', { currentTime: audio.currentTime });
});

audio.addEventListener('loadedmetadata', () => {
  patchState('player', {
    duration: audio.duration || state.player.current?.durationSeconds || 0,
    loading: false,
    error: ''
  });
});

audio.addEventListener('canplay', () => {
  patchState('player', { loading: false, error: '' });
});

audio.addEventListener('playing', () => {
  patchState('player', { playing: true, loading: false, error: '' });
});

audio.addEventListener('pause', () => {
  patchState('player', { playing: false });
});

audio.addEventListener('waiting', () => {
  patchState('player', { loading: true });
});

audio.addEventListener('ended', () => {
  patchState('player', { playing: false, currentTime: 0 });
});

audio.addEventListener('error', () => {
  const message = audioErrorMessage();
  patchState('player', { loading: false, playing: false, error: message });
  if (state.player.current) renderToast('Playback failed', message, 'error');
});

function renderToast(title, message = '', kind = 'default') {
  const stack = document.getElementById('toasts');
  if (!stack) return;

  const node = document.createElement('div');
  node.className = `toast ${kind}`;
  node.innerHTML = `
    <div class="toast-icon">${kind === 'success' ? icons.check : kind === 'error' ? icons.alert : icons.logo}</div>
    <div class="toast-copy">
      <strong>${escapeHtml(title)}</strong>
      ${message ? `<span>${escapeHtml(message)}</span>` : ''}
    </div>
  `;
  stack.appendChild(node);
  setTimeout(() => {
    node.style.opacity = '0';
    node.style.transform = 'translateY(-8px)';
    node.style.transition = 'all 180ms ease';
    setTimeout(() => node.remove(), 220);
  }, 3200);
}

function clearToastStack() {
  const stack = document.getElementById('toasts');
  if (stack) stack.innerHTML = '';
}

let renderQueued = false;
function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderApp();
  });
}

function ensureAuthenticated() {
  if (!state.session) {
    renderToast('Authentication required', 'Sign in to sync this action with your account.', 'error');
    navigate('/login', { replace: true });
    return false;
  }
  return true;
}

function parseTags(value) {
  return String(value || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function setSearchFiltersFromRoute() {
  const query = state.route.search.get('query') || '';
  const subject = state.route.search.get('subject') || '';
  const educationLevel = state.route.search.get('educationLevel') || '';
  const tags = parseTags(state.route.search.get('tag') || state.route.search.get('tags') || '');
  state.ui.homeQuery = query;
  state.ui.homeSubject = subject;
  state.ui.homeLevel = educationLevel;
  state.ui.homeTags = tags;
}

function searchPath(overrides = {}) {
  const params = new URLSearchParams();
  const query = overrides.query ?? state.ui.homeQuery;
  const subject = overrides.subject ?? state.ui.homeSubject;
  const educationLevel = overrides.educationLevel ?? state.ui.homeLevel;
  const tags = overrides.tags ?? state.ui.homeTags;

  if (query) params.set('query', query);
  if (subject) params.set('subject', subject);
  if (educationLevel) params.set('educationLevel', educationLevel);
  if (Array.isArray(tags) && tags.length) params.set('tag', tags.join(','));
  if (typeof tags === 'string' && tags) params.set('tag', tags);

  const suffix = params.toString();
  return suffix ? `/search?${suffix}` : '/search';
}

function replaceSearchParams() {
  if (!['home', 'search'].includes(state.route.name)) return;
  const path = state.route.name === 'search' ? searchPath() : '/';
  window.history.replaceState({}, '', path);
}

function allKnownTracks() {
  return uniqueById([
    state.data.detail,
    ...state.data.home,
    ...state.data.popular,
    ...state.data.recommended,
    ...state.data.saved,
    ...state.data.mine
  ]).filter(Boolean);
}

function findTrackById(id) {
  const matchId = String(id);
  return allKnownTracks().find((entry) => String(entry.id) === matchId) || null;
}

function ensurePlayerSeed(item) {
  if (!item || state.player.current) return;
  setAudioSource(item);
  patchState('player', {
    ...state.player,
    current: item,
    currentTime: 0,
    duration: item.durationSeconds || 0,
    loading: false,
    playing: false,
    error: ''
  });
}

function itemSearchText(item) {
  return [
    item.title,
    item.description,
    item.authorLogin,
    byLabel(subjects, item.subject),
    byLabel(educationLevels, item.educationLevel),
    ...fallbackTags(item)
  ].join(' ').toLowerCase();
}

function filterTracks(items, filters = state.ui) {
  const query = String(filters.homeQuery || '').trim().toLowerCase();
  const subject = filters.homeSubject || '';
  const level = filters.homeLevel || '';
  const tags = filters.homeTags || [];

  return items.filter((item) => {
    if (subject && item.subject !== subject) return false;
    if (level && item.educationLevel !== level) return false;
    if (query && !itemSearchText(item).includes(query)) return false;
    if (tags.length) {
      const availableTags = fallbackTags(item).map((tag) => tag.toLowerCase());
      const subjectLabel = byLabel(subjects, item.subject).toLowerCase();
      const levelLabel = byLabel(educationLevels, item.educationLevel).toLowerCase();
      const haystack = [...availableTags, subjectLabel, levelLabel];
      if (!tags.every((tag) => haystack.includes(String(tag).toLowerCase()))) return false;
    }
    return true;
  });
}

function isSaved(item) {
  const id = String(item?.id ?? '');
  return state.data.saved.some((entry) => String(entry.id) === id);
}

function nonNegativeCount(...values) {
  for (const value of values) {
    const count = Number(value);
    if (Number.isFinite(count) && count >= 0) return count;
  }
  return 0;
}

function countLabel(count, singular, plural = `${singular}s`) {
  const value = nonNegativeCount(count);
  return `${value.toLocaleString('en-US')} ${value === 1 ? singular : plural}`;
}

function profileSubscriberCount() {
  const user = state.session?.user;
  return nonNegativeCount(user?.subscriberCount, user?.subscribersCount, user?.followersCount);
}

function authorSubscriberCount(item) {
  if (state.session?.user?.login && state.session.user.login === item?.authorLogin) {
    return profileSubscriberCount();
  }
  return nonNegativeCount(item?.subscriberCount, item?.subscribersCount, item?.followersCount);
}

function savedItems() {
  const selected = allKnownTracks().filter((item) => isSaved(item));
  if (selected.length) return selected;
  if (state.data.saved.length) return state.data.saved;
  return [];
}

function myLectureItems() {
  return uniqueById(state.data.mine);
}

function playlistItems(playlist) {
  if (!playlist) return [];
  const byId = new Map(allKnownTracks().map((item) => [String(item.id), item]));
  return (playlist.podcastIds || []).map((id) => byId.get(String(id))).filter(Boolean);
}

function updatePodcastEverywhere(id, patch) {
  const key = String(id);
  const updateList = (items) => items.map((item) => String(item.id) === key ? { ...item, ...patch } : item);
  setState({
    data: {
      ...state.data,
      home: updateList(state.data.home),
      popular: updateList(state.data.popular),
      recommended: updateList(state.data.recommended),
      saved: updateList(state.data.saved),
      mine: updateList(state.data.mine),
      detail: state.data.detail && String(state.data.detail.id) === key ? { ...state.data.detail, ...patch } : state.data.detail
    }
  });
}

function activeFilterChips() {
  const chips = [];
  if (state.ui.homeQuery) chips.push({ key: 'query', label: state.ui.homeQuery });
  if (state.ui.homeSubject) chips.push({ key: 'subject', label: byLabel(subjects, state.ui.homeSubject) });
  if (state.ui.homeLevel) chips.push({ key: 'educationLevel', label: byLabel(educationLevels, state.ui.homeLevel) });
  state.ui.homeTags.forEach((tag) => chips.push({ key: 'tag', value: tag, label: tag }));
  return chips;
}

function skeletonCards(count = 6, shelf = false) {
  return `
    <div class="${shelf ? 'shelf' : 'lecture-grid'} skeleton-wrap">
      ${Array.from({ length: count }).map(() => `
        <article class="lecture-card ${shelf ? 'shelf-card' : ''}" aria-hidden="true">
          <div class="cover-art skeleton"></div>
          <div class="lecture-copy">
            <span class="line skeleton"></span>
            <span class="line short skeleton"></span>
            <span class="line tiny skeleton"></span>
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

function renderMenuDropdown() {
  const user = state.session?.user;
  if (user) {
    return `
      <div class="menu-dropdown" role="menu">
        <div class="menu-head">
          <strong>${escapeHtml(user.login || 'EduCast user')}</strong>
          <span>${escapeHtml(user.email || 'Signed in')}</span>
        </div>
        <a href="/profile" data-link role="menuitem">${icons.user}<span>Profile</span></a>
        <a href="/lectures" data-link role="menuitem">${icons.lecture}<span>Your lectures</span></a>
        <a href="/saved" data-link role="menuitem">${icons.bookmark}<span>Saved lectures</span></a>
        <a href="/playlists" data-link role="menuitem">${icons.playlist}<span>Your playlists</span></a>
        ${state.session ? `<a href="/upload" data-link role="menuitem">${icons.upload}<span>Add new lecture</span></a>` : ''}
        <button type="button" data-action="logout" role="menuitem">${icons.close}<span>Logout</span></button>
      </div>
    `;
  }

  return `
    <div class="menu-dropdown guest" role="menu">
      <div class="menu-head">
        <strong>Menu</strong>
        <span>Join EduCast to save and upload lectures</span>
      </div>
      <a class="menu-auth primary" href="/register" data-link role="menuitem">${icons.plus}<span>Register</span></a>
      <a class="menu-auth" href="/login" data-link role="menuitem">${icons.user}<span>Login</span></a>
      <a href="/search" data-link role="menuitem">${icons.search}<span>Search</span></a>
      <a href="/playlists" data-link role="menuitem">${icons.playlist}<span>Playlists</span></a>
    </div>
  `;
}

function renderSettingsModal() {
  if (!state.ui.settingsOpen) return '';

  const user = state.session?.user;
  const signedIn = Boolean(user);
  const savedCount = state.data.saved.length;
  const lecturesCount = state.data.mine.length;

  return `
    <div class="settings-backdrop" data-action="close-settings">
      <section class="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <button class="settings-close focus-ring" type="button" data-action="close-settings" aria-label="Close settings">${icons.close}</button>
        <h2 id="settings-title">Settings</h2>
        <div class="settings-summary">
          <div>
            <strong>${escapeHtml(user?.login || 'Guest')}</strong>
            <span>${escapeHtml(user?.email || 'Not signed in')}</span>
          </div>
          <div>
            <strong>${signedIn ? 'Active' : 'Guest mode'}</strong>
            <span>Session status</span>
          </div>
        </div>
        <div class="settings-section">
          <h3>Library</h3>
          <div class="settings-list">
            <div><span>Saved lectures</span><strong>${savedCount}</strong></div>
            <div><span>Your lectures</span><strong>${lecturesCount}</strong></div>
            <div><span>Subscribers</span><strong>${nonNegativeCount(profileSubscriberCount()).toLocaleString('en-US')}</strong></div>
          </div>
        </div>
        <div class="settings-actions">
          ${signedIn ? `
            <a class="settings-action focus-ring" href="/profile" data-link>${icons.user}<span>Profile</span></a>
            <button class="settings-action danger focus-ring" type="button" data-action="logout">${icons.close}<span>Logout</span></button>
          ` : `
            <a class="settings-action primary focus-ring" href="/register" data-link>${icons.plus}<span>Register</span></a>
            <a class="settings-action focus-ring" href="/login" data-link>${icons.user}<span>Login</span></a>
          `}
        </div>
      </section>
    </div>
  `;
}

function profileButton() {
  return `
    <div class="menu-wrap">
      <button
        class="profile-button menu-button focus-ring"
        type="button"
        data-action="toggle-menu"
        aria-label="Open menu"
        aria-expanded="${state.ui.menuOpen ? 'true' : 'false'}"
      >
        <span class="menu-user-icon">${state.session ? escapeHtml(initials(state.session.user?.login || state.session.user?.email)) : icons.user}</span>
        <span class="menu-badge">${icons.menu}</span>
      </button>
      ${state.ui.menuOpen ? renderMenuDropdown() : ''}
    </div>
  `;
}

function heroBanner({ title, subtitle = '', className = '', menu = true, settings = false }) {
  return `
    <section class="hero-banner ${className}">
      <div class="hero-title">
        <h1>${escapeHtml(title)}</h1>
        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
      </div>
      ${settings ? `<button class="profile-button focus-ring" type="button" data-action="open-settings" aria-label="Settings">${icons.settings}</button>` : menu ? profileButton() : ''}
    </section>
  `;
}

function coverArt(item, compact = false) {
  const subjectClass = `subject-${String(item.subject || 'other').toLowerCase().replace(/_/g, '-')}`;
  return `
    <div class="cover-art ${subjectClass} ${compact ? 'compact' : ''}" aria-hidden="true">
      <div class="cover-symbol">${subjectIcon(item.subject)}</div>
      <div class="cover-cap">${icons.logo}</div>
      <span>${escapeHtml(byLabel(subjects, item.subject))}</span>
    </div>
  `;
}

function renderTagPills(item, limit = 3) {
  const aiTags = fallbackTags(item).filter((tag) => {
    const normalized = tag.toLowerCase();
    return normalized !== byLabel(subjects, item.subject).toLowerCase() &&
      normalized !== byLabel(educationLevels, item.educationLevel).toLowerCase();
  });
  const tags = aiTags.slice(0, limit);
  return `
    <div class="tag-row">
      <button class="tag-pill subject" type="button" data-action="filter-subject" data-subject="${escapeHtml(item.subject)}">
        ${subjectIcon(item.subject)} ${escapeHtml(byLabel(subjects, item.subject))}
      </button>
      ${tags.map((tag) => `
        <button class="tag-pill ai" type="button" data-action="filter-tag" data-tag="${escapeHtml(tag)}">
          ${escapeHtml(tag)}
        </button>
      `).join('')}
      <button class="tag-pill level" type="button" data-action="filter-level" data-level="${escapeHtml(item.educationLevel)}">
        ${icons.logo} ${escapeHtml(byLabel(educationLevels, item.educationLevel))}
      </button>
    </div>
  `;
}

function compactMeta(item) {
  return `
    <div class="card-meta">
      <span>${icons.up}${Number(item.score || 0)} upvotes</span>
      <span>${escapeHtml(formatTimeAgo(item.createdAt))}</span>
    </div>
  `;
}

function lectureCard(item, variant = 'grid') {
  const isPlaying = state.player.current?.id === item.id && state.player.playing;
  const voted = state.ui.recentVoteId && String(state.ui.recentVoteId) === String(item.id);
  const saved = isSaved(item);
  const shelf = variant === 'shelf';

  return `
    <article
      class="lecture-card ${shelf ? 'shelf-card' : ''} ${isPlaying ? 'is-playing' : ''} ${voted ? 'just-voted' : ''}"
      role="button"
      tabindex="0"
      data-action="open-podcast"
      data-id="${escapeHtml(item.id)}"
      aria-label="${escapeHtml(item.title)}"
    >
      ${coverArt(item, shelf)}
      <div class="lecture-copy">
        <div class="title-line">
          <h3>${escapeHtml(clamp(item.title, shelf ? 19 : 18))}</h3>
          <span>${escapeHtml(formatDuration(item.durationSeconds))}</span>
        </div>
        ${!shelf ? `<p>${escapeHtml(clamp(item.authorLogin, 36))}</p>` : ''}
        ${!shelf ? renderTagPills(item, 2) : ''}
        ${compactMeta(item)}
      </div>
      <div class="card-actions">
        <button class="tiny-action ${saved ? 'active' : ''}" type="button" data-action="save-podcast" data-id="${escapeHtml(item.id)}" aria-label="Save lecture">${icons.bookmark}</button>
        <button class="tiny-action" type="button" data-action="play-podcast" data-id="${escapeHtml(item.id)}" aria-label="Play lecture">${isPlaying ? icons.pause : icons.play}</button>
      </div>
    </article>
  `;
}

function lectureGrid(items, emptyText = 'No lectures found.') {
  return items.length ? `
    <div class="lecture-grid">
      ${items.map((item) => lectureCard(item)).join('')}
    </div>
  ` : `
    <div class="empty-state">
      <h3>${escapeHtml(emptyText)}</h3>
      <p>Try another search or upload a new lecture.</p>
    </div>
  `;
}

function shelf(title, items, extra = '') {
  return `
    <section class="shelf-section">
      <div class="section-head">
        <h2>${escapeHtml(title)}</h2>
        ${extra}
      </div>
      ${items.length ? `
        <div class="shelf">
          ${items.map((item) => lectureCard(item, 'shelf')).join('')}
        </div>
      ` : `<div class="empty-row">No content yet.</div>`}
    </section>
  `;
}

function navItem(href, icon, label, activeRoutes = []) {
  const isActive = activeRoutes.includes(state.route.name);
  return `
    <a class="side-link ${isActive ? 'active' : ''}" href="${href}" data-link>
      ${icon}
      <span>${label}</span>
    </a>
  `;
}

function renderSidebar() {
  return `
    <aside class="sidebar">
      <a class="brand focus-ring" href="/" data-link>
        <span class="brand-mark">${icons.logo}</span>
        <span>EduCast</span>
      </a>

      <nav class="side-nav" aria-label="Main navigation">
        ${navItem('/search', icons.search, 'Search', ['search'])}
        ${navItem('/lectures', icons.lecture, 'Your lectures', ['lectures', 'upload'])}
        ${navItem('/saved', icons.bookmark, 'Saved lectures', ['saved'])}
        ${navItem('/playlists', icons.playlist, 'Your playlists', ['playlists', 'playlist'])}
      </nav>

      <div class="sidebar-art" aria-hidden="true">
        <div class="side-planet one"></div>
        <div class="side-planet two"></div>
      </div>
    </aside>
  `;
}

function renderPlayerBar() {
  const current = state.player.current;
  if (!current) return '';

  const duration = state.player.duration || current.durationSeconds || 0;
  const percent = duration ? Math.min(100, Math.max(0, (state.player.currentTime / duration) * 100)) : 0;
  const saved = isSaved(current);
  const downloading = state.ui.downloadingId === String(current.id);

  return `
    <div class="player">
      <input
        class="player-progress focus-ring"
        type="range"
        min="0"
        max="100"
        value="${percent.toFixed(2)}"
        step="0.1"
        data-action="seek"
        aria-label="Playback progress"
      />
      <div class="player-inner">
        <div class="player-track">
          ${coverArt(current, true)}
          <div class="player-title">
            <strong>${escapeHtml(clamp(current.title, 28))}</strong>
            <span>${escapeHtml(current.authorLogin)}</span>
          </div>
        </div>

        <div class="player-controls" aria-label="Audio controls">
          <button class="icon-button focus-ring" type="button" data-action="volume-toggle" aria-label="Volume">${icons.volume}</button>
          <input
            class="volume-slider focus-ring"
            type="range"
            min="0"
            max="1"
            value="${Number(state.player.volume).toFixed(2)}"
            step="0.01"
            data-action="volume"
            aria-label="Volume level"
          />
          <button class="icon-button focus-ring" type="button" data-action="seek-back" aria-label="Seek backward">${icons.previous}</button>
          <button class="play-button focus-ring" type="button" data-action="toggle-play" aria-label="Play or pause">
            ${state.player.playing ? icons.pause : icons.play}
          </button>
          <button class="icon-button focus-ring" type="button" data-action="seek-forward" aria-label="Seek forward">${icons.next}</button>
          <button class="icon-button focus-ring" type="button" data-action="download-podcast" data-id="${escapeHtml(current.id)}" aria-label="Download" aria-busy="${downloading ? 'true' : 'false'}" ${downloading ? 'disabled' : ''}>${icons.download}</button>
          <button class="icon-button focus-ring ${saved ? 'active' : ''}" type="button" data-action="save-podcast" data-id="${escapeHtml(current.id)}" aria-label="Save">${icons.bookmark}</button>
        </div>

        <div class="player-status">
          <span>${escapeHtml(formatDuration(state.player.currentTime))}</span>
          <span>${escapeHtml(state.player.error || (state.player.loading ? 'Buffering' : state.player.playing ? 'Playing' : 'Paused'))}</span>
        </div>
      </div>
    </div>
  `;
}

function renderHome() {
  if (state.loading.home && !state.data.home.length) {
    return `
      ${heroBanner({ title: 'Good evening!' })}
      <section class="content-panel">${skeletonCards(8, true)}</section>
    `;
  }

  const source = allKnownTracks();
  const interesting = source.slice(0, 8);
  const recommended = state.data.recommended.length ? state.data.recommended : sortByScore(source).slice(0, 8);
  const popular = state.data.popular.length ? state.data.popular : sortByScore(source).slice(0, 8);

  return `
    ${heroBanner({ title: 'Good evening!' })}
    ${renderConnectionHint()}
    <section class="content-panel home-panel">
      ${shelf('Interesting for you', interesting)}
      ${shelf('Popular lectures', popular)}
    </section>
  `;
}

function filterOptions() {
  return `
    <div class="filter-panel ${state.ui.filterOpen ? 'open' : ''}">
      <label>
        <span>Subject</span>
        <select class="select focus-ring" name="subject">
          ${subjects.map((item) => `<option value="${escapeHtml(item.value)}" ${item.value === state.ui.homeSubject ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('')}
        </select>
      </label>
      <label>
        <span>Education level</span>
        <select class="select focus-ring" name="educationLevel">
          ${educationLevels.map((item) => `<option value="${escapeHtml(item.value)}" ${item.value === state.ui.homeLevel ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('')}
        </select>
      </label>
      <button class="ghost-button focus-ring" type="submit">${icons.search} Apply</button>
    </div>
  `;
}

function renderActiveFilters() {
  const chips = activeFilterChips();
  return `
    <div class="active-filters">
      <button class="filter-toggle focus-ring" type="button" data-action="toggle-filters">${icons.filters}<span>Filters</span></button>
      ${chips.map((chip) => `
        <button
          class="active-chip focus-ring"
          type="button"
          data-action="remove-filter"
          data-filter="${escapeHtml(chip.key)}"
          data-value="${escapeHtml(chip.value || '')}"
        >
          ${escapeHtml(chip.label)} ${icons.close}
        </button>
      `).join('')}
      ${chips.length ? `<button class="active-chip clear focus-ring" type="button" data-action="clear-filters">Clear all</button>` : ''}
    </div>
  `;
}

function searchTitle() {
  if (state.ui.homeSubject) return `Top lectures in ${byLabel(subjects, state.ui.homeSubject)}`;
  if (state.ui.homeTags.length) return `Top lectures tagged ${state.ui.homeTags[0]}`;
  if (state.ui.homeQuery) return `Results for ${state.ui.homeQuery}`;
  return 'Top lectures in Biology';
}

function renderSearch() {
  const visible = filterTracks(allKnownTracks());
  const top = visible.slice(0, 6);
  const rest = visible.slice(6);

  return `
    <section class="hero-banner search-hero">
      <form class="search-shell" data-action="apply-filters">
        <label class="search-input">
          ${icons.search}
          <input
            type="search"
            name="query"
            value="${escapeHtml(state.ui.homeQuery)}"
            placeholder="Search for lectures, authors or playlists"
            autocomplete="off"
          />
        </label>
        ${renderActiveFilters()}
        ${filterOptions()}
      </form>
      ${profileButton()}
    </section>

    ${renderConnectionHint()}

    <section class="content-panel search-results">
      <div class="section-head">
        <h2>${escapeHtml(searchTitle())}</h2>
      </div>
      ${top.length ? `<div class="shelf">${top.map((item) => lectureCard(item, 'shelf')).join('')}</div>` : ''}
      ${rest.length ? lectureGrid(rest, 'No lectures match those filters.') : top.length ? '' : lectureGrid([], 'No lectures match those filters.')}
    </section>
  `;
}

function renderStart() {
  const actions = state.session ? `
    <a class="glass-button focus-ring" href="/search" data-link>${icons.search} Search</a>
    <a class="glass-button focus-ring" href="/lectures" data-link>${icons.lecture} Your lectures</a>
  ` : `
    <a class="glass-button focus-ring" href="/search" data-link>${icons.search} Search</a>
    <a class="glass-button focus-ring" href="/register" data-link>${icons.plus} Register</a>
    <a class="glass-button focus-ring" href="/login" data-link>${icons.user} Login</a>
  `;
  const items = state.data.recommended.slice(0, 6);

  return `
    ${heroBanner({ title: 'Welcome to EduCast', subtitle: 'Main menu' })}
    <section class="idea-strip">
      <h2>Start listening</h2>
      <div class="idea-actions">
        ${actions}
      </div>
    </section>
    <section class="content-panel">
      ${shelf('Recommended lectures', items)}
    </section>
  `;
}

function renderLectures() {
  const items = myLectureItems();
  return `
    ${heroBanner({ title: 'Your lectures', subtitle: `${items.length} lectures in total` })}
    <section class="idea-strip">
      <h2>Have an idea for new lecture?</h2>
      <div class="idea-actions">
        <a class="glass-button focus-ring" href="/upload" data-link>${icons.plus} Add new lecture</a>
      </div>
    </section>
    <section class="content-panel">
      ${state.loading.mine ? skeletonCards(6) : lectureGrid(items)}
    </section>
  `;
}

function renderSaved() {
  const items = savedItems();
  return `
    ${heroBanner({ title: 'Saved lectures', subtitle: `${items.length} lectures in total` })}
    <section class="content-panel">
      ${state.loading.saved ? skeletonCards(6) : lectureGrid(items, 'No saved lectures yet.')}
    </section>
  `;
}

function playlistCard(playlist, index) {
  return `
    <article
      class="playlist-card"
      role="button"
      tabindex="0"
      data-action="open-playlist"
      data-id="${escapeHtml(playlist.id)}"
    >
      <div class="playlist-art">
        ${icons.playlistShape}
      </div>
      <h3>${escapeHtml(playlist.title)}</h3>
    </article>
  `;
}

function renderPlaylists() {
  return `
    ${heroBanner({ title: 'Your playlists', subtitle: `${state.data.playlists.length} playlists in total` })}
    <section class="content-panel">
      ${state.data.playlists.length ? `
        <div class="playlist-grid">
          ${state.data.playlists.map((playlist, index) => playlistCard(playlist, index)).join('')}
        </div>
      ` : '<div class="empty-row">No playlists yet.</div>'}
    </section>
  `;
}

function renderPlaylistDetail() {
  const playlist = state.data.playlists.find((item) => String(item.id) === String(state.route.params.id));
  if (!playlist) {
    return `
      ${heroBanner({ title: 'Playlist unavailable' })}
      <section class="content-panel empty-state error-state">
        <h2>Playlist not found.</h2>
        <button class="primary-button focus-ring" type="button" data-action="go-home">Back to catalog</button>
      </section>
    `;
  }
  const items = playlistItems(playlist);
  return `
    ${heroBanner({ title: playlist.title, subtitle: `${items.length} lectures in total` })}
    <section class="content-panel">
      ${lectureGrid(items)}
    </section>
  `;
}

function renderDetail() {
  const item = state.data.detail;
  if (state.loading.detail && !item) {
    return `
      ${heroBanner({ title: 'Loading lecture' })}
      <section class="content-panel detail-panel">
        <div class="loading-cta">
          <div class="loading-cta-copy">
            <strong>Preparing your lecture</strong>
            <span>The content is being loaded; this action will become available as soon as it’s ready.</span>
          </div>
          <button class="primary-button focus-ring is-loading" type="button" disabled aria-busy="true">
            ${icons.play} Loading lecture…
          </button>
        </div>
        ${skeletonCards(3)}
      </section>
    `;
  }

  if (state.error && !item) {
    return `
      ${heroBanner({ title: 'Lecture unavailable' })}
      <section class="content-panel empty-state error-state">
        <h2>${escapeHtml(state.error)}</h2>
        <button class="primary-button focus-ring" type="button" data-action="go-home">Back to catalog</button>
      </section>
    `;
  }

  if (!item) {
    return `
      ${heroBanner({ title: 'Lecture not found' })}
      <section class="content-panel empty-state">
        <h2>This item does not exist or was removed.</h2>
        <button class="primary-button focus-ring" type="button" data-action="go-home">Back to catalog</button>
      </section>
    `;
  }

  const saved = isSaved(item);
  const isPlaying = state.player.current?.id === item.id && state.player.playing;
  const downloading = state.ui.downloadingId === String(item.id);

  return `
    ${heroBanner({ title: item.title })}
    <section class="content-panel detail-panel">
      <div class="detail-toolbar">
        <div class="author-line">
          <div class="small-avatar">${icons.user}</div>
          <div>
            <strong>${escapeHtml(item.authorLogin)}</strong>
            <span>${countLabel(authorSubscriberCount(item), 'subscriber')}</span>
          </div>
        </div>

        <div class="detail-buttons">
          <button class="circle-action focus-ring ${state.ui.recentVoteId === String(item.id) ? 'pulse' : ''}" type="button" data-action="vote-podcast" data-id="${escapeHtml(item.id)}" data-vote="1" aria-label="Upvote">${icons.up}</button>
          <span class="score-label">${Number(item.score || 0)} upvotes</span>
          <button class="circle-action focus-ring" type="button" data-action="vote-podcast" data-id="${escapeHtml(item.id)}" data-vote="-1" aria-label="Downvote">${icons.down}</button>
          <button class="circle-action focus-ring ${saved ? 'active' : ''}" type="button" data-action="save-podcast" data-id="${escapeHtml(item.id)}" aria-label="Save lecture">${icons.bookmark}</button>
        </div>
      </div>

      <div class="detail-main-actions">
        <button class="primary-button focus-ring" type="button" data-action="play-podcast" data-id="${escapeHtml(item.id)}">
          ${isPlaying ? icons.pause : icons.play} ${isPlaying ? 'Pause' : 'Play lecture'}
        </button>
        <button class="ghost-button focus-ring" type="button" data-action="download-podcast" data-id="${escapeHtml(item.id)}" aria-busy="${downloading ? 'true' : 'false'}" ${downloading ? 'disabled' : ''}>
          ${icons.download} ${downloading ? 'Downloading...' : 'Download mp3'}
        </button>
        <button class="ghost-button focus-ring" type="button" data-action="copy-link" data-id="${escapeHtml(item.id)}">${icons.copy} Copy link</button>
      </div>

      <section class="description-block">
        <h2>Description</h2>
        <p>${escapeHtml(item.description || 'No description provided yet.')}</p>
      </section>

      <section class="tags-block">
        <h2>AI generated tags</h2>
        ${renderTagPills(item, 8)}
      </section>

      ${item.transcription ? `
        <section class="transcript-block">
          <h2>Transcription</h2>
          <p>${escapeHtml(item.transcription)}</p>
        </section>
      ` : ''}

      <section class="comments-panel">
        <h2>${countLabel(state.data.comments.length, 'comment')}</h2>
        <form class="comment-form" data-action="add-comment" data-id="${escapeHtml(item.id)}">
          <input class="focus-ring" name="text" type="text" maxlength="1000" placeholder="Write a comment..." required />
          <button class="circle-action focus-ring" type="submit" aria-label="Send comment">${icons.bookmark}</button>
        </form>
        <div class="comments-list">
          ${state.data.comments.length ? state.data.comments.map((comment) => `
            <article class="comment">
              <div class="small-avatar">${icons.user}</div>
              <div>
                <div class="comment-head">
                  <strong>${escapeHtml(comment.authorLogin)}</strong>
                  <span>${escapeHtml(formatDate(comment.createdAt))}</span>
                  ${state.session?.user?.login === comment.authorLogin ? `<button class="comment-delete" type="button" data-action="delete-comment" data-id="${escapeHtml(comment.id)}" aria-label="Delete comment">${icons.trash}</button>` : ''}
                </div>
                <p>${escapeHtml(comment.text)}</p>
              </div>
            </article>
          `).join('') : `<div class="empty-row">No comments yet.</div>`}
        </div>
      </section>
    </section>
  `;
}

function renderAuth() {
  const isVerify = state.route.name === 'verify' || state.ui.registerStep === 'verify';
  const draft = state.ui.registerDraft;

  if (state.route.name === 'login') {
    return `
      <section class="auth-layout">
        <div class="auth-showcase">
          <h2>Listen, record, and share your lectures</h2>
          <div class="auth-disc" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
          <div class="auth-icons" aria-hidden="true">
            ${icons.atom}${icons.leaf}${icons.formula}${icons.logo}
          </div>
          <div class="auth-controls" aria-hidden="true">${icons.previous}${icons.play}${icons.next}</div>
        </div>
        <div class="auth-surface">
          <form class="auth-card" data-action="login">
            <h1>Welcome back!</h1>
            <p>No account yet? <a href="/register" data-link>Sign up</a></p>
            <label>Email<input class="focus-ring" name="email" type="email" autocomplete="email" required /></label>
            <label>Password<input class="focus-ring" name="password" type="password" autocomplete="current-password" required /></label>
            <button class="auth-submit focus-ring" type="submit">Sign in ${icons.play}</button>
          </form>
        </div>
      </section>
    `;
  }

  if (isVerify) {
    return `
      <section class="auth-layout">
        <div class="auth-showcase">
          <h2>Listen, record, and share your lectures</h2>
          <div class="auth-disc" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
          <div class="auth-icons" aria-hidden="true">
            ${icons.atom}${icons.leaf}${icons.formula}${icons.logo}
          </div>
          <div class="auth-controls" aria-hidden="true">${icons.previous}${icons.pause}${icons.next}</div>
        </div>
        <div class="auth-surface">
          <form class="auth-card verify-card" data-action="verify-registration">
            <h1>Verify your email</h1>
            <p>Please enter the verification code we sent to <strong>${escapeHtml(draft?.email || 'example@gmail.com')}</strong></p>
            <input type="hidden" name="email" value="${escapeHtml(draft?.email || '')}" />
            <input type="hidden" name="verificationCode" value="" />
            <div class="otp-row">
              ${Array.from({ length: 6 }).map((_, index) => `<input class="focus-ring" data-otp="${index}" inputmode="numeric" maxlength="1" pattern="[0-9]*" aria-label="Code digit ${index + 1}" />`).join('')}
            </div>
            <button class="auth-submit focus-ring" type="submit">Confirm ${icons.play}</button>
            <button class="link-button focus-ring" type="button" data-action="resend-code">Did not receive? <span>Resend code</span></button>
          </form>
        </div>
      </section>
    `;
  }

  return `
    <section class="auth-layout">
      <div class="auth-showcase">
        <h2>Listen, record, and share your lectures</h2>
        <div class="auth-disc" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
        <div class="auth-icons" aria-hidden="true">
          ${icons.atom}${icons.leaf}${icons.formula}${icons.logo}
        </div>
        <div class="auth-controls" aria-hidden="true">${icons.previous}${icons.pause}${icons.next}</div>
      </div>
      <div class="auth-surface">
        <form class="auth-card" data-action="register-init">
          <h1>Create an account</h1>
          <p>Already have an account? <a href="/login" data-link>Log in</a></p>
          <label>Username<input class="focus-ring" name="login" type="text" minlength="4" maxlength="30" autocomplete="username" required /></label>
          <label>Email<input class="focus-ring" name="email" type="email" autocomplete="email" required /></label>
          <label>Password<input class="focus-ring" name="password" type="password" minlength="8" autocomplete="new-password" required /></label>
          <button class="auth-submit focus-ring" type="submit">Sign up ${icons.play}</button>
        </form>
      </div>
    </section>
  `;
}

function renderUploadStatus() {
  const flow = state.ui.uploadFlow;
  if (flow.status === 'idle' && !flow.fileName) return '';

  return `
    <div class="upload-status ${flow.status}">
      ${flow.fileName ? `<div class="file-name">${icons.upload}<span>${escapeHtml(flow.fileName)}</span></div>` : ''}
      <div class="status-track"><span style="width: ${Math.max(0, Math.min(100, flow.progress))}%"></span></div>
      <div class="status-steps">
        ${uploadSteps.map((label, index) => `
          <div class="status-step ${index < flow.step ? 'done' : index === flow.step ? 'active' : ''}">
            <i>${index < flow.step || flow.status === 'success' ? icons.check : index + 1}</i>
            <span>${escapeHtml(label)}</span>
          </div>
        `).join('')}
      </div>
      ${flow.status === 'loading' ? `<p class="status-current">${escapeHtml(uploadSteps[Math.max(0, flow.step)] || 'Uploading...')}</p>` : ''}
      ${flow.status === 'error' ? `<p class="status-error">${escapeHtml(flow.error || 'Upload failed. Try again.')}</p>` : ''}
      ${flow.status === 'success' ? `<p class="status-success">${escapeHtml(flow.result || 'Lecture is ready.')}</p>` : ''}
    </div>
  `;
}

function renderUpload() {
  const isLoading = state.ui.uploadFlow.status === 'loading';
  const disabled = isLoading ? 'disabled' : '';

  if (!state.session) {
    return `
      <section class="upload-page">
        <div class="upload-card access-blocked">
          <h1>Add new lecture</h1>
          <p>You need an account to upload lectures. Please sign in or create an account first.</p>
          <div class="detail-main-actions">
            <a class="primary-button focus-ring" href="/login" data-link>${icons.user} Sign in</a>
            <a class="ghost-button focus-ring" href="/register" data-link>${icons.plus} Create account</a>
          </div>
        </div>
      </section>
    `;
  }

  return `
    <section class="upload-page">
      <form class="upload-card" data-action="upload">
        <h1>Add new lecture</h1>
        <label>
          <span>Title</span>
          <input class="focus-ring" name="title" type="text" maxlength="200" required ${disabled} />
        </label>
        <div class="upload-row">
          <label>
            <span class="sr-only">Subject</span>
            <select class="focus-ring" name="subject" required ${disabled}>
              <option value="" selected disabled>Subject</option>
              ${subjects.filter((item) => item.value).map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`).join('')}
            </select>
          </label>
          <label>
            <span class="sr-only">Education level</span>
            <select class="focus-ring" name="educationLevel" required ${disabled}>
              <option value="" selected disabled>Education level</option>
              ${educationLevels.filter((item) => item.value).map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`).join('')}
            </select>
          </label>
        </div>
        <label class="description-field">
          <span class="sr-only">Description</span>
          <textarea class="focus-ring" name="description" maxlength="1000" placeholder="Add description..." required ${disabled}></textarea>
        </label>
        <label class="file-field">
          ${icons.upload}
          <span>${state.ui.uploadFlow.fileName ? escapeHtml(state.ui.uploadFlow.fileName) : 'Upload audio file'}</span>
          <input name="file" type="file" accept="audio/*" required ${disabled} />
        </label>
        ${renderUploadStatus()}
        <button class="auth-submit upload-submit focus-ring" type="submit" ${disabled}>${isLoading ? icons.upload : icons.plus} ${isLoading ? 'Uploading...' : 'Add new lecture'}</button>
      </form>
    </section>
  `;
}

function renderProfile() {
  const user = state.session?.user;
  const saved = savedItems();
  const mine = myLectureItems();

  return `
    <section class="profile-hero">
      <button class="settings-button focus-ring" type="button" data-action="open-settings" aria-label="Settings">${icons.settings}</button>
      <div class="profile-avatar">${icons.user}</div>
      <h1>${escapeHtml(user?.login || 'Guest')}</h1>
      <p>${countLabel(profileSubscriberCount(), 'subscriber')}</p>
    </section>

    <section class="content-panel profile-panel">
      ${shelf('Saved lectures', saved.slice(0, 8), `<a class="arrow-link" href="/saved" data-link>${icons.chevronRight}</a>`)}
      ${shelf('Your lectures', mine.slice(0, 8), `<a class="arrow-link" href="/lectures" data-link>${icons.chevronRight}</a>`)}
    </section>
  `;
}

function renderNotFound() {
  return `
    ${heroBanner({ title: '404' })}
    <section class="content-panel empty-state">
      <h2>Page not found.</h2>
      <a class="primary-button focus-ring" href="/" data-link>Back to home</a>
    </section>
  `;
}

function renderConnectionHint() {
  return state.ui.connectionHint ? `<section class="connection-hint">${escapeHtml(state.ui.connectionHint)}</section>` : '';
}

function renderView() {
  const route = state.route.name;
  if (route === 'home') return renderHome();
  if (route === 'start') return renderStart();
  if (route === 'search') return renderSearch();
  if (route === 'podcast') return renderDetail();
  if (route === 'login' || route === 'register' || route === 'verify') return renderAuth();
  if (route === 'upload') return renderUpload();
  if (route === 'profile') return renderProfile();
  if (route === 'lectures') return renderLectures();
  if (route === 'saved') return renderSaved();
  if (route === 'playlists') return renderPlaylists();
  if (route === 'playlist') return renderPlaylistDetail();
  return renderNotFound();
}

function renderApp() {
  const authRoute = ['login', 'register', 'verify'].includes(state.route.name);
  if (authRoute) {
    app.innerHTML = `
      <div class="auth-app">
        ${renderView()}
        <div id="toasts" class="toast-stack" aria-live="polite" aria-atomic="true"></div>
      </div>
    `;
    return;
  }

  if (state.route.name === 'upload') {
    app.innerHTML = `
      <div class="upload-app">
        ${renderView()}
        <div id="toasts" class="toast-stack" aria-live="polite" aria-atomic="true"></div>
      </div>
    `;
    return;
  }

  app.innerHTML = `
    <div class="app-shell">
      ${renderSidebar()}
      <main class="main">
        <div class="main-inner">
          ${renderView()}
        </div>
      </main>
      ${renderPlayerBar()}
      ${renderSettingsModal()}
      <div id="toasts" class="toast-stack" aria-live="polite" aria-atomic="true"></div>
    </div>
  `;
}

async function loadHome() {
  patchState('loading', { ...state.loading, home: true });
  setState({ error: null });

  const query = state.ui.homeQuery.trim();
  const subject = state.ui.homeSubject;
  const educationLevel = state.ui.homeLevel;

  replaceSearchParams();

  try {
    const [homePayload, popularPayload] = await Promise.all([
      api.listPodcasts({ query, subject, educationLevel }),
      api.popularPodcasts(subject).catch(() => [])
    ]);

    const home = uniqueById(homePayload);
    const popular = sortByScore(uniqueById(popularPayload));
    const recommended = sortByScore(home).slice(0, 12);

    setState({
      data: { ...state.data, home, popular, recommended },
      error: null
    });
    ensurePlayerSeed(home[0]);
    patchUi({ connectionHint: '' });
  } catch (error) {
    setState({
      error: error.message,
      data: {
        ...state.data,
        home: [],
        popular: [],
        recommended: []
      }
    });
    patchUi({ connectionHint: '' });
  } finally {
    patchState('loading', { ...state.loading, home: false });
  }
}

async function loadPodcastDetail(id) {
  patchState('loading', { ...state.loading, detail: true });
  setState({ error: null });

  try {
    const [detail, comments] = await Promise.all([
      api.getPodcast(id),
      api.getComments(id).catch(() => [])
    ]);
    setState({
      data: { ...state.data, detail, comments },
      error: null
    });
    patchUi({ connectionHint: '' });
  } catch (error) {
    setState({
      error: error.message,
      data: { ...state.data, detail: null, comments: [] }
    });
  } finally {
    patchState('loading', { ...state.loading, detail: false });
  }
}

async function loadSaved() {
  patchState('loading', { ...state.loading, saved: true });
  setState({ error: null });

  if (!state.session) {
    patchState('loading', { ...state.loading, saved: false });
    return;
  }

  try {
    const saved = await api.savedPodcasts();
    setState({
      data: { ...state.data, saved },
      error: null
    });
    patchUi({ connectionHint: '' });
  } catch (error) {
    setState({ error: error.message });
    renderToast('Saved items unavailable', error.message, 'error');
  } finally {
    patchState('loading', { ...state.loading, saved: false });
  }
}

async function loadMine() {
  patchState('loading', { ...state.loading, mine: true });
  setState({ error: null });

  if (!state.session) {
    patchState('loading', { ...state.loading, mine: false });
    return;
  }

  try {
    const mine = await api.myPodcasts();
    setState({
      data: { ...state.data, mine },
      error: null
    });
    patchUi({ connectionHint: '' });
  } catch (error) {
    setState({ error: error.message });
    renderToast('My uploads unavailable', error.message, 'error');
  } finally {
    patchState('loading', { ...state.loading, mine: false });
  }
}

async function playPodcast(item) {
  const podcast = typeof item === 'object' ? item : findTrackById(item);
  if (!podcast) {
    const message = 'This audio item does not exist or was removed.';
    patchState('player', { loading: false, playing: false, error: message });
    renderToast('Playback failed', message, 'error');
    return;
  }

  if (state.player.current?.id !== podcast.id || !audio.src) {
    patchState('player', {
      ...state.player,
      current: podcast,
      currentTime: 0,
      duration: podcast.durationSeconds || 0,
      loading: true,
      error: ''
    });
    setAudioSource(podcast);
  } else {
    patchState('player', { loading: true, error: '' });
  }

  try {
    await audio.play();
    patchState('player', {
      ...state.player,
      current: podcast,
      playing: true,
      loading: false,
      error: ''
    });
  } catch (error) {
    const message = audio.error ? audioErrorMessage() : (error?.message || 'The browser blocked playback or the file is unavailable.');
    renderToast('Playback failed', message, 'error');
    patchState('player', { ...state.player, loading: false, playing: false, error: message });
  }
}

async function togglePlayback() {
  if (!state.player.current) return;
  if (audio.paused) {
    await playPodcast(state.player.current);
  } else {
    audio.pause();
  }
}

function seekBy(deltaSeconds) {
  const duration = audio.duration || state.player.duration || 0;
  if (!Number.isFinite(duration) || !duration) return;
  audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + deltaSeconds));
}

async function copyLink(id) {
  const url = `${window.location.origin}${routePathToPodcast(id)}`;
  try {
    await navigator.clipboard.writeText(url);
    renderToast('Link copied', url, 'success');
  } catch {
    renderToast('Copy failed', 'Clipboard access is unavailable.', 'error');
  }
}

function extensionFromAudio(item, blob) {
  const type = String(blob?.type || '').toLowerCase();
  if (type.includes('mpeg') || type.includes('mp3')) return 'mp3';
  if (type.includes('wav')) return 'wav';
  if (type.includes('ogg')) return 'ogg';
  if (type.includes('aac')) return 'aac';

  const path = String(item?.audioUrl || '').split('?')[0];
  const match = path.match(/\.([a-z0-9]{2,5})$/i);
  return match?.[1]?.toLowerCase() || 'mp3';
}

async function downloadPodcast(id) {
  const item = findTrackById(id);
  if (!item) {
    renderToast('Download failed', 'This audio item does not exist or was removed.', 'error');
    return;
  }

  const key = String(item.id);
  const src = item.audioUrl || silentAudioUrl;
  patchUi({ downloadingId: key });

  try {
    const options = {};
    if (!src.startsWith('data:') && state.session?.token) {
      options.headers = { Authorization: `Bearer ${state.session.token}` };
    }

    const response = await fetch(src, options);
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `Audio download failed with status ${response.status}.`);
    }

    const blob = await response.blob();
    const extension = extensionFromAudio(item, blob);
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `${slugify(item.title || 'educast-lecture')}.${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    renderToast('Download started', anchor.download, 'success');
  } catch (error) {
    renderToast('Download failed', error.message || 'Audio file is unavailable.', 'error');
  } finally {
    patchUi({ downloadingId: '' });
  }
}

async function submitLogin(form) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const email = form.email.value.trim();
    const password = form.password.value;
    await api.login(email, password);
    renderToast('Welcome back', 'Signed in successfully.', 'success');
    navigate('/', { replace: true });
  } catch (error) {
    renderToast('Sign in failed', error.message, 'error');
  } finally {
    button.disabled = false;
  }
}

async function submitRegistrationInit(form) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const draft = {
      login: form.login.value.trim(),
      email: form.email.value.trim(),
      password: form.password.value
    };
    await api.registerInit(draft);
    setRegistrationDraft(draft);
    renderToast('Verification code sent', 'Check your email and enter the code.', 'success');
    navigate('/verify');
  } catch (error) {
    renderToast('Registration failed', error.message, 'error');
  } finally {
    button.disabled = false;
  }
}

function verificationCodeFromForm(form) {
  const digits = [...form.querySelectorAll('[data-otp]')].map((input) => input.value.trim()).join('');
  if (digits) return digits;
  return form.verificationCode?.value?.trim() || '';
}

async function submitRegistrationVerify(form) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const draft = state.ui.registerDraft;
    if (!draft) throw new Error('Registration draft is missing.');
    await api.registerVerify({
      email: draft.email,
      verificationCode: verificationCodeFromForm(form)
    });
    clearRegistrationFlow();
    await api.login(draft.email, draft.password);
    renderToast('Account verified', 'You are signed in now.', 'success');
    navigate('/', { replace: true });
  } catch (error) {
    renderToast('Verification failed', error.message, 'error');
  } finally {
    button.disabled = false;
  }
}

async function resendVerificationCode() {
  const draft = state.ui.registerDraft;
  if (!draft) {
    renderToast('Missing draft', 'Restart registration and request a new code.', 'error');
    return;
  }
  try {
    await api.registerResend(draft.email);
    renderToast('Code resent', 'A fresh verification code was sent.', 'success');
  } catch (error) {
    renderToast('Resend failed', error.message, 'error');
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runUploadAnimation(uploadPromise) {
  for (let index = 0; index < uploadSteps.length - 1; index += 1) {
    setUploadFlow({ status: 'loading', step: index, progress: 14 + index * 21, error: '', result: '' });
    await sleep(430);
  }
  const result = await uploadPromise;
  setUploadFlow({ status: 'success', step: uploadSteps.length - 1, progress: 100, result: 'Lecture is ready.' });
  await sleep(520);
  return result;
}

async function submitUpload(form) {
  if (!ensureAuthenticated()) return;

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;

  try {
    const file = form.file.files[0] || selectedUploadFile;
    if (!file) throw new Error('Select an audio file first.');

    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const subject = form.subject.value;
    const educationLevel = form.educationLevel.value;

    setUploadFlow({ status: 'loading', step: 0, progress: 8, error: '', result: '', fileName: file.name });

    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', title);
    fd.append('description', description);
    fd.append('subject', subject);
    fd.append('educationLevel', educationLevel);

    const created = await runUploadAnimation(api.uploadPodcast(fd));
    selectedUploadFile = null;
    renderToast('Uploaded', 'Published to backend.', 'success');
    await loadHome();
    navigate(created?.id ? routePathToPodcast(created.id) : '/lectures', { replace: true });
  } catch (error) {
    setUploadFlow({ status: 'error', step: Math.max(0, state.ui.uploadFlow.step), progress: state.ui.uploadFlow.progress, error: error.message });
    renderToast('Upload failed', error.message, 'error');
  } finally {
    button.disabled = false;
  }
}

async function submitComment(form) {
  const text = form.text.value.trim();
  if (!text) return;

  const item = state.data.detail;
  if (!item) return;

  if (!ensureAuthenticated()) return;

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const id = form.dataset.id;
    await api.addComment(id, text);
    const comments = await api.getComments(id);
    setState({ data: { ...state.data, comments } });
    form.reset();
    renderToast('Comment posted', 'Your comment is live.', 'success');
  } catch (error) {
    renderToast('Comment failed', error.message, 'error');
  } finally {
    button.disabled = false;
  }
}

async function votePodcast(id, vote) {
  const item = findTrackById(id) || state.data.detail;
  if (!item) return;

  if (!ensureAuthenticated()) return;

  const previousScore = Number(item.score || 0);
  const optimisticScore = Math.max(0, previousScore + Number(vote));
  updatePodcastEverywhere(id, { score: optimisticScore });
  patchUi({ recentVoteId: String(id) });
  setTimeout(() => {
    if (state.ui.recentVoteId === String(id)) patchUi({ recentVoteId: '' });
  }, 700);

  try {
    const result = await api.votePodcast(id, Number(vote));
    updatePodcastEverywhere(id, { score: result.score });
    renderToast('Vote recorded', `New score: ${result.score}`, 'success');
  } catch (error) {
    updatePodcastEverywhere(id, { score: previousScore });
    renderToast('Vote failed', error.message, 'error');
  }
}

async function savePodcast(id) {
  const item = findTrackById(id) || state.data.detail;
  if (!item) return;

  if (!ensureAuthenticated()) return;

  try {
    const result = await api.toggleSavePodcast(id);
    renderToast('Saved', result.message || 'Saved list updated.', 'success');
    await loadSaved();
  } catch (error) {
    renderToast('Save failed', error.message, 'error');
  }
}

async function deleteComment(commentId) {
  const item = state.data.detail;
  if (!item) return;

  if (!ensureAuthenticated()) return;
  try {
    await api.deleteComment(commentId);
    const comments = await api.getComments(item.id);
    setState({ data: { ...state.data, comments } });
    renderToast('Deleted', 'Comment removed.', 'success');
  } catch (error) {
    renderToast('Delete failed', error.message, 'error');
  }
}

function applyFilterPatch(patch, replace = false) {
  patchUi({
    homeQuery: patch.query ?? state.ui.homeQuery,
    homeSubject: patch.subject ?? state.ui.homeSubject,
    homeLevel: patch.educationLevel ?? state.ui.homeLevel,
    homeTags: patch.tags ?? state.ui.homeTags
  });
  navigate(searchPath({
    query: patch.query ?? state.ui.homeQuery,
    subject: patch.subject ?? state.ui.homeSubject,
    educationLevel: patch.educationLevel ?? state.ui.homeLevel,
    tags: patch.tags ?? state.ui.homeTags
  }), { replace });
}

async function handleRoute() {
  const route = syncRoute();

  clearToastStack();
  resetTransientUi();
  setSearchFiltersFromRoute();

  if (isProtectedRoute(route.name) && !state.session) {
    navigate('/login', { replace: true });
    return;
  }

  if (['home', 'start', 'search', 'saved', 'lectures', 'playlists', 'playlist', 'profile'].includes(route.name)) {
    await loadHome();
  }

  if (route.name === 'podcast') {
    await loadPodcastDetail(route.params.id);
    if (state.session) await loadSaved();
  }

  if (['saved', 'profile'].includes(route.name)) {
    await loadSaved();
  }

  if (['lectures', 'profile'].includes(route.name)) {
    await loadMine();
  }

  scheduleRender();
}

document.addEventListener('click', async (event) => {
  const link = event.target.closest('a[data-link]');
  if (link) {
    event.preventDefault();
    navigate(link.getAttribute('href'));
    return;
  }

  const action = event.target.closest('[data-action]');
  if (!action) return;

  const type = action.dataset.action;

  if (type === 'toggle-filters') {
    event.preventDefault();
    patchUi({ filterOpen: !state.ui.filterOpen });
    return;
  }

  if (type === 'toggle-menu') {
    event.preventDefault();
    patchUi({ menuOpen: !state.ui.menuOpen });
    return;
  }

  switch (type) {
    case 'open-settings':
      event.preventDefault();
      patchUi({ settingsOpen: true, menuOpen: false });
      break;
    case 'close-settings':
      if (action.classList.contains('settings-backdrop') && event.target !== action) break;
      event.preventDefault();
      patchUi({ settingsOpen: false });
      break;
    case 'logout':
      clearSession();
      setState({ data: { ...state.data, saved: [], mine: [] } });
      renderToast('Signed out', 'Your session has been cleared.', 'success');
      navigate('/login', { replace: true });
      break;
    case 'play-podcast':
      event.preventDefault();
      await playPodcast(action.dataset.id);
      break;
    case 'toggle-play':
      event.preventDefault();
      await togglePlayback();
      break;
    case 'volume-toggle':
      event.preventDefault();
      audio.muted = !audio.muted;
      patchState('player', { ...state.player, volume: audio.volume });
      renderToast(audio.muted ? 'Muted' : 'Volume on', '', 'success');
      break;
    case 'seek-back':
      event.preventDefault();
      seekBy(-10);
      break;
    case 'seek-forward':
      event.preventDefault();
      seekBy(10);
      break;
    case 'vote-podcast':
      event.preventDefault();
      await votePodcast(action.dataset.id, action.dataset.vote);
      break;
    case 'save-podcast':
      event.preventDefault();
      await savePodcast(action.dataset.id);
      break;
    case 'copy-link':
      event.preventDefault();
      await copyLink(action.dataset.id);
      break;
    case 'download-podcast':
      event.preventDefault();
      await downloadPodcast(action.dataset.id);
      break;
    case 'filter-tag': {
      event.preventDefault();
      const tag = action.dataset.tag;
      const tags = state.ui.homeTags.includes(tag) ? state.ui.homeTags : [...state.ui.homeTags, tag];
      applyFilterPatch({ tags });
      break;
    }
    case 'filter-subject':
      event.preventDefault();
      applyFilterPatch({ subject: action.dataset.subject });
      break;
    case 'filter-level':
      event.preventDefault();
      applyFilterPatch({ educationLevel: action.dataset.level });
      break;
    case 'remove-filter': {
      event.preventDefault();
      const filter = action.dataset.filter;
      const value = action.dataset.value;
      if (filter === 'query') applyFilterPatch({ query: '' });
      if (filter === 'subject') applyFilterPatch({ subject: '' });
      if (filter === 'educationLevel') applyFilterPatch({ educationLevel: '' });
      if (filter === 'tag') applyFilterPatch({ tags: state.ui.homeTags.filter((tag) => tag !== value) });
      break;
    }
    case 'clear-filters':
      event.preventDefault();
      applyFilterPatch({ query: '', subject: '', educationLevel: '', tags: [] });
      break;
    case 'open-podcast':
      if (event.target.closest('button')) return;
      navigate(routePathToPodcast(action.dataset.id));
      break;
    case 'open-playlist':
      navigate(routePathToPlaylist(action.dataset.id));
      break;
    case 'go-home':
      event.preventDefault();
      navigate('/');
      break;
    case 'resend-code':
      event.preventDefault();
      await resendVerificationCode();
      break;
    case 'delete-comment':
      event.preventDefault();
      await deleteComment(action.dataset.id);
      break;
    default:
      break;
  }
});

document.addEventListener('click', (event) => {
  if (state.ui.menuOpen && !event.target.closest('.menu-wrap')) {
    patchUi({ menuOpen: false });
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.ui.settingsOpen) {
    patchUi({ settingsOpen: false });
    return;
  }

  if (event.key === 'Escape' && state.ui.menuOpen) {
    patchUi({ menuOpen: false });
  }

  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;

  if (event.code === 'Space' && state.player.current) {
    event.preventDefault();
    void togglePlayback();
  }

  if (event.code === 'ArrowLeft' && state.player.current) {
    event.preventDefault();
    seekBy(-5);
  }

  if (event.code === 'ArrowRight' && state.player.current) {
    event.preventDefault();
    seekBy(5);
  }
});

document.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.matches('input[type="range"][data-action="seek"]')) {
    const duration = audio.duration || state.player.duration || 0;
    if (!duration) return;
    const ratio = Number(target.value) / 100;
    audio.currentTime = duration * ratio;
    patchState('player', { ...state.player, currentTime: audio.currentTime });
  }

  if (target.matches('input[type="range"][data-action="volume"]')) {
    const volume = Math.min(1, Math.max(0, Number(target.value)));
    audio.volume = volume;
    audio.muted = volume === 0;
    patchState('player', { ...state.player, volume });
  }

  if (target.matches('input[type="file"][name="file"]')) {
    const file = target.files?.[0];
    selectedUploadFile = file || null;
    setUploadFlow({ fileName: file?.name || '', status: 'idle', error: '', result: '', progress: 0, step: -1 });
  }

  if (target.matches('[data-otp]')) {
    target.value = target.value.replace(/\D/g, '').slice(0, 1);
    const form = target.closest('form');
    const inputs = [...form.querySelectorAll('[data-otp]')];
    const index = inputs.indexOf(target);
    if (target.value && inputs[index + 1]) inputs[index + 1].focus();
    const hidden = form.querySelector('input[name="verificationCode"]');
    if (hidden) hidden.value = inputs.map((input) => input.value).join('');
  }
});

document.addEventListener('submit', async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;

  const action = form.dataset.action;
  if (!action) return;

  event.preventDefault();

  if (action === 'apply-filters') {
    applyFilterPatch({
      query: form.query?.value?.trim() || '',
      subject: form.subject?.value || '',
      educationLevel: form.educationLevel?.value || '',
      tags: state.ui.homeTags
    });
    return;
  }

  if (action === 'login') return submitLogin(form);
  if (action === 'register-init') return submitRegistrationInit(form);
  if (action === 'verify-registration') return submitRegistrationVerify(form);
  if (action === 'upload') return submitUpload(form);
  if (action === 'add-comment') return submitComment(form);
});

window.addEventListener('educast:navigate', () => {
  handleRoute();
});

window.addEventListener('popstate', () => {
  handleRoute();
});

window.addEventListener('educast:unauthorized', () => {
  if (['profile', 'upload'].includes(state.route.name)) {
    clearSession();
    renderToast('Session expired', 'Please sign in again.', 'error');
    navigate('/login', { replace: true });
  }
});

subscribe(() => {
  scheduleRender();
});

setState({
  player: {
    ...state.player,
    volume: Number(state.player.volume || 0.9)
  }
});

handleRoute();

