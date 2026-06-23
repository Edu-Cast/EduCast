import './styles.css';
import { api } from './api.js';
import {
  state,
  setState,
  patchState,
  subscribe,
  resetTransientUi,
  setSession,
  clearSession,
  setRegistrationDraft,
  clearRegistrationFlow,
  loadLocalTracks,
  addLocalTrack,
  saveLocalTracks
} from './store.js';
import {
  subjects,
  educationLevels,
  icons,
  escapeHtml,
  formatDuration,
  formatBytes,
  formatDate,
  initials,
  byLabel
} from './helpers.js';
import {
  navigate,
  syncRoute,
  isProtectedRoute,
  isLocalPodcastId,
  routePathToPodcast
} from './router.js';

const app = document.getElementById('app');
const audio = new Audio();

audio.volume = state.player.volume;
audio.preload = 'metadata';

audio.addEventListener('timeupdate', () => {
  patchState('player', { currentTime: audio.currentTime });
});

audio.addEventListener('loadedmetadata', () => {
  patchState('player', {
    duration: audio.duration || 0,
    loading: false
  });
});

audio.addEventListener('playing', () => {
  patchState('player', { playing: true, loading: false });
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

function renderToast(title, message = '', kind = 'default') {
  const stack = document.getElementById('toasts');
  if (!stack) return;

  const node = document.createElement('div');
  node.className = `toast ${kind}`;
  node.innerHTML = `
    <div style="font-size: 1rem; line-height: 1.1; margin-top: 2px">${kind === 'success' ? icons.check : kind === 'error' ? '⚠️' : icons.shield}</div>
    <div style="min-width: 0">
      <strong>${escapeHtml(title)}</strong>
      ${message ? `<div class="muted" style="line-height: 1.5">${escapeHtml(message)}</div>` : ''}
    </div>
  `;
  stack.appendChild(node);
  setTimeout(() => {
    node.style.opacity = '0';
    node.style.transform = 'translateY(-8px) scale(0.98)';
    node.style.transition = 'all 220ms ease';
    setTimeout(() => node.remove(), 240);
  }, 3000);
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
    renderToast('Authentication required', 'You can still use guest demo mode for uploads and playback.', 'error');
    navigate('/login', { replace: true });
    return false;
  }
  return true;
}

function setSearchFiltersFromRoute() {
  const query = state.route.search.get('query') || '';
  const subject = state.route.search.get('subject') || '';
  const educationLevel = state.route.search.get('educationLevel') || '';
  state.ui.homeQuery = query;
  state.ui.homeSubject = subject;
  state.ui.homeLevel = educationLevel;
}

function updateRouteSearch(params) {
  const url = new URL(window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    if (!value) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  });
  window.history.replaceState({}, '', `${url.pathname}${url.search}`);
}

