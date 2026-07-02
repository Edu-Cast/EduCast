import { state, clearSession, setSession, setApiBase } from './store.js';
import { normalizeTagList } from './helpers.js';

const DEFAULT_BASE = import.meta.env.VITE_API_BASE?.trim() || '';
const BASE = state.apiBase || DEFAULT_BASE || '';

function getBase() {
  return state.apiBase || DEFAULT_BASE || BASE || '';
}

function buildUrl(path) {
  const base = getBase();
  return base ? new URL(path, base).toString() : path;
}

function parseResponseText(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(payload, status) {
  if (typeof payload === 'string' && payload.trim()) return payload;
  if (payload && typeof payload === 'object') {
    return payload.detail || payload.message || payload.error || payload.title || JSON.stringify(payload);
  }
  if (status === 400) return 'Request validation failed.';
  if (status === 401) return 'You are not authorized.';
  if (status === 403) return 'Access is denied.';
  if (status === 404) return 'Resource not found.';
  if (status >= 500) return 'Server error.';
  return 'Request failed.';
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = state.session?.token;

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData) && !(options.body instanceof URLSearchParams) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(buildUrl(path), { ...options, headers });
    const text = await response.text();
    const payload = parseResponseText(text);

    if (!response.ok) {
      if (response.status === 401) {
        clearSession();
        window.dispatchEvent(new CustomEvent('educast:unauthorized'));
      }
      throw new Error(getErrorMessage(payload, response.status));
    }

    if (response.status === 204) return null;
    return payload;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Backend is unreachable. Check the proxy target, backend process, and CORS configuration.');
    }
    throw error;
  }
}

function normalizePodcast(podcast) {
  if (!podcast) return null;
  return {
    id: podcast.demo || podcast.local ? podcast.id : Number(podcast.id),
    title: podcast.title || 'Untitled',
    description: podcast.description || '',
    subject: podcast.subject || 'OTHER',
    educationLevel: podcast.educationLevel || 'UNIVERSITY',
    durationSeconds: Number(podcast.durationSeconds || 0),
    fileSizeBytes: Number(podcast.fileSizeBytes || 0),
    authorLogin: podcast.authorLogin || 'Unknown',
    createdAt: podcast.createdAt || '',
    score: Number(podcast.score || 0),
    audioUrl: podcast.audioUrl || `${getBase()}/api/podcasts/${podcast.id}/audio`,
    tags: normalizeTagList(podcast.tags),
    transcription: podcast.transcription || '',
    isEducational: podcast.isEducational,
    validationReason: podcast.validationReason || '',
    mlLanguage: podcast.mlLanguage || '',
    demo: Boolean(podcast.demo),
    local: Boolean(podcast.local)
  };
}

function normalizeComment(comment) {
  if (!comment) return null;
  return {
    id: Number(comment.id),
    text: comment.text || '',
    authorLogin: comment.authorLogin || 'Unknown',
    createdAt: comment.createdAt || ''
  };
}

export const api = {
  request,
  normalizePodcast,
  normalizeComment,
  setApiBase,

  async login(email, password) {
    const payload = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    const session = {
      token: payload.token,
      user: {
        email: payload.email,
        login: payload.login
      }
    };

    setSession(session);
    return session;
  },

  async registerInit({ login, email, password }) {
    return request('/api/auth/register/init', {
      method: 'POST',
      body: JSON.stringify({ login, email, password })
    });
  },

  async registerVerify({ email, verificationCode }) {
    return request('/api/auth/register/verify', {
      method: 'POST',
      body: JSON.stringify({
        email,
        verificationCode: Number(verificationCode)
      })
    });
  },

  async registerResend(email) {
    return request('/api/auth/register/resend', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async listPodcasts({ query = '', subject = '', educationLevel = '' } = {}) {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (subject) params.set('subject', subject);
    if (educationLevel) params.set('educationLevel', educationLevel);

    const path = params.size ? `/api/podcasts/search?${params.toString()}` : '/api/podcasts';
    const payload = await request(path);
    return Array.isArray(payload) ? payload.map(normalizePodcast) : [];
  },

  async popularPodcasts(subject = '') {
    const path = subject ? `/api/podcasts/popular/${encodeURIComponent(subject)}` : '/api/podcasts/popular';
    const payload = await request(path);
    return Array.isArray(payload) ? payload.map(normalizePodcast) : [];
  },

  async getPodcast(id) {
    const payload = await request(`/api/podcasts/${id}`);
    return normalizePodcast(payload);
  },

  async getComments(id) {
    const payload = await request(`/api/podcasts/${id}/comments`);
    return Array.isArray(payload) ? payload.map(normalizeComment) : [];
  },

  async addComment(id, text) {
    return request(`/api/podcasts/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  },

  async deleteComment(commentId) {
    return request(`/api/podcasts/comments/${commentId}`, {
      method: 'DELETE'
    });
  },

  async votePodcast(id, vote) {
    return request(`/api/podcasts/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote })
    });
  },

  async toggleSavePodcast(id) {
    return request(`/api/podcasts/${id}/save`, {
      method: 'POST'
    });
  },

  async savedPodcasts() {
    const payload = await request('/api/podcasts/saved');
    return Array.isArray(payload) ? payload.map(normalizePodcast) : [];
  },

  async myPodcasts() {
    const payload = await request('/api/podcasts/my');
    return Array.isArray(payload) ? payload.map(normalizePodcast) : [];
  },

  async uploadPodcast(formData) {
    return request('/api/podcasts', {
      method: 'POST',
      body: formData
    });
  }
};
