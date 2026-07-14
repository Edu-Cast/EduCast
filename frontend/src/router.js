import { setState, state } from './store.js';

export function routeName(pathname) {
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

export function routeParams(pathname) {
  if (pathname.startsWith('/podcast/')) {
    return { id: pathname.split('/')[2] || '' };
  }
  if (pathname.startsWith('/playlist/')) {
    return { id: pathname.split('/')[2] || '' };
  }
  return {};
}

export function isProtectedRoute(name) {
  return ['profile', 'upload'].includes(name);
}

export function syncRoute() {
  const pathname = window.location.pathname;
  const route = {
    name: routeName(pathname),
    path: pathname,
    search: new URLSearchParams(window.location.search),
    params: routeParams(pathname)
  };

  setState({ route });
  return route;
}

export function navigate(path, { replace = false } = {}) {
  if (replace) window.history.replaceState({}, '', path);
  else window.history.pushState({}, '', path);
  const route = syncRoute();
  window.dispatchEvent(new CustomEvent('educast:navigate', { detail: { route } }));
  return route;
}

export function currentPath() {
  return `${window.location.pathname}${window.location.search}`;
}

export function routePathToPodcast(id) {
  return `/podcast/${encodeURIComponent(String(id))}`;
}

export function routePathToPlaylist(id) {
  return `/playlist/${encodeURIComponent(String(id))}`;
}

export function isLocalPodcastId(id) {
  const value = String(id || '');
  return value.startsWith('local-') || value.startsWith('demo-');
}

export function getRouteName() {
  return state.route.name;
}