function skeletonGrid(count = 8) {
  return `
    <div class="skeleton-grid">
      ${Array.from({ length: count }).map(() => `
        <div class="media-card" aria-hidden="true">
          <div class="media-art skeleton"></div>
          <div class="media-body">
            <div class="line big skeleton"></div>
            <div class="line medium skeleton"></div>
            <div class="line small skeleton"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function mediaCard(item) {
  const isPlaying = state.player.current?.id === item.id && state.player.playing;
  const local = Boolean(item.local);
  return `
    <article
      class="media-card ${isPlaying ? 'is-playing' : ''}"
      tabindex="0"
      role="button"
      data-action="open-podcast"
      data-id="${escapeHtml(item.id)}"
      aria-label="${escapeHtml(item.title)}"
    >
      <div class="media-art">
        <div style="font-size: 3rem; font-weight: 900; letter-spacing: -0.08em; color: rgba(255,255,255,0.16); pointer-events: none">${escapeHtml(initials(item.title))}</div>
        <button class="play-overlay" type="button" data-action="play-podcast" data-id="${escapeHtml(item.id)}" aria-label="Play">
          <span class="play-pill">${isPlaying ? icons.pause : icons.play}</span>
        </button>
        <div class="timestamp">${formatDuration(item.durationSeconds)}</div>
      </div>
      <div class="media-body">
        <h3 class="title">${escapeHtml(item.title)}</h3>
        <div class="meta">
          <span class="badge">${escapeHtml(byLabel(subjects, item.subject))}</span>
          <span class="badge">${escapeHtml(byLabel(educationLevels, item.educationLevel))}</span>
          ${local ? `<span class="badge">Local demo</span>` : ''}
        </div>
        <div class="submeta">
          <span class="muted">${escapeHtml(item.authorLogin)}</span>
          <span class="muted">•</span>
          <span class="muted">${escapeHtml(formatDate(item.createdAt))}</span>
        </div>
        <div class="submeta">
          <span class="badge">${icons.heart} ${Number(item.score || 0)}</span>
          <span class="badge">${escapeHtml(formatBytes(item.fileSizeBytes))}</span>
        </div>
      </div>
    </article>
  `;
}

function renderHeader() {
  const user = state.session?.user;
  const menu = state.ui.menuOpen ? `
    <div class="dropdown" role="menu">
      <a href="/profile" data-link role="menuitem">${icons.user} Profile</a>
      <a href="/library" data-link role="menuitem">${icons.bookmark} Saved</a>
      <a href="/upload" data-link role="menuitem">${icons.upload} Upload</a>
      <button type="button" data-action="logout" role="menuitem" class="danger">Sign out</button>
    </div>
  ` : '';

  return `
    <header class="header">
      <div class="header-inner">
        <a class="brand focus-ring" href="/" data-link>
          <span class="brand-mark">${icons.logo}</span>
          <span>EduCast</span>
        </a>

        <form class="header-search" data-action="search">
          <span style="color: #94a3b8">${icons.search}</span>
          <input
            type="search"
            name="query"
            value="${escapeHtml(state.ui.homeQuery)}"
            placeholder="Search podcasts, authors, or topics"
            autocomplete="off"
            aria-label="Search podcasts"
          />
        </form>

        <div class="header-actions">
          ${user ? `
            <div class="menu-wrap">
              <button
                class="avatar focus-ring"
                type="button"
                data-action="toggle-menu"
                aria-label="Open menu"
                aria-expanded="${state.ui.menuOpen ? 'true' : 'false'}"
              >
                ${escapeHtml(initials(user.login || user.email))}
              </button>
              ${menu}
            </div>
          ` : `
            <span class="badge">${icons.shield} Guest demo enabled</span>
            <a class="ghost-button focus-ring" href="/login" data-link>Sign in</a>
            <a class="primary-button focus-ring" href="/register" data-link>Register</a>
          `}
        </div>
      </div>
    </header>
  `;
}

function renderPlayerBar() {
  const current = state.player.current;
  if (!current) return '';

  const percent = state.player.duration ? Math.min(100, Math.max(0, (state.player.currentTime / state.player.duration) * 100)) : 0;
  return `
    <div class="player">
      <div class="player-inner">
        <div class="player-track">
          <div class="player-art">${icons.logo}</div>
          <div class="player-title">
            <div style="font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${escapeHtml(current.title)}</div>
            <div class="muted" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${escapeHtml(current.authorLogin)}</div>
          </div>
        </div>

        <div class="player-controls">
          <div class="actions-row" style="justify-content: center">
            <button class="icon-button focus-ring" type="button" data-action="toggle-play" aria-label="Play or pause">
              ${state.player.playing ? icons.pause : icons.play}
            </button>
            <button class="icon-button focus-ring" type="button" data-action="seek-back" aria-label="Seek backward">${icons.arrowLeft}</button>
            <button class="icon-button focus-ring" type="button" data-action="seek-forward" aria-label="Seek forward">${icons.arrowRight}</button>
          </div>
          <div class="range-wrap">
            <span class="muted" style="font-size: 0.8rem">${formatDuration(state.player.currentTime)}</span>
            <input
              class="range focus-ring"
              type="range"
              min="0"
              max="100"
              value="${percent.toFixed(2)}"
              step="0.1"
              data-action="seek"
              aria-label="Playback progress"
            />
            <span class="muted" style="font-size: 0.8rem">${formatDuration(state.player.duration)}</span>
          </div>
        </div>

        <div class="player-aside">
          <span class="badge">${escapeHtml(byLabel(subjects, current.subject))}</span>
          <span class="badge">${state.player.loading ? 'Buffering…' : state.player.playing ? 'Playing' : 'Paused'}</span>
          <input
            class="range focus-ring"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value="${state.player.volume}"
            data-action="volume"
            aria-label="Volume"
            style="max-width: 120px"
          />
        </div>
      </div>
    </div>
  `;
}

function renderHome() {
  if (state.loading.home && !state.data.home.length) {
    return `
      <section class="section hero-card">
        <div class="hero-top">
          <div class="hero-copy">
            <span class="kicker">${icons.shield} Release-ready frontend</span>
            <h1 class="h1">Education audio, fast and focused.</h1>
            <p class="lead">Discover podcasts, search by topic, play audio instantly, save useful episodes, and upload local demo audio without signing in.</p>
          </div>
        </div>
        <div class="toolbar">
          <div class="input skeleton" style="height: 54px; border-radius: 999px"></div>
          <div class="input skeleton" style="height: 54px; width: 180px"></div>
          <div class="input skeleton" style="height: 54px; width: 180px"></div>
        </div>
      </section>
      ${skeletonGrid(8)}
    `;
  }

  if (state.error && !state.data.home.length) {
    return `
      <section class="error-state soft-card">
        <h2 style="margin-top: 0">Could not load podcasts</h2>
        <p>${escapeHtml(state.error)}</p>
        <div class="actions-row" style="justify-content: center">
          <button class="primary-button focus-ring" type="button" data-action="retry-home">Retry</button>
        </div>
      </section>
    `;
  }

  const allTracks = [...state.data.localTracks, ...state.data.home];
  const featured = [...state.data.localTracks.slice(0, 2), ...state.data.popular.slice(0, 2)].slice(0, 4);
  const chips = `
    <div class="submeta">
      <span class="badge">${icons.shield} API: ${escapeHtml(state.apiBase || 'same-origin / proxy')}</span>
      <span class="badge">${state.session ? `Signed in as ${escapeHtml(state.session.user?.login || state.session.user?.email || 'User')}` : 'Guest mode'}</span>
      <span class="badge">${state.data.localTracks.length} local</span>
      <span class="badge">${state.data.home.length} remote</span>
    </div>
  `;

  return `
    <section class="section hero-card">
      <div class="hero-top">
        <div class="hero-copy">
          <span class="kicker">${icons.shield} Release-ready frontend</span>
          <h1 class="h1">Education audio, fast and focused.</h1>
          <p class="lead">Discover podcasts, search by topic, play audio instantly, save useful episodes, and upload local demo audio without signing in.</p>
          ${chips}
        </div>
      </div>

      <form class="toolbar" data-action="apply-filters">
        <input class="input focus-ring" type="search" name="query" value="${escapeHtml(state.ui.homeQuery)}" placeholder="Search by title, author, or keyword" />
        <select class="select focus-ring" name="subject">
          ${subjects.map((item) => `<option value="${escapeHtml(item.value)}" ${item.value === state.ui.homeSubject ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('')}
        </select>
        <select class="select focus-ring" name="educationLevel">
          ${educationLevels.map((item) => `<option value="${escapeHtml(item.value)}" ${item.value === state.ui.homeLevel ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('')}
        </select>
      </form>
    </section>

    <section class="section">
      <div class="hero-top" style="margin-bottom: 0.85rem">
        <div>
          <h2 style="margin: 0; font-size: 1.35rem; letter-spacing: -0.03em">Featured</h2>
          <p class="muted" style="margin: 0.3rem 0 0">Local demo items and remote favorites.</p>
        </div>
        <a class="ghost-button focus-ring" href="/library" data-link>${icons.bookmark} Saved</a>
      </div>

      <div class="card-grid">
        ${featured.map(mediaCard).join('') || '<div class="empty-state soft-card" style="grid-column: 1 / -1">No featured podcasts yet.</div>'}
      </div>
    </section>

    <section class="section">
      <div class="hero-top" style="margin-bottom: 0.85rem">
        <div>
          <h2 style="margin: 0; font-size: 1.35rem; letter-spacing: -0.03em">Catalog</h2>
          <p class="muted" style="margin: 0.3rem 0 0">Remote API items plus local demo uploads.</p>
        </div>
      </div>

      ${allTracks.length ? `
        <div class="card-grid">
          ${allTracks.map(mediaCard).join('')}
        </div>
      ` : `
        <div class="empty-state soft-card">
          <h3 style="margin-top: 0">No podcasts found</h3>
          <p>Try another search term or upload a local audio file.</p>
        </div>
      `}
    </section>
  `;
}

function findTrackById(id) {
  const matchId = String(id);
  return (
    state.data.localTracks.find((entry) => String(entry.id) === matchId) ||
    state.data.home.find((entry) => String(entry.id) === matchId) ||
    state.data.popular.find((entry) => String(entry.id) === matchId) ||
    state.data.detail
  );
}

function renderDetail() {
  const item = state.data.detail;
  if (state.loading.detail && !item) {
    return `
      <section class="soft-card detail-hero">
        <div class="detail-layout">
          <div class="cover skeleton"></div>
          <div class="detail-info">
            <div class="line big skeleton" style="width: 70%"></div>
            <div class="line medium skeleton"></div>
            <div class="line small skeleton"></div>
          </div>
        </div>
      </section>
    `;
  }

  if (state.error && !item) {
    return `
      <section class="error-state soft-card">
        <h2 style="margin-top: 0">Podcast unavailable</h2>
        <p>${escapeHtml(state.error)}</p>
        <div class="actions-row" style="justify-content: center">
          <button class="primary-button focus-ring" type="button" data-action="go-home">${icons.arrowLeft} Back to catalog</button>
        </div>
      </section>
    `;
  }

  if (!item) {
    return `
      <section class="empty-state soft-card">
        <h2 style="margin-top: 0">Podcast not found</h2>
        <p>This item does not exist or was removed.</p>
        <div class="actions-row" style="justify-content: center">
          <button class="primary-button focus-ring" type="button" data-action="go-home">${icons.arrowLeft} Back to catalog</button>
        </div>
      </section>
    `;
  }

  const isPlaying = state.player.current?.id === item.id && state.player.playing;
  const local = Boolean(item.local);
  return `
    <section class="soft-card detail-hero">
      <div class="detail-layout">
        <div class="cover">
          <button class="play-overlay" type="button" data-action="play-podcast" data-id="${escapeHtml(item.id)}" aria-label="Play">
            <span class="play-pill">${isPlaying ? icons.pause : icons.play}</span>
          </button>
          <div style="position: absolute; inset: auto 16px 16px auto" class="badge">${formatDuration(item.durationSeconds)}</div>
        </div>

        <div class="detail-info">
          <div class="meta">
            <span class="kicker">${icons.shield} ${escapeHtml(byLabel(subjects, item.subject))}</span>
            <span class="badge">${escapeHtml(byLabel(educationLevels, item.educationLevel))}</span>
            <span class="badge">${icons.heart} ${Number(item.score || 0)}</span>
            <span class="badge">${escapeHtml(formatBytes(item.fileSizeBytes))}</span>
            ${local ? `<span class="badge">Local demo</span>` : ''}
          </div>

          <h1 class="detail-title">${escapeHtml(item.title)}</h1>
          <div class="submeta">
            <span class="muted">By ${escapeHtml(item.authorLogin)}</span>
            <span class="muted">•</span>
            <span class="muted">${escapeHtml(formatDate(item.createdAt))}</span>
          </div>
          <p class="lead" style="max-width: 100%">${escapeHtml(item.description || 'No description provided.')}</p>

          <div class="detail-actions">
            <button class="primary-button focus-ring" type="button" data-action="play-podcast" data-id="${escapeHtml(item.id)}">
              ${isPlaying ? icons.pause : icons.play} ${isPlaying ? 'Pause' : 'Play'}
            </button>
            ${local ? `
              <span class="badge">Guest mode playback</span>
            ` : `
              <button class="ghost-button focus-ring" type="button" data-action="vote-podcast" data-id="${escapeHtml(item.id)}" data-vote="1">${icons.heart} Upvote</button>
              <button class="ghost-button focus-ring" type="button" data-action="save-podcast" data-id="${escapeHtml(item.id)}">${icons.bookmark} Save</button>
              <button class="ghost-button focus-ring" type="button" data-action="copy-link" data-id="${escapeHtml(item.id)}">${icons.copy} Copy link</button>
            `}
          </div>

          <div class="stat-grid">
            <div class="stat">
              <div class="label">Duration</div>
              <div class="value">${escapeHtml(formatDuration(item.durationSeconds))}</div>
            </div>
            <div class="stat">
              <div class="label">Source score</div>
              <div class="value">${Number(item.score || 0)}</div>
            </div>
            <div class="stat">
              <div class="label">File size</div>
              <div class="value">${escapeHtml(formatBytes(item.fileSizeBytes))}</div>
            </div>
            <div class="stat">
              <div class="label">Author</div>
              <div class="value">${escapeHtml(item.authorLogin)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section soft-card form-card">
      <div class="hero-top" style="margin-bottom: 0.4rem">
        <div>
          <h2 style="margin: 0">Comments</h2>
          <p class="helper" style="margin: 0.3rem 0 0">
            ${local ? 'Local demo uploads do not sync comments.' : 'Send a comment, keep it short and useful.'}
          </p>
        </div>
      </div>

      ${local ? `
        <div class="empty-state" style="padding: 1.5rem 0">This is a local demo track. Playback works immediately in guest mode.</div>
      ` : `
        <form class="form-grid" data-action="add-comment" data-id="${escapeHtml(item.id)}">
          <textarea class="textarea focus-ring" name="text" placeholder="Write a comment..." maxlength="1000" required></textarea>
          <div class="actions-row" style="justify-content: flex-end">
            <button class="primary-button focus-ring" type="submit">${icons.plus} Send comment</button>
          </div>
        </form>

        <div class="divider"></div>

        <div class="form-grid">
          ${state.data.comments.length ? state.data.comments.map((comment) => `
            <article class="soft-card" style="padding: 1rem; background: rgba(2, 6, 23, 0.35)">
              <div class="hero-top" style="align-items: center">
                <div style="display: flex; gap: 0.75rem; align-items: center">
                  <div class="avatar" style="width: 36px; height: 36px; font-size: 0.82rem">${escapeHtml(initials(comment.authorLogin))}</div>
                  <div>
                    <div style="font-weight: 750">${escapeHtml(comment.authorLogin)}</div>
                    <div class="muted" style="font-size: 0.82rem">${escapeHtml(formatDate(comment.createdAt))}</div>
                  </div>
                </div>
                ${state.session?.user?.login === comment.authorLogin ? `
                  <button class="icon-button focus-ring" type="button" data-action="delete-comment" data-id="${comment.id}" aria-label="Delete comment">${icons.trash}</button>
                ` : ''}
              </div>
              <p style="margin: 0.85rem 0 0; color: #e2e8f0; line-height: 1.65">${escapeHtml(comment.text)}</p>
            </article>
          `).join('') : `
            <div class="empty-state" style="padding: 1.5rem 0">No comments yet.</div>
          `}
        </div>
      `}
    </section>
  `;
}

function renderAuth() {
  const isVerify = state.ui.registerStep === 'verify';
  if (state.route.name === 'login') {
    return `
      <section class="soft-card form-card" style="max-width: 540px; margin: 0 auto">
        <div class="hero-copy" style="margin-bottom: 1rem">
          <span class="kicker">${icons.shield} Secure access</span>
          <h1 style="margin: 0.8rem 0 0.4rem; font-size: 2rem; letter-spacing: -0.04em">Sign in</h1>
          <p class="muted" style="margin: 0">Use your email and password, or skip straight to guest demo upload.</p>
        </div>

        <form class="form-grid" data-action="login">
          <div class="field">
            <label class="label" for="login-email">Email</label>
            <input class="input focus-ring" id="login-email" name="email" type="email" autocomplete="email" required />
          </div>
          <div class="field">
            <label class="label" for="login-password">Password</label>
            <input class="input focus-ring" id="login-password" name="password" type="password" autocomplete="current-password" required />
          </div>
          <button class="primary-button focus-ring" type="submit">${icons.user} Sign in</button>
        </form>

        <div class="divider"></div>
        <p class="helper">No account yet? <a href="/register" data-link style="color: #c4b5fd; font-weight: 700">Create one</a></p>
      </section>
    `;
  }

  if (state.route.name === 'verify' || isVerify) {
    const draft = state.ui.registerDraft;
    return `
      <section class="soft-card form-card" style="max-width: 540px; margin: 0 auto">
        <div class="hero-copy" style="margin-bottom: 1rem">
          <span class="kicker">${icons.shield} Email verification</span>
          <h1 style="margin: 0.8rem 0 0.4rem; font-size: 2rem; letter-spacing: -0.04em">Verify your account</h1>
          <p class="muted" style="margin: 0">${draft ? `Code sent to ${escapeHtml(draft.email)}.` : 'Enter the code you received by email.'}</p>
        </div>

        <form class="form-grid" data-action="verify-registration">
          <div class="field">
            <label class="label" for="verify-email">Email</label>
            <input class="input focus-ring" id="verify-email" name="email" type="email" autocomplete="email" required value="${escapeHtml(draft?.email || '')}" />
          </div>
          <div class="field">
            <label class="label" for="verify-code">Verification code</label>
            <input class="input focus-ring" id="verify-code" name="verificationCode" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" required />
          </div>
          <div class="actions-row">
            <button class="ghost-button focus-ring" type="button" data-action="resend-code">${icons.plus} Resend code</button>
            <button class="primary-button focus-ring" type="submit">${icons.check} Verify and continue</button>
          </div>
        </form>
      </section>
    `;
  }

  return `
    <section class="soft-card form-card" style="max-width: 680px; margin: 0 auto">
      <div class="hero-copy" style="margin-bottom: 1rem">
        <span class="kicker">${icons.shield} Create account</span>
        <h1 style="margin: 0.8rem 0 0.4rem; font-size: 2rem; letter-spacing: -0.04em">Register</h1>
        <p class="muted" style="margin: 0">The backend uses a two-step verification flow, but guest demo mode works without it.</p>
      </div>

      <form class="form-grid" data-action="register-init">
        <div class="form-row two">
          <div class="field">
            <label class="label" for="register-login">Login</label>
            <input class="input focus-ring" id="register-login" name="login" type="text" minlength="4" maxlength="30" autocomplete="username" required />
            <div class="helper">Latin letters, digits, underscore.</div>
          </div>
          <div class="field">
            <label class="label" for="register-email">Email</label>
            <input class="input focus-ring" id="register-email" name="email" type="email" autocomplete="email" required />
          </div>
        </div>

        <div class="field">
          <label class="label" for="register-password">Password</label>
          <input class="input focus-ring" id="register-password" name="password" type="password" minlength="8" autocomplete="new-password" required />
        </div>

        <button class="primary-button focus-ring" type="submit">${icons.user} Send verification code</button>
      </form>

      <div class="divider"></div>
      <p class="helper">You can skip registration and upload a local file from the home page.</p>
    </section>
  `;
}

function renderUpload() {
  return `
    <section class="soft-card form-card" style="max-width: 840px; margin: 0 auto">
      <div class="hero-copy" style="margin-bottom: 1rem">
        <span class="kicker">${icons.upload} Upload audio</span>
        <h1 style="margin: 0.8rem 0 0.4rem; font-size: 2rem; letter-spacing: -0.04em">New podcast</h1>
        <p class="muted" style="margin: 0">Upload to backend when available, or save a local demo copy and play it immediately without signing in.</p>
      </div>

      <form class="form-grid" data-action="upload">
        <div class="field">
          <label class="label" for="upload-file">Audio file</label>
          <input class="file-input focus-ring" id="upload-file" name="file" type="file" accept="audio/*" required />
        </div>

        <div class="form-row two">
          <div class="field">
            <label class="label" for="upload-title">Title</label>
            <input class="input focus-ring" id="upload-title" name="title" type="text" maxlength="200" required />
          </div>
          <div class="field">
            <label class="label" for="upload-subject">Subject</label>
            <select class="select focus-ring" id="upload-subject" name="subject" required>
              ${subjects.filter((item) => item.value).map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-row two">
          <div class="field">
            <label class="label" for="upload-level">Education level</label>
            <select class="select focus-ring" id="upload-level" name="educationLevel" required>
              ${educationLevels.filter((item) => item.value).map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label class="label" for="upload-tags">Tags</label>
            <input class="input focus-ring" id="upload-tags" name="tags" type="text" placeholder="Optional, comma separated" />
          </div>
        </div>

        <div class="field">
          <label class="label" for="upload-description">Description</label>
          <textarea class="textarea focus-ring" id="upload-description" name="description" maxlength="1000" required></textarea>
        </div>

        <button class="primary-button focus-ring" type="submit">${icons.plus} Publish podcast</button>
      </form>
    </section>
  `;
}

function renderProfile() {
  const user = state.session?.user;
  const uploads = state.data.mine;
  return `
    <section class="soft-card detail-hero">
      <div class="detail-layout">
        <div class="cover" style="aspect-ratio: 1 / 1.1">
          <div class="avatar" style="width: 112px; height: 112px; font-size: 2rem">${escapeHtml(initials(user?.login || user?.email))}</div>
        </div>

        <div class="detail-info">
          <span class="kicker">${icons.user} Account</span>
          <h1 class="detail-title">${escapeHtml(user?.login || 'User')}</h1>
          <div class="submeta">
            <span class="muted">${escapeHtml(user?.email || 'No email on file')}</span>
            <span class="muted">•</span>
            <span class="muted">Signed in</span>
          </div>

          <div class="stat-grid">
            <div class="stat"><div class="label">Saved podcasts</div><div class="value">${state.data.saved.length}</div></div>
            <div class="stat"><div class="label">My uploads</div><div class="value">${uploads.length}</div></div>
            <div class="stat"><div class="label">Player state</div><div class="value">${state.player.current ? 'Active' : 'Idle'}</div></div>
            <div class="stat"><div class="label">Session</div><div class="value">${state.session?.token ? 'Valid' : 'Missing'}</div></div>
          </div>

          <div class="detail-actions">
            <a class="ghost-button focus-ring" href="/library" data-link>${icons.bookmark} Saved</a>
            <a class="primary-button focus-ring" href="/upload" data-link>${icons.upload} Upload</a>
          </div>
        </div>
      </div>
    </section>

    <section class="section soft-card form-card">
      <div class="hero-top" style="margin-bottom: 0.75rem">
        <div>
          <h2 style="margin: 0">My uploads</h2>
          <p class="helper" style="margin: 0.3rem 0 0">Items created by the signed-in user.</p>
        </div>
      </div>

      ${state.loading.mine ? skeletonGrid(4) : uploads.length ? `
        <div class="card-grid">
          ${uploads.map(mediaCard).join('')}
        </div>
      ` : `
        <div class="empty-state" style="padding: 1.5rem 0">No uploads yet.</div>
      `}
    </section>
  `;
}

function renderLibrary() {
  const items = state.data.saved;
  return `
    <section class="section hero-card">
      <div class="hero-top">
        <div class="hero-copy">
          <span class="kicker">${icons.bookmark} Saved podcasts</span>
          <h1 class="h1" style="font-size: clamp(1.8rem, 4vw, 3rem)">Your personal library</h1>
          <p class="lead">Access episodes you saved for later.</p>
        </div>
      </div>
    </section>

    ${state.loading.saved ? skeletonGrid(6) : items.length ? `
      <div class="card-grid">
        ${items.map(mediaCard).join('')}
      </div>
    ` : `
      <section class="empty-state soft-card">
        <h2 style="margin-top: 0">No saved podcasts</h2>
        <p>Use the save button on a podcast page to add it here.</p>
        <div class="actions-row" style="justify-content: center">
          <a class="primary-button focus-ring" href="/" data-link>Browse catalog</a>
        </div>
      </section>
    `}
  `;
}

function renderNotFound() {
  return `
    <section class="empty-state soft-card">
      <h1 style="margin-top: 0; font-size: 2.5rem; letter-spacing: -0.05em">404</h1>
      <p>Page not found.</p>
      <div class="actions-row" style="justify-content: center">
        <a class="primary-button focus-ring" href="/" data-link>${icons.arrowLeft} Back to home</a>
      </div>
    </section>
  `;
}

function renderConnectionHint() {
  const hint = state.ui.connectionHint;
  return hint ? `
    <section class="section soft-card" style="padding: 0.9rem 1rem; border-color: rgba(248, 113, 113, 0.18); background: rgba(127, 29, 29, 0.14); color: #fecaca">
      ${escapeHtml(hint)}
    </section>
  ` : '';
}

function renderView() {
  const route = state.route.name;
  if (route === 'home') return renderHome();
  if (route === 'podcast') return renderDetail();
  if (route === 'login' || route === 'register' || route === 'verify') return renderAuth();
  if (route === 'upload') return renderUpload();
  if (route === 'profile') return renderProfile();
  if (route === 'library') return renderLibrary();
  return renderNotFound();
}

function renderApp() {
  app.innerHTML = `
    <div class="app-shell">
      ${renderHeader()}
      <main class="main">
        <div class="main-inner">
          ${renderConnectionHint()}
          ${renderView()}
        </div>
      </main>
      ${renderPlayerBar()}
      <div id="toasts" class="toast-stack" aria-live="polite" aria-atomic="true"></div>
    </div>
  `;
}

async function loadHome() {
  patchState('loading', { home: true });
  setState({ error: null });

  const query = state.ui.homeQuery.trim();
  const subject = state.ui.homeSubject;
  const educationLevel = state.ui.homeLevel;
  const localTracks = loadLocalTracks();

  updateRouteSearch({ query, subject, educationLevel });

  try {
    const [home, popular] = await Promise.all([
      api.listPodcasts({ query, subject, educationLevel }),
      api.popularPodcasts(subject).catch(() => [])
    ]);

    setState({
      data: { ...state.data, home, popular, localTracks },
      error: null
    });
    patchState('ui', { connectionHint: '' });
  } catch (error) {
    setState({
      error: error.message,
      data: { ...state.data, home: [], popular: [], localTracks }
    });
    patchState('ui', {
      connectionHint: 'Unable to load backend content. Guest demo mode still works.'
    });
  } finally {
    patchState('loading', { home: false });
  }
}

async function loadPodcastDetail(id) {
  patchState('loading', { detail: true });
  setState({ error: null });

  const local = state.data.localTracks.find((entry) => String(entry.id) === String(id));
  if (local) {
    setState({
      data: {
        ...state.data,
        detail: local,
        comments: []
      },
      error: null
    });
    patchState('loading', { detail: false });
    return;
  }

  try {
    const [detail, comments] = await Promise.all([
      api.getPodcast(id),
      api.getComments(id)
    ]);
    setState({
      data: { ...state.data, detail, comments },
      error: null
    });
    patchState('ui', { connectionHint: '' });
  } catch (error) {
    setState({
      error: error.message,
      data: { ...state.data, detail: null, comments: [] }
    });
  } finally {
    patchState('loading', { detail: false });
  }
}

async function loadSaved() {
  if (!state.session) return;
  patchState('loading', { saved: true });
  setState({ error: null });

  try {
    const saved = await api.savedPodcasts();
    setState({
      data: { ...state.data, saved },
      error: null
    });
    patchState('ui', { connectionHint: '' });
  } catch (error) {
    setState({ error: error.message });
    renderToast('Saved items unavailable', error.message, 'error');
  } finally {
    patchState('loading', { saved: false });
  }
}

async function loadMine() {
  if (!state.session) return;
  patchState('loading', { mine: true });
  setState({ error: null });

  try {
    const mine = await api.myPodcasts();
    setState({
      data: { ...state.data, mine },
      error: null
    });
    patchState('ui', { connectionHint: '' });
  } catch (error) {
    setState({ error: error.message });
    renderToast('My uploads unavailable', error.message, 'error');
  } finally {
    patchState('loading', { mine: false });
  }
}

async function playPodcast(item) {
  const podcast = typeof item === 'object' ? item : findTrackById(item);
  if (!podcast) return;

  if (state.player.current?.id !== podcast.id) {
    patchState('player', {
      current: podcast,
      currentTime: 0,
      duration: 0,
      loading: true
    });
    audio.src = podcast.audioUrl;
  }

  try {
    await audio.play();
    patchState('player', {
      current: podcast,
      playing: true
    });
  } catch {
    renderToast('Playback failed', 'Browser blocked playback or the file is unavailable.', 'error');
  }
}

function togglePlayback() {
  if (!state.player.current) return;
  if (audio.paused) {
    audio.play().catch(() => {});
  } else {
    audio.pause();
  }
}

function seekBy(deltaSeconds) {
  if (!Number.isFinite(audio.duration) || !audio.duration) return;
  audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + deltaSeconds));
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

async function submitRegistrationVerify(form) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const draft = state.ui.registerDraft;
    if (!draft) throw new Error('Registration draft is missing.');
    await api.registerVerify({
      email: form.email.value.trim(),
      verificationCode: form.verificationCode.value.trim()
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

async function submitUpload(form) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;

  try {
    const file = form.file.files[0];
    if (!file) throw new Error('Select an audio file first.');

    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const subject = form.subject.value;
    const educationLevel = form.educationLevel.value;

    const localTrack = {
      id: `local-${crypto.randomUUID()}`,
      title,
      description,
      subject,
      educationLevel,
      durationSeconds: 0,
      fileSizeBytes: file.size,
      authorLogin: state.session?.user?.login || 'Guest user',
      createdAt: new Date().toISOString(),
      score: 0,
      audioUrl: URL.createObjectURL(file),
      local: true
    };

    if (state.session) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title);
      fd.append('description', description);
      fd.append('subject', subject);
      fd.append('educationLevel', educationLevel);

      try {
        await api.uploadPodcast(fd);
        renderToast('Uploaded', 'Published to backend.', 'success');
        navigate('/', { replace: true });
        await loadHome();
        return;
      } catch {
        // Fall through to local demo mode.
      }
    }

    const updatedTracks = addLocalTrack(localTrack);
    saveLocalTracks(updatedTracks);
    setState({
      data: {
        ...state.data,
        localTracks: updatedTracks
      }
    });

    renderToast('Uploaded locally', 'You can play this file right now.', 'success');
    navigate(routePathToPodcast(localTrack.id));
  } catch (error) {
    renderToast('Upload failed', error.message, 'error');
  } finally {
    button.disabled = false;
  }
}

async function submitComment(form) {
  if (!ensureAuthenticated()) return;
  const text = form.text.value.trim();
  if (!text) return;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const id = form.dataset.id;
    await api.addComment(id, text);
    const comments = await api.getComments(id);
    setState({
      data: { ...state.data, comments }
    });
    form.reset();
    renderToast('Comment posted', 'Your comment is live.', 'success');
  } catch (error) {
    renderToast('Comment failed', error.message, 'error');
  } finally {
    button.disabled = false;
  }
}

