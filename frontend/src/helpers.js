const svg = (body, attrs = 'viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"') => (
  `<svg ${attrs} aria-hidden="true">${body}</svg>`
);

export const subjects = [
  { value: '', label: 'All subjects' },
  { value: 'BIOLOGY', label: 'Biology' },
  { value: 'CHEMISTRY', label: 'Chemistry' },
  { value: 'PHYSICS', label: 'Physics' },
  { value: 'MATHEMATICS', label: 'Mathematics' },
  { value: 'GEOGRAPHY', label: 'Geography' },
  { value: 'HISTORY', label: 'History' },
  { value: 'LITERATURE', label: 'Literature' },
  { value: 'COMPUTER_SCIENCE', label: 'Computer Science' },
  { value: 'ECONOMICS', label: 'Economics' },
  { value: 'MATHEMATICAL_ANALYSIS', label: 'Mathematical Analysis' },
  { value: 'PHILOSOPHY', label: 'Philosophy' },
  { value: 'PSYCHOLOGY', label: 'Psychology' },
  { value: 'LAW', label: 'Law' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'LANGUAGES', label: 'Languages' },
  { value: 'ART', label: 'Art' },
  { value: 'MUSIC', label: 'Music' },
  { value: 'PHYSICAL_EDUCATION', label: 'Physical Education' },
  { value: 'SOCIOLOGY', label: 'Sociology' },
  { value: 'OTHER', label: 'Other' }
];

export const educationLevels = [
  { value: '', label: 'All education levels' },
  { value: 'SCHOOL', label: 'For school students' },
  { value: 'UNIVERSITY', label: 'For university students' }
];

export const icons = {
  logo: svg('<path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z"/><path d="M7 11v4.2c0 1.4 2.2 2.8 5 2.8s5-1.4 5-2.8V11"/><path d="M20 9.5v5"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/>'),
  lecture: svg('<rect x="4" y="4" width="12" height="16" rx="2"/><path d="M8 8h4M8 12h4M18 7v10"/>'),
  bookmark: svg('<path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1Z"/>'),
  playlist: svg('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M8 11h8"/><path d="m9 15 2 2 4-4"/>'),
  playlistShape: svg('<circle cx="9" cy="15" r="4"/><path d="M13 15 17 8l4 7h-8Z"/>'),
  upload: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5-6 5 6"/><path d="M12 4v12"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  settings: svg('<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V22a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H2a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.5h.1a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.5 1Z"/>'),
  download: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>'),
  play: svg('<path d="m8 5 11 7-11 7V5Z" fill="currentColor" stroke="none"/>'),
  pause: svg('<path d="M8 5v14M16 5v14"/>'),
  previous: svg('<path d="m19 20-10-8 10-8v16Z" fill="currentColor" stroke="none"/><path d="M5 5v14"/>'),
  next: svg('<path d="m5 4 10 8-10 8V4Z" fill="currentColor" stroke="none"/><path d="M19 5v14"/>'),
  volume: svg('<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M16 9a5 5 0 0 1 0 6"/>'),
  plus: svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),
  filters: svg('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>'),
  close: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  up: svg('<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>'),
  down: svg('<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>'),
  send: svg('<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>'),
  chevronRight: svg('<path d="m9 18 6-6-6-6"/>'),
  chevronDown: svg('<path d="m6 9 6 6 6-6"/>'),
  check: svg('<path d="m5 13 4 4L19 7"/>'),
  alert: svg('<path d="M12 9v4M12 17h.01"/><path d="M10.3 4.2 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z"/>'),
  copy: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
  trash: svg('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m6 6 1 15h10l1-15"/><path d="M10 11v6M14 11v6"/>'),
  leaf: svg('<path d="M5 21c8-2 13-8 14-18-9 1-15 6-16 14 0 2 1 3 2 4Z"/><path d="M9 15c2-3 5-5 9-7"/>'),
  plant: svg('<path d="M12 14v-4"/><path d="M12 10c-4.3-.1-6.3-2-6.4-5.6 3.6.1 5.5 2.1 6.4 5.6Z"/><path d="M12 10c4.3-.1 6.3-2 6.4-5.6-3.6.1-5.5 2.1-6.4 5.6Z"/><path d="M8 14h8l-1 6h-6l-1-6Z"/>'),
  flask: svg('<path d="M9 3h6"/><path d="M10 3v5l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-9V3"/><path d="M8 15h8"/>'),
  globe: svg('<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16"/>'),
  atom: svg('<circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><path d="M19 12c0 2-3.1 3.7-7 3.7S5 14 5 12s3.1-3.7 7-3.7 7 1.7 7 3.7Z"/><path d="M15.5 18c-1.7 1-4.6-1.2-6.5-4.5S6.8 7 8.5 6s4.6 1.2 6.5 4.5 2.2 6.5.5 7.5Z"/><path d="M8.5 18c-1.7-1-.5-4.3 1.5-7.5S14 5 15.5 6s.5 4.3-1.5 7.5S10 19 8.5 18Z"/>'),
  formula: svg('<path d="M4 6h16"/><path d="M8 6l4 12 4-12"/><path d="M6 18h12"/>')
};

export const subjectIconMap = {
  BIOLOGY: icons.plant,
  CHEMISTRY: icons.flask,
  GEOGRAPHY: icons.globe,
  PHYSICS: icons.atom,
  MATHEMATICS: icons.formula,
  MATHEMATICAL_ANALYSIS: icons.formula,
  COMPUTER_SCIENCE: icons.lecture,
  HISTORY: icons.logo,
  LITERATURE: icons.lecture,
  MUSIC: icons.play,
  OTHER: icons.logo
};

export const silentAudioUrl = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

export function formatDuration(seconds) {
  const total = Number(seconds);
  if (!Number.isFinite(total) || total < 0) return '0:00';
  const minutes = Math.floor(total / 60);
  const remaining = Math.floor(total % 60);
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}

export function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(size < 10 && index > 0 ? 1 : 0)} ${units[index]}`;
}

export function formatDate(value) {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatTimeAgo(value) {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  const diff = Math.max(0, Date.now() - parsed.getTime());
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'just now';
  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(diff / day);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function initials(text) {
  const source = String(text ?? '').trim();
  if (!source) return 'U';
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function clamp(text, length = 120) {
  const str = String(text ?? '');
  if (str.length <= length) return str;
  return `${str.slice(0, length - 3).trimEnd()}...`;
}

export function qs(value) {
  return encodeURIComponent(value ?? '');
}

export function byLabel(list, value) {
  return list.find((item) => item.value === value)?.label || value || '-';
}

export function subjectIcon(subject) {
  return subjectIconMap[subject] || icons.logo;
}

export function slugify(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

export function normalizeTagList(tags) {
  if (Array.isArray(tags)) {
    return [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))];
  }
  if (typeof tags === 'string') {
    return [...new Set(tags.split(',').map((tag) => tag.trim()).filter(Boolean))];
  }
  return [];
}

export function fallbackTags(item) {
  const tags = normalizeTagList(item?.tags);
  if (tags.length) return tags;

  const subject = byLabel(subjects, item?.subject);
  const level = byLabel(educationLevels, item?.educationLevel);
  return [subject, level, 'AI generated'].filter(Boolean);
}

export function sortByScore(items) {
  return [...items].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
}

export function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => {
    const id = String(item?.id ?? '');
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}