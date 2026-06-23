import { setState, state } from './store.js';

export function routeName(pathname) {
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

export function routeParams(pathname) {
  if (pathname.startsWith('/podcast/')) {
    return { id: pathname.split('/')[2] || '' };
  }
  return {};
}

export function isProtectedRoute(name) {
  return ['profile', 'library'].includes(name);
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
  return syncRoute();
}

export function currentPath() {
  return `${window.location.pathname}${window.location.search}`;
}

export function routePathToPodcast(id) {
  return `/podcast/${encodeURIComponent(String(id))}`;
}

export function isLocalPodcastId(id) {
  return String(id || '').startsWith('local-');
}

export function getRouteName() {
  return state.route.name;
}