async function votePodcast(id, vote) {
  if (!ensureAuthenticated()) return;
  try {
    const result = await api.votePodcast(id, Number(vote));
    if (state.data.detail && String(state.data.detail.id) === String(id)) {
      setState({
        data: {
          ...state.data,
          detail: { ...state.data.detail, score: result.score }
        }
      });
    }
    renderToast('Vote recorded', `New score: ${result.score}`, 'success');
    await refreshListsAfterInteraction(id);
  } catch (error) {
    renderToast('Vote failed', error.message, 'error');
  }
}

async function savePodcast(id) {
  if (!ensureAuthenticated()) return;
  try {
    const result = await api.toggleSavePodcast(id);
    renderToast('Saved', result.message || 'Saved list updated.', 'success');
    await loadSaved();
    if (state.route.name === 'profile') await loadMine();
  } catch (error) {
    renderToast('Save failed', error.message, 'error');
  }
}

async function deleteComment(commentId) {
  if (!ensureAuthenticated()) return;
  try {
    await api.deleteComment(commentId);
    if (state.data.detail) {
      const comments = await api.getComments(state.data.detail.id);
      setState({
        data: { ...state.data, comments }
      });
    }
    renderToast('Deleted', 'Comment removed.', 'success');
  } catch (error) {
    renderToast('Delete failed', error.message, 'error');
  }
}

async function refreshListsAfterInteraction(id) {
  if (state.route.name === 'home') await loadHome();
  if (state.route.name === 'podcast' && state.data.detail && String(state.data.detail.id) === String(id)) {
    const detail = await api.getPodcast(id);
    const comments = await api.getComments(id);
    setState({
      data: {
        ...state.data,
        detail,
        comments
      }
    });
  }
}

async function handleRoute() {
  const pathname = window.location.pathname;
  const route = syncRoute();

  clearToastStack();
  resetTransientUi();
  setSearchFiltersFromRoute();

  if (isProtectedRoute(route.name) && !state.session) {
    navigate('/login', { replace: true });
    return;
  }

  if (route.name === 'home') {
    await loadHome();
  } else if (route.name === 'podcast') {
    await loadPodcastDetail(route.params.id);
  } else if (route.name === 'library') {
    await loadSaved();
  } else if (route.name === 'profile') {
    await loadSaved();
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

  if (type === 'toggle-menu') {
    patchState('ui', { menuOpen: !state.ui.menuOpen });
    return;
  }

  switch (type) {
    case 'logout':
      clearSession();
      patchState('ui', { menuOpen: false });
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
      togglePlayback();
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
    case 'go-home':
      event.preventDefault();
      navigate('/');
      break;
    case 'retry-home':
      event.preventDefault();
      await loadHome();
      break;
    case 'resend-code':
      event.preventDefault();
      await resendVerificationCode();
      break;
    case 'delete-comment':
      event.preventDefault();
      await deleteComment(action.dataset.id);
      break;
    case 'open-podcast':
      if (event.target.closest('button')) return;
      navigate(routePathToPodcast(action.dataset.id));
      break;
    default:
      break;
  }
});

document.addEventListener('click', (event) => {
  if (state.ui.menuOpen && !event.target.closest('.menu-wrap')) {
    patchState('ui', { menuOpen: false });
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.ui.menuOpen) {
    patchState('ui', { menuOpen: false });
  }

  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;

  if (event.code === 'Space' && state.player.current) {
    event.preventDefault();
    togglePlayback();
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
    if (!audio.duration) return;
    const ratio = Number(target.value) / 100;
    audio.currentTime = audio.duration * ratio;
    patchState('player', { currentTime: audio.currentTime });
  }

  if (target.matches('input[type="range"][data-action="volume"]')) {
    const volume = Number(target.value);
    audio.volume = volume;
    patchState('player', { volume });
  }
});

document.addEventListener('submit', async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;

  const action = form.dataset.action;
  if (!action) return;

  event.preventDefault();

  if (action === 'search') {
    const value = form.query.value.trim();
    state.ui.homeQuery = value;
    updateRouteSearch({
      query: value,
      subject: state.ui.homeSubject,
      educationLevel: state.ui.homeLevel
    });
    navigate('/', { replace: true });
    return;
  }

  if (action === 'apply-filters') {
    state.ui.homeQuery = form.query.value.trim();
    state.ui.homeSubject = form.subject.value;
    state.ui.homeLevel = form.educationLevel.value;
    updateRouteSearch({
      query: state.ui.homeQuery,
      subject: state.ui.homeSubject,
      educationLevel: state.ui.homeLevel
    });
    await loadHome();
    return;
  }

  if (action === 'login') return submitLogin(form);
  if (action === 'register-init') return submitRegistrationInit(form);
  if (action === 'verify-registration') return submitRegistrationVerify(form);
  if (action === 'upload') return submitUpload(form);
  if (action === 'add-comment') return submitComment(form);
});

window.addEventListener('popstate', () => {
  handleRoute();
});

window.addEventListener('educast:unauthorized', () => {
  if (['profile', 'library'].includes(state.route.name)) {
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
