'use strict';

const PALETTE = ['#1a6846', '#a86b24', '#2457a6', '#8a4b2f', '#6b5330', '#0f6e6e'];

const AVATAR_TONES = [
  { from: '#2d9a68', to: '#0c3a28', solid: '#1a6846' },
  { from: '#d0923c', to: '#6a4012', solid: '#a86b24' },
  { from: '#3f86b8', to: '#153f62', solid: '#2457a6' },
  { from: '#b56c4a', to: '#5a2f20', solid: '#8a4b2f' },
  { from: '#2f8f8c', to: '#144443', solid: '#0f6e6e' },
  { from: '#957546', to: '#40311a', solid: '#6b5330' },
];

const icon = {
  back: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6 9 12l6 6"/></svg>',
  out: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6H5v12h4"/><path d="M10 12h9"/><path d="m16 8 4 4-4 4"/></svg>',
  key: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="14" r="3.2"/><path d="M11 14h9l-2 2 2 2h-3"/></svg>',
  edit: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L18 10l-4-4L4 16v4z"/><path d="m12.5 7.5 4 4"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/><circle cx="9.5" cy="7" r="3"/><path d="M20 20v-1a3.5 3.5 0 0 0-2.5-3.3"/><path d="M16 4.1a3 3 0 0 1 0 5.8"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.2"/><path d="M5 19.2v-.5A5 5 0 0 1 10 14h4a5 5 0 0 1 5 4.7v.5"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5A2.5 2.5 0 0 1 6.5 8H20"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19h16"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-4"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.2.6.7 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  download: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v10"/><path d="m8 10 4 4 4-4"/><path d="M5 18h14"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/><path d="M5.2 7.2 3.8 5.2M18.8 7.2l1.4-2"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v5c0 5 3.2 8.4 7 9.5 3.8-1.1 7-4.5 7-9.5V6z"/></svg>',
  clipboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="4" width="10" height="16" rx="2"/><path d="M9 4.5h6V3.2A1.2 1.2 0 0 0 13.8 2h-3.6A1.2 1.2 0 0 0 9 3.2z"/><path d="M10 10h4M10 14h4"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3.5 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.8 7.2 18.4l.9-5.4L4.2 9.2l5.4-.8z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4.5 4.5L19 7"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 7h14M5 12h14M5 17h14"/></svg>',
};

const Charts = window.JournalCharts || {
  fmtPct: (rate) => (rate == null ? '—' : `${String(rate).replace('.', ',')}%`),
  levelMeta: () => ({ label: '', hint: '' }),
  levelBadge: () => '',
  donut: () => '',
  meter: () => '',
  sparkline: () => '',
  legend: () => '',
  stackBars: () => '',
};

const S = {
  token: localStorage.getItem('journal_token') || '',
  me: null,
  hint: null,
  overview: null,
  journal: null,
  stats: null,
  studentStats: null,
  settings: null,
  calendar: null,
  calendarDay: null,
  calendarMonth: '',
  calendarView: localStorage.getItem('journal_cal_view') || 'month',
  calendarAnchor: '',
  activePairId: null,
  pairModalOpen: false,
  pairFilter: '',
  pairConfirm: null,
  pairCopyConfirm: null,
  lastPairMark: null,
  lastPairCopy: null,
  schedule: null,
  scheduleWeekType: '',
  scheduleWeekIndex: null,
  schedulePreview: null,
  subjectDupes: null,
  route: null,
  missing: false,
  fatal: '',
  q: '',
  groupFilter: '',
  subjectSort: localStorage.getItem('journal_subject_sort') || 'lessons',
  scheduleFocusDay: Number(localStorage.getItem('journal_schedule_day') || '0') || 0,
  audit: null,
  auditQ: '',
  auditAction: '',
  auditOffset: 0,
  teachers: null,
  teacherDetail: null,
  teacherSchedule: null,
  diary: null,
  accessResult: null,
  denied: false,
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function ruWord(n, one, few, many) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few;
  return many;
}

function ru(n, one, few, many) {
  return `${n} ${ruWord(n, one, few, many)}`;
}

function todayISO() {
  const date = new Date();
  const z = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${z(date.getMonth() + 1)}-${z(date.getDate())}`;
}

function dateParts(iso) {
  const [year, month, day] = String(iso).split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return {
    day,
    month: new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(date).replace('.', ''),
    weekday: new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(date),
  };
}

function fmtDate(iso) {
  const parts = dateParts(iso);
  return `${parts.weekday}, ${parts.day} ${parts.month}`;
}

function initials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '•';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function nameHash(name) {
  let hash = 0;
  for (const char of String(name)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

function avatarTone(name) {
  return AVATAR_TONES[nameHash(name) % AVATAR_TONES.length];
}

function colorOf(name) {
  return avatarTone(name).solid;
}

function avatarStyle(name) {
  const tone = avatarTone(name);
  return `--av-from:${tone.from};--av-to:${tone.to};background:linear-gradient(145deg,${tone.from} 0%,${tone.to} 100%)`;
}

function gradesOn() {
  const settings = S.settings || S.me?.settings || {};
  return settings.gradesEnabled !== false;
}

function mediaUrl(url) {
  if (!url) return '';
  if (!S.token) return url;
  const join = url.includes('?') ? '&' : '?';
  return `${url}${join}token=${encodeURIComponent(S.token)}`;
}

function avatarHtml(name, photoUrl, size = '') {
  const cls = `avatar${size ? ` ${size}` : ''}${photoUrl ? ' has-photo' : ''}`;
  const style = avatarStyle(name);
  if (photoUrl) {
    return `<span class="${cls}" style="${style}"><img src="${esc(mediaUrl(photoUrl))}" alt=""></span>`;
  }
  return `<span class="${cls}" style="${style}" aria-hidden="true"><em>${esc(initials(name))}</em></span>`;
}

function isTeacherRole() {
  return S.me?.role === 'teacher' || Boolean(S.me?.teacherId);
}

function mapGet(map, id) {
  if (!map) return undefined;
  if (map[id] != null) return map[id];
  return map[String(id)];
}

function markStatus(marks, studentId) {
  const value = mapGet(marks, studentId);
  if (!value) return '';
  return typeof value === 'string' ? value : (value.status || '');
}

function markComment(marks, studentId) {
  const value = mapGet(marks, studentId);
  if (!value || typeof value === 'string') return '';
  return value.comment || '';
}

function statusLabel(status, short = false) {
  if (status === 'present') return short ? 'Здесь' : 'Был';
  if (status === 'late') return 'Опоздал';
  if (status === 'absent') return short ? 'Нет' : 'Не был';
  if (status === 'excused') return short ? 'Уваж.' : 'Уважительная';
  return '—';
}

function avgOf(values) {
  if (!values.length) return null;
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return avg.toLocaleString('ru-RU', { maximumFractionDigits: 1 });
}

let toastTimer;
function toast(message, opts = {}) {
  const el = document.getElementById('toast');
  el.replaceChildren();
  const text = document.createElement('span');
  text.className = 'toast-text';
  text.textContent = message;
  el.appendChild(text);
  if (opts.action && opts.actionLabel) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-action';
    btn.textContent = opts.actionLabel;
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      el.hidden = true;
      Promise.resolve(opts.action()).catch(report);
    });
    el.appendChild(btn);
  }
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, opts.timeout || (opts.action ? 5200 : 2600));
}

function openModal(html) {
  document.body.classList.add('modal-open');
  document.getElementById('modal-root').innerHTML = html;
  // Только поля форм. Комментарии/поиск не трогаем — иначе sheet прыгает вверх.
  const input = document.querySelector('#modal-root form input:not([type="hidden"]), #modal-root form select');
  if (input) setTimeout(() => input.focus(), 40);
}

function closeModal() {
  document.body.classList.remove('modal-open');
  document.getElementById('modal-root').innerHTML = '';
  closeConfirmDialog();
}

function modalWrap(inner) {
  return `<div class="backdrop"><div class="sheet">${inner}</div></div>`;
}

function closeConfirmDialog() {
  const host = document.getElementById('confirm-root');
  if (host) host.innerHTML = '';
}

function openConfirmDialog({
  title,
  text,
  okLabel = 'Да',
  cancelLabel = 'Нет',
  okAct = 'close-confirm',
  cancelAct = 'close-confirm',
  danger = false,
  okAttrs = '',
  extra = '',
} = {}) {
  let host = document.getElementById('confirm-root');
  if (!host) {
    host = document.createElement('div');
    host.id = 'confirm-root';
    document.body.appendChild(host);
  }
  host.innerHTML = `<div class="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
    <button class="confirm-scrim" type="button" data-act="${cancelAct}" aria-label="Закрыть"></button>
    <div class="confirm-card">
      <div class="kicker">Подтверждение</div>
      <h2 id="confirm-title">${title}</h2>
      <p class="muted">${text}</p>
      ${extra}
      <div class="confirm-actions">
        <button class="btn btn-ghost btn-block" type="button" data-act="${cancelAct}">${cancelLabel}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-block" type="button" data-act="${okAct}" ${okAttrs}>${okLabel}</button>
      </div>
    </div>
  </div>`;
}

async function api(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(S.token ? { Authorization: `Bearer ${S.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    const error = new Error('Нет связи с сервером');
    error.status = 0;
    throw error;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Ошибка');
    error.status = response.status;
    throw error;
  }
  return data;
}

function parseHash() {
  const hash = location.hash || '#/';
  let match;
  if ((match = hash.match(/^#\/subject\/(\d+)\/lesson\/(\d+)$/))) {
    return { name: 'lesson', subjectId: Number(match[1]), lessonId: Number(match[2]) };
  }
  if ((match = hash.match(/^#\/subject\/(\d+)\/credit\/(\d+)$/))) {
    return { name: 'credit', subjectId: Number(match[1]), creditId: Number(match[2]) };
  }
  if ((match = hash.match(/^#\/subject\/(\d+)(?:\/(attendance|credits|grades))?$/))) {
    return { name: 'subject', subjectId: Number(match[1]), tab: match[2] || 'attendance' };
  }
  if ((match = hash.match(/^#\/subjects\/hub\/(.+)$/))) {
    let key = match[1];
    try { key = decodeURIComponent(key); } catch { /* keep raw */ }
    return { name: 'subject-hub', key };
  }
  if ((match = hash.match(/^#\/stats\/student\/(\d+)$/))) {
    return { name: 'student-stats', studentId: Number(match[1]) };
  }
  if ((match = hash.match(/^#\/stats(?:\/group\/(\d+))?$/))) {
    return { name: 'stats', groupId: match[1] ? Number(match[1]) : null };
  }
  if ((match = hash.match(/^#\/calendar\/(\d+)\/(\d{4}-\d{2}-\d{2})(?:\/pair\/(\d+))?$/))) {
    return {
      name: 'calendar-day',
      groupId: Number(match[1]),
      date: match[2],
      pairId: match[3] ? Number(match[3]) : null,
    };
  }
  if ((match = hash.match(/^#\/calendar(?:\/(\d+))?$/))) {
    return { name: 'calendar', groupId: match[1] ? Number(match[1]) : null };
  }
  if ((match = hash.match(/^#\/schedule(?:\/(\d+))?$/))) {
    return { name: 'schedule', groupId: match[1] ? Number(match[1]) : null };
  }
  if ((match = hash.match(/^#\/teachers\/(\d+)$/))) {
    return { name: 'teacher', teacherId: Number(match[1]) };
  }
  if (hash === '#/teachers') return { name: 'teachers' };
  if (hash === '#/teacher/schedule' || hash === '#/my-schedule') return { name: 'teacher-schedule' };
  if (hash === '#/diary/grades') return { name: 'diary-grades' };
  if (hash === '#/diary') return { name: 'diary' };
  if ((match = hash.match(/^#\/group\/(\d+)$/))) return { name: 'group', groupId: Number(match[1]) };
  if (hash === '#/groups') return { name: 'groups' };
  if (hash === '#/students') return { name: 'students' };
  if (hash === '#/subjects') return { name: 'subjects' };
  if (hash === '#/settings') return { name: 'settings' };
  if (hash === '#/users') return { name: 'users' };
  if (hash === '#/audit') return { name: 'audit' };
  return { name: 'home' };
}

async function load() {
  S.missing = false;
  S.route = parseHash();
  if (!S.token) {
    S.me = null;
    S.hint = await api('/api/hint');
    return;
  }
  S.me = await api('/api/me');
  S.settings = S.me.settings || null;
  S.overview = S.overview || null;
  const route = S.route;
  if (!routeAllowed(route)) {
    S.denied = true;
    try { S.overview = await api('/api/overview'); } catch { /* keep previous */ }
    return;
  }
  S.denied = false;
  if (route.name === 'subject' || route.name === 'lesson' || route.name === 'credit') {
    try {
      S.journal = await api(`/api/subjects/${route.subjectId}`);
      S.stats = await api(`/api/stats?subjectId=${route.subjectId}`);
    } catch (error) {
      if (error.status === 404) {
        S.journal = null;
        S.stats = null;
        S.missing = true;
        return;
      }
      throw error;
    }
  } else if (route.name === 'stats') {
    S.overview = await api('/api/overview');
    const q = route.groupId ? `?groupId=${route.groupId}` : '';
    S.stats = await api(`/api/stats${q}`);
  } else if (route.name === 'student-stats') {
    try {
      S.studentStats = await api(`/api/stats/students/${route.studentId}`);
      S.overview = await api('/api/overview');
    } catch (error) {
      if (error.status === 404) {
        S.studentStats = null;
        S.missing = true;
        return;
      }
      throw error;
    }
  } else if (route.name === 'diary' || route.name === 'diary-grades') {
    S.diary = await api('/api/me/diary');
    S.overview = await api('/api/overview');
  } else if (route.name === 'teachers') {
    S.teachers = await api('/api/teachers');
    S.overview = await api('/api/overview');
  } else if (route.name === 'teacher') {
    S.teacherDetail = await api(`/api/teachers/${route.teacherId}`);
    S.overview = await api('/api/overview');
  } else if (route.name === 'teacher-schedule') {
    if (S.me?.teacherId) {
      S.teacherSchedule = await api('/api/teachers/me/schedule');
    } else {
      S.missing = true;
      return;
    }
  } else if (route.name === 'settings') {
    S.settings = can('settings.manage') ? await api('/api/settings') : (S.me?.settings || {});
    S.overview = await api('/api/overview');
    if (can('subjects.manage') && can('users.manage')) {
      try { S.subjectDupes = await api('/api/subjects/duplicates'); } catch { S.subjectDupes = { clusters: [] }; }
    }
  } else if (route.name === 'users') {
    S.users = await api('/api/users');
    S.overview = await api('/api/overview');
  } else if (route.name === 'audit') {
    const params = new URLSearchParams({
      limit: '80',
      offset: String(S.auditOffset || 0),
    });
    if (S.auditQ) params.set('q', S.auditQ);
    if (S.auditAction) params.set('action', S.auditAction);
    S.audit = await api(`/api/audit?${params}`);
    S.overview = await api('/api/overview');
  } else if (route.name === 'schedule') {
    S.overview = await api('/api/overview');
    const groups = S.overview.groups || [];
    const groupId = route.groupId || groups[0]?.id || null;
    if (!S.scheduleWeekType) S.scheduleWeekType = 'upper';
    if (!groupId) {
      S.schedule = { count: 0, weekTypeToday: '', entries: [], plan: null };
    } else {
      const week = S.scheduleWeekType === 'all' ? '' : `&weekType=${encodeURIComponent(S.scheduleWeekType)}`;
      const wi = S.scheduleWeekIndex != null && S.scheduleWeekType !== 'all'
        ? `&weekIndex=${S.scheduleWeekIndex}`
        : '';
      S.schedule = await api(`/api/schedule?groupId=${groupId}${week}${wi}`);
      if (S.schedule?.plan?.weeks?.length && S.scheduleWeekIndex == null && S.scheduleWeekType !== 'all') {
        const match = S.schedule.plan.weeks.find((w) => w.legacyCode === S.scheduleWeekType || w.label === S.scheduleWeekType);
        if (match) S.scheduleWeekIndex = match.weekIndex;
      }
    }
    if (can('subjects.manage')) {
      try { S.subjectDupes = await api('/api/subjects/duplicates'); } catch { S.subjectDupes = { clusters: [] }; }
    } else {
      S.subjectDupes = { clusters: [] };
    }
  } else if (route.name === 'calendar' || route.name === 'calendar-day') {
    S.overview = await api('/api/overview');
    const groups = S.overview.groups || [];
    const groupId = route.groupId || groups[0]?.id;
    if (!groupId) {
      S.calendar = null;
      S.calendarDay = null;
      return;
    }
    if (!S.calendarMonth) S.calendarMonth = todayISO().slice(0, 7);
    if (route.name === 'calendar-day') {
      S.calendarMonth = route.date.slice(0, 7);
      S.calendarDay = await api(`/api/calendar/day?groupId=${groupId}&date=${route.date}`);
      S.calendar = await api(`/api/calendar?groupId=${groupId}&month=${S.calendarMonth}`);
      S.activePairId = route.pairId || S.activePairId;
    } else {
      S.calendar = await api(`/api/calendar?groupId=${groupId}&month=${S.calendarMonth}`);
      S.calendarDay = null;
      if (!route.groupId && groups[0]) {
        /* keep URL clean on first open */
      }
    }
  } else {
    S.overview = await api('/api/overview');
    if (route.name === 'subjects' && can('subjects.manage')) {
      try { S.subjectDupes = await api('/api/subjects/duplicates'); } catch { S.subjectDupes = { clusters: [] }; }
    }
    if (route.name === 'home') {
      S.stats = S.stats || null;
      if (isStudentRole()) {
        try { S.diary = await api('/api/me/diary'); } catch { S.diary = null; }
        if ((S.overview.groups || []).length) {
          const groupId = S.overview.groups[0].id;
          try {
            S.calendarDay = await api(`/api/calendar/day?groupId=${groupId}&date=${todayISO()}`);
          } catch {
            S.calendarDay = null;
          }
        }
      }
    }
  }
}

async function boot() {
  S._pairScroll = document.querySelector('.pair-modal-people')?.scrollTop || 0;
  const keepPairOpen = S.pairModalOpen && S.activePairId;
  closeModal();
  if (keepPairOpen) S.pairModalOpen = true;
  const previous = S.route?.name;
  S.fatal = '';
  try {
    await load();
  } catch (error) {
    if (error.status === 401) {
      localStorage.removeItem('journal_token');
      S.token = '';
      S.me = null;
      try { S.hint = await api('/api/hint'); } catch { /* остаётся экран ошибки */ }
    } else {
      S.fatal = error.message || 'Не удалось загрузить данные';
    }
  }
  if (S.route?.name !== previous) {
    S.q = '';
    S.groupFilter = '';
  }
  render();
  if (S.token && S.route?.name === 'home' && !S.stats && can('stats.view')) {
    api('/api/stats').then((stats) => {
      S.stats = stats;
      if (S.route?.name === 'home') render();
    }).catch(() => {});
  }
  maybeQuietScheduleSync();
}

/** Тихая сверка при открытии правки/календаря — если автосинк включён */
function maybeQuietScheduleSync() {
  if (!S.token || !canImportExcel()) return;
  const settings = S.settings || S.me?.settings || {};
  if (settings.scheduleAutoSync === false) return;
  const route = S.route?.name;
  if (route !== 'schedule' && route !== 'calendar' && route !== 'calendar-day') return;
  const groups = S.overview?.groups || [];
  const groupId = S.route?.groupId || groups[0]?.id;
  const group = groups.find((item) => item.id === groupId);
  if (!group?.scheduleCode) return;
  const last = Number(group.scheduleSyncedAt || 0);
  const mins = Number(settings.scheduleAutoSyncMinutes) || 5;
  if (last && Date.now() - last < Math.min(mins, 3) * 60_000) return;
  if (S._quietSyncBusy) return;
  S._quietSyncBusy = true;
  api('/api/schedule/autosync', {
    method: 'POST',
    body: { groupId },
  }).then(async (summary) => {
    if (summary?.updated > 0) {
      toast(`Расписание обновлено из Excel`);
      await reload();
    } else if (S.overview) {
      const g = (S.overview.groups || []).find((item) => item.id === groupId);
      if (g) {
        g.scheduleSyncedAt = Date.now();
        g.scheduleSyncError = '';
        if (S.route?.name === 'schedule') render();
      }
    }
  }).catch(() => {}).finally(() => {
    S._quietSyncBusy = false;
  });
}

async function reload() {
  const y = window.scrollY;
  const table = document.querySelector('.table-scroll');
  const left = table?.scrollLeft || 0;
  const top = table?.scrollTop || 0;
  await load();
  render();
  window.scrollTo(0, y);
  const next = document.querySelector('.table-scroll');
  if (next) {
    next.scrollLeft = left;
    next.scrollTop = top;
  }
}

function navOn(key) {
  const name = S.route?.name;
  if (key === 'home') return name === 'home';
  if (key === 'groups') return name === 'groups' || name === 'group';
  if (key === 'students') return name === 'students';
  if (key === 'teachers') return name === 'teachers' || name === 'teacher';
  if (key === 'my-schedule') return name === 'teacher-schedule';
  if (key === 'stats') return name === 'stats' || name === 'student-stats';
  if (key === 'diary') return name === 'diary' || name === 'diary-grades';
  if (key === 'calendar') return name === 'calendar' || name === 'calendar-day';
  if (key === 'schedule-edit') return name === 'schedule';
  if (key === 'settings') return name === 'settings' || name === 'users' || name === 'audit';
  if (key === 'subjects') {
    return name === 'subjects' || name === 'subject-hub' || name === 'subject' || name === 'lesson' || name === 'credit';
  }
  return false;
}

function navItem(key, href, label, glyph) {
  if (!canNav(key)) return '';
  return `<a href="${href}" class="${navOn(key) ? 'on' : ''}" ${navOn(key) ? 'aria-current="page"' : ''}>${glyph}<span>${label}</span></a>`;
}

function moreLink(key, href, label, glyph) {
  if (!canNav(key)) return '';
  return `<a class="more-link" href="${href}">${glyph}<span>${label}</span></a>`;
}

function brandName() {
  return S.me?.settings?.institutionName
    || S.settings?.institutionName
    || S.hint?.institutionName
    || 'Журнал';
}

function brandSub() {
  return S.me?.settings?.institutionSubtitle
    || S.settings?.institutionSubtitle
    || S.hint?.institutionSubtitle
    || '';
}

function pageTitle() {
  const route = S.route || { name: 'home' };
  if (route.name === 'groups' || route.name === 'group') return route.name === 'group' ? 'Группа' : 'Группы';
  if (route.name === 'students') return 'Ученики';
  if (route.name === 'teachers') return 'Педагоги';
  if (route.name === 'teacher') return 'Педагог';
  if (route.name === 'teacher-schedule') return 'Моё расписание';
  if (route.name === 'subjects' || route.name === 'subject-hub') return 'Предметы';
  if (route.name === 'stats') return 'Электронный дневник';
  if (route.name === 'student-stats') return 'Карточка ученика';
  if (route.name === 'diary') return 'Мои пропуски';
  if (route.name === 'diary-grades') return 'Мои оценки';
  if (route.name === 'calendar' || route.name === 'calendar-day') {
    return isStudentRole() || !can('attendance.mark') ? 'Расписание' : 'Пары';
  }
  if (route.name === 'schedule') return 'Правка пар';
  if (route.name === 'settings') return isStudentRole() ? 'Профиль' : 'Настройки';
  if (route.name === 'users') return 'Пользователи';
  if (route.name === 'audit') return 'Журнал изменений';
  if (route.name === 'subject') {
    if (route.tab === 'credits') return 'Зачёты';
    if (route.tab === 'grades') return 'Оценки';
    return 'Посещаемость';
  }
  if (route.name === 'lesson') return 'Занятие';
  if (route.name === 'credit') return 'Зачёт';
  return 'Обзор';
}

function backHref() {
  const route = S.route;
  if (!route) return '';
  if (route.name === 'group') return '#/groups';
  if (route.name === 'lesson') return `#/subject/${route.subjectId}/attendance`;
  if (route.name === 'credit') return `#/subject/${route.subjectId}/credits`;
  if (route.name === 'student-stats') {
    return S.route.fromGroup ? `#/stats/group/${S.studentStats?.student?.groupId}` : '#/stats';
  }
  if (route.name === 'teacher') return '#/teachers';
  if (route.name === 'teacher-schedule') return '#/';
  if (route.name === 'diary' || route.name === 'diary-grades') return '#/';
  if (route.name === 'calendar-day') {
    return `#/calendar/${route.groupId}`;
  }
  if (route.name === 'schedule') {
    return route.groupId ? `#/calendar/${route.groupId}` : '#/calendar';
  }
  if (route.name === 'users' || route.name === 'audit') return '#/settings';
  if (route.name === 'stats' && route.groupId) return '#/stats';
  if (route.name === 'subject-hub') return '#/subjects';
  if (route.name === 'subject') {
    const subject = S.journal?.subject;
    const siblings = S.journal?.siblings || [];
    if (subject && siblings.length > 1) {
      return `#/subjects/hub/${encodeURIComponent(normalizeSubjectKey(subject.name))}`;
    }
    const groupId = subject?.groupId;
    return groupId ? `#/group/${groupId}` : '#/subjects';
  }
  return '';
}

function loginHtml() {
  const hint = S.hint || {};
  const title = hint.institutionName || 'Классный журнал';
  const lead = hint.institutionSubtitle || 'Посещаемость, зачёты и оценки';
  return `<div class="login-screen">
    <div class="login-bg" aria-hidden="true"></div>
    <div class="login-wrap">
      <div class="login-hero">
        <span class="logo" aria-hidden="true">Ж</span>
        <div class="login-glow" aria-hidden="true"></div>
      </div>
      <div class="login-brand">
        <div class="kicker">Электронный журнал</div>
        <h1>${esc(title)}</h1>
        <p class="lead">${esc(lead)}</p>
      </div>
      <form class="login-card" data-form="login" novalidate>
        <div id="login-error" class="form-error" hidden></div>
        <label class="field"><span>Логин или email</span><input name="username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" inputmode="text" required autofocus></label>
        <label class="field"><span>Пароль</span><input name="password" type="password" autocomplete="current-password" required enterkeyhint="go"></label>
        <button class="btn btn-primary btn-block" type="submit" id="login-submit">Войти</button>
      </form>
    </div>
  </div>`;
}

function fatalHtml() {
  return `<div class="login-screen">
    <div class="login-bg" aria-hidden="true"></div>
    <div class="login-wrap">
      <span class="logo">Ж</span>
      <h1>Нет связи</h1>
      <p class="lead">${esc(S.fatal || 'Не удалось открыть журнал')}</p>
      <button class="btn btn-primary" type="button" data-act="retry">Повторить</button>
    </div>
  </div>`;
}

function shell(content, fab) {
  const back = backHref();
  const name = brandName();
  const sub = brandSub();
  const roleLabel = roleTitle(S.me?.role);
  const student = isStudentRole();
  const moreKeys = new Set(['students', 'teachers', 'teacher', 'subjects', 'stats', 'student-stats', 'settings', 'users', 'audit', 'teacher-schedule', 'schedule']);
  const primaryKeys = student
    ? new Set(['home', 'calendar', 'calendar-day', 'diary', 'diary-grades', 'settings'])
    : new Set(['home', 'groups', 'group', 'calendar', 'calendar-day']);
  const moreOn = moreKeys.has(S.route?.name) && !primaryKeys.has(S.route?.name);
  const sideMain = student
    ? [
      navItem('home', '#/', 'Главная', icon.home),
      navItem('calendar', '#/calendar', 'Расписание', icon.cal),
      navItem('diary', '#/diary', 'Пропуски', icon.clipboard),
      canNav('diary-grades') ? navItem('diary', '#/diary/grades', 'Оценки', icon.star) : '',
      navItem('settings', '#/settings', 'Профиль', icon.user),
    ].filter(Boolean).join('')
    : [
      navItem('home', '#/', 'Главная', icon.home),
      navItem('groups', '#/groups', 'Группы', icon.grid),
      navItem('calendar', '#/calendar', can('attendance.mark') ? 'Пары' : 'Расписание', icon.cal),
      navItem('stats', '#/stats', 'Дневник', icon.chart),
    ].filter(Boolean).join('');
  const sideExtra = student ? '' : [
    navItem('students', '#/students', 'Ученики', icon.user),
    navItem('teachers', '#/teachers', 'Педагоги', icon.users),
    navItem('subjects', '#/subjects', 'Предметы', icon.book),
    navItem('my-schedule', '#/teacher/schedule', 'Мои пары', icon.clipboard),
    navItem('schedule-edit', '#/schedule', 'Правка сетки', icon.edit),
    navItem('users', '#/users', 'Пользователи', icon.shield),
    navItem('audit', '#/audit', 'Журнал изменений', icon.history),
    navItem('settings', '#/settings', 'Настройки', icon.gear),
  ].filter(Boolean).join('');
  const sideNav = `${sideMain}${sideExtra ? `<div class="nav-sep" role="separator"></div>${sideExtra}` : ''}`;
  const tabParts = student
    ? [
      navItem('home', '#/', 'Главная', icon.home),
      navItem('calendar', '#/calendar', 'Пары', icon.cal),
      navItem('diary', '#/diary', 'Пропуски', icon.clipboard),
      navItem('settings', '#/settings', 'Профиль', icon.user),
    ].filter(Boolean)
    : [
      navItem('home', '#/', 'Главная', icon.home),
      navItem('groups', '#/groups', 'Группы', icon.grid),
      navItem('calendar', '#/calendar', 'Пары', icon.cal),
      `<button type="button" class="tab-more${moreOn ? ' on' : ''}" data-act="open-more" aria-label="Ещё">${icon.more}<span>Ещё</span></button>`,
    ].filter(Boolean);
  const tabCount = Math.max(tabParts.length, 2);
  return `<div class="shell${student ? ' shell-student' : ''}">
    <aside class="sidebar">
      <div class="brand">
        <span class="logo" aria-hidden="true">Ж</span>
        <div>
          <strong>${esc(name)}</strong>
          <small>${esc(sub || roleLabel)}</small>
        </div>
      </div>
      <nav class="nav" aria-label="Разделы">${sideNav}</nav>
      <div class="side-foot">
        <button class="side-user" type="button" data-act="open-account" aria-label="Аккаунт">
          <span class="side-user-avatar" aria-hidden="true">${avatarHtml(S.me?.displayName || S.me?.username || '?', null, 'sm')}</span>
          <span class="side-user-meta">
            <span class="side-user-name">${esc(S.me?.displayName || S.me?.username || '')}</span>
            <span class="side-user-role">${esc(roleLabel)}</span>
          </span>
        </button>
      </div>
    </aside>
    <div class="main">
      <header class="topbar">
        ${back ? `<a class="icon-btn" href="${back}" aria-label="Назад">${icon.back}</a>` : '<span class="logo top-logo" aria-hidden="true">Ж</span>'}
        <div class="topbar-copy">
          <div class="topbar-kicker">${esc(name)}</div>
          <h1>${esc(pageTitle())}</h1>
        </div>
        <button class="icon-btn" type="button" data-act="open-account" aria-label="Аккаунт">${icon.user}</button>
        ${student ? '' : `<button class="icon-btn" type="button" data-act="open-more" aria-label="Меню">${icon.menu}</button>`}
      </header>
      <div class="content${fab ? ' has-fab' : ''} page-enter">${content}</div>
    </div>
    <nav class="tabbar" style="--tabs:${tabCount}" aria-label="Навигация">${tabParts.join('')}</nav>
    ${fab || ''}
  </div>`;
}

function pairsHub(groupId, active) {
  const g = groupId ? `/${groupId}` : '';
  const canEdit = can('schedule.manage') || canImportExcel();
  const viewLabel = isStudentRole() || !can('attendance.mark') ? 'Расписание' : 'Отметки';
  return `<div class="tabs hub-tabs">
    <a href="#/calendar${g}" class="${active === 'calendar' ? 'on' : ''}">${viewLabel}</a>
    ${canEdit
      ? `<a href="#/schedule${g}" class="${active === 'schedule' ? 'on' : ''}">Правка</a>`
      : ''}
  </div>`;
}

function missingHtml() {
  return `<div class="empty"><h2>Не найдено</h2><p>Запись уже удалена или ссылка неверная.</p><a class="btn btn-primary" href="#/">На обзор</a></div>`;
}

function hiddenByQuery(text) {
  const q = S.q.trim().toLowerCase();
  return q && !String(text).toLowerCase().includes(q);
}

function homePage() {
  const { groups, students, subjects } = S.overview;
  const totals = S.stats?.totals;
  if (!groups.length) {
    return `<section class="empty home-start">
        <div class="kicker">${esc(brandName())}</div>
        <h2>С чего начать</h2>
        <p>${isStudentRole()
          ? 'Попросите администратора назначить вам учебную группу — тогда здесь появится расписание.'
          : 'Создайте группу, добавьте учеников и соберите расписание — дальше отмечайте пары за минуты.'}</p>
        ${can('groups.manage') ? '<button class="btn btn-primary btn-block" type="button" data-act="add-group">Создать группу</button>' : '<p class="muted">Попросите администратора назначить вам группы.</p>'}
      </section>`;
  }
  if (isStudentRole()) {
    const day = S.calendarDay;
    const group = day?.group || groups[0];
    const pairs = day?.pairs || [];
    const diary = S.diary;
    const att = diary?.attendance;
    const pairCards = pairs.length
      ? pairs.map((pair) => `<article class="today-pair" style="--pair-accent:${colorOf(pair.subjectName)}">
          <div class="today-pair-num">${pair.pairNum}</div>
          <div class="today-pair-body">
            <strong>${esc(pair.subjectName)}</strong>
            <div class="muted">${esc([
              pair.timeStart && pair.timeEnd ? `${pair.timeStart}–${pair.timeEnd}` : '',
              pair.lessonKind,
              pair.room ? `ауд. ${pair.room}` : '',
              pair.teacher,
            ].filter(Boolean).join(' · '))}</div>
          </div>
        </article>`).join('')
      : '<div class="empty soft"><h2>Сегодня пар нет</h2><p>Откройте расписание на неделю.</p></div>';
    return `<section class="home-hero student-hero diary-home">
        <div class="home-hero-copy">
          <div class="kicker">${esc(group?.name || brandName())} · электронный дневник</div>
          <h2>Привет${diary?.student?.fullName ? `, ${esc(diary.student.fullName.split(' ')[0])}` : ''}!</h2>
          <p>${esc(fmtDate(todayISO()))} · явка ${Charts.fmtPct(att?.rate)}</p>
        </div>
        <div class="home-hero-actions">
          <a class="btn btn-primary" href="#/calendar/${group?.id || ''}">Неделя</a>
          <a class="btn btn-ghost home-hero-ghost" href="#/diary">Пропуски</a>
          ${gradesOn() ? '<a class="btn btn-ghost home-hero-ghost" href="#/diary/grades">Оценки</a>' : ''}
        </div>
      </section>
      ${att ? `<div class="mini-kpis diary-kpis home-diary-kpis">
        <div><b>${att.absent || 0}</b><span>пропусков</span></div>
        <div><b>${att.late || 0}</b><span>опозданий</span></div>
        <div><b>${att.excused || 0}</b><span>уваж.</span></div>
        <div><b class="level-text-${esc(att.level)}">${Charts.fmtPct(att.rate)}</b><span>явка</span></div>
      </div>` : ''}
      <div class="section-head"><h2>Сегодня</h2></div>
      <div class="today-pairs">${pairCards}</div>`;
  }
  const risk = (S.stats?.students || []).filter((row) => row.level === 'bad' || row.level === 'warn').slice(0, 3);
  const meta = totals?.rate != null
    ? `Явка ${Charts.fmtPct(totals.rate)} · ${ru(students.length, 'ученик', 'ученика', 'учеников')}`
    : `${ru(groups.length, 'группа', 'группы', 'групп')} · ${ru(students.length, 'ученик', 'ученика', 'учеников')}`;
  return `<section class="home-hero">
      <div class="home-hero-copy">
        <div class="kicker">${esc(brandName())}</div>
        <h2>Сегодня</h2>
        <p>${esc(meta)}</p>
      </div>
      <div class="home-hero-actions">
        <a class="btn btn-primary" href="#/calendar">${can('attendance.mark') ? 'Отметить пары' : 'Расписание'}</a>
        ${can('schedule.manage') || canImportExcel() ? '<a class="btn btn-ghost home-hero-ghost" href="#/schedule">Правка сетки</a>' : ''}
      </div>
    </section>
    <div class="quick-grid">
      ${canNav('groups') ? `<a class="quick" href="#/groups">${icon.grid}<strong>${groups.length}</strong><span>Группы</span></a>` : ''}
      ${canNav('students') ? `<a class="quick" href="#/students">${icon.user}<strong>${students.length}</strong><span>Ученики</span></a>` : ''}
      ${canNav('subjects') ? `<a class="quick" href="#/subjects">${icon.book}<strong>${clusterSubjectsByName(subjects).length}</strong><span>Предметы</span></a>` : ''}
      ${canNav('stats') ? `<a class="quick" href="#/stats">${icon.chart}<strong>${totals?.rate != null ? Charts.fmtPct(totals.rate) : '—'}</strong><span>Явка</span></a>` : ''}
      ${canNav('calendar') ? `<a class="quick" href="#/calendar">${icon.cal}<strong>${can('attendance.mark') ? 'Отметки' : 'Сетка'}</strong><span>${can('attendance.mark') ? 'Пары' : 'Расписание'}</span></a>` : ''}
      ${canNav('teachers') ? `<a class="quick" href="#/teachers">${icon.users}<strong>Каталог</strong><span>Педагоги</span></a>` : ''}
    </div>
    ${risk.length && canNav('stats') ? `<div class="section-head"><h2>Внимание</h2><a href="#/stats">Все</a></div>
      <div class="list">${risk.map(studentStatCard).join('')}</div>` : ''}
    ${canNav('groups') ? `<div class="section-head"><h2>Группы</h2><a href="#/groups">Все</a></div>
    <div class="list">${groups.slice(0, 4).map(groupCard).join('')}</div>` : ''}`;
}

function groupCard(group) {
  const canEdit = can('groups.rename') || can('groups.manage') || can('elders.appoint');
  const bindOk = excelOn() && (group.scheduleBound || group.scheduleCode);
  const bindLabel = !excelOn()
    ? ''
    : (bindOk
      ? `↔ ${group.scheduleCode}${group.scheduleAliases?.length ? ` +${group.scheduleAliases.length}` : ''}`
      : 'Excel не привязан');
  const years = group.studyYears || '';
  const badges = [
    group.archived ? '<span class="group-badge archive">Архив</span>' : '',
    group.course ? `<span class="group-badge course">${esc(group.course)} курс</span>` : '',
    years ? `<span class="group-badge years">${esc(years)}</span>` : '',
  ].filter(Boolean).join('');
  return `<article class="card row-card group-card diary-card${group.archived ? ' is-archived' : ''}">
    <a class="card-main group-card-main" href="#/group/${group.id}">
      <div class="group-card-mark" aria-hidden="true">${esc((group.name || '?').slice(0, 2).toUpperCase())}</div>
      <div class="group-card-copy">
        <strong>${esc(group.name)}</strong>
        <span class="muted group-card-meta">${group.elderName ? `Староста ${esc(group.elderName)}` : 'Без старосты'}${bindLabel ? ` · ${esc(bindLabel)}` : ''}</span>
        ${badges ? `<div class="group-card-badges">${badges}</div>` : ''}
        <div class="group-card-stats">
          <span><b>${group.studentCount || 0}</b> уч.</span>
          <span><b>${group.subjectCount || 0}</b> предм.</span>
          <span><b>${group.scheduleCount || 0}</b> пар</span>
        </div>
      </div>
    </a>
    ${canEdit ? `<button class="icon-btn dark group-card-edit" type="button" data-act="edit-group" data-id="${group.id}" aria-label="Настройки группы">${icon.edit}</button>` : ''}
  </article>`;
}

function normalizeSubjectKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»""„‟‹›'\u0060´]/g, '')
    .replace(/№\s*/g, ' ')
    .replace(/[.,;:!?()[\]{}]/g, ' ')
    .replace(/[-–—_/\\|+＋]+/g, ' ')
    .replace(/(?:^|\s)(?:лекция|лекции|лекц|практика|практики|практ|семинар|семинары|сем|лабораторная|лабораторные|лаб|консультация|конс)(?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function subjectCountPills(row) {
  return `<span class="count-row">
    <span class="count-pill">${row.lessonCount || 0}<small>зан.</small></span>
    <span class="count-pill">${row.scheduleCount || 0}<small>пар</small></span>
    <span class="count-pill">${row.creditCount || 0}<small>зач.</small></span>
    <span class="count-pill">${row.workCount || 0}<small>оц.</small></span>
  </span>`;
}

function subjectCard(subject) {
  return `<article class="card row-card subject-card" data-search="${esc(`${subject.name} ${subject.groupName}`)}" data-group="${subject.groupId}">
    <a class="card-main" href="#/subject/${subject.id}/attendance">
      <strong>${esc(subject.name)}</strong>
      <span class="muted">${esc(subject.groupName)}</span>
      ${subjectCountPills(subject)}
    </a>
    ${can('subjects.manage') ? `<button class="icon-btn dark" type="button" data-act="edit-subject" data-id="${subject.id}" aria-label="Изменить предмет">${icon.edit}</button>` : ''}
  </article>`;
}

function clusterSubjectsByName(subjects) {
  const buckets = new Map();
  for (const subject of subjects || []) {
    const key = normalizeSubjectKey(subject.name) || `id:${subject.id}`;
    const list = buckets.get(key) || [];
    list.push(subject);
    buckets.set(key, list);
  }
  return [...buckets.entries()].map(([key, items]) => {
    const sorted = [...items].sort((a, b) => a.groupName.localeCompare(b.groupName, 'ru') || a.id - b.id);
    const name = [...sorted].sort((a, b) => String(b.name || '').length - String(a.name || '').length || a.id - b.id)[0].name;
    return {
      key,
      name,
      items: sorted,
      lessonCount: sorted.reduce((sum, row) => sum + (Number(row.lessonCount) || 0), 0),
      scheduleCount: sorted.reduce((sum, row) => sum + (Number(row.scheduleCount) || 0), 0),
      creditCount: sorted.reduce((sum, row) => sum + (Number(row.creditCount) || 0), 0),
      workCount: sorted.reduce((sum, row) => sum + (Number(row.workCount) || 0), 0),
    };
  });
}

function subjectClusterCard(cluster) {
  const search = `${cluster.name} ${cluster.items.map((item) => item.groupName).join(' ')}`;
  const multi = cluster.items.length > 1;
  const href = multi
    ? `#/subjects/hub/${encodeURIComponent(cluster.key)}`
    : `#/subject/${cluster.items[0].id}/attendance`;
  if (!multi) {
    return `<article class="card row-card subject-card subject-cluster-card" data-search="${esc(search)}" data-key="${esc(cluster.key)}" data-group="${cluster.items[0].groupId}">
      <a class="card-main" href="${href}">
        <strong>${esc(cluster.name)}</strong>
        <span class="muted">${esc(cluster.items[0].groupName)}</span>
        ${subjectCountPills(cluster)}
      </a>
      ${can('subjects.manage') ? `<button class="icon-btn dark" type="button" data-act="edit-subject" data-id="${cluster.items[0].id}" aria-label="Изменить предмет">${icon.edit}</button>` : ''}
    </article>`;
  }
  return `<article class="card subject-cluster-card multi" data-search="${esc(search)}" data-key="${esc(cluster.key)}">
    <div class="subject-cluster-top">
      <a class="card-main subject-cluster-main" href="${href}">
        <strong>${esc(cluster.name)}</strong>
        <span class="muted">${ru(cluster.items.length, 'группа', 'группы', 'групп')} · откройте нужную</span>
        ${subjectCountPills(cluster)}
      </a>
    </div>
    <div class="subject-group-rows" role="list">
      ${cluster.items.map((item) => `<div class="subject-group-row" role="listitem">
        <a href="#/subject/${item.id}/attendance">
          <strong>${esc(item.groupName)}</strong>
          <span class="muted">${item.lessonCount || 0} зан. · ${item.scheduleCount || 0} пар${item.creditCount ? ` · ${item.creditCount} зач.` : ''}${item.workCount ? ` · ${item.workCount} оц.` : ''}</span>
        </a>
        ${can('subjects.manage') ? `<button class="icon-btn dark" type="button" data-act="edit-subject" data-id="${item.id}" aria-label="Изменить в группе ${esc(item.groupName)}">${icon.edit}</button>` : ''}
      </div>`).join('')}
    </div>
  </article>`;
}

function studentCard(student) {
  const hidden = hiddenByQuery(`${student.fullName} ${student.groupName}`);
  const access = student.hasAccess ? '<span class="access-pill on">доступ</span>' : '';
  return `<article class="card person-card diary-person" data-search="${esc(`${student.fullName} ${student.groupName}`)}" ${hidden ? 'hidden' : ''}>
    <a class="person-main" href="${can('stats.view') ? `#/stats/student/${student.id}` : `#/group/${student.groupId}`}">
      ${avatarHtml(student.fullName, student.photoUrl)}
      <div><strong>${esc(student.fullName)}</strong><div class="muted">${esc(student.groupName)} ${access}</div></div>
    </a>
    ${can('students.manage') ? `<button class="icon-btn dark" type="button" data-act="edit-student" data-id="${student.id}" aria-label="Изменить ученика">${icon.edit}</button>` : ''}
  </article>`;
}

function exportAttrs({ groupId, subjectId, studentId } = {}) {
  return [
    groupId ? `data-group="${groupId}"` : '',
    subjectId ? `data-subject="${subjectId}"` : '',
    studentId ? `data-student="${studentId}"` : '',
  ].filter(Boolean).join(' ');
}

function exportTile({ kind, title, hint, format = 'xlsx', primary = false, attrs = '' }) {
  return `<button class="export-tile${primary ? ' primary' : ''}" type="button" data-act="export" data-kind="${kind}" data-format="${format}" ${attrs}>
    <span class="export-tile-icon">${icon.download}</span>
    <span class="export-tile-copy">
      <strong>${title}</strong>
      <small>${hint}</small>
    </span>
  </button>`;
}

function exportToolbar({ groupId, subjectId, compact = false } = {}) {
  if (!can('stats.view')) return '';
  const attrs = exportAttrs({ groupId, subjectId });
  const scope = subjectId ? 'предмету' : (groupId ? 'группе' : 'всем группам');
  const tiles = [
    exportTile({
      kind: 'workbook', title: 'Excel · вся книга', hint: 'Явка, оценки, зачёты, список, расписание',
      primary: true, attrs,
    }),
    exportTile({ kind: 'summary', title: 'Сводка + матрица', hint: 'Таблица явки по занятиям', attrs }),
    exportTile({ kind: 'attendance', title: 'Посещаемость', hint: 'Сводка и детализация', attrs }),
    gradesOn() ? exportTile({ kind: 'grades', title: 'Оценки', hint: 'Все работы и баллы', attrs }) : '',
    exportTile({ kind: 'credits', title: 'Зачёты', hint: 'Зачёты и экзамены', attrs }),
    exportTile({ kind: 'roster', title: 'Список учеников', hint: 'ФИО, группа, доступ', attrs }),
    !subjectId ? exportTile({ kind: 'subjects', title: 'Предметы', hint: 'Занятия и пары', attrs }) : '',
    groupId && !subjectId ? exportTile({ kind: 'schedule', title: 'Расписание', hint: 'Сетка пар группы', attrs }) : '',
  ].filter(Boolean).join('');
  const csv = [
    ['summary', 'Сводка'],
    ['attendance', 'Явка'],
    gradesOn() ? ['grades', 'Оценки'] : null,
    ['credits', 'Зачёты'],
    ['roster', 'Список'],
  ].filter(Boolean).map(([kind, label]) => (
    `<button class="btn btn-ghost btn-small export-btn" type="button" data-act="export" data-kind="${kind}" ${attrs}>${label} CSV</button>`
  )).join('');
  return `<section class="export-panel card pad${compact ? ' compact' : ''}">
    <div class="export-panel-head">
      <div>
        <div class="kicker">Выгрузка</div>
        <strong>Excel и CSV по ${scope}</strong>
      </div>
      <span class="muted">Готовые таблицы для отчётов и печати</span>
    </div>
    <div class="export-grid">${tiles}</div>
    <details class="export-more">
      <summary>CSV · запасной формат</summary>
      <div class="export-bar csv-row">${csv}</div>
    </details>
  </section>`;
}

function studentExportToolbar(studentId) {
  if (!can('stats.view') && !isStudentRole()) return '';
  const attrs = exportAttrs({ studentId });
  return `<section class="export-panel card pad compact student-export">
    <div class="export-panel-head">
      <div>
        <div class="kicker">Выгрузка</div>
        <strong>Карточка ученика</strong>
      </div>
      <span class="muted">Excel с несколькими листами</span>
    </div>
    <div class="export-grid tight">
      ${exportTile({
        kind: 'student', title: 'Excel · карточка', hint: 'Явка, предметы, оценки, зачёты',
        primary: true, attrs,
      })}
      ${exportTile({
        kind: 'student', title: 'CSV', hint: 'Краткий отчёт', format: 'csv', attrs,
      })}
    </div>
  </section>`;
}

function canExportLists() {
  return can('stats.view') || can('students.manage') || can('subjects.manage') || can('teachers.manage') || can('groups.manage');
}

function listsExportToolbar({ groupId } = {}) {
  if (!canExportLists()) return '';
  const attrs = exportAttrs({ groupId });
  const gid = groupId ? Number(groupId) : null;
  const groupName = gid
    ? (S.overview?.groups || []).find((g) => Number(g.id) === gid)?.name
    : '';
  const tiles = [
    !groupId && (can('stats.view') || can('groups.manage'))
      ? exportTile({ kind: 'groups', title: 'Группы', hint: 'Составы и привязки', primary: true, attrs })
      : '',
    (can('stats.view') || can('students.manage'))
      ? exportTile({
        kind: 'roster',
        title: 'Ученики',
        hint: groupName ? `Список · ${groupName}` : 'Все доступные ученики',
        primary: !!groupId,
        attrs,
      })
      : '',
    (can('stats.view') || can('subjects.manage'))
      ? exportTile({ kind: 'subjects', title: 'Предметы', hint: 'Занятия и пары', attrs })
      : '',
    can('teachers.manage') && !groupId
      ? exportTile({ kind: 'teachers', title: 'Педагоги', hint: 'ФИО и группы', attrs })
      : '',
    groupId && can('stats.view')
      ? exportTile({ kind: 'workbook', title: 'Excel · группа', hint: 'Явка, оценки, список', attrs })
      : '',
  ].filter(Boolean).join('');
  if (!tiles) return '';
  return `<section class="export-panel card pad compact lists-export">
    <div class="export-panel-head">
      <div>
        <div class="kicker">Выгрузка</div>
        <strong>${groupName ? `Файлы · ${esc(groupName)}` : 'Списки Excel / CSV'}</strong>
      </div>
      <span class="muted">Скачивается сразу</span>
    </div>
    <div class="export-grid tight">${tiles}</div>
  </section>`;
}

function studentStatCard(student) {
  return `<article class="card student-stat diary-card level-border-${esc(student.level)}">
    <a class="student-stat-main" href="#/stats/student/${student.id}">
      ${avatarHtml(student.fullName, student.photoUrl, 'lg')}
      <div class="student-stat-copy">
        <div class="student-stat-top">
          <strong>${esc(student.fullName)}</strong>
          ${Charts.levelBadge(student.level)}
        </div>
        <div class="student-stat-meta muted">
          <span>${esc(student.groupName)}</span>
          <span>был ${student.attended}/${student.total}</span>
          <span>пропуск ${student.absent}</span>
          ${student.hasAccess ? '<span class="access-pill on">доступ</span>' : ''}
        </div>
        ${Charts.meter(student.rate, student.level)}
        ${Charts.sparkline(student.history)}
      </div>
    </a>
  </article>`;
}

function statsPage() {
  const data = S.stats;
  if (!data) return missingHtml();
  const { totals, students, groups, settings } = data;
  const groupFilter = S.route.groupId;
  const groupName = groupFilter
    ? (groups.find((item) => item.id === groupFilter)?.name || S.overview?.groups?.find((item) => item.id === groupFilter)?.name)
    : null;
  const groupChips = (() => {
    const all = S.overview?.groups || [];
    if (!all.length) return '';
    const items = [`<a class="chip${!groupFilter ? ' on' : ''}" href="#/stats">Все</a>`]
      .concat(all.map((group) => `<a class="chip${groupFilter === group.id ? ' on' : ''}" href="#/stats/group/${group.id}">${esc(group.name)}</a>`));
    return `<div class="chips diary-chips">${items.join('')}</div>`;
  })();
  const overview = `<section class="stats-hero diary-hero card pad">
    <div class="diary-hero-banner">
      <div>
        <div class="kicker">Электронный дневник</div>
        <h2>${esc(groupName || 'Все группы')}</h2>
        <p class="muted">Явка ${Charts.fmtPct(totals.rate)} · ${Charts.levelMeta(totals.level).label} · нажмите на ученика</p>
      </div>
      <div class="diary-hero-rate level-text-${esc(totals.level)}">${Charts.fmtPct(totals.rate)}</div>
    </div>
    <div class="stats-hero-grid">
      <div class="mini-kpis diary-kpis">
        <div><b>${totals.present}</b><span>был</span></div>
        <div><b>${totals.late}</b><span>опоздал</span></div>
        <div><b>${totals.excused || 0}</b><span>уваж.</span></div>
        <div><b class="bad-num">${totals.absent}</b><span>не был</span></div>
        <div><b>${totals.unmarked}</b><span>пусто</span></div>
      </div>
      <div class="stats-donut-wrap">${Charts.donut(totals)}${Charts.legend()}</div>
    </div>
    <div class="pulse-grid tight">
      <div class="pulse level-excellent"><b>${totals.excellent}</b><span>отлично</span></div>
      <div class="pulse level-good"><b>${totals.good}</b><span>хорошо</span></div>
      <div class="pulse level-warn"><b>${totals.warn}</b><span>внимание</span></div>
      <div class="pulse level-bad"><b>${totals.bad}</b><span>плохо</span></div>
    </div>
    <div class="threshold-note">Пороги: ≥${settings.attendanceExcellent}% отлично · ≥${settings.attendanceGood}% хорошо · ≥${settings.attendanceWarn}% внимание</div>
  </section>`;
  const groupCards = !groupFilter && groups.length ? `<div class="section-head"><h2>По группам</h2></div>
    <div class="group-rate-grid">${groups.map((group) => `
      <a class="card group-rate diary-group-card level-border-${esc(group.level)}" href="#/stats/group/${group.id}">
        <strong>${esc(group.name)}</strong>
        <div class="big-pct level-text-${esc(group.level)}">${Charts.fmtPct(group.rate)}</div>
        ${Charts.meter(group.rate, group.level)}
        <span class="muted">${ru(group.students, 'ученик', 'ученика', 'учеников')}</span>
      </a>`).join('')}</div>` : '';
  const ranking = students.length
    ? `<div class="section-head"><h2>Ученики</h2><span class="muted">${students.length}</span></div>
      <div class="chart-card card pad diary-compare">
        <div class="section-head tight"><h3>Сравнение явки</h3>${Charts.levelBadge(totals.level)}</div>
        ${Charts.stackBars(students)}
      </div>
      <div class="list student-stat-list diary-student-list">${students.map(studentStatCard).join('')}</div>`
    : `<div class="empty"><h2>Нет данных</h2><p>Добавьте учеников и отметьте занятия.</p></div>`;
  return `${groupChips}
    ${overview}
    ${groupCards}
    ${ranking}
    ${exportToolbar({ groupId: groupFilter || undefined })}`;
}

function studentAccessBlock(student) {
  if (!can('users.manage')) {
    return student.hasAccess
      ? `<div class="card pad access-card"><div class="kicker">Доступ</div><p>Ученику выдан вход в дневник${student.accessUsername ? `: <b>${esc(student.accessUsername)}</b>` : ''}.</p></div>`
      : '';
  }
  const result = S.accessResult;
  return `<section class="card pad access-card">
    <div class="kicker">Доступ в электронный дневник</div>
    <h3>${student.hasAccess ? 'Доступ уже есть' : 'Выдать доступ'}</h3>
    ${student.hasAccess ? `<p class="muted">Логин: <b>${esc(student.accessUsername || '—')}</b>${student.accessEmail ? ` · ${esc(student.accessEmail)}` : ''}${student.accessActive ? '' : ' · отключён'}</p>` : '<p class="muted">Простой временный пароль из 6 цифр. Можно войти по логину или email.</p>'}
    <form data-form="grant-student-access" data-id="${student.id}">
      <label class="field"><span>Логин</span><input name="username" maxlength="80" placeholder="ivanov" value="${esc(student.accessUsername || '')}" autocomplete="off"></label>
      <label class="field"><span>Email</span><input name="email" type="email" maxlength="160" placeholder="ученик@mail.ru" value="${esc(student.email || student.accessEmail || '')}" autocomplete="off"></label>
      <div class="row-actions">
        <button class="btn btn-primary" type="submit">${student.hasAccess ? 'Сбросить пароль / обновить' : 'Выдать доступ'}</button>
        ${student.hasAccess ? `<button class="btn btn-danger" type="button" data-act="revoke-student-access" data-id="${student.id}">Отозвать</button>` : ''}
      </div>
    </form>
    ${result && Number(result.studentId) === Number(student.id) ? `<div class="temp-pass-banner">
      <div class="kicker">Временный пароль</div>
      <div class="temp-pass">${esc(result.tempPassword)}</div>
      <p class="muted">${result.mailed ? 'Письмо отправлено на email.' : (result.mailError ? `Письмо не ушло: ${esc(result.mailError)}` : 'Передайте пароль ученику лично.')}</p>
      <p class="muted tight">Логин: <b>${esc(result.username)}</b></p>
    </div>` : ''}
  </section>`;
}

function studentNotesBlock(data, student) {
  if (!can('notes.manage')) return '';
  const notes = data.notes || [];
  return `<section class="card pad notes-card">
    <div class="kicker">Только для преподавателей</div>
    <h3>Заметки об ученике</h3>
    <form data-form="add-student-note" data-id="${student.id}">
      <label class="field"><span>Новая заметка</span><textarea name="body" rows="3" maxlength="2000" placeholder="Комментарий виден только педагогам…" required></textarea></label>
      <button class="btn btn-primary" type="submit">Сохранить заметку</button>
    </form>
    <div class="notes-list">${notes.length ? notes.map((note) => `
      <article class="note-item">
        <div class="note-meta"><strong>${esc(note.authorName)}</strong><span>${esc(fmtAuditWhen(note.createdAt))}</span></div>
        <p>${esc(note.body)}</p>
        <button class="btn btn-ghost btn-small" type="button" data-act="delete-student-note" data-student="${student.id}" data-id="${note.id}">Удалить</button>
      </article>`).join('') : '<p class="muted">Пока нет заметок.</p>'}</div>
  </section>`;
}

function studentPhotoBlock(student) {
  if (!can('students.manage')) return '';
  return `<div class="photo-actions">
    <label class="btn btn-ghost btn-small photo-upload-btn">Фото
      <input type="file" accept="image/jpeg,image/png,image/webp" hidden data-act-change="upload-student-photo" data-id="${student.id}">
    </label>
    ${student.photoUrl ? `<button class="btn btn-ghost btn-small" type="button" data-act="delete-student-photo" data-id="${student.id}">Убрать фото</button>` : ''}
  </div>`;
}

function studentStatsPage() {
  if (S.missing || !S.studentStats) return missingHtml();
  const data = S.studentStats;
  const student = data.student;
  const att = data.attendance || {
    present: 0, late: 0, absent: 0, excused: 0, unmarked: 0, rate: null, level: 'empty', total: 0, attended: 0, history: [],
  };
  const subjects = data.bySubject || [];
  const showGrades = gradesOn();
  const firstName = student.fullName.split(/\s+/)[0] || student.fullName;
  return `<section class="student-hero diary-profile profile-hero card pad level-border-${esc(att.level)}">
      <div class="profile-hero-banner">
        <div class="student-hero-top">
          ${avatarHtml(student.fullName, student.photoUrl, 'xl')}
          <div class="profile-hero-copy">
            <div class="kicker">Карточка ученика · ${esc(student.groupName)}${student.hasAccess ? ' · доступ' : ''}</div>
            <h2>${esc(student.fullName)}</h2>
            <div class="profile-hero-meta">
              ${Charts.levelBadge(att.level)}
              <a class="chip soft" href="#/group/${student.groupId}">Группа</a>
              ${can('stats.view') ? `<a class="chip soft" href="#/stats/group/${student.groupId}">Статистика группы</a>` : ''}
            </div>
            ${studentPhotoBlock(student)}
          </div>
        </div>
        <div class="profile-hero-rate level-text-${esc(att.level)}">
          <b>${Charts.fmtPct(att.rate)}</b>
          <span>явка</span>
        </div>
      </div>
      <div class="student-hero-grid">
        <div class="profile-chart">${Charts.donut(att)}${Charts.legend()}</div>
        <div>
          <p class="muted tight">${Charts.levelMeta(att.level).hint}</p>
          ${Charts.meter(att.rate, att.level)}
          <div class="mini-kpis diary-kpis">
            <div><b>${att.present}</b><span>был</span></div>
            <div><b>${att.late}</b><span>опоздал</span></div>
            <div><b>${att.excused || 0}</b><span>уваж.</span></div>
            <div><b class="bad-num">${att.absent}</b><span>не был</span></div>
            <div><b>${att.unmarked}</b><span>пусто</span></div>
            <div><b>${att.total || 0}</b><span>всего</span></div>
          </div>
        </div>
      </div>
      <div class="section-head tight"><h3>Лента занятий</h3><span class="muted">${firstName}</span></div>
      ${Charts.sparkline(att.history)}
    </section>
    ${studentExportToolbar(student.id)}
    ${studentAccessBlock(student)}
    ${studentNotesBlock(data, student)}
    <div class="section-head"><h2>По предметам</h2><span class="muted">${subjects.length}</span></div>
    ${subjects.length ? `<div class="list profile-subjects">${subjects.map((subject) => `
      <a class="card subject-rate diary-card level-border-${esc(subject.level)}" href="#/subject/${subject.id}/attendance">
        <div class="subject-rate-top">
          <strong>${esc(subject.name)}</strong>
          <span class="subject-rate-pct level-text-${esc(subject.level)}">${Charts.fmtPct(subject.rate)}</span>
        </div>
        ${Charts.levelBadge(subject.level)}
        ${Charts.meter(subject.rate, subject.level)}
        <div class="muted">был ${subject.present + subject.late}/${subject.total} · пропуск ${subject.absent}</div>
      </a>`).join('')}</div>` : '<p class="muted">Предметов в группе пока нет.</p>'}
    ${showGrades ? `<div class="section-head"><h2>Оценки и зачёты</h2></div>
    <div class="side-stats profile-side">
      <div class="card pad grade-stat-card">
        <div class="kicker">Средний балл</div>
        <div class="big-pct">${data.grades.average == null ? '—' : String(data.grades.average).replace('.', ',')}</div>
        <p class="muted">${ru(data.grades.count, 'оценка', 'оценки', 'оценок')}</p>
      </div>
      <div class="card pad grade-stat-card">
        <div class="kicker">Зачёты</div>
        <div class="big-pct">${data.credits.length}</div>
        <p class="muted">результатов</p>
      </div>
    </div>
    ${data.grades.rows.length ? `<div class="tiny-list">${data.grades.rows.slice(0, 10).map((row) => `
      <div class="tiny-row"><span>${esc(row.subjectName)} · ${esc(row.title)}</span><b class="g${row.value}">${row.value}</b></div>`).join('')}</div>` : ''}`
    : `<div class="section-head"><h2>Зачёты</h2></div>
      <div class="card pad grade-stat-card"><div class="kicker">Зачёты / экзамены</div><div class="big-pct">${data.credits.length}</div></div>`}
    ${data.credits?.length ? `<div class="tiny-list credit-list">${data.credits.slice(0, 8).map((row) => `
      <div class="tiny-row">
        <span>${esc(row.subjectName)} · ${esc(row.title)}</span>
        <b class="credit-pill ${esc(row.result || '')}">${row.result === 'pass' ? 'зачёт' : row.result === 'fail' ? 'незачёт' : esc(row.result || '—')}</b>
      </div>`).join('')}</div>` : ''}
    ${att.history.length ? `<div class="section-head"><h2>История посещений</h2><span class="muted">${Math.min(30, att.history.length)}</span></div>
      <div class="history-list">${att.history.slice().reverse().slice(0, 30).map((item) => `
        <div class="history-row status-${esc(item.status || 'none')}">
          <div class="datechip mini"><b>${dateParts(item.date).day}</b><span>${esc(dateParts(item.date).month)}</span></div>
          <div><strong>${esc(item.subjectName)}</strong><div class="muted">${esc(item.topic || 'Без темы')}</div></div>
          <span class="status-pill ${esc(item.status || 'none')}">${statusLabel(item.status)}${item.comment ? ` · ${esc(item.comment)}` : ''}</span>
        </div>`).join('')}</div>` : ''}`;
}

function isAdmin() {
  return S.me?.role === 'admin' || can('users.manage');
}

function isStudentRole() {
  return S.me?.role === 'student';
}

function excelOn() {
  const settings = S.settings || S.me?.settings || {};
  return settings.excelEnabled !== false;
}

function canImportExcel() {
  return excelOn() && can('schedule.import');
}

function institutionKindLabel(kind) {
  if (kind === 'university') return 'ВУЗ';
  if (kind === 'school') return 'Школа';
  return 'Колледж';
}

function can(permission) {
  if (!S.me) return false;
  if (S.me.role === 'admin') return true;
  const fromOverview = S.overview?.can?.[permission];
  if (typeof fromOverview === 'boolean') return fromOverview;
  return Array.isArray(S.me.permissions) && S.me.permissions.includes(permission);
}

/** Пункт меню / раздел виден только при праве. Без права — не показываем вообще. */
function canNav(key) {
  if (!S.me) return false;
  const student = isStudentRole();
  switch (key) {
    case 'home':
      return true;
    case 'groups':
      return !student && (
        can('groups.manage') || can('groups.rename') || can('elders.appoint')
        || can('students.manage') || can('schedule.view') || can('attendance.mark')
        || can('stats.view') || can('subjects.manage') || can('grades.manage')
      );
    case 'students':
      return can('students.manage');
    case 'teachers':
      return can('teachers.manage');
    case 'my-schedule':
      return Boolean(S.me.teacherId);
    case 'subjects':
      return can('subjects.manage');
    case 'calendar':
      return can('schedule.view');
    case 'schedule-edit':
      return can('schedule.manage') || canImportExcel();
    case 'stats':
      return !student && can('stats.view');
    case 'diary':
      return can('diary.own');
    case 'diary-grades':
      return can('diary.own') && gradesOn();
    case 'settings':
      return true;
    case 'users':
      return can('users.manage');
    case 'audit':
      return S.me.role === 'admin' || can('users.manage');
    case 'subject-journal':
      return can('attendance.mark') || can('grades.manage') || can('stats.view') || can('subjects.manage');
    default:
      return false;
  }
}

function routeAllowed(route) {
  if (!route) return true;
  switch (route.name) {
    case 'home':
      return true;
    case 'groups':
    case 'group':
      return canNav('groups');
    case 'students':
      return canNav('students');
    case 'teachers':
      return canNav('teachers');
    case 'teacher':
      return canNav('teachers');
    case 'teacher-schedule':
      return canNav('my-schedule');
    case 'subjects':
    case 'subject-hub':
      return canNav('subjects');
    case 'subject':
    case 'lesson':
    case 'credit':
      return canNav('subject-journal');
    case 'stats':
    case 'student-stats':
      return canNav('stats');
    case 'diary':
      return canNav('diary');
    case 'diary-grades':
      return canNav('diary');
    case 'calendar':
    case 'calendar-day':
      return canNav('calendar');
    case 'schedule':
      return canNav('schedule-edit');
    case 'settings':
      return true;
    case 'users':
      return canNav('users');
    case 'audit':
      return canNav('audit');
    default:
      return true;
  }
}

function deniedHtml() {
  return `<div class="empty denied-empty">
    <div class="denied-icon" aria-hidden="true">${icon.lock}</div>
    <h2>Нет доступа</h2>
    <p>У вашей роли нет прав на этот раздел — он скрыт из меню.</p>
    <a class="btn btn-primary" href="#/">На главную</a>
  </div>`;
}

function roleTitle(role) {
  if (role === 'admin') return 'Администратор';
  if (role === 'teacher') return 'Преподаватель';
  if (role === 'elder') return 'Староста';
  if (role === 'student') return 'Ученик';
  return role || 'Пользователь';
}

function permissionCatalog() {
  return S.users?.catalog || S.me?.permissionCatalog || { roles: [], permissions: [], categories: [] };
}

function telegramStatusHtml(settings) {
  const st = settings.telegramStatus || {};
  if (!settings.telegramEnabled) {
    return `<p class="muted tight">Бот выключен. Включите галочку выше и сохраните — или нажмите «Тест в чат» (включит и запустит сам).${settings.telegramBotTokenSet ? '' : ' Сначала укажите токен.'}</p>`;
  }
  const state = st.running
    ? `онлайн${st.username ? ` · @${esc(st.username)}` : ''}`
    : 'офлайн';
  const err = st.lastError ? `<span class="warn-inline"> · ${esc(st.lastError)}</span>` : '';
  return `<p class="muted tight">Статус: <b>${state}</b>${err}${st.scheduleJobs ? ` · автопостов: ${st.scheduleJobs}` : ''}<br>В Telegram наберите <b>/</b> — должны быть подсказки: /commands, /pos, /today…</p>`;
}

function telegramBindingsEditor(settings) {
  const groups = S.overview?.groups || [];
  const byId = new Map((settings.telegramBindings || []).map((b) => [Number(b.groupId), b]));
  if (!groups.length) {
    return '<p class="muted tight">Сначала создайте учебные группы — затем привяжите чат/тему.</p>';
  }
  return `<div class="telegram-bind-list">
    <p class="muted tight">Для форум-группы Telegram укажите Chat ID и ID темы (команда /chatid внутри темы). Одна тема = одна учебная группа.</p>
    ${groups.map((g) => {
      const b = byId.get(Number(g.id)) || {};
      return `<div class="telegram-bind-row" data-group-id="${g.id}">
        <div class="telegram-bind-name">${esc(g.name)}</div>
        <label class="field"><span>Chat ID</span>
          <input name="tgChat-${g.id}" maxlength="40" value="${esc(b.chatId || settings.telegramChatId || '')}" placeholder="-100…" autocomplete="off">
        </label>
        <label class="field"><span>Тема (topic ID)</span>
          <input name="tgTopic-${g.id}" maxlength="20" value="${esc(b.topicId != null ? b.topicId : '')}" placeholder="например 12" autocomplete="off">
        </label>
      </div>`;
    }).join('')}
  </div>`;
}

function readTelegramBindingsFromForm(form) {
  const rows = [...form.querySelectorAll('.telegram-bind-row')];
  return rows.map((row) => {
    const groupId = Number(row.dataset.groupId);
    const chatId = String(row.querySelector(`input[name="tgChat-${groupId}"]`)?.value || '').trim();
    const topicRaw = String(row.querySelector(`input[name="tgTopic-${groupId}"]`)?.value || '').trim();
    if (!chatId && !topicRaw) return null;
    return {
      groupId,
      chatId,
      topicId: topicRaw ? Number(topicRaw) : null,
    };
  }).filter(Boolean);
}

function settingsPage() {
  const settings = S.settings || S.me?.settings || {};
  const dupes = S.subjectDupes?.clusters || [];
  const manageSettings = can('settings.manage');
  const manageUsers = can('users.manage');
  const manageSubjects = can('subjects.manage');
  const urls = (settings.scheduleUrls || []).join('\n');
  const excel = settings.excelEnabled !== false;
  const grades = settings.gradesEnabled !== false;
  const smtp = settings.smtpEnabled === true;
  const kind = settings.institutionKind || 'college';
  const institution = manageSettings
    ? `<form class="card pad settings-form" data-form="save-settings">
      <div class="kicker">Заведение</div>
      <div class="settings-grid-2">
        <label class="field"><span>Название</span><input name="institutionName" required maxlength="120" value="${esc(settings.institutionName || '')}" placeholder="Мой колледж / ВУЗ"></label>
        <label class="field"><span>Подзаголовок</span><input name="institutionSubtitle" maxlength="160" value="${esc(settings.institutionSubtitle || '')}" placeholder="Журнал посещаемости"></label>
      </div>
      <label class="field"><span>Тип заведения</span>
        <select name="institutionKind">
          <option value="college" ${kind === 'college' ? 'selected' : ''}>Колледж</option>
          <option value="university" ${kind === 'university' ? 'selected' : ''}>ВУЗ / университет</option>
          <option value="school" ${kind === 'school' ? 'selected' : ''}>Школа</option>
        </select>
      </label>
      <p class="muted tight">Пороги явки для цветов статистики</p>
      <div class="threshold-grid">
        <label class="field"><span>Отлично ≥</span><input name="attendanceExcellent" type="number" min="0" max="100" step="1" required value="${esc(settings.attendanceExcellent ?? 90)}"></label>
        <label class="field"><span>Хорошо ≥</span><input name="attendanceGood" type="number" min="0" max="100" step="1" required value="${esc(settings.attendanceGood ?? 75)}"></label>
        <label class="field"><span>Внимание ≥</span><input name="attendanceWarn" type="number" min="0" max="100" step="1" required value="${esc(settings.attendanceWarn ?? 60)}"></label>
      </div>
      <label class="check-row">
        <input type="checkbox" name="gradesEnabled" value="1" ${grades ? 'checked' : ''}>
        <span><strong>Оценки в журнале</strong><small>Выключите, чтобы скрыть работы и оценки (зачёты останутся).</small></span>
      </label>
      <label class="check-row excel-toggle">
        <input type="checkbox" name="excelEnabled" value="1" ${excel ? 'checked' : ''} data-act-change="toggle-excel-settings">
        <span><strong>Подгрузка из Excel / Google Sheets</strong><small>Таблицы с расписанием. Выключите, если правите пары только вручную.</small></span>
      </label>
      <div class="excel-settings-block" ${excel ? '' : 'hidden'}>
        <div class="excel-howto-card">
          <strong>Как настроить за 3 шага</strong>
          <ol class="excel-howto">
            <li>Группы → откройте группу → вставьте ссылку на таблицу</li>
            <li>«Найти группы в таблице» → выберите код столбца (А-101 ↔ ваша группа)</li>
            <li>«Подтянуть расписание» — дальше сервер сверяет сам</li>
          </ol>
        </div>
        <label class="check-row">
          <input type="checkbox" name="scheduleAutoSync" value="1" ${settings.scheduleAutoSync !== false ? 'checked' : ''}>
          <span><strong>Автосверка расписания</strong><small>Сервер сам подтягивает изменения из Excel</small></span>
        </label>
        <label class="field"><span>Интервал сверки, минут</span>
          <input name="scheduleAutoSyncMinutes" type="number" min="1" max="120" step="1" value="${esc(settings.scheduleAutoSyncMinutes ?? 5)}">
        </label>
        <label class="field"><span>Общие ссылки (если у группы нет своей)</span>
          <textarea name="scheduleUrls" rows="3" placeholder="https://docs.google.com/spreadsheets/d/…/edit">${esc(urls)}</textarea>
        </label>
        <p class="muted tight">Удобнее задать ссылку прямо в карточке группы — тогда привязка «группа ↔ столбец» нагляднее.</p>
        <a class="btn btn-ghost btn-block" href="#/groups">Открыть группы и привязки</a>
      </div>
      <div class="section-head tight"><h3>Учебный год и курсы</h3></div>
      <p class="muted tight">Летний перевод: ИК 31/9 → ИК 41/9; выпускной курс уходит в архив с годами обучения.</p>
      <div class="settings-grid-2">
        <label class="field"><span>Учебный год (начало)</span>
          <input name="academicYearStart" type="number" min="2000" max="2100" step="1" value="${esc(settings.academicYearStart ?? new Date().getFullYear())}">
        </label>
        <label class="field"><span>Макс. курс</span>
          <input name="maxCourse" type="number" min="1" max="9" step="1" value="${esc(settings.maxCourse ?? 4)}">
        </label>
      </div>
      <p class="muted tight">Сейчас: <b>${esc(settings.academicYearStart || new Date().getFullYear())}/${String((Number(settings.academicYearStart) || new Date().getFullYear()) + 1).slice(-2)}</b></p>
      <label class="check-row">
        <input type="checkbox" name="promotionKeepOldAlias" value="1" ${settings.promotionKeepOldAlias !== false ? 'checked' : ''}>
        <span><strong>Оставлять старый код Excel как alias</strong><small>После перевода ИК-31/9 останется в aliases, пока таблица не обновится.</small></span>
      </label>
      <div class="course-url-grid">
        ${[1, 2, 3, 4].map((course) => {
          const fromMap = settings.promotionCourseUrls?.[String(course)] || '';
          const fallback = (settings.scheduleUrls || [])[course - 1] || '';
          return `<label class="field"><span>Excel · ${course} курс</span>
            <input name="courseUrl${course}" maxlength="500" value="${esc(fromMap)}" placeholder="${esc(fallback || 'https://docs.google.com/…')}">
          </label>`;
        }).join('')}
      </div>
      <div class="row-actions toolbar-row" style="margin-bottom:12px">
        <button class="btn btn-primary" type="button" data-act="promote-preview">Летний перевод курса</button>
      </div>
      <div class="section-head tight"><h3>SMTP · письма с доступом</h3></div>
      <label class="check-row">
        <input type="checkbox" name="smtpEnabled" value="1" ${smtp ? 'checked' : ''}>
        <span><strong>Отправлять письма</strong><small>Временный пароль уйдёт на email ученика или педагога.</small></span>
      </label>
      <div class="threshold-grid">
        <label class="field"><span>SMTP хост</span><input name="smtpHost" maxlength="200" value="${esc(settings.smtpHost || '')}" placeholder="smtp.yandex.ru"></label>
        <label class="field"><span>Порт</span><input name="smtpPort" type="number" min="1" max="65535" value="${esc(settings.smtpPort ?? 587)}"></label>
      </div>
      <label class="check-row">
        <input type="checkbox" name="smtpSecure" value="1" ${settings.smtpSecure ? 'checked' : ''}>
        <span><strong>SSL/TLS (обычно порт 465)</strong></span>
      </label>
      <label class="field"><span>Логин SMTP</span><input name="smtpUser" maxlength="160" value="${esc(settings.smtpUser || '')}" autocomplete="off"></label>
      <label class="field"><span>Пароль SMTP</span><input name="smtpPass" type="password" maxlength="200" value="" placeholder="${settings.smtpPassSet ? '•••••• (оставьте пустым, чтобы не менять)' : 'пароль приложения'}" autocomplete="new-password"></label>
      <label class="field"><span>From (email)</span><input name="smtpFrom" type="email" maxlength="160" value="${esc(settings.smtpFrom || '')}" placeholder="noreply@college.ru"></label>
      <label class="field"><span>Имя отправителя</span><input name="smtpFromName" maxlength="120" value="${esc(settings.smtpFromName || '')}" placeholder="${esc(settings.institutionName || 'Журнал')}"></label>
      <button class="btn btn-ghost btn-block" type="button" data-act="smtp-test">Отправить тестовое письмо</button>
      <div class="section-head tight"><h3>Telegram-бот</h3></div>
      <label class="check-row">
        <input type="checkbox" name="telegramEnabled" value="1" ${settings.telegramEnabled ? 'checked' : ''}>
        <span><strong>Включить бота</strong><small>Команды в группе: /pos, /schedule, /commands</small></span>
      </label>
      <label class="field"><span>Токен бота</span>
        <input name="telegramBotToken" type="password" maxlength="200" value="" placeholder="${settings.telegramBotTokenSet ? '•••••• (оставьте пустым, чтобы не менять)' : '123456:AA… от @BotFather'}" autocomplete="new-password">
      </label>
      <div class="settings-grid-2">
        <label class="field"><span>ID чата (по умолчанию)</span>
          <input name="telegramChatId" maxlength="40" value="${esc(settings.telegramChatId || '')}" placeholder="-100…" autocomplete="off">
        </label>
        <label class="field"><span>ID админов бота</span>
          <input name="telegramAdminIds" maxlength="400" value="${esc(settings.telegramAdminIds || '')}" placeholder="111, 222" autocomplete="off">
        </label>
      </div>
      <p class="muted tight">В группе напишите боту <code>/whoami</code> и <code>/chatid</code> — скопируйте ID сюда. Админы управляют /schedule и автопостингом.</p>
      <label class="check-row">
        <input type="checkbox" name="telegramMultiMode" value="1" ${settings.telegramMultiMode ? 'checked' : ''} data-act-change="toggle-telegram-multi">
        <span><strong>Мультигруппа · темы форума</strong><small>У каждой учебной группы свой чат или тема Telegram</small></span>
      </label>
      <div class="telegram-bindings-block" ${settings.telegramMultiMode ? '' : 'hidden'}>
        ${telegramBindingsEditor(settings)}
      </div>
      ${telegramStatusHtml(settings)}
      <div class="row-actions toolbar-row" style="margin-bottom:12px">
        <button class="btn btn-ghost" type="button" data-act="telegram-test">Тест в чат</button>
        <button class="btn btn-ghost" type="button" data-act="telegram-restart">Перезапустить бота</button>
      </div>
      <button class="btn btn-primary btn-block" type="submit">Сохранить</button>
    </form>`
    : `<div class="card pad profile-card">
        <div class="profile-card-head">
          ${avatarHtml(S.me?.displayName || S.me?.username || '?', null, 'lg')}
          <div class="profile-card-copy">
            <div class="kicker">${esc(roleTitle(S.me?.role))} · ${esc(institutionKindLabel(settings.institutionKind))}</div>
            <h2>${esc(S.me?.displayName || S.me?.username || '')}</h2>
            <p class="muted">${esc(S.me?.email || (isStudentRole() ? 'Электронный дневник: пропуски, расписание и оценки.' : 'Доступ только к назначенным группам.'))}</p>
            <p class="muted tight profile-org">${esc(settings.institutionName || brandName())}</p>
          </div>
        </div>
        ${isStudentRole() || S.me?.teacherId ? `<div class="profile-shortcuts">
          ${isStudentRole() ? `<a class="profile-chip" href="#/diary">${icon.clipboard}<span>Пропуски</span></a>
            ${gradesOn() ? `<a class="profile-chip" href="#/diary/grades">${icon.star}<span>Оценки</span></a>` : ''}
            <a class="profile-chip" href="#/calendar">${icon.cal}<span>Расписание</span></a>` : ''}
          ${S.me?.teacherId ? `<a class="profile-chip" href="#/teacher/schedule">${icon.cal}<span>Мои пары</span></a>` : ''}
        </div>` : ''}
      </div>`;
  const catalogLinks = [
    manageUsers ? `<a class="more-link" href="#/users">${icon.shield}<span>Пользователи и доступы</span></a>` : '',
    canNav('teachers') ? `<a class="more-link" href="#/teachers">${icon.users}<span>Педагоги</span></a>` : '',
    canNav('groups') ? `<a class="more-link" href="#/groups">${icon.grid}<span>${excelOn() ? 'Группы и Excel' : 'Группы'}</span></a>` : '',
    canNav('audit') ? `<a class="more-link" href="#/audit">${icon.history}<span>Журнал изменений</span></a>` : '',
  ].filter(Boolean).join('');
  return `<div class="settings-page">
    ${institution}
    ${manageSubjects && dupes.length ? `<div class="card pad dupe-banner">
        <strong>Похожие предметы</strong>
        ${dupes.map((cluster) => `<div class="dupe-cluster">
          <div class="muted">${esc(cluster.groupName)} · ${cluster.subjects.map((s) => esc(s.name)).join(' / ')}</div>
          <button class="btn btn-ghost btn-small" type="button" data-act="merge-subjects" data-keep="${cluster.subjects[0].id}" data-ids="${cluster.subjects.slice(1).map((s) => s.id).join(',')}">Объединить</button>
        </div>`).join('')}
      </div>` : ''}
    ${catalogLinks ? `<section class="settings-block">
      <div class="settings-block-label">Справочники</div>
      <nav class="more-menu settings-menu">${catalogLinks}</nav>
    </section>` : ''}
    <section class="settings-block">
      <div class="settings-block-label">Аккаунт</div>
      <nav class="more-menu settings-menu">
        <button class="more-link more-btn" type="button" data-act="password">${icon.lock}<span>Сменить пароль</span></button>
        ${manageSubjects && manageUsers ? `<button class="more-link more-btn" type="button" data-act="cleanup-subjects">${icon.book}<span>Убрать пустые предметы</span></button>` : ''}
      </nav>
    </section>
    <section class="settings-block settings-danger">
      <button class="more-link more-btn danger logout-btn" type="button" data-act="confirm-logout">${icon.out}<span>Выйти из аккаунта</span></button>
    </section>
  </div>`;
}

const AUDIT_ACTION_LABELS = {
  'auth.login': 'Вход',
  'auth.logout': 'Выход',
  'users.create': 'Пользователь · создан',
  'users.update': 'Пользователь · изменён',
  'users.delete': 'Пользователь · удалён',
  'groups.create': 'Группа · создана',
  'groups.update': 'Группа · изменена',
  'groups.delete': 'Группа · удалена',
  'groups.elder': 'Староста',
  'students.create': 'Ученик · добавлен',
  'students.update': 'Ученик · изменён',
  'students.delete': 'Ученик · удалён',
  'subjects.create': 'Предмет · добавлен',
  'subjects.update': 'Предмет · изменён',
  'subjects.delete': 'Предмет · удалён',
  'subjects.merge': 'Предметы · объединение',
  'subjects.dedupe': 'Предметы · дубли',
  'subjects.cleanup': 'Предметы · очистка',
  'settings.update': 'Настройки',
  'attendance.mark': 'Отметка',
  'attendance.fill': 'Массовая отметка',
  'attendance.copy': 'Перенос явки',
  'schedule.import': 'Импорт расписания',
};

function auditActionLabel(action) {
  return AUDIT_ACTION_LABELS[action] || action;
}

function auditActionTone(action) {
  if (action.startsWith('auth.')) return 'auth';
  if (action.includes('delete') || action.includes('cleanup')) return 'danger';
  if (action.startsWith('attendance.')) return 'mark';
  if (action.startsWith('schedule.')) return 'schedule';
  if (action.startsWith('users.') || action.startsWith('groups.') || action.startsWith('settings.')) return 'admin';
  return 'default';
}

function fmtAuditWhen(ts) {
  const date = new Date(Number(ts) || 0);
  if (!Number.isFinite(date.getTime())) return '—';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `сегодня · ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `вчера · ${time}`;
  return `${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} · ${time}`;
}

function auditPage() {
  const data = S.audit || { items: [], total: 0, actions: [], limit: 80, offset: 0 };
  const items = data.items || [];
  const actionChips = [
    ['', 'Все'],
    ...((data.actions || []).slice(0, 10).map((row) => [row.action, `${auditActionLabel(row.action)} · ${row.count}`])),
  ];
  const cards = items.length
    ? items.map((item) => {
      const who = item.displayName || item.username || 'Система';
      const tone = auditActionTone(item.action);
      return `<article class="audit-card tone-${tone}">
        <div class="audit-card-top">
          <span class="audit-badge">${esc(auditActionLabel(item.action))}</span>
          <time>${esc(fmtAuditWhen(item.createdAt))}</time>
        </div>
        <strong class="audit-summary">${esc(item.summary || 'Изменение')}</strong>
        <div class="audit-meta">
          ${avatarHtml(who, null, 'tiny')}
          <span>${esc(who)}${item.roleLabel ? ` · ${esc(item.roleLabel)}` : ''}</span>
          ${item.groupName ? `<span class="audit-group">${esc(item.groupName)}</span>` : ''}
        </div>
        ${item.ip ? `<div class="audit-ip">${esc(item.ip)}</div>` : ''}
      </article>`;
    }).join('')
    : '<div class="empty soft"><h2>Пока пусто</h2><p>Как только кто-то изменит журнал, записи появятся здесь.</p></div>';

  const shown = Math.min((data.offset || 0) + items.length, data.total || 0);
  const canMore = shown < (data.total || 0);

  return `<div class="audit-page">
    <div class="intro">
      <div>
        <div class="kicker">Только для администратора</div>
        <h2>Журнал изменений</h2>
      </div>
    </div>
    <p class="hint">Кто и что менял: отметки, переносы явки, пользователи, группы, расписание.</p>
    <div class="audit-toolbar">
      <input id="audit-q" class="search" placeholder="Поиск: ученик, группа, логин…" value="${esc(S.auditQ || '')}" autocomplete="off">
      <button class="btn btn-primary btn-small" type="button" data-act="audit-search">Найти</button>
    </div>
    <div class="chips audit-chips">
      ${actionChips.map(([value, label]) => `
        <button class="chip${String(S.auditAction || '') === String(value) ? ' on' : ''}" type="button" data-act="audit-filter" data-action="${esc(value)}">${esc(label)}</button>
      `).join('')}
    </div>
    <div class="audit-list">${cards}</div>
    <div class="audit-footer">
      <span class="muted">Показано ${shown} из ${data.total || 0}</span>
      ${canMore ? `<button class="btn btn-ghost btn-small" type="button" data-act="audit-more">Ещё</button>` : ''}
    </div>
  </div>`;
}

function usersPage() {
  const users = S.users?.users || [];
  const groups = S.overview?.groups || [];
  const groupName = (item) => {
    if (item.role === 'admin' || item.groupIds == null) return 'Все группы';
    if (!item.groupIds.length) return 'Без групп';
    return item.groupIds.map((id) => groups.find((g) => g.id === id)?.name || `#${id}`).join(', ');
  };
  const cards = users.map((item) => `<article class="card person-card">
      <div class="person-main">
        ${avatarHtml(item.displayName || item.username, item.photoUrl)}
        <div>
          <strong>${esc(item.displayName || item.username)}</strong>
          <div class="muted">${esc(roleTitle(item.role))}${item.active ? '' : ' · отключён'}${item.permissionsCustom ? ' · свои права' : ''}</div>
          <div class="muted">${esc(item.email || item.username)} · ${esc(groupName(item))}</div>
        </div>
      </div>
      <button class="icon-btn dark" type="button" data-act="edit-user" data-id="${item.id}" aria-label="Изменить">${icon.edit}</button>
    </article>`).join('');
  return `<p class="hint">Роль задаёт базовые права. Можно сузить или расширить галочками. Группы ограничивают видимость; старосту назначают на группу.</p>
    <button class="btn btn-primary btn-block" type="button" data-act="add-user">Добавить пользователя</button>
    <div class="list" style="margin-top:12px">${cards || '<div class="empty"><h2>Нет пользователей</h2></div>'}</div>`;
}

function shiftMonth(month, delta) {
  const [y, m] = month.split('-').map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function weekTypeLabel(type) {
  const raw = String(type || '').trim();
  const key = raw.toLowerCase();
  if (key === 'upper' || key === 'верх' || key === 'верхняя' || key === 'в') return 'Верхняя неделя';
  if (key === 'lower' || key === 'низ' || key === 'нижняя' || key === 'н') return 'Нижняя неделя';
  if (key === 'all' || key === 'все') return 'Каждую неделю';
  if (!raw) return 'Неделя';
  return raw;
}

function weekChipLabel(label) {
  const raw = String(label || '').trim();
  const key = raw.toLowerCase();
  if (key === 'upper' || key === 'верх' || key === 'в') return 'Верхняя';
  if (key === 'lower' || key === 'низ' || key === 'н') return 'Нижняя';
  if (key === 'all' || key === 'все') return 'Все';
  return raw || 'Неделя';
}

const WEEKDAY_LABELS = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

const WEEK_TYPE_SHORT = { upper: 'В', lower: 'Н', all: 'В/Н' };

function scheduleExcelPanelHtml(group, { canImport, canEditGroup }) {
  if (!excelOn()) {
    return `<section class="excel-sync-panel card pad off">
      <div class="kicker">Excel выключен</div>
      <p class="muted">Расписание ведётся вручную. Включить подгрузку можно в настройках.</p>
    </section>`;
  }
  if (!group) return '';
  const settings = S.settings || S.me?.settings || {};
  const plan = S.schedule?.plan;
  const source = S.schedule?.source;
  const ready = !!(source?.id || (group.scheduleCode && (group.scheduleUrl || (settings.scheduleUrls || []).length)));
  const autoOn = settings.scheduleAutoSync !== false;
  const mins = settings.scheduleAutoSyncMinutes || 5;
  const weekLabel = plan?.weeks?.find((w) => w.weekIndex === S.schedule?.weekIndexToday)?.label
    || S.schedule?.weekTypeToday
    || '';
  const err = group.scheduleSyncError
    ? `<p class="sync-err">Ошибка: ${esc(group.scheduleSyncError)}</p>`
    : '';
  const syncLine = autoOn
    ? `Синхронизация · каждые ${mins} мин · ${esc(syncAgoLabel(group.scheduleSyncedAt))}`
    : `Синхронизация выкл. · ${esc(syncAgoLabel(group.scheduleSyncedAt))}`;
  const sourceLine = source?.originalName || source?.url || group.scheduleUrl || group.scheduleCode || 'не подключён';
  return `<section class="excel-sync-panel card pad schedule-settings-bar ${ready ? 'ready' : 'need-bind'}">
    <div class="excel-sync-row">
      <div class="excel-sync-copy">
        <div class="kicker">Источник Excel</div>
        <strong class="excel-sync-title">${esc(group.name)}${weekLabel ? ` · ${esc(weekLabel)}` : ''}</strong>
        <p class="muted tight excel-source-line" title="${esc(sourceLine)}">${esc(sourceLine)}</p>
        <p class="muted tight excel-sync-meta"><span class="excel-sync-dot${ready ? ' on' : ''}"></span>${esc(syncLine)}</p>
        ${err}
      </div>
      <div class="excel-sync-actions">
        ${canImport ? `<button class="btn btn-primary" type="button" data-act="schedule-upload" data-group="${group.id}">Загрузить</button>` : ''}
        ${canImport && ready ? `<button class="btn btn-ghost" type="button" data-act="autosync-schedule" data-group="${group.id}">Обновить</button>` : ''}
        ${canImport ? `<button class="btn btn-ghost" type="button" data-act="schedule-constructor" data-group="${group.id}">Парсер</button>` : ''}
        ${canEditGroup && !canImport ? `<button class="btn btn-ghost btn-small" type="button" data-act="edit-group" data-id="${group.id}">Группа</button>` : ''}
      </div>
    </div>
  </section>`;
}

function schedulePage() {
  const groups = S.overview?.groups || [];
  if (!groups.length) {
    return `<div class="empty"><h2>Нет групп</h2><p>Создайте группу и привяжите её к столбцу Excel (например А-101).</p>
      <button class="btn btn-primary" type="button" data-act="add-group">Создать группу</button></div>`;
  }
  const groupId = S.route.groupId || groups[0].id;
  const group = groups.find((item) => item.id === groupId) || groups[0];
  const plan = S.schedule?.plan;
  const planWeeks = plan?.weeks || [];
  const week = S.scheduleWeekType || (planWeeks[0]?.legacyCode || planWeeks[0]?.label || 'upper');
  const todayType = S.schedule?.weekTypeToday || '';
  const todayIndex = S.schedule?.weekIndexToday;
  const entries = S.schedule?.entries || [];
  const dupes = (S.subjectDupes?.clusters || []).filter((c) => !groupId || c.groupId === groupId);
  const chipsHtml = groups.map((item) => {
    const mark = excelOn() && item.scheduleCode ? '' : (excelOn() ? ' · ?' : '');
    return `<a class="chip${item.id === groupId ? ' on' : ''}" href="#/schedule/${item.id}">${esc(item.name)}${mark}</a>`;
  }).join('');
  const weekChips = (planWeeks.length
    ? planWeeks.map((w) => {
      const value = w.legacyCode || `w${w.weekIndex}`;
      const on = week === value || week === String(w.weekIndex) || (S.scheduleWeekIndex != null && S.scheduleWeekIndex === w.weekIndex);
      const today = todayIndex === w.weekIndex || todayType === w.label || todayType === w.legacyCode;
      return `<button class="chip${on ? ' on' : ''}" type="button" data-act="schedule-week" data-week="${esc(value)}" data-week-index="${w.weekIndex}">${esc(weekChipLabel(w.label))}${today ? ' · сегодня' : ''}</button>`;
    }).concat([`<button class="chip${week === 'all' ? ' on' : ''}" type="button" data-act="schedule-week" data-week="all">Все</button>`])
    : [
      ['upper', 'Верхняя'],
      ['lower', 'Нижняя'],
      ['all', 'Все'],
    ].map(([value, label]) => `<button class="chip${week === value ? ' on' : ''}" type="button" data-act="schedule-week" data-week="${value}">${label}${todayType === value ? ' · сегодня' : ''}</button>`)
  ).join('');

  const canEditGrid = can('schedule.manage');
  const canImport = canImportExcel();
  const canSubjects = can('subjects.manage');
  const canEditGroup = can('groups.rename') || can('groups.manage');
  const todayWd = weekdayOfToday();
  const focusDay = S.scheduleFocusDay >= 1 && S.scheduleFocusDay <= 6
    ? S.scheduleFocusDay
    : (todayWd >= 1 && todayWd <= 6 ? todayWd : 1);
  const maxPair = Math.max(6, ...entries.map((entry) => Number(entry.pairNum) || 0), 0);
  const slotMap = new Map();
  for (const entry of entries) {
    slotMap.set(`${entry.weekday}|${entry.pairNum}`, entry);
  }
  const head = `<div class="sched-grid-head"><span class="sched-pair-label-head"></span>${[1, 2, 3, 4, 5, 6].map((day) => `<span class="sched-day-head${day === todayWd ? ' is-today' : ''}">${WEEKDAY_LABELS[day]}</span>`).join('')}</div>`;
  const rows = [];
  for (let pair = 1; pair <= maxPair; pair += 1) {
    const cells = [1, 2, 3, 4, 5, 6].map((day) => {
      const entry = slotMap.get(`${day}|${pair}`);
      if (!entry) {
        if (!canEditGrid) return '<div class="sched-cell empty muted-cell"></div>';
        return `<button class="sched-cell empty" type="button" data-act="add-schedule-entry" data-group="${groupId}" data-weekday="${day}" data-pair="${pair}" aria-label="Добавить пару в ${WEEKDAY_LABELS[day]}">+</button>`;
      }
      const meta = [entry.teacher, entry.timeStart && entry.timeEnd ? `${entry.timeStart}–${entry.timeEnd}` : '', entry.room, WEEK_TYPE_SHORT[entry.weekType] || ''].filter(Boolean).join(' · ');
      if (!canEditGrid) {
        return `<div class="sched-cell filled">
          <strong>${esc(entry.subjectName)}</strong>
          <span>${esc(meta)}</span>
        </div>`;
      }
      return `<button class="sched-cell filled" type="button" data-act="edit-schedule-entry" data-id="${entry.id}">
        <strong>${esc(entry.subjectName)}</strong>
        <span>${esc(meta)}</span>
      </button>`;
    }).join('');
    rows.push(`<div class="sched-grid-row"><div class="sched-pair-label" title="Пара ${pair}">${pair}</div>${cells}</div>`);
  }

  const copyTarget = week === 'upper' ? 'lower' : week === 'lower' ? 'upper' : '';
  const copyLabel = week === 'upper' ? 'На нижнюю' : week === 'lower' ? 'На верхнюю' : '';
  if (!canEditGrid && !canImport) {
    return `${pairsHub(groupId, 'schedule')}
      <div class="empty">
        <h2>Нет права на правку</h2>
        <p>Администратор может выдать право «Редактировать расписание» или «Импорт из Excel».</p>
        <a class="btn btn-primary" href="#/calendar/${groupId}">К отметкам</a>
      </div>`;
  }
  const dayChips = [1, 2, 3, 4, 5, 6].map((day) => {
    const count = entries.filter((entry) => Number(entry.weekday) === day).length;
    const isToday = day === todayWd;
    return `<button class="chip day-chip${focusDay === day ? ' on' : ''}${isToday ? ' is-today' : ''}" type="button" data-act="schedule-day" data-day="${day}" aria-pressed="${focusDay === day ? 'true' : 'false'}">
      <span class="day-chip-name">${WEEKDAY_LABELS[day]}</span>
      <span class="count${count ? '' : ' zero'}">${count}</span>
      ${isToday ? '<span class="day-chip-today">сегодня</span>' : ''}
    </button>`;
  }).join('');
  const dayEditor = canEditGrid
    ? dayScheduleEditorHtml({ groupId, week, focusDay, entries })
    : dayScheduleReadonlyHtml({ focusDay, entries });

  return `${pairsHub(groupId, 'schedule')}
    <section class="schedule-edit-page page-enter">
    ${scheduleExcelPanelHtml(group, { canImport, canEditGroup })}
    <section class="editor-toolbar card pad">
      <div class="editor-toolbar-top">
        <div class="editor-toolbar-copy">
          <div class="kicker">Ручная правка</div>
          <h2 class="editor-toolbar-title">Расписание группы</h2>
          <p class="muted tight">${canEditGrid
            ? 'Выберите день → заполните пары → сохраните. «Замок» защищает пару от Excel.'
            : 'Только просмотр сетки.'}</p>
        </div>
        <div class="editor-actions">
          ${canEditGrid ? `<button class="btn btn-primary btn-small" type="button" data-act="add-schedule-entry" data-group="${groupId}" data-weekday="${focusDay}">+ Пара</button>` : ''}
          ${canSubjects ? `<button class="btn btn-ghost btn-small" type="button" data-act="add-subject" data-group="${groupId}">+ Предмет</button>` : ''}
          ${canEditGrid && copyTarget ? `<button class="btn btn-ghost btn-small" type="button" data-act="copy-schedule-week" data-group="${groupId}" data-from="${week}" data-to="${copyTarget}">${copyLabel}</button>` : ''}
          ${canEditGrid ? `<button class="btn btn-ghost btn-small" type="button" data-act="clear-schedule-week" data-group="${groupId}" data-week="${week === 'all' ? '' : week}">Очистить</button>` : ''}
          ${canSubjects ? `<button class="btn btn-ghost btn-small" type="button" data-act="dedupe-subjects" data-group="${groupId}">Дубли${dupes.length ? ` (${dupes.length})` : ''}</button>` : ''}
        </div>
      </div>
      <div class="editor-filters">
        <div class="editor-filter-block">
          <span class="editor-filter-label">Группа</span>
          <div class="chips scroll-chips" aria-label="Группа">${chipsHtml}</div>
        </div>
        <div class="editor-filter-block">
          <span class="editor-filter-label">Неделя</span>
          <div class="chips week-chips scroll-chips" aria-label="Неделя">${weekChips}</div>
        </div>
      </div>
      <p class="muted tight editor-count"><b>${ru(entries.length, 'пара', 'пары', 'пар')}</b> · ${esc(weekTypeLabel(week === 'all' ? todayType : week))} · ${WEEKDAY_LABELS[focusDay]}</p>
    </section>
    ${dupes.length && canSubjects ? `<div class="banner soft">Похожие предметы (${dupes.length}) — нажмите «Дубли».</div>` : ''}
    <div class="day-editor-block">
      <div class="day-editor-head">
        <div>
          <div class="kicker">День недели</div>
          <p class="muted tight">Выберите день и отредактируйте пары ниже</p>
        </div>
      </div>
      <div class="chips scroll-chips day-chips" role="tablist" aria-label="День недели">${dayChips}</div>
      ${dayEditor}
    </div>
    <div class="sched-desktop">
      <div class="section-head"><h2>Сетка недели</h2><span class="muted">Клик — карточка пары</span></div>
      <div class="sched-grid card">${head}${rows.join('')}</div>
    </div>
    </section>
    <div class="sticky-actions">
      ${canImport ? `<button class="btn btn-primary" type="button" data-act="autosync-schedule" data-group="${groupId}">Сверить с Excel</button>` : ''}
      ${can('stats.view') ? `<button class="btn btn-ghost export-btn" type="button" data-act="export" data-kind="schedule" data-format="xlsx" data-group="${groupId}" aria-label="Скачать Excel">${icon.download}</button>` : ''}
    </div>`;
}

function dayScheduleReadonlyHtml({ focusDay, entries }) {
  const dayEntries = entries
    .filter((entry) => Number(entry.weekday) === focusDay)
    .sort((a, b) => (a.pairNum - b.pairNum) || String(a.timeStart || '').localeCompare(String(b.timeStart || '')));
  if (!dayEntries.length) {
    return `<div class="empty compact"><h2>В этот день пусто</h2><p>Нет пар.</p></div>`;
  }
  return `<div class="sched-day-list card">${dayEntries.map((entry) => {
    const meta = [entry.teacher, entry.timeStart && entry.timeEnd ? `${entry.timeStart}–${entry.timeEnd}` : '', entry.room, entry.lessonKind].filter(Boolean).join(' · ');
    return `<div class="sched-day-row static">
      <span class="sched-day-num">${entry.pairNum}</span>
      <span class="sched-day-body"><strong>${esc(entry.subjectName)}</strong><span class="muted">${esc(meta)}</span></span>
    </div>`;
  }).join('')}</div>`;
}

function dayScheduleEditorHtml({ groupId, week, focusDay, entries }) {
  const weekType = week === 'all' ? 'upper' : week;
  const byPair = new Map();
  for (const entry of entries.filter((item) => Number(item.weekday) === focusDay)) {
    if (week !== 'all' && entry.weekType !== 'all' && entry.weekType !== week) continue;
    if (!byPair.has(entry.pairNum) || entry.weekType === weekType) byPair.set(Number(entry.pairNum), entry);
  }
  const maxPair = Math.max(6, ...byPair.keys(), 0);
  const subjects = sortSubjects(
    (S.overview?.subjects || []).filter((item) => item.groupId === groupId),
    'pairs',
  );
  const subjectOptions = subjects.map((item) => `<option value="${esc(item.name)}"></option>`).join('');
  const cards = [];
  for (let pair = 1; pair <= maxPair; pair += 1) {
    const entry = byPair.get(pair) || null;
    cards.push(`<article class="pair-field-card${entry?.locked ? ' locked' : ''}${entry?.subjectName ? ' filled' : ''}" data-pair-card="${pair}">
      <div class="pair-field-head">
        <span class="pair-num-badge">${pair}</span>
        <strong>Пара ${pair}</strong>
        <span class="muted mono">${esc(entry?.slotKey || `${WEEKDAY_LABELS[focusDay]} · п.${pair}`)}</span>
        <label class="lock-toggle" title="Не перезаписывать из Excel">
          <input type="checkbox" name="locked" ${entry?.locked ? 'checked' : ''}> замок
        </label>
      </div>
      <input type="hidden" name="pairNum" value="${pair}">
      <input type="hidden" name="id" value="${entry?.id || ''}">
      <label class="field"><span>Предмет</span>
        <input name="subjectName" list="day-subjects-${focusDay}" maxlength="200" value="${esc(entry?.subjectName || '')}" placeholder="Название предмета">
      </label>
      <div class="threshold-grid">
        <label class="field"><span>Вид</span><input name="lessonKind" maxlength="80" value="${esc(entry?.lessonKind || '')}" placeholder="лекция / практика"></label>
        <label class="field"><span>Преподаватель</span><input name="teacher" maxlength="120" value="${esc(entry?.teacher || '')}" placeholder="Фамилия И.О."></label>
      </div>
      <div class="threshold-grid">
        <label class="field"><span>Аудитория</span><input name="room" maxlength="80" value="${esc(entry?.room || '')}" placeholder="409"></label>
        <label class="field"><span>Начало</span><input name="timeStart" maxlength="8" value="${esc(entry?.timeStart || '')}" placeholder="09:00"></label>
        <label class="field"><span>Конец</span><input name="timeEnd" maxlength="8" value="${esc(entry?.timeEnd || '')}" placeholder="10:30"></label>
      </div>
    </article>`);
  }
  const filled = [...byPair.values()].filter((e) => e?.subjectName).length;
  return `<form class="day-schedule-form card pad" data-form="save-schedule-day" data-group="${groupId}" data-week="${weekType}" data-weekday="${focusDay}">
    <datalist id="day-subjects-${focusDay}">${subjectOptions}</datalist>
    <div class="section-head day-form-head">
      <div>
        <div class="kicker">Редактирование дня</div>
        <h2>${WEEKDAY_LABELS[focusDay]}</h2>
        <p class="muted tight">${filled ? `${ru(filled, 'пара', 'пары', 'пар')} заполнено` : 'Пока пусто'} · пустой предмет удаляет пару · замок защищает от Excel</p>
      </div>
      <button class="btn btn-ghost btn-small" type="button" data-act="add-day-pair-slot">+ слот</button>
    </div>
    <div class="pair-field-list" id="day-pair-list">${cards.join('')}</div>
    <button class="btn btn-primary btn-block day-save-btn" type="submit">Сохранить ${WEEKDAY_LABELS[focusDay].toLowerCase()}</button>
  </form>`;
}

function weekdayOfToday() {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
}

function mondayOf(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  const z = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${z(date.getMonth() + 1)}-${z(date.getDate())}`;
}

function shiftDays(iso, delta) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d + delta);
  const z = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${z(date.getMonth() + 1)}-${z(date.getDate())}`;
}

function calPairChip(pair) {
  const time = pair.timeStart ? esc(pair.timeStart) : `№${pair.pairNum}`;
  const title = esc(pair.subjectName || '');
  const tip = [pair.subjectName, pair.room, pair.teacher, pair.lessonKind].filter(Boolean).map(esc).join(' · ');
  return `<span class="cal-chip${pair.marked ? ' marked' : ''}" style="--chip:${colorOf(pair.subjectName)}" title="${tip}">
    <b>${time}</b><em>${title}</em>
  </span>`;
}

function calendarMonthGridHtml(data, groupId) {
  const month = data.month;
  const [year, mon] = month.split('-').map(Number);
  const firstWeekday = new Date(year, mon - 1, 1).getDay();
  const lead = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const canMark = can('attendance.mark');
  const cells = [];
  for (let i = 0; i < lead; i += 1) cells.push('<div class="cal-cell empty-cell"></div>');
  for (const day of data.days) {
    const isToday = day.date === todayISO();
    const pairs = day.pairs || [];
    const classes = [
      'cal-cell',
      day.pairCount ? 'has-pairs' : 'no-pairs',
      day.markedPairs ? 'has-marks' : '',
      day.absent ? 'has-absent' : '',
      isToday ? 'is-today' : '',
      day.weekday === 7 ? 'is-sun' : '',
    ].filter(Boolean).join(' ');
    const weekClass = day.weekType === 'lower' ? 'week-lower' : day.weekType === 'upper' ? 'week-upper' : '';
    const chips = pairs.map(calPairChip).join('');
    const body = day.pairCount
      ? `<div class="cal-chip-stack">${chips}</div>
         <div class="cal-meta">${canMark ? (day.markedPairs ? `отмечено ${day.markedPairs}/${day.pairCount}` : 'не отмечено') : ru(day.pairCount, 'пара', 'пары', 'пар')}</div>`
      : '<div class="cal-meta">выходной</div>';
    cells.push(`<a class="${classes}" href="#/calendar/${groupId}/${day.date}">
      <div class="cal-daynum">${Number(day.date.slice(-2))}</div>
      <div class="cal-week ${weekClass}">${day.weekType === 'upper' ? 'В' : day.weekType === 'lower' ? 'Н' : ''}</div>
      ${body}
    </a>`);
  }
  while (cells.length % 7) cells.push('<div class="cal-cell empty-cell"></div>');
  return `<div class="cal-board">
    <div class="cal-head"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div>
    <div class="cal-grid">${cells.join('')}</div>
  </div>`;
}

function calendarWeekTableHtml(data, groupId) {
  const anchor = S.calendarAnchor || mondayOf(todayISO());
  const monday = mondayOf(anchor);
  const byDate = new Map((data.days || []).map((day) => [day.date, day]));
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const iso = shiftDays(monday, i);
    const fromMonth = byDate.get(iso);
    days.push(fromMonth || {
      date: iso,
      weekday: i + 1 === 7 ? 7 : i + 1,
      weekType: '',
      pairCount: 0,
      pairs: [],
      outside: iso.slice(0, 7) !== data.month,
    });
  }
  const maxPair = Math.max(1, ...days.flatMap((day) => (day.pairs || []).map((p) => Number(p.pairNum) || 0)), 6);
  const pairIndex = new Map();
  for (const day of days) {
    for (const pair of day.pairs || []) {
      pairIndex.set(`${day.date}|${pair.pairNum}`, pair);
    }
  }
  const head = `<div class="cal-table-head">
    <div class="cal-table-corner">Пара</div>
    ${days.map((day, index) => {
      const isToday = day.date === todayISO();
      const label = WEEKDAY_LABELS[day.weekday] || ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][index] || '';
      return `<a class="cal-table-day${isToday ? ' is-today' : ''}${day.outside ? ' outside' : ''}" href="#/calendar/${groupId}/${day.date}">
        <span>${esc(String(label).slice(0, 2))}</span>
        <strong>${Number(day.date.slice(-2))}</strong>
        <em>${day.weekType === 'upper' ? 'В' : day.weekType === 'lower' ? 'Н' : '·'}</em>
      </a>`;
    }).join('')}
  </div>`;
  const rows = [];
  for (let pair = 1; pair <= maxPair; pair += 1) {
    const cells = days.map((day) => {
      const entry = pairIndex.get(`${day.date}|${pair}`);
      if (!entry) {
        return `<div class="cal-table-cell empty${day.weekday === 7 ? ' sun' : ''}"></div>`;
      }
      const meta = [entry.timeStart && entry.timeEnd ? `${entry.timeStart}–${entry.timeEnd}` : '', entry.room, entry.teacher].filter(Boolean).join(' · ');
      return `<a class="cal-table-cell filled${entry.marked ? ' marked' : ''}" href="#/calendar/${groupId}/${day.date}" style="--chip:${colorOf(entry.subjectName)}">
        <strong>${esc(entry.subjectName)}</strong>
        <span>${esc(meta)}</span>
        ${entry.lessonKind ? `<em>${esc(entry.lessonKind)}</em>` : ''}
      </a>`;
    }).join('');
    rows.push(`<div class="cal-table-row"><div class="cal-table-pair">${pair}</div>${cells}</div>`);
  }
  const weekLabel = `${fmtDate(monday).replace(/^[а-я]{2}, /, '')} — ${fmtDate(shiftDays(monday, 6)).replace(/^[а-я]{2}, /, '')}`;
  return `<div class="cal-week-toolbar">
      <button class="icon-btn dark" type="button" data-act="cal-week" data-anchor="${esc(shiftDays(monday, -7))}" aria-label="Прошлая неделя">${icon.back}</button>
      <strong>${esc(weekLabel)}</strong>
      <button class="icon-btn dark" type="button" data-act="cal-week" data-anchor="${esc(shiftDays(monday, 7))}" aria-label="Следующая неделя"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></button>
    </div>
    <div class="cal-table-scroll">
      <div class="cal-table">${head}${rows.join('')}</div>
    </div>`;
}

function calendarPage() {
  const groups = S.overview?.groups || [];
  if (!groups.length) {
    return `<div class="empty"><h2>Нет групп</h2><p>${isStudentRole() ? 'Группа ещё не назначена.' : 'Сначала добавьте группы и составьте расписание.'}</p></div>`;
  }
  const groupId = S.route.groupId || S.calendar?.group?.id || groups[0].id;
  const month = S.calendarMonth || todayISO().slice(0, 7);
  const data = S.calendar;
  if (!data) return `<div class="empty"><h2>Загрузка…</h2></div>`;
  const [year, mon] = month.split('-').map(Number);
  const monthTitle = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(year, mon - 1, 1));
  const preferWeek = isStudentRole() || S.calendarView === 'week';
  if (isStudentRole() && S.calendarView !== 'week') {
    S.calendarView = 'week';
    localStorage.setItem('journal_cal_view', 'week');
    if (!S.calendarAnchor) S.calendarAnchor = mondayOf(todayISO());
  }
  const view = preferWeek ? 'week' : 'month';
  const chips = isStudentRole()
    ? ''
    : groups.map((group) => `<a class="chip${group.id === groupId ? ' on' : ''}" href="#/calendar/${group.id}">${esc(group.name)}</a>`).join('');
  const todayWeek = data.days.find((day) => day.date === todayISO())?.weekType;
  const body = view === 'week' ? calendarWeekTableHtml(data, groupId) : calendarMonthGridHtml(data, groupId);
  return `${pairsHub(groupId, 'calendar')}
    <div class="cal-toolbar">
      ${chips ? `<div class="chips scroll-chips cal-group-chips" aria-label="Группы">${chips}</div>` : `<div class="kicker diary-week-kicker">${esc(data.group?.name || groups.find((g) => g.id === groupId)?.name || '')} · текущая неделя</div>`}
      ${isStudentRole() ? '' : `<div class="cal-view-switch" role="tablist" aria-label="Вид календаря">
        <button class="chip${view === 'month' ? ' on' : ''}" type="button" data-act="cal-view" data-view="month">Месяц</button>
        <button class="chip${view === 'week' ? ' on' : ''}" type="button" data-act="cal-view" data-view="week">Неделя · таблица</button>
      </div>`}
    </div>
    <div class="cal-month-nav">
      <button class="icon-btn dark" type="button" data-act="cal-month" data-month="${esc(shiftMonth(month, -1))}" aria-label="Предыдущий месяц">${icon.back}</button>
      <strong>${esc(monthTitle)}</strong>
      <button class="icon-btn dark" type="button" data-act="cal-month" data-month="${esc(shiftMonth(month, 1))}" aria-label="Следующий месяц"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></button>
    </div>
    <div class="cal-legend">
      <span class="cal-pill">${esc(weekTypeLabel(todayWeek))}</span>
      <span class="cal-legend-item"><span class="cal-week week-upper">В</span> верхняя</span>
      <span class="cal-legend-item"><span class="cal-week week-lower">Н</span> нижняя</span>
      <span class="cal-legend-item"><i class="cal-dot"></i> цвет = предмет</span>
    </div>
    ${body}
    <a class="btn btn-primary btn-block today-cta cal-today-btn" href="#/calendar/${groupId}/${todayISO()}">Сегодня</a>`;
}

function pairRosterCounts(pair, day) {
  let open = 0;
  let here = 0;
  let away = 0;
  for (const student of day.students) {
    const status = markStatus(pair.marks, student.id);
    if (!status) open += 1;
    else if (status === 'present' || status === 'late') here += 1;
    else away += 1;
  }
  return { all: day.students.length, open, here, away };
}

function pairRosterSummary(pair, day) {
  const stats = pair.stats || {};
  const here = (stats.present || 0) + (stats.late || 0);
  const excused = stats.excused || 0;
  const absent = stats.absent || 0;
  const marked = stats.marked || 0;
  const total = day.students.length;
  const left = Math.max(0, total - marked);
  if (!marked) return `не отмечено · ${total} уч. · жмите статус по списку`;
  return `на паре ${here}/${total}${excused ? ` · уваж. ${excused}` : ''}${absent ? ` · нет ${absent}` : ''}${left ? ` · ещё ${left}` : ' · готово'}`;
}

function pairRosterProgress(pair, day) {
  const marked = pair.stats?.marked || 0;
  const total = day.students.length || 1;
  const pctValue = Math.round((marked / total) * 100);
  return `<div class="pair-progress" aria-hidden="true"><span style="width:${pctValue}%"></span></div>
    <div class="pair-progress-label">${marked} из ${day.students.length} · ${pctValue}%</div>`;
}

function pairFilterMatches(status, filter) {
  if (!filter || filter === 'all') return true;
  if (filter === 'open') return !status;
  if (filter === 'here') return status === 'present' || status === 'late';
  if (filter === 'away') return status === 'absent' || status === 'excused';
  return true;
}

function pairRosterPeopleHtml(pair, day) {
  const filter = S.pairFilter || 'all';
  return day.students.map((student) => {
    const status = markStatus(pair.marks, student.id);
    const comment = markComment(pair.marks, student.id);
    const searchHidden = hiddenByQuery(student.fullName);
    const filterHidden = !pairFilterMatches(status, filter);
    const btn = (value, label, positive) => `<button type="button" class="${value}${status === value ? ' on' : ''}" data-act="pair-mark" data-status="${value}" data-entry="${pair.scheduleEntryId}" data-group="${day.group.id}" data-date="${day.date}" data-student="${student.id}" tabindex="-1" ${positive ? 'data-positive="1"' : ''}>${label}</button>`;
    return `<div class="person pair-person" data-student="${student.id}" data-search="${esc(student.fullName)}" data-status="${esc(status || '')}" ${searchHidden || filterHidden ? 'hidden' : ''}>
      ${avatarHtml(student.fullName, student.photoUrl)}
      <div class="person-name">
        <strong>${esc(student.fullName)}</strong>
        ${comment ? `<span class="person-note">${esc(comment)}</span>` : ''}
      </div>
      <div class="seg four">${btn('present', 'Здесь', true)}${btn('late', 'Опозд.', true)}${btn('excused', 'Уваж.', true)}${btn('absent', 'Нет', false)}</div>
      <details class="mark-comment-details"${comment ? ' open' : ''}>
        <summary>Комментарий</summary>
        <label class="mark-comment">
          <span class="sr-only">Комментарий</span>
          <input type="text" maxlength="240" placeholder="Причина, примечание" value="${esc(comment)}" data-act-input="pair-comment" data-entry="${pair.scheduleEntryId}" data-group="${day.group.id}" data-date="${day.date}" data-student="${student.id}">
        </label>
      </details>
    </div>`;
  }).join('');
}

function pairFilterChips(pair, day) {
  const filter = S.pairFilter || 'all';
  const counts = pair && day ? pairRosterCounts(pair, day) : { all: 0, open: 0, here: 0, away: 0 };
  const items = [
    ['all', 'Все', counts.all],
    ['open', 'Пусто', counts.open],
    ['here', 'На паре', counts.here],
    ['away', 'Нет', counts.away],
  ];
  return `<div class="chips pair-filter-chips">${items.map(([value, label, count]) => `
    <button class="chip${filter === value ? ' on' : ''}" type="button" data-act="pair-filter" data-filter="${value}">${label}<span class="count">${count}</span></button>`).join('')}</div>`;
}

function pairConfirmBarHtml() {
  const conf = S.pairConfirm;
  if (!conf || conf.fill === 'clear') return '';
  const text = conf.fill === 'absent-open'
    ? 'Пустых отметить «нет»? Уже отмеченные не изменятся.'
    : 'Отметить всю группу «здесь»?';
  const ok = conf.fill === 'absent-open' ? 'Да, пустых → нет' : 'Да, все здесь';
  return `<div class="pair-confirm-bar" role="status">
    <p>${text}</p>
    <button class="btn btn-ghost btn-small" type="button" data-act="pair-fill-cancel">Отмена</button>
    <button class="btn btn-primary btn-small" type="button" data-act="confirm-pair-fill">${ok}</button>
  </div>`;
}

function askClearPairList(pair, day, { groupId, date, scheduleEntryId } = {}) {
  const num = pair?.pairNum || '';
  const name = pair?.subjectName ? shortSubjectName(pair.subjectName, 28) : '';
  S.pairCopyConfirm = null;
  S.pairConfirm = {
    groupId: Number(groupId || day?.group?.id),
    date: date || day?.date,
    scheduleEntryId: Number(scheduleEntryId || pair?.scheduleEntryId),
    fill: 'clear',
  };
  openConfirmDialog({
    title: 'Очистить список?',
    text: num
      ? `Снять все отметки с ${num}-й пары${name ? ` «${esc(name)}»` : ''}? Это действие можно будет повторить заново.`
      : 'Снять все отметки явки по этой паре?',
    okLabel: 'Да, очистить',
    cancelLabel: 'Нет',
    okAct: 'confirm-pair-fill',
    cancelAct: 'pair-fill-cancel',
    danger: true,
  });
}

function askCopyPairAttendance(payload) {
  S.pairConfirm = null;
  S.pairCopyConfirm = payload;
  const fromName = payload.fromSubject ? ` «${esc(shortSubjectName(payload.fromSubject, 24))}»` : '';
  const toName = payload.toSubject ? ` «${esc(shortSubjectName(payload.toSubject, 24))}»` : '';
  openConfirmDialog({
    title: 'Перенести отметки?',
    text: `Перенести отметки с ${payload.fromPairNum}-й пары${fromName} на ${payload.toPairNum}-ю${toName}?`,
    okLabel: 'Да, перенести',
    cancelLabel: 'Нет',
    okAct: 'confirm-pair-copy',
    cancelAct: 'pair-copy-cancel',
    okAttrs: 'data-mode="replace"',
    extra: `<div class="confirm-extra">
      <button class="btn btn-ghost btn-small" type="button" data-act="confirm-pair-copy" data-mode="fill-empty">Только пустые</button>
      <button class="btn btn-ghost btn-small" type="button" data-act="confirm-pair-copy" data-mode="here-only">Только «здесь»</button>
    </div>`,
  });
}

function pairHasMarks(pair) {
  return Number(pair?.stats?.marked || 0) > 0;
}

function pairMarksFingerprint(pair) {
  if (!pair?.marks) return '';
  return Object.keys(pair.marks)
    .map(Number)
    .sort((a, b) => a - b)
    .map((id) => {
      const status = markStatus(pair.marks, id);
      if (!status) return '';
      const comment = markComment(pair.marks, id);
      return `${id}:${status}:${comment}`;
    })
    .filter(Boolean)
    .join('|');
}

function pairMarksEqual(a, b) {
  if (!pairHasMarks(a) || !pairHasMarks(b)) return false;
  return pairMarksFingerprint(a) === pairMarksFingerprint(b);
}

function shortSubjectName(name, max = 12) {
  const text = String(name || '').trim().replace(/\s+/g, ' ');
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(1, max - 1))}…`;
}

function pairXferMeta(pair) {
  const here = Number(pair?.here || 0);
  const marked = Number(pair?.stats?.marked || 0);
  const away = Math.max(0, marked - here);
  if (!marked) return { count: '0', detail: 'пусто' };
  if (away) return { count: String(here), detail: `${here}·${away}` };
  return { count: String(here), detail: `${here}/${pair.totalStudents || marked}` };
}

function pairCopyConfirmBarHtml() {
  return '';
}

function pairTransferSources(day, targetPair) {
  if (!day?.pairs?.length || !targetPair) return [];
  const targetNum = Number(targetPair.pairNum) || 0;
  return day.pairs
    .filter((pair) => pair.scheduleEntryId !== targetPair.scheduleEntryId && pairHasMarks(pair))
    .sort((a, b) => {
      const da = Math.abs((Number(a.pairNum) || 0) - targetNum);
      const db = Math.abs((Number(b.pairNum) || 0) - targetNum);
      if (da !== db) return da - db;
      const aPrev = (Number(a.pairNum) || 0) < targetNum ? 0 : 1;
      const bPrev = (Number(b.pairNum) || 0) < targetNum ? 0 : 1;
      if (aPrev !== bPrev) return aPrev - bPrev;
      return (Number(a.pairNum) || 0) - (Number(b.pairNum) || 0);
    });
}

function pairTransferTargets(day, sourcePair) {
  if (!day?.pairs?.length || !sourcePair || !pairHasMarks(sourcePair)) return [];
  const sourceNum = Number(sourcePair.pairNum) || 0;
  return day.pairs
    .filter((pair) => pair.scheduleEntryId !== sourcePair.scheduleEntryId)
    .sort((a, b) => {
      const da = Math.abs((Number(a.pairNum) || 0) - sourceNum);
      const db = Math.abs((Number(b.pairNum) || 0) - sourceNum);
      if (da !== db) return da - db;
      return (Number(a.pairNum) || 0) - (Number(b.pairNum) || 0);
    });
}

function pairTransferPanelHtml(pair, day, { compact = false } = {}) {
  const sources = pairTransferSources(day, pair).slice(0, compact ? 3 : 6);
  const targets = pairTransferTargets(day, pair).slice(0, compact ? 3 : 6);
  const canClear = pairHasMarks(pair);
  if (!sources.length && !targets.length && !canClear) return '';
  const attrs = `data-group="${day.group.id}" data-date="${day.date}"`;
  const last = S.lastPairCopy;
  const nearestSourceId = sources[0]?.scheduleEntryId;
  const fromBtns = sources.map((src, index) => {
    const meta = pairXferMeta(src);
    const same = pairMarksEqual(src, pair);
    const linked = last
      && Number(last.fromScheduleEntryId) === Number(src.scheduleEntryId)
      && Number(last.toScheduleEntryId) === Number(pair.scheduleEntryId);
    const hot = index === 0 && Number(src.scheduleEntryId) === Number(nearestSourceId);
    const title = same
      ? `Список как на ${src.pairNum}-й — нажмите, чтобы очистить эту пару`
      : `Взять отметки с ${src.pairNum}-й пары`;
    return `
    <button class="pair-xfer-btn from${same ? ' same' : ''}${linked ? ' linked' : ''}${hot && !same ? ' hot' : ''}" type="button" data-act="copy-pair-attendance"
      ${attrs}
      data-from="${src.scheduleEntryId}" data-to="${pair.scheduleEntryId}"
      data-from-num="${src.pairNum}" data-to-num="${pair.pairNum}"
      title="${esc(title)}">
      <span class="pair-xfer-ico">${same ? '✕' : '↓'}</span>
      <span class="pair-xfer-txt"><b>${src.pairNum}</b><small>${same ? 'сброс' : meta.count}</small></span>
    </button>`;
  }).join('');
  const toBtns = targets.map((dst) => {
    const same = pairMarksEqual(pair, dst);
    const empty = !pairHasMarks(dst);
    const linked = last
      && Number(last.fromScheduleEntryId) === Number(pair.scheduleEntryId)
      && Number(last.toScheduleEntryId) === Number(dst.scheduleEntryId);
    const title = same
      ? `На ${dst.pairNum}-й уже такой же список — очистить`
      : `Перенести отметки на ${dst.pairNum}-ю пару`;
    return `
    <button class="pair-xfer-btn to${same ? ' same' : ''}${linked ? ' linked' : ''}${empty ? ' empty-target' : ''}" type="button" data-act="copy-pair-attendance"
      ${attrs}
      data-from="${pair.scheduleEntryId}" data-to="${dst.scheduleEntryId}"
      data-from-num="${pair.pairNum}" data-to-num="${dst.pairNum}"
      title="${esc(title)}">
      <span class="pair-xfer-txt"><b>${dst.pairNum}</b><small>${same ? 'сброс' : empty ? 'пусто' : String(dst.stats?.marked || 0)}</small></span>
      <span class="pair-xfer-ico">${same ? '✕' : '→'}</span>
    </button>`;
  }).join('');
  return `<div class="pair-xfer ${compact ? 'compact' : ''}">
    ${sources.length ? `<div class="pair-xfer-row">
      <span class="pair-xfer-label">С пары</span>
      <div class="pair-xfer-btns">${fromBtns}</div>
    </div>` : ''}
    ${targets.length ? `<div class="pair-xfer-row">
      <span class="pair-xfer-label">На пару</span>
      <div class="pair-xfer-btns">${toBtns}</div>
    </div>` : ''}
    ${canClear ? `<button class="pair-xfer-clear" type="button" data-act="pair-fill-clear"
      ${attrs} data-entry="${pair.scheduleEntryId}"
      title="Очистить весь список явки">Очистить список</button>` : ''}
  </div>`;
}

function pairMiniMeter(pair) {
  const total = pair.totalStudents || 0;
  const marked = pair.stats?.marked || 0;
  if (!total || !marked) return '';
  const present = ((pair.stats?.present || 0) / total) * 100;
  const late = ((pair.stats?.late || 0) / total) * 100;
  const excused = ((pair.stats?.excused || 0) / total) * 100;
  const absent = ((pair.stats?.absent || 0) / total) * 100;
  return `<div class="pair-meter" aria-hidden="true">
    <i class="m-present" style="width:${present}%"></i>
    <i class="m-late" style="width:${late}%"></i>
    <i class="m-excused" style="width:${excused}%"></i>
    <i class="m-absent" style="width:${absent}%"></i>
  </div>`;
}

function dayAttendanceStrip(day) {
  if (!day?.pairs?.length) return '';
  const totalSlots = day.pairs.length * (day.students?.length || 0);
  let marked = 0;
  let here = 0;
  let away = 0;
  for (const pair of day.pairs) {
    marked += pair.stats?.marked || 0;
    here += (pair.stats?.present || 0) + (pair.stats?.late || 0);
    away += (pair.stats?.absent || 0) + (pair.stats?.excused || 0);
  }
  const donePairs = day.pairs.filter(pairHasMarks).length;
  const pct = totalSlots ? Math.round((marked / totalSlots) * 100) : 0;
  return `<div class="day-strip">
    <div class="day-strip-main">
      <strong>${donePairs}/${day.pairs.length}</strong>
      <span>пар отмечено</span>
    </div>
    <div class="day-strip-stats">
      <span class="day-pill present">${here} здесь</span>
      <span class="day-pill away">${away} нет</span>
      <span class="day-pill muted">${pct}%</span>
    </div>
  </div>`;
}

function updatePairModalChrome(pair, day) {
  const statEl = document.querySelector('.pair-modal-stat');
  if (statEl) statEl.textContent = pairRosterSummary(pair, day);
  const progress = document.querySelector('.pair-progress-wrap');
  if (progress) progress.innerHTML = pairRosterProgress(pair, day);
  const chips = document.querySelector('.pair-filter-chips');
  if (chips) chips.outerHTML = pairFilterChips(pair, day);
  const toolbar = document.querySelector('.pair-modal-toolbar');
  if (toolbar) {
    toolbar.classList.toggle('has-clear', pairHasMarks(pair));
    const clearBtn = toolbar.querySelector('[data-act="pair-fill-clear"]');
    if (pairHasMarks(pair) && !clearBtn) {
      const done = toolbar.querySelector('[data-act="close-pair-modal"]');
      const html = `<button class="btn btn-ghost btn-small pair-clear-btn" type="button" data-act="pair-fill-clear" data-entry="${pair.scheduleEntryId}" data-group="${day.group.id}" data-date="${day.date}">Очистить</button>`;
      if (done) done.insertAdjacentHTML('beforebegin', html);
      else toolbar.insertAdjacentHTML('beforeend', html);
    } else if (!pairHasMarks(pair) && clearBtn) {
      clearBtn.remove();
    }
  }
  const xfer = document.querySelector('.pair-modal .pair-xfer');
  const nextXfer = pairTransferPanelHtml(pair, day);
  if (xfer && nextXfer) xfer.outerHTML = nextXfer;
  else if (xfer && !nextXfer) xfer.remove();
  else if (!xfer && nextXfer) {
    if (toolbar) toolbar.insertAdjacentHTML('afterend', nextXfer);
  }
  const confirmHost = document.getElementById('pair-confirm-host');
  if (confirmHost) confirmHost.innerHTML = pairConfirmBarHtml() + pairCopyConfirmBarHtml();
}

function applyPairPeopleVisibility() {
  const q = S.q.trim().toLowerCase();
  const filter = S.pairFilter || 'all';
  const rows = [...document.querySelectorAll('.pair-modal-people .person')];
  rows.forEach((row) => {
    const status = row.dataset.status || '';
    const searchOk = !q || (row.dataset.search || '').toLowerCase().includes(q);
    row.hidden = !searchOk || !pairFilterMatches(status, filter);
  });
  const empty = document.getElementById('empty-filter');
  if (empty) empty.hidden = !rows.length || rows.some((row) => !row.hidden);
}

function refreshPairPeopleList(pair, day, { scrollTop } = {}) {
  const list = document.querySelector('.pair-modal-people');
  if (!list) return;
  const keep = scrollTop == null ? list.scrollTop : scrollTop;
  list.innerHTML = day.students.length
    ? pairRosterPeopleHtml(pair, day)
    : '<div class="empty"><h2>Нет учеников</h2><p>Добавьте учеников в группу.</p></div>';
  updatePairModalChrome(pair, day);
  const xfer = document.querySelector('.pair-modal .pair-xfer');
  const nextXfer = pairTransferPanelHtml(pair, day);
  if (xfer && nextXfer) xfer.outerHTML = nextXfer;
  else if (xfer && !nextXfer) xfer.remove();
  else if (!xfer && nextXfer) {
    const host = document.getElementById('pair-confirm-host');
    if (host) host.insertAdjacentHTML('beforebegin', nextXfer);
  }
  applyPairPeopleVisibility();
  list.scrollTop = keep;
}

function focusNextOpenPerson(fromRow) {
  const list = document.querySelector('.pair-modal-people');
  if (!list) return;
  const rows = [...list.querySelectorAll('.person')];
  const start = fromRow ? rows.indexOf(fromRow) : -1;
  const next = rows.slice(start + 1).find((row) => !row.hidden && !row.dataset.status)
    || rows.find((row) => !row.hidden && !row.dataset.status);
  list.querySelectorAll('.person.mark-focus').forEach((row) => row.classList.remove('mark-focus'));
  if (!next) return;
  next.classList.add('mark-focus');
  const sheet = document.querySelector('.sheet:has(.pair-modal)');
  if (sheet) sheet.scrollTop = 0;
  const deltaTop = next.offsetTop - list.scrollTop;
  const deltaBottom = deltaTop + next.offsetHeight - list.clientHeight;
  if (deltaTop < 8) list.scrollTop = Math.max(0, next.offsetTop - 8);
  else if (deltaBottom > -8) list.scrollTop += deltaBottom + 8;
}

function pairRosterModalHtml(pair, day) {
  const xfer = pairTransferPanelHtml(pair, day);
  return modalWrap(`<div class="pair-modal">
    <div class="pair-modal-top">
      <div class="pair-modal-head">
        <div class="kicker">${pair.pairNum} пара${pair.timeStart ? ` · ${esc(pair.timeStart)}–${esc(pair.timeEnd)}` : ''} · ${esc(day.group.name)}</div>
        <h2>${esc(pair.subjectName)}</h2>
        <p class="muted">${esc([pair.lessonKind, pair.teacher, pair.room].filter(Boolean).join(' · ') || 'Отметьте посещаемость')}</p>
        <p class="pair-modal-stat">${pairRosterSummary(pair, day)}</p>
        <div class="pair-progress-wrap">${pairRosterProgress(pair, day)}</div>
      </div>
      <div class="pair-modal-toolbar${pairHasMarks(pair) ? ' has-clear' : ''}">
        <button class="btn btn-primary btn-small" type="button" data-act="pair-fill-present" data-entry="${pair.scheduleEntryId}" data-group="${day.group.id}" data-date="${day.date}">Все здесь</button>
        <button class="btn btn-ghost btn-small" type="button" data-act="pair-fill-absent" data-entry="${pair.scheduleEntryId}" data-group="${day.group.id}" data-date="${day.date}">Пустых → нет</button>
        ${pairHasMarks(pair) ? `<button class="btn btn-ghost btn-small pair-clear-btn" type="button" data-act="pair-fill-clear" data-entry="${pair.scheduleEntryId}" data-group="${day.group.id}" data-date="${day.date}">Очистить</button>` : ''}
        <button class="btn btn-ghost btn-small" type="button" data-act="close-pair-modal">Готово</button>
      </div>
      ${xfer}
      <div id="pair-confirm-host">${pairConfirmBarHtml()}${pairCopyConfirmBarHtml()}</div>
      <input id="q" class="search" placeholder="Поиск · фильтр «Пусто» ускоряет перекличку" value="${esc(S.q)}" autocomplete="off" enterkeyhint="search">
      ${pairFilterChips(pair, day)}
      <div class="pair-legend">
        <span><i class="swatch present"></i>Здесь</span>
        <span><i class="swatch late"></i>Опозд.</span>
        <span><i class="swatch excused"></i>Уваж.</span>
        <span><i class="swatch absent"></i>Нет</span>
      </div>
    </div>
    <div class="people pair-modal-people">${day.students.length
      ? pairRosterPeopleHtml(pair, day)
      : '<div class="empty"><h2>Нет учеников</h2><p>Добавьте учеников в группу.</p></div>'}</div>
    <p id="empty-filter" class="muted pair-empty-filter" hidden>Ничего не найдено</p>
  </div>`);
}

function openPairRosterModal(entryId, { preserveScroll = 0 } = {}) {
  const day = S.calendarDay;
  if (!day) return;
  const id = Number(entryId);
  const pair = day.pairs.find((item) => item.scheduleEntryId === id);
  if (!pair) return;
  S.activePairId = id;
  S.pairModalOpen = true;
  if (!S.pairFilter) {
    const left = day.students.filter((student) => !markStatus(pair.marks, student.id)).length;
    S.pairFilter = left ? 'open' : 'all';
  }
  openModal(pairRosterModalHtml(pair, day));
  applyPairPeopleVisibility();
  const list = document.querySelector('.pair-modal-people');
  if (list && preserveScroll) list.scrollTop = preserveScroll;
  else requestAnimationFrame(() => focusNextOpenPerson());
}

function recomputePairStats(pair, day) {
  const stats = { marked: 0, present: 0, late: 0, absent: 0, excused: 0 };
  for (const student of day.students) {
    const status = markStatus(pair.marks, student.id);
    if (!status) continue;
    stats.marked += 1;
    if (status === 'present') stats.present += 1;
    if (status === 'late') stats.late += 1;
    if (status === 'absent') stats.absent += 1;
    if (status === 'excused') stats.excused += 1;
  }
  pair.stats = stats;
  pair.here = stats.present + stats.late;
  return pair;
}

function calendarDayPage() {
  const day = S.calendarDay;
  if (!day) return missingHtml();
  const activeId = S.route.pairId || S.activePairId || null;
  const dateLabel = fmtDate(day.date);
  const canMark = can('attendance.mark');
  const copyHost = !S.pairModalOpen
    ? `${pairConfirmBarHtml()}${pairCopyConfirmBarHtml()}`
    : '';
  const pairCards = day.pairs.length
    ? day.pairs.map((pair, index) => {
      const on = pair.scheduleEntryId === Number(activeId);
      const rate = pair.totalStudents ? Math.round(((pair.here || 0) / pair.totalStudents) * 100) : null;
      const level = rate == null || !pair.stats.marked ? 'empty' : rate >= 90 ? 'excellent' : rate >= 75 ? 'good' : rate >= 60 ? 'warn' : 'bad';
      const meta = [
        pair.timeStart && pair.timeEnd ? `${pair.timeStart}–${pair.timeEnd}` : '',
        pair.lessonKind,
        pair.room ? `ауд. ${pair.room}` : '',
        pair.teacher,
      ].filter(Boolean).join(' · ');
      const delay = Math.min(index * 45, 220);
      if (!canMark) {
        return `<article class="pair-card view-only level-border-empty" style="--pair-accent:${colorOf(pair.subjectName)}; --rise-delay:${delay}ms">
          <div class="pair-card-main">
            <div class="pair-num">${pair.pairNum}</div>
            <div class="pair-body">
              <strong>${esc(pair.subjectName)}</strong>
              <div class="muted">${esc(meta)}</div>
            </div>
          </div>
        </article>`;
      }
      const status = pair.stats.marked
        ? `<span class="pair-stat-chip level-text-${level}">на паре ${pair.here}/${pair.totalStudents}${pair.stats.absent ? ` · нет ${pair.stats.absent}` : ''}</span>`
        : '<span class="pair-stat-chip open">отметить</span>';
      const xfer = pairTransferPanelHtml(pair, day, { compact: true });
      return `<article class="pair-card ${on ? 'on' : ''} ${pair.stats.marked ? 'has-marks' : 'needs-marks'} level-border-${level}" style="--pair-accent:${colorOf(pair.subjectName)}; --rise-delay:${delay}ms">
        <button class="pair-card-main" type="button" data-act="open-pair-roster" data-entry="${pair.scheduleEntryId}" data-group="${day.group.id}" data-date="${day.date}">
          <div class="pair-num">${pair.pairNum}<small>пара</small></div>
          <div class="pair-body">
            <strong>${esc(pair.subjectName)}</strong>
            <div class="muted pair-meta">${esc(meta)}</div>
            ${pairMiniMeter(pair)}
            <div class="pair-stat-row">${status}</div>
          </div>
          <span class="pair-open" aria-hidden="true">→</span>
        </button>
        ${xfer}
      </article>`;
    }).join('')
    : (day.noSchedule
      ? `<div class="empty"><h2>Нет расписания на эту дату</h2><p>${esc(day.noScheduleReason === 'outside_ranges' ? 'Дата вне настроенных календарных недель.' : 'Для этой даты не задан период расписания.')}</p></div>`
      : '<div class="empty"><h2>Пар нет</h2><p>На этот день в расписании группы занятий нет.</p></div>');

  return `<div class="day-page">
    <div class="intro day-intro">
      <div>
        <div class="kicker">${esc(day.group.name)} · ${esc(weekTypeLabel(day.weekLabel || day.weekType))}</div>
        <h2>${esc(dateLabel)}</h2>
      </div>
      <a class="btn btn-ghost btn-small" href="#/calendar/${day.group.id}">Календарь</a>
    </div>
    ${canMark ? dayAttendanceStrip(day) : ''}
    ${canMark
      ? '<p class="hint day-hint">Откройте пару для переклички. Кнопки <b>С пары</b> / <b>На пару</b> переносят отметки с подтверждением.</p>'
      : '<p class="hint">Расписание группы на выбранный день.</p>'}
    ${copyHost ? `<div id="day-copy-host">${copyHost}</div>` : ''}
    <div class="pair-list">${pairCards}</div>
  </div>`;
}

function groupsPage() {
  const all = S.overview.groups || [];
  const tab = S.groupsTab === 'archive' ? 'archive' : 'active';
  const groups = all.filter((g) => (tab === 'archive' ? g.archived : !g.archived));
  const activeCount = all.filter((g) => !g.archived).length;
  const archiveCount = all.filter((g) => g.archived).length;
  const totalStudents = groups.reduce((sum, group) => sum + (group.studentCount || 0), 0);
  const excelBound = groups.filter((g) => g.scheduleBound || g.scheduleCode).length;
  const hint = tab === 'archive'
    ? 'Архив выпускных групп. Годы обучения указаны на карточке.'
    : (excelOn()
      ? 'Привязка Excel: группа → ссылка → код столбца → подтянуть пары.'
      : 'Excel выключен — правьте сетку вручную в разделе «Правка».');
  return `<section class="page-hero groups-hero card pad">
      <div class="kicker">Группы журнала</div>
      <h2>${ru(groups.length, 'группа', 'группы', 'групп')}</h2>
      <p class="muted groups-hero-lead">${ru(totalStudents, 'ученик', 'ученика', 'учеников')} · ${hint}</p>
      <div class="mini-kpis diary-kpis kpis-3">
        <div><b>${activeCount}</b><span>активных</span></div>
        <div><b>${archiveCount}</b><span>в архиве</span></div>
        <div><b>${excelBound}</b><span>с Excel</span></div>
      </div>
    </section>
    <div class="tabs hub-tabs groups-tabs" role="tablist" aria-label="Список групп">
      <button class="chip${tab === 'active' ? ' on' : ''}" type="button" data-act="groups-tab" data-tab="active">Активные · ${activeCount}</button>
      <button class="chip${tab === 'archive' ? ' on' : ''}" type="button" data-act="groups-tab" data-tab="archive">Архив · ${archiveCount}</button>
    </div>
    ${excelOn() && tab === 'active' ? `<div class="banner soft">Группа журнала = столбец в Excel. Название может отличаться — важен код (например А-101).</div>` : ''}
    ${tab === 'active' ? listsExportToolbar() : ''}
    ${groups.length ? `<div class="list group-list">${groups.map(groupCard).join('')}</div>` : `<div class="empty"><h2>${tab === 'archive' ? 'Архив пуст' : 'Групп нет'}</h2><p>${tab === 'archive' ? 'После летнего перевода выпускные группы появятся здесь.' : 'Создайте первую группу вашего заведения.'}</p></div>`}`;
}

function groupPage() {
  const group = S.overview.groups.find((item) => item.id === S.route.groupId);
  if (!group) return missingHtml();
  const students = S.overview.students.filter((item) => item.groupId === group.id);
  const subjects = S.overview.subjects.filter((item) => item.groupId === group.id);
  const canEditGroup = can('groups.rename') || can('groups.manage') || can('elders.appoint');
  const excelMeta = excelOn()
    ? (group.scheduleCode
      ? `Excel ${group.scheduleCode}${(group.scheduleAliases || []).length ? ` +${group.scheduleAliases.length}` : ''}`
      : 'Excel не привязан')
    : `${ru(group.scheduleCount || 0, 'пара', 'пары', 'пар')} в сетке`;
  return `<section class="page-hero group-hero card pad">
      <div class="group-hero-top">
        <div>
          <div class="kicker">Группа${group.elderName ? ` · староста ${esc(group.elderName)}` : ''}${group.archived ? ' · архив' : ''}${group.course ? ` · ${group.course} курс` : ''}</div>
          <h2>${esc(group.name)}</h2>
          <p class="muted">${esc(excelMeta)}${group.studyYears ? ` · ${esc(group.studyYears)}` : ''}${group.scheduleSyncedAt ? ` · сверка ${esc(syncAgoLabel(group.scheduleSyncedAt))}` : ''}</p>
        </div>
        <div class="intro-actions">
          <a class="btn btn-primary btn-small" href="#/calendar/${group.id}">Расписание</a>
          ${can('stats.view') ? `<a class="btn btn-ghost btn-small" href="#/stats/group/${group.id}">Статистика</a>` : ''}
          ${canEditGroup ? `<button class="btn btn-ghost btn-small" type="button" data-act="edit-group" data-id="${group.id}">Настройки</button>` : ''}
        </div>
      </div>
      <div class="mini-kpis diary-kpis">
        <div><b>${students.length}</b><span>учеников</span></div>
        <div><b>${subjects.length}</b><span>предметов</span></div>
        <div><b>${group.scheduleCount || 0}</b><span>пар</span></div>
        <div><b>${students.filter((s) => s.hasAccess).length}</b><span>с доступом</span></div>
      </div>
    </section>
    ${excelOn() && !group.scheduleBound ? `<div class="banner soft">Чтобы подтянуть пары: «Привязка Excel» → ссылка → найти группы → выбрать код столбца → подтянуть. Дальше сверка сама.</div>` : ''}
    ${excelOn() && group.scheduleBound ? `<div class="banner soft">Привязка ${esc(group.name)} ↔ ${esc(group.scheduleCode)} · сверка ${esc(syncAgoLabel(group.scheduleSyncedAt))}${group.scheduleSyncError ? ` · ${esc(group.scheduleSyncError)}` : ''}</div>` : ''}
    <div class="section-head"><h2>Ученики</h2>
      <div class="section-actions">
        ${can('stats.view') ? `<button class="btn btn-ghost btn-small export-btn" type="button" data-act="export" data-kind="roster" data-format="xlsx" data-group="${group.id}">${icon.download}<span>Excel</span></button>` : ''}
        ${can('students.manage') ? `<button class="btn btn-primary btn-small" type="button" data-act="add-student" data-group="${group.id}">Добавить</button>` : ''}
      </div>
    </div>
    ${students.length ? `<div class="list">${students.map(studentCard).join('')}</div>` : '<div class="empty"><h2>Пока пусто</h2><p>Добавьте учеников этой группы.</p></div>'}
    <div class="section-head"><h2>Предметы</h2>
      <div class="section-actions">
        ${can('stats.view') ? `<button class="btn btn-ghost btn-small export-btn" type="button" data-act="export" data-kind="subjects" data-format="xlsx" data-group="${group.id}">${icon.download}<span>Excel</span></button>` : ''}
        ${can('subjects.manage') ? `<button class="btn btn-primary btn-small" type="button" data-act="add-subject" data-group="${group.id}">Добавить</button>` : ''}
      </div>
    </div>
    ${subjects.length ? `<div class="list">${sortSubjects(subjects, S.subjectSort || 'lessons').map(subjectCard).join('')}</div>` : `<div class="empty"><h2>Предметов нет</h2><p>${can('subjects.manage') ? 'Добавьте предмет — или он появится из Excel/пары.' : 'Нужно право «Добавлять предметы».'}</p></div>`}
    ${exportToolbar({ groupId: group.id })}`;
}

function chips(groups, { counts = true } = {}) {
  const allOn = !S.groupFilter;
  const total = (groups || []).reduce((sum, g) => sum + (Number(g.studentCount) || 0), 0);
  const items = [`<button class="chip${allOn ? ' on' : ''}" type="button" data-act="filter-group" data-id="">Все${counts ? ` · ${total}` : ''}</button>`];
  for (const group of groups) {
    const on = String(S.groupFilter) === String(group.id);
    const count = counts ? ` · ${Number(group.studentCount) || 0}` : '';
    items.push(`<button class="chip${on ? ' on' : ''}" type="button" data-act="filter-group" data-id="${group.id}">${esc(group.name)}${count}</button>`);
  }
  return `<div class="chips group-filter-chips" role="toolbar" aria-label="Фильтр по группе">${items.join('')}</div>`;
}

function filterByGroup(rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (!S.groupFilter) return list;
  const want = String(S.groupFilter);
  return list.filter((item) => String(item.groupId ?? item.group_id ?? '') === want);
}

function studentsPage() {
  const groups = S.overview?.groups || [];
  const students = S.overview?.students || [];
  const filtered = filterByGroup(students);
  const activeGroup = S.groupFilter
    ? groups.find((g) => String(g.id) === String(S.groupFilter))
    : null;
  const withAccess = filtered.filter((item) => item.hasAccess).length;
  const canAdd = can('students.manage');
  const empty = filtered.length
    ? `<div class="list" id="list">${filtered.map(studentCard).join('')}</div><p id="empty-filter" class="muted" hidden>Ничего не найдено</p>`
    : `<div class="empty students-empty">
        <h2>${activeGroup ? `В «${esc(activeGroup.name)}» нет учеников` : 'Учеников пока нет'}</h2>
        <p>${activeGroup
          ? 'Группа есть, но список пуст — добавьте учеников в эту группу.'
          : (groups.length
            ? 'Во всех доступных группах список пуст. Добавьте учеников или попросите администратора.'
            : 'Сначала нужна группа, затем ученики.')}</p>
        <div class="row-actions toolbar-row" style="justify-content:center;margin-top:12px">
          ${canAdd ? `<button class="btn btn-primary" type="button" data-act="add-student"${activeGroup ? ` data-group="${activeGroup.id}"` : ''}>Добавить ученика</button>` : ''}
          ${activeGroup ? `<a class="btn btn-ghost" href="#/group/${activeGroup.id}">Открыть группу</a>` : ''}
          ${!activeGroup && groups[0] ? `<a class="btn btn-ghost" href="#/group/${groups[0].id}">К группе</a>` : ''}
        </div>
      </div>`;
  return `<section class="page-hero students-hero card pad">
      <div class="kicker">${activeGroup ? esc(activeGroup.name) : 'Электронный дневник'}</div>
      <h2>${ru(filtered.length, 'ученик', 'ученика', 'учеников')}</h2>
      <p class="muted">${activeGroup
        ? `Фильтр по группе · ${withAccess ? `доступ выдан: ${withAccess}` : 'добавьте учеников или выгрузите список'}`
        : `Ученика создаёт администратор и сразу относит в группу.${withAccess ? ` Доступ выдан: ${withAccess}.` : ''}`}</p>
      ${canAdd ? `<div class="row-actions toolbar-row" style="margin-top:12px">
        <button class="btn btn-primary btn-small" type="button" data-act="add-student"${activeGroup ? ` data-group="${activeGroup.id}"` : ''}>Добавить ученика</button>
      </div>` : ''}
    </section>
    <input id="q" class="search" placeholder="Поиск по имени" value="${esc(S.q)}" autocomplete="off" enterkeyhint="search">
    ${groups.length ? chips(groups) : ''}
    ${listsExportToolbar({ groupId: S.groupFilter || undefined })}
    ${empty}`;
}

function sortSubjects(list, mode) {
  const rows = [...list];
  const byName = (a, b) => a.name.localeCompare(b.name, 'ru')
    || String(a.groupName || '').localeCompare(String(b.groupName || ''), 'ru');
  if (mode === 'name') return rows.sort(byName);
  const key = mode === 'pairs' ? 'scheduleCount'
    : mode === 'credits' ? 'creditCount'
      : mode === 'works' ? 'workCount'
        : 'lessonCount';
  return rows.sort((a, b) => (Number(b[key]) || 0) - (Number(a[key]) || 0) || byName(a, b));
}

function subjectSortChips() {
  const mode = S.subjectSort || 'lessons';
  const items = [
    ['lessons', 'По занятиям'],
    ['pairs', 'По парам'],
    ['credits', 'По зачётам'],
    ['works', 'По оценкам'],
    ['name', 'А–Я'],
  ];
  return `<div class="chips sort-chips" role="toolbar" aria-label="Сортировка">
    ${items.map(([value, label]) => `<button class="chip${mode === value ? ' on' : ''}" type="button" data-act="subject-sort" data-sort="${value}">${label}</button>`).join('')}
  </div>`;
}

function subjectsPage() {
  const groups = S.overview?.groups || [];
  const subjects = S.overview?.subjects || [];
  const scoped = filterByGroup(subjects);
  const clustered = S.groupFilter
    ? sortSubjects(scoped, S.subjectSort || 'lessons').map((subject) => ({
      key: normalizeSubjectKey(subject.name) || `id:${subject.id}`,
      name: subject.name,
      items: [subject],
      lessonCount: subject.lessonCount || 0,
      scheduleCount: subject.scheduleCount || 0,
      creditCount: subject.creditCount || 0,
      workCount: subject.workCount || 0,
    }))
    : sortSubjects(clusterSubjectsByName(scoped), S.subjectSort || 'lessons');
  const cards = clustered.map((cluster) => {
    const search = `${cluster.name} ${cluster.items.map((item) => item.groupName).join(' ')}`;
    const hidden = hiddenByQuery(search);
    return subjectClusterCard(cluster).replace('data-search=', `${hidden ? 'hidden' : ''} data-search=`);
  }).join('');
  const multiCount = clustered.filter((cluster) => cluster.items.length > 1).length;
  const dupes = (S.subjectDupes?.clusters || []).filter((cluster) => !S.groupFilter || String(cluster.groupId) === String(S.groupFilter));
  const dupeBanner = dupes.length
    ? `<div class="card pad dupe-banner">
        <strong>Похожие предметы (${dupes.length})</strong>
        <p class="muted">Объедините дубли внутри одной группы, чтобы оценки и явка не разъезжались.</p>
        ${dupes.map((cluster) => `<div class="dupe-cluster">
          <div class="muted">${esc(cluster.groupName)} · ${cluster.subjects.map((s) => esc(s.name)).join(' / ')}</div>
          <button class="btn btn-ghost btn-small" type="button" data-act="merge-subjects" data-keep="${cluster.subjects[0].id}" data-ids="${cluster.subjects.slice(1).map((s) => s.id).join(',')}">Объединить</button>
        </div>`).join('')}
      </div>`
    : '';
  const canAdd = can('subjects.manage');
  return `<section class="page-hero subjects-hero card pad">
      <div class="section-head subjects-head" style="margin:0">
        <div>
          <div class="kicker">Каталог</div>
          <h2>${ru(clustered.length, 'предмет', 'предмета', 'предметов')}</h2>
          <p class="muted tight subjects-lead">${S.groupFilter
            ? 'Фильтр по группе'
            : (multiCount
              ? `Одинаковые названия собраны вместе · ${ru(multiCount, 'предмет с несколькими группами', 'предмета с несколькими группами', 'предметов с несколькими группами')}`
              : 'Один предмет — несколько групп внутри карточки')}</p>
        </div>
        ${canAdd ? `<button class="btn btn-primary btn-small" type="button" data-act="add-subject">Добавить</button>` : ''}
      </div>
    </section>
    ${listsExportToolbar({ groupId: S.groupFilter || undefined })}
    ${dupeBanner}
    <input id="q" class="search" placeholder="Поиск предмета или группы" value="${esc(S.q)}" autocomplete="off">
    ${groups.length ? chips(groups, { counts: false }) : ''}
    ${subjectSortChips()}
    ${clustered.length ? `<div class="list subject-catalog" id="list">${cards}</div><p id="empty-filter" class="muted" hidden>Ничего не найдено</p>` : `<div class="empty"><h2>Предметов нет</h2><p>${canAdd ? 'Добавьте предмет сразу в нужные группы или подтяните расписание из Excel.' : 'Попросите доступ «Добавлять предметы».'}</p>${canAdd ? '<button class="btn btn-primary" type="button" data-act="add-subject">Добавить предмет</button>' : ''}</div>`}`;
}

function subjectHubPage() {
  const key = S.route?.key || '';
  const subjects = S.overview?.subjects || [];
  const items = subjects
    .filter((subject) => normalizeSubjectKey(subject.name) === key)
    .sort((a, b) => a.groupName.localeCompare(b.groupName, 'ru') || a.id - b.id);
  if (!items.length) return missingHtml();
  const name = [...items].sort((a, b) => String(b.name || '').length - String(a.name || '').length || a.id - b.id)[0].name;
  const totals = {
    lessonCount: items.reduce((sum, row) => sum + (Number(row.lessonCount) || 0), 0),
    scheduleCount: items.reduce((sum, row) => sum + (Number(row.scheduleCount) || 0), 0),
    creditCount: items.reduce((sum, row) => sum + (Number(row.creditCount) || 0), 0),
    workCount: items.reduce((sum, row) => sum + (Number(row.workCount) || 0), 0),
  };
  return `<section class="page-hero subjects-hero card pad subject-hub-hero">
      <div class="kicker">Предмет · ${ru(items.length, 'группа', 'группы', 'групп')}</div>
      <h2>${esc(name)}</h2>
      <p class="muted">Журнал у каждой группы свой — откройте нужную строку.</p>
      ${subjectCountPills(totals)}
    </section>
    <div class="list subject-hub-list">
      ${items.map((item) => `<article class="card pad subject-hub-group">
        <div class="subject-hub-group-head">
          <div>
            <strong>${esc(item.groupName)}</strong>
            <div class="muted">${item.lessonCount || 0} зан. · ${item.scheduleCount || 0} пар${item.creditCount ? ` · ${item.creditCount} зач.` : ''}${item.workCount ? ` · ${item.workCount} оц.` : ''}</div>
          </div>
          ${can('subjects.manage') ? `<button class="icon-btn dark" type="button" data-act="edit-subject" data-id="${item.id}" aria-label="Изменить">${icon.edit}</button>` : ''}
        </div>
        <div class="subject-hub-actions">
          <a class="btn btn-primary btn-small" href="#/subject/${item.id}/attendance">Явка</a>
          <a class="btn btn-ghost btn-small" href="#/subject/${item.id}/credits">Зачёты</a>
          ${gradesOn() ? `<a class="btn btn-ghost btn-small" href="#/subject/${item.id}/grades">Оценки</a>` : ''}
          <a class="btn btn-ghost btn-small" href="#/group/${item.groupId}">Группа</a>
        </div>
      </article>`).join('')}
    </div>`;
}

function subjectTabs(subject, tab) {
  const link = (key, full, short) => `<a href="#/subject/${subject.id}/${key}" class="${tab === key ? 'on' : ''}"><span class="full">${full}</span><span class="short">${short}</span></a>`;
  const siblings = (S.journal?.siblings || []).slice().sort((a, b) => a.groupName.localeCompare(b.groupName, 'ru'));
  const groupSwitch = siblings.length > 1
    ? `<div class="chips subject-group-switch scroll-chips" role="toolbar" aria-label="Группы предмета">
        ${siblings.map((row) => `<a class="chip${row.id === subject.id ? ' on' : ''}" href="#/subject/${row.id}/${tab}">${esc(row.groupName)}</a>`).join('')}
      </div>`
    : '';
  return `<div class="intro"><div><div class="kicker">${esc(subject.groupName)}${siblings.length > 1 ? ` · ${siblings.length} групп` : ''}</div><h2>${esc(subject.name)}</h2></div>
    ${can('subjects.manage') ? `<button class="btn btn-ghost btn-small" type="button" data-act="edit-subject" data-id="${subject.id}">Изменить</button>` : ''}</div>
    ${groupSwitch}
    <div class="tabs">
      ${link('attendance', 'Посещаемость', 'Явка')}
      ${link('credits', 'Зачёты', 'Зачёты')}
      ${gradesOn() ? link('grades', 'Оценки', 'Оценки') : ''}
    </div>`;
}

function hereCount(lesson, students) {
  let here = 0;
  for (const student of students) {
    const status = markStatus(lesson.marks, student.id);
    if (status === 'present' || status === 'late') here += 1;
  }
  return here;
}

function subjectPage() {
  if (S.missing || !S.journal) return missingHtml();
  const { subject, students, lessons, credits, works } = S.journal;
  const tab = S.route.tab || 'attendance';
  const head = subjectTabs(subject, tab);
  if (!students.length) {
    return `${head}<div class="empty"><h2>В группе нет учеников</h2><p>Отметки и оценки ставятся ученикам этой группы.</p><a class="btn btn-primary" href="#/group/${subject.groupId}">К группе</a></div>`;
  }
  if (tab === 'credits') return head + creditsTab(subject, students, credits);
  if (tab === 'grades') {
    if (!gradesOn()) {
      return `${head}<div class="empty"><h2>Оценки отключены</h2><p>Включите их в настройках администратора.</p></div>`;
    }
    return head + gradesTab(students, works);
  }
  return head + attendanceTab(subject, students, lessons);
}

function attendanceTab(subject, students, lessons) {
  const totals = S.stats?.totals;
  const perStudent = S.stats?.students || [];
  const summary = totals ? `<section class="subject-stats card pad">
      <div class="subject-stats-grid">
        <div>
          <div class="kicker">Явка по предмету</div>
          <div class="big-pct level-text-${esc(totals.level)}">${Charts.fmtPct(totals.rate)}</div>
          ${Charts.meter(totals.rate, totals.level)}
          <div class="mini-kpis">
            <div><b>${totals.present}</b><span>был</span></div>
            <div><b>${totals.late}</b><span>опоздал</span></div>
            <div><b class="bad-num">${totals.absent}</b><span>не был</span></div>
          </div>
        </div>
        <div>${Charts.donut(totals)}</div>
      </div>
      ${perStudent.length ? `<div class="section-head tight"><h3>Ученики</h3><a href="#/stats/group/${subject.groupId}">Вся группа</a></div>
        <div class="list compact">${perStudent.map(studentStatCard).join('')}</div>` : ''}
      ${exportToolbar({ subjectId: subject.id, groupId: subject.groupId })}
    </section>` : '';
  if (!lessons.length) {
    return `${summary}<p class="hint">План — это даты занятий. Добавьте занятие и отметьте, кто был.</p><div class="empty"><h2>План пуст</h2><p>Первое занятие можно поставить на сегодня.</p></div>`;
  }
  const cards = lessons.map((lesson) => {
    const parts = dateParts(lesson.date);
    return `<a class="card card-main" href="#/subject/${subject.id}/lesson/${lesson.id}">
      <div class="lesson-row">
        <div class="datechip"><b>${parts.day}</b><span>${esc(parts.month)}</span></div>
        <div><strong>${esc(lesson.topic || 'Без темы')}</strong><div class="muted">${esc(parts.weekday)} · на занятии ${hereCount(lesson, students)}/${students.length}</div></div>
      </div>
    </a>`;
  }).join('');
  return `${summary}<p class="hint">План посещаемости. Откройте занятие, чтобы отметить учеников.</p><div class="list">${cards}</div>`;
}

function creditsTab(subject, students, credits) {
  if (!credits.length) {
    return `<p class="hint">План зачётов и экзаменов. Сначала дата и вид, потом результат каждому.</p><div class="empty"><h2>Зачётов нет</h2><p>Добавьте зачёт или экзамен в план.</p></div>`;
  }
  const cards = credits.map((credit) => {
    const parts = dateParts(credit.date);
    const values = students.map((student) => mapGet(credit.results, student.id)).filter(Boolean);
    let summary;
    if (credit.kind === 'exam') {
      const nums = values.map(Number);
      summary = `средний ${avgOf(nums) || '—'} · ${values.length}/${students.length}`;
    } else {
      const pass = values.filter((value) => value === 'pass').length;
      summary = `зачёт ${pass}/${students.length}`;
    }
    return `<a class="card card-main" href="#/subject/${subject.id}/credit/${credit.id}">
      <div class="lesson-row">
        <div class="datechip"><b>${parts.day}</b><span>${esc(parts.month)}</span></div>
        <div><strong>${esc(credit.title)}</strong><div class="muted"><span class="badge ${credit.kind}">${credit.kind === 'exam' ? 'Экзамен' : 'Зачёт'}</span> ${esc(summary)}</div></div>
      </div>
    </a>`;
  }).join('');
  return `<p class="hint">План зачётов. Откройте строку и выставьте результат.</p>
    ${exportToolbar({ subjectId: subject.id, groupId: subject.groupId })}
    <div class="list">${cards}</div>`;
}

function gradesTab(students, works) {
  const all = [];
  for (const work of works) {
    for (const student of students) {
      const value = mapGet(work.grades, student.id);
      if (value != null) all.push(Number(value));
    }
  }
  const summary = `<p class="hint">Колонка — работа или ответ. Нажмите клетку и поставьте оценку от 2 до 5. Средний балл: <b>${avgOf(all) || '—'}</b></p>`;
  if (!works.length) return `${summary}<div class="empty"><h2>Оценок нет</h2><p>Добавьте колонку: контрольная, самостоятельная или ответ.</p></div>`;
  const head = works.map((work) => {
    const parts = dateParts(work.date);
    return `<th><button class="work-head" type="button" data-act="edit-work" data-id="${work.id}"><span class="t">${esc(work.title)}</span><span class="d">${parts.day} ${esc(parts.month)}</span></button></th>`;
  }).join('');
  const rows = students.map((student) => {
    const values = works.map((work) => mapGet(work.grades, student.id)).filter((value) => value != null).map(Number);
    const cells = works.map((work) => {
      const value = mapGet(work.grades, student.id);
      const cls = value == null ? '' : ` g${value}`;
      return `<td><button class="mark${cls}" type="button" data-act="pick-grade" data-work="${work.id}" data-student="${student.id}">${value == null ? '—' : value}</button></td>`;
    }).join('');
    return `<tr><td><div class="stu-name">${esc(student.fullName)}</div><div class="stu-avg">${values.length ? `ср. ${avgOf(values)}` : 'нет оценок'}</div></td>${cells}</tr>`;
  }).join('');
  return `${summary}${exportToolbar({ subjectId: S.journal.subject.id, groupId: S.journal.subject.groupId })}
    <div class="table-scroll pad-fab"><table class="marks"><thead><tr><th>Ученик</th>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function lessonPage() {
  if (S.missing || !S.journal) return missingHtml();
  const lesson = S.journal.lessons.find((item) => item.id === S.route.lessonId);
  if (!lesson) return missingHtml();
  const { subject, students } = S.journal;
  const here = hereCount(lesson, students);
  const marked = students.filter((student) => markStatus(lesson.marks, student.id)).length;
  return `<div class="kicker">${esc(subject.groupName)} · ${esc(subject.name)}</div>
    <div class="intro"><h2>${esc(lesson.topic || 'Без темы')}</h2></div>
    <p class="muted">${esc(fmtDate(lesson.date))}</p>
    <p id="stat-line" data-mode="attendance">на занятии ${here} из ${students.length} · отмечено ${marked}</p>
    <div class="row-actions">
      <button class="btn btn-ghost" type="button" data-act="edit-lesson" data-id="${lesson.id}">Изменить</button>
      <button class="btn btn-primary" type="button" data-act="fill-present" data-id="${lesson.id}">Все здесь</button>
      <button class="btn btn-danger" type="button" data-act="delete-lesson" data-id="${lesson.id}">Удалить</button>
    </div>
    ${students.length ? `<input id="q" class="search" placeholder="Поиск ученика" value="${esc(S.q)}" autocomplete="off">
      <div class="people">${students.map((student) => personAttendance(lesson, student)).join('')}</div>
      <p id="empty-filter" class="muted" hidden>Ничего не найдено</p>` : `<div class="empty"><h2>Нет учеников</h2><a class="btn btn-primary" href="#/group/${subject.groupId}">К группе</a></div>`}`;
}

function personAttendance(lesson, student) {
  const status = markStatus(lesson.marks, student.id);
  const comment = markComment(lesson.marks, student.id);
  const hidden = hiddenByQuery(student.fullName);
  const btn = (value, label, positive) => `<button type="button" class="${value}${status === value ? ' on' : ''}" data-act="mark" data-status="${value}" data-lesson="${lesson.id}" data-student="${student.id}" ${positive ? 'data-positive="1"' : ''}>${label}</button>`;
  return `<div class="person pair-person" data-search="${esc(student.fullName)}" ${hidden ? 'hidden' : ''}>
    ${avatarHtml(student.fullName, student.photoUrl)}
    <div class="person-name">
      <strong>${esc(student.fullName)}</strong>
      ${comment ? `<span class="person-note">${esc(comment)}</span>` : ''}
    </div>
    <div class="seg four">${btn('present', 'Здесь', true)}${btn('late', 'Опозд.', true)}${btn('excused', 'Уваж.', true)}${btn('absent', 'Нет', false)}</div>
    <label class="mark-comment">
      <span class="sr-only">Комментарий</span>
      <input type="text" maxlength="240" placeholder="Комментарий" value="${esc(comment)}" data-act-input="lesson-comment" data-lesson="${lesson.id}" data-student="${student.id}">
    </label>
  </div>`;
}

function creditPage() {
  if (S.missing || !S.journal) return missingHtml();
  const credit = S.journal.credits.find((item) => item.id === S.route.creditId);
  if (!credit) return missingHtml();
  const { subject, students } = S.journal;
  const marked = students.filter((student) => mapGet(credit.results, student.id)).length;
  return `<div class="kicker">${esc(subject.groupName)} · ${esc(subject.name)}</div>
    <div class="intro"><h2>${esc(credit.title)}</h2></div>
    <p class="muted"><span class="badge ${credit.kind}">${credit.kind === 'exam' ? 'Экзамен' : 'Зачёт'}</span> ${esc(fmtDate(credit.date))}</p>
    <p id="stat-line">выставлено ${marked} из ${students.length}</p>
    <div class="row-actions">
      <button class="btn btn-ghost" type="button" data-act="edit-credit" data-id="${credit.id}">Изменить</button>
      <button class="btn btn-danger" type="button" data-act="delete-credit" data-id="${credit.id}">Удалить</button>
    </div>
    ${students.length ? `<input id="q" class="search" placeholder="Поиск ученика" value="${esc(S.q)}" autocomplete="off">
      <div class="people">${students.map((student) => personCredit(credit, student)).join('')}</div>
      <p id="empty-filter" class="muted" hidden>Ничего не найдено</p>` : `<div class="empty"><h2>Нет учеников</h2><a class="btn btn-primary" href="#/group/${subject.groupId}">К группе</a></div>`}`;
}

function personCredit(credit, student) {
  const result = String(mapGet(credit.results, student.id) || '');
  const hidden = hiddenByQuery(student.fullName);
  if (credit.kind === 'exam') {
    const buttons = ['5', '4', '3', '2'].map((value) => `<button type="button" class="g${value}${result === value ? ' on' : ''}" data-act="result" data-result="${value}" data-credit="${credit.id}" data-student="${student.id}">${value}</button>`).join('');
    return `<div class="person" data-search="${esc(student.fullName)}" ${hidden ? 'hidden' : ''}>${avatarHtml(student.fullName, student.photoUrl)}<strong>${esc(student.fullName)}</strong><div class="seg four">${buttons}</div></div>`;
  }
  const btn = (value, label, cls) => `<button type="button" class="${cls}${result === value ? ' on' : ''}" data-act="result" data-result="${value}" data-credit="${credit.id}" data-student="${student.id}">${label}</button>`;
  return `<div class="person" data-search="${esc(student.fullName)}" ${hidden ? 'hidden' : ''}>${avatarHtml(student.fullName, student.photoUrl)}<strong>${esc(student.fullName)}</strong><div class="seg two">${btn('pass', 'Зачёт', 'pass')}${btn('fail', 'Незачёт', 'fail')}</div></div>`;
}

function diaryPage() {
  const data = S.diary;
  if (!data?.student) return missingHtml();
  const att = data.attendance || { history: [], absent: 0, late: 0, excused: 0, present: 0, rate: null, level: 'empty' };
  const misses = (att.history || []).filter((item) => item.status === 'absent' || item.status === 'late' || item.status === 'excused')
    .slice().reverse();
  return `<section class="student-hero diary-profile card pad level-border-${esc(att.level)}">
      <div class="student-hero-top">
        ${avatarHtml(data.student.fullName, data.student.photoUrl, 'xl')}
        <div>
          <div class="kicker">${esc(data.student.groupName)} · мой дневник</div>
          <h2>${esc(data.student.fullName)}</h2>
          ${Charts.levelBadge(att.level)}
        </div>
      </div>
      <div class="big-pct level-text-${esc(att.level)}">${Charts.fmtPct(att.rate)}</div>
      ${Charts.meter(att.rate, att.level)}
      <div class="mini-kpis">
        <div><b>${att.present || 0}</b><span>был</span></div>
        <div><b>${att.late || 0}</b><span>опоздал</span></div>
        <div><b class="bad-num">${att.absent || 0}</b><span>пропуск</span></div>
        <div><b>${att.excused || 0}</b><span>уваж.</span></div>
      </div>
    </section>
    <div class="tabs hub-tabs">
      <a href="#/diary" class="on">Пропуски</a>
      ${gradesOn() ? '<a href="#/diary/grades">Оценки</a>' : ''}
      <a href="#/calendar">Расписание</a>
    </div>
    <div class="section-head"><h2>Пропуски и опоздания</h2></div>
    ${misses.length ? `<div class="history-list">${misses.map((item) => `
      <div class="history-row status-${esc(item.status || 'none')}">
        <div class="datechip mini"><b>${dateParts(item.date).day}</b><span>${esc(dateParts(item.date).month)}</span></div>
        <div><strong>${esc(item.subjectName)}</strong><div class="muted">${esc(item.topic || '')}</div></div>
        <span class="status-pill ${esc(item.status || 'none')}">${statusLabel(item.status)}</span>
      </div>`).join('')}</div>` : '<div class="empty soft"><h2>Пропусков нет</h2><p>Так держать!</p></div>'}`;
}

function diaryGradesPage() {
  if (!gradesOn()) {
    return `<div class="empty"><h2>Оценки отключены</h2><p>Администратор выключил оценки в настройках.</p><a class="btn btn-primary" href="#/diary">К пропускам</a></div>`;
  }
  const data = S.diary;
  if (!data?.student) return missingHtml();
  return `<div class="tabs hub-tabs">
      <a href="#/diary">Пропуски</a>
      <a href="#/diary/grades" class="on">Оценки</a>
      <a href="#/calendar">Расписание</a>
    </div>
    <div class="side-stats">
      <div class="card pad">
        <div class="kicker">Средний балл</div>
        <div class="big-pct">${data.grades?.average == null ? '—' : String(data.grades.average).replace('.', ',')}</div>
        <p class="muted">${ru(data.grades?.count || 0, 'оценка', 'оценки', 'оценок')}</p>
      </div>
      <div class="card pad">
        <div class="kicker">Зачёты</div>
        <div class="big-pct">${(data.credits || []).length}</div>
      </div>
    </div>
    ${(data.grades?.rows || []).length ? `<div class="tiny-list">${data.grades.rows.map((row) => `
      <div class="tiny-row"><span>${esc(row.subjectName)} · ${esc(row.title)} · ${esc(fmtDate(row.date))}</span><b class="g${row.value}">${row.value}</b></div>`).join('')}</div>` : '<p class="muted">Оценок пока нет.</p>'}
    ${(data.credits || []).length ? `<div class="section-head"><h2>Зачёты и экзамены</h2></div>
      <div class="tiny-list">${data.credits.map((row) => `
        <div class="tiny-row"><span>${esc(row.subjectName)} · ${esc(row.title)}</span><b>${esc(row.result === 'pass' ? 'Зачёт' : row.result === 'fail' ? 'Незачёт' : row.result)}</b></div>`).join('')}</div>` : ''}`;
}

function teachersPage() {
  const teachers = S.teachers?.teachers || [];
  return `<section class="page-hero teachers-hero card pad">
      <div class="kicker">Электронный дневник</div>
      <h2>${ru(teachers.length, 'педагог', 'педагога', 'педагогов')}</h2>
      <p class="muted">ФИО ищет пары во всём Excel-расписании. Группы подтягиваются из найденных пар.</p>
    </section>
    <div class="row-actions toolbar-row">
      ${can('teachers.manage') ? '<button class="btn btn-primary btn-small" type="button" data-act="add-teacher">Добавить</button>' : ''}
      ${can('teachers.manage') ? '<button class="btn btn-ghost btn-small" type="button" data-act="discover-teachers">Из расписания</button>' : ''}
      ${S.me?.teacherId ? '<a class="btn btn-ghost btn-small" href="#/teacher/schedule">Мои пары</a>' : ''}
      ${can('teachers.manage') || can('stats.view') ? `<button class="btn btn-ghost btn-small export-btn" type="button" data-act="export" data-kind="teachers" data-format="xlsx">${icon.download}<span>Excel</span></button>` : ''}
    </div>
    <input id="q" class="search" placeholder="Поиск педагога или группы…" value="${esc(S.q)}" autocomplete="off" enterkeyhint="search">
    <div class="list" style="margin-top:12px">${teachers.length ? teachers.map((teacher) => {
      const groupNames = [...new Set([
        ...(teacher.groups || []).map((g) => g.name),
        ...(teacher.scheduleGroups || []).map((g) => g.name),
      ].filter(Boolean))];
      const meta = [
        teacher.shortName || '',
        teacher.scheduleCount != null ? `${teacher.scheduleCount} пар` : '',
        groupNames.length ? `${groupNames.length} групп` : '',
        teacher.hasAccess ? 'доступ есть' : '',
        teacher.email || '',
      ].filter(Boolean).join(' · ');
      return `
      <article class="card person-card diary-person" data-search="${esc(teacher.fullName)} ${esc(teacher.shortName || '')} ${esc(teacher.email || '')} ${esc(groupNames.join(' '))}">
        <a class="person-main" href="#/teachers/${teacher.id}">
          ${avatarHtml(teacher.fullName, teacher.photoUrl)}
          <div>
            <strong>${esc(teacher.fullName)}</strong>
            <div class="muted">${esc(meta)}</div>
            ${groupNames.length ? `<div class="teacher-group-chips">${groupNames.slice(0, 8).map((name) => `<span class="chip tiny">${esc(name)}</span>`).join('')}${groupNames.length > 8 ? `<span class="muted">+${groupNames.length - 8}</span>` : ''}</div>` : ''}
          </div>
        </a>
        ${can('teachers.manage') ? `<button class="icon-btn dark" type="button" data-act="edit-teacher" data-id="${teacher.id}" aria-label="Изменить">${icon.edit}</button>` : ''}
      </article>`;
    }).join('') : '<div class="empty"><h2>Нет педагогов</h2><p>Добавьте вручную или импортируйте из Excel-расписания.</p></div>'}</div>`;
}

function teacherScheduleGrid(entries, weekTypeToday) {
  const filtered = entries || [];
  const byDay = new Map();
  for (let d = 1; d <= 6; d += 1) byDay.set(d, []);
  for (const entry of filtered) {
    const list = byDay.get(entry.weekday) || [];
    list.push(entry);
    byDay.set(entry.weekday, list);
  }
  return `<div class="teacher-week">
    <div class="kicker">${esc(weekTypeLabel(weekTypeToday))} · текущая логика недели</div>
    ${[1, 2, 3, 4, 5, 6].map((day) => {
      const items = (byDay.get(day) || []).sort((a, b) => a.pairNum - b.pairNum);
      if (!items.length) return '';
      return `<section class="schedule-day teacher-day">
        <h3>${esc(WEEKDAY_LABELS[day] || `День ${day}`)}</h3>
        <div class="list">${items.map((entry) => `
          <article class="card schedule-row teacher-pair" style="--pair-accent:${colorOf(entry.subjectName)}">
            <div class="schedule-pair">${entry.pairNum}</div>
            <div class="schedule-body">
              <strong>${esc(entry.subjectName)}</strong>
              <div class="muted">${esc([
                entry.timeStart && entry.timeEnd ? `${entry.timeStart}–${entry.timeEnd}` : '',
                entry.groupName || entry.groupCode,
                entry.lessonKind,
                entry.room ? `ауд. ${entry.room}` : '',
              ].filter(Boolean).join(' · '))}</div>
            </div>
            ${entry.groupId ? `<a class="btn btn-ghost btn-small" href="#/calendar/${entry.groupId}">Группа</a>` : ''}
          </article>`).join('')}</div>
      </section>`;
    }).join('') || '<div class="empty soft"><h2>Пар не найдено</h2><p>Проверьте, что ФИО педагога совпадает с текстом в Excel.</p></div>'}
  </div>`;
}

function teacherGroupLinks(assigned = [], fromSchedule = []) {
  const byId = new Map();
  for (const g of [...fromSchedule, ...assigned]) {
    if (!g?.groupId) continue;
    const prev = byId.get(Number(g.groupId)) || { groupId: g.groupId, name: g.name, pairs: 0 };
    prev.name = g.name || prev.name;
    if (g.pairs) prev.pairs = g.pairs;
    byId.set(Number(g.groupId), prev);
  }
  return [...byId.values()].sort((a, b) => String(a.name).localeCompare(String(b.name), 'ru'));
}

function teacherGroupsPanel(groups, { canMark = false } = {}) {
  if (!groups.length) {
    return '<p class="muted">Группы пока не найдены — проверьте ФИО как в Excel или назначьте вручную.</p>';
  }
  return `<div class="list teacher-group-actions">${groups.map((g) => `
    <article class="card row-card">
      <div class="card-main">
        <strong>${esc(g.name)}</strong>
        <span class="muted">${g.pairs ? `${g.pairs} пар в сетке педагога` : 'закреплена · полное расписание группы'}</span>
      </div>
      <div class="row-actions">
        <a class="btn btn-ghost btn-small" href="#/calendar/${g.groupId}">Расписание</a>
        ${canMark ? `<a class="btn btn-primary btn-small" href="#/calendar/${g.groupId}">Отмечать</a>` : ''}
      </div>
    </article>`).join('')}</div>`;
}

function teacherPage() {
  const data = S.teacherDetail;
  if (!data?.teacher) return missingHtml();
  const teacher = data.teacher;
  const result = S.accessResult;
  const assigned = data.groups || [];
  const fromSchedule = data.scheduleGroups || [];
  const groupLinks = teacherGroupLinks(assigned, fromSchedule);
  const assignedIds = new Set(assigned.map((g) => Number(g.groupId)));
  const allGroups = data.allGroups || [];
  const scheduleCount = (data.schedule || []).length;
  const canMark = can('attendance.mark') || can('teachers.manage');
  return `<section class="student-hero diary-profile card pad">
      <div class="student-hero-top">
        ${avatarHtml(teacher.fullName, teacher.photoUrl, 'xl')}
        <div>
          <div class="kicker">Педагог${teacher.hasAccess ? ' · доступ есть' : ''}</div>
          <h2>${esc(teacher.fullName)}</h2>
          <p class="muted">${esc(teacher.shortName || '')}${teacher.email ? ` · ${esc(teacher.email)}` : ''} · ${scheduleCount} пар · ${groupLinks.length} групп</p>
          ${can('teachers.manage') ? `<div class="photo-actions">
            <label class="btn btn-ghost btn-small photo-upload-btn">Фото
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden data-act-change="upload-teacher-photo" data-id="${teacher.id}">
            </label>
          </div>` : ''}
        </div>
      </div>
    </section>
    <section class="card pad teacher-groups-card">
      <div class="section-head"><h2>Группы педагога</h2></div>
      <p class="hint">Пары из Excel + закреплённые группы (куратор). У каждой группы — полное расписание и отметки.</p>
      ${teacherGroupsPanel(groupLinks, { canMark })}
      ${can('teachers.manage') && allGroups.length ? `<form data-form="save-teacher-groups" data-id="${teacher.id}" class="teacher-groups-form">
        <div class="group-check-grid">${allGroups.map((g) => `
          <label class="check-row"><input type="checkbox" name="groupIds" value="${g.id}" ${assignedIds.has(Number(g.id)) ? 'checked' : ''}><span>${esc(g.name)}</span></label>`).join('')}
        </div>
        <div class="row-actions" style="margin-top:12px">
          <button class="btn btn-primary" type="submit">Сохранить группы</button>
          <button class="btn btn-ghost" type="button" data-act="sync-teacher-groups" data-id="${teacher.id}">Дополнить из расписания</button>
        </div>
      </form>` : ''}
    </section>
    ${can('users.manage') ? `<section class="card pad access-card">
      <div class="kicker">Доступ преподавателя</div>
      <form data-form="grant-teacher-access" data-id="${teacher.id}">
        <label class="field"><span>Логин</span><input name="username" maxlength="80" placeholder="abdel.hafez" autocomplete="off"></label>
        <label class="field"><span>Email</span><input name="email" type="email" maxlength="160" value="${esc(teacher.email || '')}" autocomplete="off"></label>
        <div class="row-actions">
          <button class="btn btn-primary" type="submit">${teacher.hasAccess ? 'Сбросить пароль' : 'Выдать доступ'}</button>
          ${teacher.hasAccess ? `<button class="btn btn-danger" type="button" data-act="revoke-teacher-access" data-id="${teacher.id}">Отозвать</button>` : ''}
        </div>
      </form>
      ${result && Number(result.teacherId) === Number(teacher.id) ? `<div class="temp-pass-banner">
        <div class="kicker">Временный пароль</div>
        <div class="temp-pass">${esc(result.tempPassword)}</div>
        <p class="muted">Логин: <b>${esc(result.username)}</b>${result.mailed ? ' · письмо отправлено' : ''}</p>
      </div>` : ''}
    </section>` : ''}
    <div class="section-head"><h2>Мои пары</h2><span class="muted">${scheduleCount} пар во всём журнале</span></div>
    ${teacherScheduleGrid(data.schedule || [], S.schedule?.weekTypeToday || '')}`;
}

function teacherSchedulePage() {
  const data = S.teacherSchedule;
  if (!data?.teacher) return missingHtml();
  const groups = teacherGroupLinks(data.groups || [], data.scheduleGroups || []);
  const canMark = can('attendance.mark');
  return `<section class="home-hero">
      <div class="home-hero-copy">
        <div class="kicker">${esc(data.teacher.fullName)}</div>
        <h2>Моё расписание</h2>
        <p>${esc(weekTypeLabel(data.weekTypeToday))} · ${(data.entries || []).length} пар · ${groups.length} групп</p>
      </div>
    </section>
    <section class="card pad" style="margin-bottom:16px">
      <div class="section-head"><h2>Группы</h2></div>
      <p class="hint">Откройте группу — там полное расписание и отметки по каждой паре.</p>
      ${teacherGroupsPanel(groups, { canMark })}
    </section>
    <div class="section-head"><h2>Мои пары</h2></div>
    ${teacherScheduleGrid(data.entries || [], data.weekTypeToday)}`;
}

function pageHtml() {
  if (S.denied) return deniedHtml();
  if (S.missing && S.route.name !== 'group') return missingHtml();
  switch (S.route.name) {
    case 'groups': return groupsPage();
    case 'group': return groupPage();
    case 'students': return studentsPage();
    case 'teachers': return teachersPage();
    case 'teacher': return teacherPage();
    case 'teacher-schedule': return teacherSchedulePage();
    case 'subjects': return subjectsPage();
    case 'subject-hub': return subjectHubPage();
    case 'subject': return subjectPage();
    case 'lesson': return lessonPage();
    case 'credit': return creditPage();
    case 'stats': return statsPage();
    case 'student-stats': return studentStatsPage();
    case 'diary': return diaryPage();
    case 'diary-grades': return diaryGradesPage();
    case 'calendar': return calendarPage();
    case 'calendar-day': return calendarDayPage();
    case 'schedule': return schedulePage();
    case 'settings': return settingsPage();
    case 'users': return usersPage();
    case 'audit': return auditPage();
    default: return homePage();
  }
}

function fabHtml() {
  const route = S.route;
  if (!route || !S.overview && route.name !== 'subject' && route.name !== 'lesson') {
    /* subject pages still can have a fab */
  }
  const button = (act, label, extra = '') => `<button class="fab" type="button" data-act="${act}" ${extra}>${icon.plus}<span>${label}</span></button>`;
  if ((route.name === 'home' || route.name === 'groups') && can('groups.manage')) return button('add-group', 'Группа');
  if (route.name === 'students' && can('students.manage')) {
    const gid = S.groupFilter ? `data-group="${esc(String(S.groupFilter))}"` : '';
    return button('add-student', 'Ученик', gid);
  }
  if (route.name === 'teachers' && can('teachers.manage')) return button('add-teacher', 'Педагог');
  if (route.name === 'subjects' && can('subjects.manage')) return button('add-subject', 'Предмет');
  if (route.name === 'users' && can('users.manage')) return button('add-user', 'Пользователь');
  if (route.name === 'subject' && S.journal?.students.length) {
    if (route.tab === 'credits' && can('grades.manage')) return button('add-credit', 'Зачёт');
    if (route.tab === 'grades' && can('grades.manage') && gradesOn()) return button('add-work', 'Оценка');
    if (can('attendance.mark')) return button('add-lesson', 'Занятие');
  }
  return '';
}

function render() {
  const app = document.getElementById('app');
  if (!S.token) {
    document.title = 'Вход · Журнал';
    app.innerHTML = S.fatal ? fatalHtml() : loginHtml();
    return;
  }
  if (S.fatal || !S.me) {
    document.title = 'Журнал';
    app.innerHTML = fatalHtml();
    return;
  }
  document.title = `${pageTitle()} · ${brandName()}`;
  const needsFab = ['home', 'groups', 'students', 'teachers', 'subjects', 'subject'].includes(S.route.name);
  const peopleScroll = document.querySelector('.pair-modal-people')?.scrollTop || S._pairScroll || 0;
  S._pairScroll = 0;
  const keepPairModal = S.pairModalOpen && S.activePairId;
  const openFromRoute = S.route.name === 'calendar-day' && S.route.pairId;
  app.innerHTML = shell(pageHtml(), needsFab ? fabHtml() : '');
  applySearchVisibility();
  if (keepPairModal || openFromRoute) {
    const entryId = S.route.pairId || S.activePairId;
    requestAnimationFrame(() => openPairRosterModal(entryId, { preserveScroll: peopleScroll }));
  } else if (S.route.name !== 'calendar-day') {
    S.pairModalOpen = false;
    S.pairConfirm = null;
  }
}

function formActions(label, extra = '') {
  return `<div class="sheet-actions">${extra}<button class="btn btn-ghost" type="button" data-act="close-modal">Отмена</button><button class="btn btn-primary" type="submit">${label}</button></div>`;
}

function groupOptions(selected) {
  return (S.overview?.groups || []).map((group) => `<option value="${group.id}" ${Number(selected) === group.id ? 'selected' : ''}>${esc(group.name)}</option>`).join('');
}

function openConfirm({ title, text, act, id, ok, danger = true }) {
  openModal(modalWrap(`<h2>${esc(title)}</h2><p class="lead">${esc(text)}</p>
    <div class="sheet-actions">
      <button class="btn btn-ghost" type="button" data-act="close-modal">Отмена</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="button" data-act="${act}" data-id="${id || ''}">${esc(ok)}</button>
    </div>`));
}

function syncAgoLabel(ts) {
  if (!ts) return 'ещё не сверяли';
  const ms = Date.now() - Number(ts);
  if (ms < 60_000) return 'только что';
  if (ms < 3600_000) return `${Math.max(1, Math.round(ms / 60_000))} мин назад`;
  if (ms < 86400_000) return `${Math.max(1, Math.round(ms / 3600_000))} ч назад`;
  const date = new Date(Number(ts));
  return date.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function groupScheduleBindHtml(group, probe) {
  if (!excelOn()) {
    return `<div class="group-schedule-bind off">
      <div class="kicker">Расписание</div>
      <p class="muted">Режим Excel выключен в настройках. Пары добавляйте вручную в разделе «Правка».</p>
      ${group?.id ? `<a class="btn btn-ghost btn-small" href="#/schedule/${group.id}">Открыть сетку</a>` : ''}
    </div>`;
  }
  const canRename = can('groups.rename') || can('groups.manage');
  const canImport = canImportExcel();
  const primary = group?.scheduleCode || '';
  const aliases = new Set(group?.scheduleAliases || []);
  const codes = probe?.codes || [];
  const hasUrl = !!(group?.scheduleUrl || (S.settings || S.me?.settings)?.scheduleUrls?.length);
  const step1Done = hasUrl || !!(group?.scheduleUrl);
  const step2Done = !!primary;
  const journalName = group?.name || 'эта группа';

  const codePicker = codes.length
    ? `<div class="bind-step-body">
        <p class="bind-lead"><strong>Журнал:</strong> ${esc(journalName)} ← выберите такой же столбец в таблице</p>
        <div class="code-picker" data-code-picker>
          ${codes.map((row) => {
            const onPrimary = primary === row.code;
            const onAlias = !onPrimary && aliases.has(row.code);
            const linked = probe.linked?.find((item) => item.code === row.code);
            const other = linked && linked.groupId !== group?.id
              ? `уже у «${linked.groupName || linked.groupId}»`
              : '';
            return `<label class="code-pick${onPrimary ? ' primary' : ''}${onAlias ? ' alias' : ''}">
              <input type="radio" name="scheduleCodePick" value="${esc(row.code)}" ${onPrimary ? 'checked' : ''} ${canRename ? '' : 'disabled'}>
              <span class="code-pick-main">
                <strong>${esc(row.code)}</strong>
                <span class="muted">${row.entries} пар · ${row.subjectCount} предм.${other ? ` · ${esc(other)}` : ''}</span>
              </span>
              <span class="code-alias-toggle" title="Если в Excel две колонки относятся к одной группе">
                <input type="checkbox" name="scheduleAlias" value="${esc(row.code)}" ${onAlias ? 'checked' : ''} ${canRename && !onPrimary ? '' : (onPrimary ? 'disabled' : '')}>
                ещё код
              </span>
            </label>`;
          }).join('')}
        </div>
        <p class="muted tight">Нажмите на строку — это и есть привязка «группа журнала ↔ группа в Excel». «Ещё код» — если в таблице две колонки одной группы.</p>
      </div>`
    : (probe
      ? `<div class="bind-step-body"><p class="banner warn tight">В таблице не нашлось кодов групп. Откройте доступ «всем, у кого есть ссылка» и проверьте лист расписания.</p></div>`
      : '');

  const statusLine = step2Done
    ? `<div class="bind-status ok">Привязано: <strong>${esc(journalName)}</strong> ↔ <strong>${esc(primary)}</strong>${aliases.size ? ` +${aliases.size}` : ''}</div>`
    : `<div class="bind-status wait">Пока не привязано — сделайте шаги ниже</div>`;

  return `
    <div class="group-schedule-bind">
      <div class="bind-head">
        <div class="kicker">Подгрузка из Excel</div>
        <h3 class="bind-title">Как подключить расписание</h3>
        ${statusLine}
      </div>

      <div class="bind-step${step1Done ? ' done' : ''}">
        <div class="bind-step-num">1</div>
        <div class="bind-step-body">
          <strong>Вставьте ссылку на таблицу</strong>
          <p class="muted tight">Google Sheets или Excel Online. Нужен доступ «по ссылке».</p>
          <label class="field"><span class="sr-only">Ссылка</span>
            <input name="scheduleUrl" type="url" maxlength="500" value="${esc(group?.scheduleUrl || '')}" placeholder="https://docs.google.com/spreadsheets/d/…/edit" ${canRename || !group ? '' : 'readonly'}>
          </label>
          ${canImport ? `<button class="btn btn-primary btn-small" type="button" data-act="probe-group-schedule" ${group?.id ? `data-id="${group.id}"` : ''}>Найти группы в таблице</button>` : ''}
        </div>
      </div>

      <div class="bind-step${step2Done ? ' done' : ''}${codes.length || primary ? '' : ' soft'}">
        <div class="bind-step-num">2</div>
        <div class="bind-step-body">
          <strong>Привяжите группу к группе</strong>
          <p class="muted tight">Выберите код столбца из Excel — он станет «тем же» что и «${esc(journalName)}» в журнале.</p>
          <div id="group-probe-result">${codePicker || `<p class="muted tight">${canImport ? 'Сначала нажмите «Найти группы в таблице» — появится список для выбора.' : 'Нужно право импорта из Excel.'}</p>`}</div>
          <details class="bind-advanced">
            <summary>Ввести код вручную</summary>
            <label class="field"><span>Основной код (как в шапке Excel)</span>
              <input name="scheduleCode" maxlength="40" value="${esc(primary)}" placeholder="А-101" ${canRename || !group ? '' : 'readonly'} autocomplete="off">
            </label>
            <label class="field"><span>Доп. коды через запятую</span>
              <input name="scheduleAliases" maxlength="200" value="${esc((group?.scheduleAliases || []).join(', '))}" placeholder="А-101б" ${canRename || !group ? '' : 'readonly'} autocomplete="off">
            </label>
          </details>
        </div>
      </div>

      <div class="bind-step${group?.scheduleCount ? ' done' : ''}">
        <div class="bind-step-num">3</div>
        <div class="bind-step-body">
          <strong>Подтянуть пары</strong>
          <p class="muted tight">После привязки журнал сам сверяет таблицу каждые несколько минут. Можно обновить сразу.</p>
          ${canImport && group?.id
            ? `<button class="btn btn-primary" type="button" data-act="import-group-schedule" data-id="${group.id}" ${primary ? '' : 'disabled'}>Подтянуть расписание сейчас</button>`
            : `<p class="muted tight">${group?.id ? 'Сохраните группу с кодом — затем можно подтянуть пары.' : 'Сначала сохраните новую группу, потом подтяните пары.'}</p>`}
          ${group?.scheduleSyncedAt || group?.scheduleSyncError
            ? `<p class="muted tight">Последняя сверка: ${esc(syncAgoLabel(group.scheduleSyncedAt))}${group.scheduleSyncError ? ` · ошибка: ${esc(group.scheduleSyncError)}` : ''}</p>`
            : ''}
        </div>
      </div>
    </div>`;
}

function syncGroupCodePicker(form) {
  if (!form) return;
  const primary = form.querySelector('input[name="scheduleCodePick"]:checked')?.value
    || form.querySelector('input[name="scheduleCode"]')?.value?.trim()
    || '';
  const aliases = [...form.querySelectorAll('input[name="scheduleAlias"]:checked')]
    .map((el) => el.value)
    .filter((code) => code && code !== primary);
  const codeInput = form.querySelector('input[name="scheduleCode"]');
  const aliasInput = form.querySelector('input[name="scheduleAliases"]');
  if (primary && codeInput) codeInput.value = primary;
  if (aliasInput) aliasInput.value = aliases.join(', ');
  form.querySelectorAll('.code-pick').forEach((row) => {
    const radio = row.querySelector('input[name="scheduleCodePick"]');
    const alias = row.querySelector('input[name="scheduleAlias"]');
    const isPrimary = !!radio?.checked;
    row.classList.toggle('primary', isPrimary);
    row.classList.toggle('alias', !!alias?.checked && !isPrimary);
    if (alias) {
      if (isPrimary) {
        alias.checked = false;
        alias.disabled = true;
      } else {
        alias.disabled = false;
      }
    }
  });
  const importBtn = form.querySelector('[data-act="import-group-schedule"]');
  if (importBtn) importBtn.disabled = !primary;
  const status = form.querySelector('.bind-status');
  const name = form.querySelector('input[name="name"]')?.value || 'эта группа';
  if (status) {
    if (primary) {
      status.className = 'bind-status ok';
      status.innerHTML = `Привязано: <strong>${esc(name)}</strong> ↔ <strong>${esc(primary)}</strong>`;
    } else {
      status.className = 'bind-status wait';
      status.textContent = 'Пока не привязано — сделайте шаги ниже';
    }
  }
}

function readGroupScheduleFields(form, data) {
  syncGroupCodePicker(form);
  const aliases = String(form.querySelector('input[name="scheduleAliases"]')?.value || data.scheduleAliases || '')
    .split(/[,;\n+|]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const scheduleCode = String(form.querySelector('input[name="scheduleCode"]')?.value || data.scheduleCode || '').trim();
  return {
    scheduleCode,
    scheduleUrl: String(form.querySelector('input[name="scheduleUrl"]')?.value || data.scheduleUrl || '').trim(),
    scheduleAliases: aliases.filter((code) => code !== scheduleCode),
  };
}

function groupTelegramBindHtml(group) {
  const settings = S.settings || S.me?.settings || {};
  if (!group?.id || !settings.telegramEnabled || !settings.telegramMultiMode || !can('settings.manage')) {
    return '';
  }
  const bind = (settings.telegramBindings || []).find((b) => Number(b.groupId) === Number(group.id)) || {};
  return `<div class="group-schedule-bind" style="margin-top:12px">
    <div class="bind-head">
      <div class="kicker">Telegram · тема</div>
      <h3 class="bind-title">Чат и тема форума</h3>
      <p class="muted tight">В теме группы напишите боту /chatid и вставьте значения ниже.</p>
    </div>
    <div class="settings-grid-2">
      <label class="field"><span>Chat ID</span>
        <input name="telegramChatId" maxlength="40" value="${esc(bind.chatId || settings.telegramChatId || '')}" placeholder="-100…" autocomplete="off">
      </label>
      <label class="field"><span>Topic ID (тема)</span>
        <input name="telegramTopicId" maxlength="20" value="${esc(bind.topicId != null ? bind.topicId : '')}" placeholder="12" autocomplete="off">
      </label>
    </div>
  </div>`;
}

function openPromoteModal(preview) {
  const items = preview?.items || [];
  const rows = items.map((item) => {
    if (item.action === 'promote') {
      return `<tr>
        <td>${esc(item.name)}</td>
        <td>→ <b>${esc(item.nextName)}</b></td>
        <td class="muted">${item.nextUrl ? 'Excel курса обновлён' : 'URL без изменений'}</td>
      </tr>`;
    }
    if (item.action === 'archive') {
      return `<tr>
        <td>${esc(item.name)}</td>
        <td><b>Архив</b> · ${esc(item.studyYears || 'годы')}</td>
        <td class="muted">выпускной курс</td>
      </tr>`;
    }
    return `<tr class="is-skip">
      <td>${esc(item.name)}</td>
      <td class="muted">пропуск</td>
      <td class="muted">${esc(item.conflict ? `конфликт: ${item.conflict}` : (item.reason || ''))}</td>
    </tr>`;
  }).join('');
  openModal(modalWrap(`<h2>Летний перевод курса</h2>
    <p class="muted">Учебный год <b>${esc(preview.academicYearLabel || '')}</b> · макс. курс ${esc(preview.maxCourse)}.
      Перевод: <b>${preview.promoteCount || 0}</b> · архив: <b>${preview.archiveCount || 0}</b> · пропуск: <b>${preview.skipCount || 0}</b></p>
    <div class="promote-table-wrap">
      <table class="promote-table">
        <thead><tr><th>Сейчас</th><th>Станет</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="3" class="muted">Нет групп</td></tr>'}</tbody>
      </table>
    </div>
    <div class="row-actions toolbar-row" style="margin-top:14px">
      <button class="btn btn-primary" type="button" data-act="promote-apply" ${(preview.promoteCount || preview.archiveCount) ? '' : 'disabled'}>Применить перевод</button>
      <button class="btn btn-ghost" type="button" data-act="close-modal">Отмена</button>
    </div>`));
}

function openGroupModal(group, probe = null) {
  const users = (S.users?.users || []).filter((item) => item.active && item.role !== 'admin');
  const elderOptions = [`<option value="">Без старосты</option>`]
    .concat(users.map((item) => `<option value="${item.id}" ${Number(group?.elderUserId) === item.id ? 'selected' : ''}>${esc(item.displayName || item.username)} · ${esc(roleTitle(item.role))}</option>`))
    .join('');
  const canRename = can('groups.rename') || can('groups.manage');
  const canDelete = can('groups.manage');
  const canElder = can('elders.appoint');
  const maxCourse = Number((S.settings || S.me?.settings)?.maxCourse) || 4;
  const course = Number(group?.course) || '';
  const courseOpts = [`<option value="">—</option>`]
    .concat(Array.from({ length: maxCourse }, (_, i) => {
      const n = i + 1;
      return `<option value="${n}" ${Number(course) === n ? 'selected' : ''}>${n} курс</option>`;
    }))
    .join('');
  S._groupModalProbe = probe;
  openModal(modalWrap(`<h2>${group ? 'Настройки группы' : 'Новая группа'}</h2>
    <form data-form="save-group" class="group-form">
      <input type="hidden" name="id" value="${group?.id || ''}">
      <div class="kicker">Основное</div>
      <label class="field"><span>Название в журнале</span><input name="name" required maxlength="120" value="${esc(group?.name || '')}" placeholder="ИК 31/9" ${canRename || !group ? '' : 'readonly'}></label>
      ${group ? `<div class="settings-grid-2">
        <label class="field"><span>Текущий курс</span>
          <select name="course" ${canRename ? '' : 'disabled'}>${courseOpts}</select>
        </label>
        <label class="field"><span>Статус</span>
          <select name="archived" ${canRename ? '' : 'disabled'}>
            <option value="0" ${group.archived ? '' : 'selected'}>Активная</option>
            <option value="1" ${group.archived ? 'selected' : ''}>Архив</option>
          </select>
        </label>
      </div>
      <label class="check-row">
        <input type="checkbox" name="renameToCourse" value="1" checked ${canRename ? '' : 'disabled'}>
        <span><strong>Обновить название и код под курс</strong><small>Например 3→4: ИК 31/9 → ИК 41/9</small></span>
      </label>
      <div class="kicker">Годы обучения</div>
      <div class="settings-grid-2">
        <label class="field"><span>Год начала</span>
          <input name="studyStartYear" type="number" min="1990" max="2100" value="${esc(group.studyStartYear ?? '')}" placeholder="2019" ${canRename ? '' : 'readonly'}>
        </label>
        <label class="field"><span>Год окончания</span>
          <input name="studyEndYear" type="number" min="1990" max="2100" value="${esc(group.studyEndYear ?? '')}" placeholder="2023" ${canRename ? '' : 'readonly'}>
        </label>
      </div>
      <p class="muted tight">${group.studyYears ? `Сейчас: <b>${esc(group.studyYears)}</b>` : 'При переводе в архив годы подставятся сами, если поля пустые.'}</p>` : ''}
      <div class="kicker">${excelOn() ? 'Excel' : 'Расписание'}</div>
      ${groupScheduleBindHtml(group, probe)}
      ${groupTelegramBindHtml(group)}
      ${group && canElder ? `<label class="field"><span>Староста</span><select name="elderUserId">${elderOptions}</select></label>` : ''}
      ${formActions('Сохранить', group && canDelete ? `<button class="btn btn-danger" type="button" data-act="delete-group" data-id="${group.id}">Удалить</button>` : '')}
    </form>`));
  const form = document.querySelector('#modal-root form[data-form="save-group"]');
  form?.querySelector('[data-code-picker]')?.addEventListener('change', () => syncGroupCodePicker(form));
}

function openUserModal(user) {
  const groups = S.overview?.groups || [];
  const catalog = permissionCatalog();
  const selected = new Set(user?.groupIds || []);
  const selectedPerms = new Set(user?.permissions || []);
  const role = user?.role || 'teacher';
  const defaults = Object.fromEntries((catalog.roles || []).map((item) => [item.key, item.defaults || []]));
  const groupChecks = groups.map((group) => {
    const link = (user?.groups || []).find((item) => item.groupId === group.id);
    const groupRole = link?.groupRole
      || (role === 'elder' ? 'elder' : role === 'student' ? 'student' : 'teacher');
    return `<label class="check-row group-access-row">
      <input type="checkbox" name="groupIds" value="${group.id}" ${selected.has(group.id) ? 'checked' : ''}>
      <span>${esc(group.name)}</span>
      <select name="groupRole-${group.id}" aria-label="Роль в группе">
        <option value="teacher" ${groupRole === 'teacher' ? 'selected' : ''}>Препод</option>
        <option value="elder" ${groupRole === 'elder' ? 'selected' : ''}>Староста</option>
        <option value="student" ${groupRole === 'student' ? 'selected' : ''}>Ученик</option>
        <option value="member" ${groupRole === 'member' ? 'selected' : ''}>Доступ</option>
      </select>
    </label>`;
  }).join('');
  const permBlocks = (catalog.categories || []).map((category) => `
    <div class="perm-category">
      <div class="perm-cat-title">${esc(category.name)}</div>
      <div class="check-list">
        ${(category.items || []).map((item) => `<label class="check-row perm-row" title="${esc(item.description || '')}">
          <input type="checkbox" name="permissions" value="${esc(item.key)}" ${selectedPerms.has(item.key) || (!user && (defaults.teacher || []).includes(item.key)) ? 'checked' : ''}>
          <span><strong>${esc(item.label)}</strong>${item.description ? `<small>${esc(item.description)}</small>` : ''}</span>
        </label>`).join('')}
      </div>
    </div>`).join('');
  openModal(modalWrap(`<h2>${user ? 'Пользователь' : 'Новый пользователь'}</h2>
    <form data-form="save-user" data-role-defaults='${esc(JSON.stringify(defaults))}'>
      <input type="hidden" name="id" value="${user?.id || ''}">
      <label class="field"><span>Логин</span><input name="username" required maxlength="80" value="${esc(user?.username || '')}" autocomplete="off" autocapitalize="none"></label>
      <label class="field"><span>Email</span><input name="email" type="email" maxlength="160" value="${esc(user?.email || '')}" placeholder="name@example.com"></label>
      <label class="field"><span>Имя</span><input name="displayName" maxlength="120" value="${esc(user?.displayName || '')}" placeholder="Как отображать"></label>
      <label class="field"><span>Роль</span>
        <select name="role" required data-act-change="role-defaults">
          <option value="teacher" ${role === 'teacher' ? 'selected' : ''}>Преподаватель</option>
          <option value="elder" ${role === 'elder' ? 'selected' : ''}>Староста</option>
          <option value="student" ${role === 'student' ? 'selected' : ''}>Ученик</option>
          <option value="admin" ${role === 'admin' ? 'selected' : ''}>Администратор</option>
        </select>
      </label>
      <label class="field"><span>${user ? 'Новый пароль (если менять)' : 'Пароль'}</span><input name="password" type="password" ${user ? '' : 'required'} minlength="6" maxlength="80" autocomplete="new-password"></label>
      ${user ? `<label class="check-row"><input type="checkbox" name="active" value="1" ${user.active ? 'checked' : ''}> Активен</label>` : ''}
      <div class="field"><span>Группы и роль в них</span><div class="check-list">${groupChecks || '<p class="muted">Сначала создайте группы</p>'}</div></div>
      <div class="field perm-field"><span>Права доступа</span>
        <p class="muted tight">Снимите или добавьте галочки поверх роли. Администратор всегда со всеми правами.</p>
        <div class="perm-grid">${permBlocks || '<p class="muted">Каталог прав недоступен</p>'}</div>
      </div>
      ${formActions('Сохранить', user ? `<button class="btn btn-danger" type="button" data-act="delete-user" data-id="${user.id}">Удалить</button>` : '')}
    </form>`));
  if (role === 'admin') {
    const form = document.querySelector('form[data-form="save-user"]');
    for (const box of form?.querySelectorAll('input[name="permissions"]') || []) {
      box.checked = true;
      box.disabled = true;
    }
  }
}

function openScheduleEntryModal(entry, presets = {}) {
  const groups = S.overview?.groups || [];
  if (!groups.length) { toast('Сначала создайте группу'); return; }
  const selected = entry?.groupId || Number(presets.groupId) || S.route.groupId || groups[0].id;
  const week = entry?.weekType || S.scheduleWeekType || 'upper';
  const weekday = entry?.weekday || Number(presets.weekday) || S.scheduleFocusDay || 1;
  const pairNum = entry?.pairNum || Number(presets.pairNum) || Number(presets.pair) || 1;
  const subjects = sortSubjects(
    (S.overview?.subjects || []).filter((item) => item.groupId === selected),
    'pairs',
  );
  const subjectOptions = subjects.map((item) => `<option value="${esc(item.name)}"></option>`).join('');
  const subjectChips = subjects.slice(0, 12).map((item) => {
    const on = entry?.subjectName === item.name;
    return `<button class="chip${on ? ' on' : ''}" type="button" data-act="pick-schedule-subject" data-name="${esc(item.name)}">${esc(item.name)}</button>`;
  }).join('');
  openModal(modalWrap(`<h2>${entry ? 'Пара' : 'Новая пара'}</h2>
    <form data-form="save-schedule-entry" class="schedule-entry-form">
      <input type="hidden" name="id" value="${entry?.id || ''}">
      <label class="field"><span>Группа</span><select name="groupId" required>${groupOptions(selected)}</select></label>
      <div class="threshold-grid">
        <label class="field"><span>Неделя</span>
          <select name="weekType" required>
            <option value="upper" ${week === 'upper' ? 'selected' : ''}>Верхняя</option>
            <option value="lower" ${week === 'lower' ? 'selected' : ''}>Нижняя</option>
            <option value="all" ${week === 'all' ? 'selected' : ''}>Каждая</option>
          </select>
        </label>
        <label class="field"><span>День</span>
          <select name="weekday" required>
            ${[1, 2, 3, 4, 5, 6].map((day) => `<option value="${day}" ${Number(weekday) === day ? 'selected' : ''}>${WEEKDAY_LABELS[day]}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="threshold-grid pair-time-grid">
        <label class="field"><span>Пара №</span><input name="pairNum" type="number" min="1" max="12" required inputmode="numeric" value="${esc(pairNum)}"></label>
        <label class="field"><span>Начало</span><input name="timeStart" maxlength="8" inputmode="numeric" value="${esc(entry?.timeStart || '')}" placeholder="09:00"></label>
        <label class="field"><span>Конец</span><input name="timeEnd" maxlength="8" inputmode="numeric" value="${esc(entry?.timeEnd || '')}" placeholder="10:30"></label>
      </div>
      <label class="field"><span>Предмет</span>
        <input name="subjectName" list="schedule-subjects" required maxlength="200" value="${esc(entry?.subjectName || '')}" placeholder="Название или новый предмет">
        <datalist id="schedule-subjects">${subjectOptions}</datalist>
      </label>
      ${subjectChips ? `<div class="chips scroll-chips subject-pick-chips">${subjectChips}</div>` : ''}
      ${can('subjects.manage') ? `<button class="btn btn-ghost btn-small btn-block" type="button" data-act="add-subject" data-group="${selected}">Новый предмет в группу</button>` : ''}
      <label class="field"><span>Вид занятия</span><input name="lessonKind" maxlength="80" value="${esc(entry?.lessonKind || '')}" placeholder="лекция / практика"></label>
      <label class="field"><span>Преподаватель</span><input name="teacher" maxlength="120" value="${esc(entry?.teacher || '')}" autocomplete="name"></label>
      <label class="field"><span>Аудитория</span><input name="room" maxlength="80" value="${esc(entry?.room || '')}"></label>
      <label class="check-row"><input type="checkbox" name="locked" value="1" ${entry?.locked ? 'checked' : ''}> Замок — не перезаписывать из Excel</label>
      ${entry?.slotKey ? `<p class="muted tight mono">Индекс слота: ${esc(entry.slotKey)}</p>` : ''}
      ${formActions('Сохранить', entry ? `<button class="btn btn-danger" type="button" data-act="delete-schedule-entry" data-id="${entry.id}">Удалить</button>` : '')}
    </form>`));
}

function openSchedulePreviewModal(preview, groupId) {
  const lines = [];
  if (preview.addedCount) lines.push(`+${preview.addedCount} новых`);
  if (preview.removedCount) lines.push(`−${preview.removedCount} убрать`);
  if (preview.changedCount) lines.push(`~${preview.changedCount} обновить поля`);
  if (preview.keptCount) lines.push(`${preview.keptCount} без изменений`);
  if (preview.lockedCount) lines.push(`${preview.lockedCount} под замком`);
  const sample = (preview.sampleAdded || []).slice(0, 4).map((e) => `<li>+ п.${e.pairNum} · ${esc(e.subjectName)} · ${esc(e.teacher || 'без препода')}</li>`).join('')
    + (preview.sampleRemoved || []).slice(0, 4).map((e) => `<li>− п.${e.pairNum} · ${esc(e.subjectName)}</li>`).join('')
    + (preview.sampleChanged || []).slice(0, 5).map((e) => {
      const fields = (e.fields || []).map((f) => `${f.label}: «${f.from || '—'}» → «${f.to || '—'}»`).join('; ');
      return `<li>~ п.${e.to?.pairNum || e.from?.pairNum} · ${esc(fields || `${e.from?.subjectName || ''} → ${e.to?.subjectName || ''}`)}</li>`;
    }).join('');
  const group = groupId ? (S.overview?.groups || []).find((item) => item.id === Number(groupId)) : null;
  const unlinked = (preview.unlinkedCodes || []).slice(0, 8)
    .map((row) => `<button class="chip" type="button" disabled>${esc(row.code)} · ${row.entries}</button>`)
    .join('');
  openModal(modalWrap(`<h2>${group ? `Сверка: ${esc(group.name)}` : 'Сверка с Excel'}</h2>
    <p class="lead">${lines.length ? lines.join(' · ') : 'Уже совпадает с таблицей — менять нечего.'}</p>
    <p class="muted">${group
      ? `В Excel найдено пар для этой группы: ${preview.matchedEntries || 0}. Замки не трогаем. Сейчас ${esc(weekTypeLabel(preview.weekTypeToday)).toLowerCase()}.`
      : `Групп: ${preview.matchedGroups || 0} · пар: ${preview.matchedEntries || 0}. Сейчас ${esc(weekTypeLabel(preview.weekTypeToday)).toLowerCase()}.`}</p>
    ${unlinked ? `<p class="muted tight">Коды без привязки — откройте группу и выберите столбец:</p><div class="chips">${unlinked}</div>` : ''}
    ${sample ? `<ul class="preview-list">${sample}</ul>` : ''}
    <div class="sheet-actions">
      <button class="btn btn-ghost" type="button" data-act="close-modal">Отмена</button>
      <button class="btn btn-primary" type="button" data-act="import-schedule"${(preview.addedCount || preview.removedCount || preview.changedCount) ? '' : ' disabled'}>${group ? 'Применить к группе' : 'Применить ко всем'}</button>
    </div>`));
}

function openStudentModal(student, presetGroup) {
  const groups = S.overview?.groups || [];
  if (!groups.length) { toast('Сначала создайте группу'); return; }
  const selected = student?.groupId || presetGroup || S.route.groupId || groups[0].id;
  openModal(modalWrap(`<h2>${student ? 'Ученик' : 'Новый ученик'}</h2>
    <form data-form="save-student">
      <input type="hidden" name="id" value="${student?.id || ''}">
      <label class="field"><span>Имя</span><input name="fullName" required maxlength="120" value="${esc(student?.fullName || '')}" placeholder="Иванова Мария"></label>
      <label class="field"><span>Группа</span><select name="groupId" required>${groupOptions(selected)}</select></label>
      ${formActions('Сохранить', student ? `<button class="btn btn-danger" type="button" data-act="delete-student" data-id="${student.id}">Удалить</button>` : '')}
    </form>`));
}

function openSubjectModal(subject, presetGroup) {
  if (subject && S.journal?.subject?.id === subject.id) {
    openModal(modalWrap(`<h2>Предмет</h2>
      <form data-form="save-subject">
        <input type="hidden" name="id" value="${subject.id}">
        <p class="muted">${esc(subject.groupName)}</p>
        <label class="field"><span>Название</span><input name="name" required maxlength="120" value="${esc(subject.name)}"></label>
        ${formActions('Сохранить', `<button class="btn btn-danger" type="button" data-act="delete-subject" data-id="${subject.id}">Удалить</button>`)}
      </form>`));
    return;
  }
  const fromList = S.overview?.subjects?.find((item) => item.id === Number(subject?.id));
  const editing = subject?.id ? (fromList || subject) : null;
  const groups = S.overview?.groups || [];
  if (!editing && !groups.length) { toast('Сначала создайте группу'); return; }
  const selected = Number(editing?.groupId || presetGroup || S.route.groupId || groups[0]?.id || 0);
  const groupPicks = !editing
    ? `<div class="field"><span>Группы</span>
        <div class="check-list subject-group-picks">
          ${groups.map((group) => `<label class="check-row">
            <input type="checkbox" name="groupIds" value="${group.id}" ${Number(group.id) === selected ? 'checked' : ''}>
            <span>${esc(group.name)}</span>
          </label>`).join('')}
        </div>
        <p class="muted tight">Один предмет — отметьте все группы, где он читается. Журнал у каждой группы свой.</p>
      </div>`
    : `<p class="muted">${esc(editing.groupName)}</p>`;
  openModal(modalWrap(`<h2>${editing ? 'Предмет' : 'Новый предмет'}</h2>
    <form data-form="save-subject">
      <input type="hidden" name="id" value="${editing?.id || ''}">
      <label class="field"><span>Название</span><input name="name" required maxlength="120" value="${esc(editing?.name || '')}" placeholder="Алгебра"></label>
      ${groupPicks}
      ${formActions('Сохранить', editing ? `<button class="btn btn-danger" type="button" data-act="delete-subject" data-id="${editing.id}">Удалить</button>` : '')}
    </form>`));
}

function openLessonModal(lesson) {
  openModal(modalWrap(`<h2>${lesson ? 'Занятие' : 'Занятие в план'}</h2>
    <form data-form="save-lesson">
      <input type="hidden" name="id" value="${lesson?.id || ''}">
      <label class="field"><span>Дата</span><input name="date" type="date" required value="${esc(lesson?.date || todayISO())}"></label>
      <label class="field"><span>Тема</span><input name="topic" maxlength="200" value="${esc(lesson?.topic || '')}" placeholder="Квадратные уравнения"></label>
      ${formActions('Сохранить')}
    </form>`));
}

function openCreditModal(credit) {
  const kind = credit?.kind || 'credit';
  openModal(modalWrap(`<h2>${credit ? 'В плане зачётов' : 'В план зачётов'}</h2>
    <form data-form="save-credit">
      <input type="hidden" name="id" value="${credit?.id || ''}">
      <label class="field"><span>Название</span><input name="title" required maxlength="120" value="${esc(credit?.title || '')}" placeholder="Зачёт за четверть"></label>
      <label class="field"><span>Дата</span><input name="date" type="date" required value="${esc(credit?.date || todayISO())}"></label>
      <div class="field"><span>Вид</span><div class="choice">
        <label><input type="radio" name="kind" value="credit" ${kind === 'credit' ? 'checked' : ''}> Зачёт</label>
        <label><input type="radio" name="kind" value="exam" ${kind === 'exam' ? 'checked' : ''}> Экзамен</label>
      </div></div>
      ${formActions('Сохранить')}
    </form>`));
}

function openWorkModal(work) {
  openModal(modalWrap(`<h2>${work ? 'Колонка оценок' : 'Новая колонка'}</h2>
    <form data-form="save-work">
      <input type="hidden" name="id" value="${work?.id || ''}">
      <label class="field"><span>Название</span><input name="title" required maxlength="120" value="${esc(work?.title || '')}" placeholder="Самостоятельная"></label>
      <label class="field"><span>Дата</span><input name="date" type="date" required value="${esc(work?.date || todayISO())}"></label>
      ${formActions('Сохранить', work ? `<button class="btn btn-danger" type="button" data-act="delete-work" data-id="${work.id}">Удалить</button>` : '')}
    </form>`));
}

function openPassword() {
  openModal(modalWrap(`<h2>Пароль</h2>
    <p class="muted">Минимум 6 символов. После смены все старые сессии завершатся.</p>
    <form data-form="password">
      <label class="field"><span>Текущий</span><input name="current" type="password" autocomplete="current-password" required></label>
      <label class="field"><span>Новый</span><input name="next" type="password" autocomplete="new-password" required minlength="6" maxlength="80"></label>
      <label class="field"><span>Ещё раз</span><input name="repeat" type="password" autocomplete="new-password" required minlength="6" maxlength="80"></label>
      ${formActions('Сменить')}
    </form>`));
}

function openGrade(workId, studentId) {
  const work = S.journal.works.find((item) => item.id === Number(workId));
  const student = S.journal.students.find((item) => item.id === Number(studentId));
  if (!work || !student) return;
  const current = mapGet(work.grades, student.id);
  const buttons = [5, 4, 3, 2].map((value) => `<button type="button" class="g${value}${Number(current) === value ? ' on' : ''}" data-act="set-grade" data-work="${work.id}" data-student="${student.id}" data-value="${value}">${value}</button>`).join('');
  openModal(modalWrap(`<h2>${esc(student.fullName)}</h2><p class="muted">${esc(work.title)}</p><div class="grades">${buttons}</div>
    <button class="btn btn-ghost btn-block" type="button" data-act="set-grade" data-work="${work.id}" data-student="${student.id}" data-value="">Убрать оценку</button>`));
}

function updateStat() {
  const rows = [...document.querySelectorAll('.person')];
  const el = document.getElementById('stat-line');
  if (!el || !rows.length) return;
  if (el.dataset.mode === 'attendance') {
    const here = rows.filter((row) => row.querySelector('.seg button.on[data-positive]')).length;
    const marked = rows.filter((row) => row.querySelector('.seg button.on')).length;
    el.textContent = `на занятии ${here} из ${rows.length} · отмечено ${marked}`;
    return;
  }
  const marked = rows.filter((row) => row.querySelector('.seg button.on')).length;
  el.textContent = `выставлено ${marked} из ${rows.length}`;
}

function applySearchVisibility() {
  if (document.querySelector('.pair-modal-people')) {
    applyPairPeopleVisibility();
    return;
  }
  const q = S.q.trim().toLowerCase();
  const rows = [...document.querySelectorAll('[data-search]')];
  rows.forEach((row) => {
    row.hidden = !!q && !row.dataset.search.toLowerCase().includes(q);
  });
  const empty = document.getElementById('empty-filter');
  if (empty) empty.hidden = !rows.length || rows.some((row) => !row.hidden);
}

async function go(hash) {
  if ((location.hash || '#/') !== hash) location.hash = hash;
  else await boot();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });
}

function openTeacherModal(teacher) {
  openModal(modalWrap(`<h2>${teacher ? 'Педагог' : 'Новый педагог'}</h2>
    <form data-form="save-teacher">
      ${teacher ? `<input type="hidden" name="id" value="${teacher.id}">` : ''}
      <label class="field"><span>ФИО</span><input name="fullName" required maxlength="120" value="${esc(teacher?.fullName || '')}"></label>
      <label class="field"><span>Как в расписании</span><input name="shortName" maxlength="80" value="${esc(teacher?.shortName || '')}" placeholder="Истратова Л.З."></label>
      <label class="field"><span>Email</span><input name="email" type="email" maxlength="160" value="${esc(teacher?.email || '')}"></label>
      ${formActions(teacher ? 'Сохранить' : 'Добавить')}
    </form>`));
}

const actions = {
  retry() { return boot(); },
  'close-modal'() {
    if (S._pairFillReturn && S._pairFill?.scheduleEntryId) {
      const entryId = S._pairFill.scheduleEntryId;
      S._pairFillReturn = false;
      openPairRosterModal(entryId);
      return;
    }
    if (S.pairModalOpen) {
      actions['close-pair-modal']();
      return;
    }
    closeModal();
  },
  'close-pair-modal'() {
    S.pairModalOpen = false;
    S.pairConfirm = null;
    S.pairCopyConfirm = null;
    S._pairFillReturn = false;
    S.pairFilter = '';
    closeModal();
    const day = S.calendarDay;
    if (day?.group?.id && day.date) {
      const next = `#/calendar/${day.group.id}/${day.date}`;
      if (location.hash !== next) location.hash = next;
      else if (S.route) {
        S.route.pairId = null;
        S.activePairId = null;
        render();
      }
    }
  },
  'open-pair-roster'(el) {
    const entryId = Number(el.dataset.entry);
    const groupId = el.dataset.group;
    const date = el.dataset.date;
    S.activePairId = entryId;
    S.pairModalOpen = true;
    S.pairConfirm = null;
    S.pairCopyConfirm = null;
    S.pairFilter = '';
    const next = `#/calendar/${groupId}/${date}/pair/${entryId}`;
    if (location.hash !== next) location.hash = next;
    else openPairRosterModal(entryId);
  },
  async logout() {
    await api('/api/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('journal_token');
    S.token = '';
    S.me = null;
    S.overview = null;
    S.journal = null;
    if ((location.hash || '#/') !== '#/') location.hash = '#/';
    else await boot();
  },
  password() { openPassword(); },
  async 'cal-month'(el) {
    S.calendarMonth = el.dataset.month;
    await reload();
  },
  async 'cal-view'(el) {
    S.calendarView = el.dataset.view === 'week' ? 'week' : 'month';
    localStorage.setItem('journal_cal_view', S.calendarView);
    if (S.calendarView === 'week' && !S.calendarAnchor) S.calendarAnchor = mondayOf(todayISO());
    render();
  },
  async 'cal-week'(el) {
    const anchor = el.dataset.anchor || mondayOf(todayISO());
    S.calendarAnchor = anchor;
    S.calendarView = 'week';
    localStorage.setItem('journal_cal_view', 'week');
    const month = anchor.slice(0, 7);
    if (month !== S.calendarMonth) {
      S.calendarMonth = month;
      await reload();
      return;
    }
    render();
  },
  'open-more'() {
    const links = [
      moreLink('students', '#/students', 'Ученики', icon.user),
      moreLink('teachers', '#/teachers', 'Педагоги', icon.users),
      moreLink('my-schedule', '#/teacher/schedule', 'Моё расписание', icon.clipboard),
      moreLink('subjects', '#/subjects', 'Предметы', icon.book),
      moreLink('stats', '#/stats', 'Электронный дневник', icon.chart),
      moreLink('diary', '#/diary', 'Мои пропуски', icon.clipboard),
      moreLink('diary-grades', '#/diary/grades', 'Мои оценки', icon.star),
      moreLink('calendar', '#/calendar', isStudentRole() || !can('attendance.mark') ? 'Расписание' : 'Пары', icon.cal),
      moreLink('schedule-edit', '#/schedule', 'Правка пар', icon.edit),
      moreLink('users', '#/users', 'Пользователи и доступы', icon.shield),
      moreLink('audit', '#/audit', 'Журнал изменений', icon.history),
      moreLink('settings', '#/settings', isStudentRole() ? 'Профиль' : 'Настройки', icon.gear),
    ].filter(Boolean).join('');
    openModal(modalWrap(`<div class="more-sheet">
      <div class="sheet-head-row">
        <div>
          <div class="kicker">Навигация</div>
          <h2>Разделы</h2>
        </div>
        <button class="icon-btn dark" type="button" data-act="close-modal" aria-label="Закрыть">${icon.close}</button>
      </div>
      <nav class="more-menu">${links || '<p class="muted">Нет дополнительных разделов</p>'}</nav>
      <div class="sheet-actions col">
        <button class="btn btn-ghost btn-block btn-icon" type="button" data-act="open-account">${icon.user}<span>Аккаунт</span></button>
      </div>
    </div>`));
  },
  'open-account'() {
    openModal(modalWrap(`<div class="account-sheet">
      <div class="sheet-head-row">
        <div class="account-head">
          ${avatarHtml(S.me?.displayName || S.me?.username || '?', null, 'lg')}
          <div>
            <div class="kicker">${esc(roleTitle(S.me?.role))}</div>
            <h2>${esc(S.me?.displayName || S.me?.username || 'Аккаунт')}</h2>
            <p class="muted tight">${esc(S.me?.email || brandName())}</p>
          </div>
        </div>
        <button class="icon-btn dark" type="button" data-act="close-modal" aria-label="Закрыть">${icon.close}</button>
      </div>
      <nav class="more-menu account-menu">
        ${moreLink('settings', '#/settings', isStudentRole() ? 'Профиль' : 'Настройки', icon.gear)}
        ${moreLink('users', '#/users', 'Пользователи', icon.shield)}
        ${moreLink('audit', '#/audit', 'Журнал изменений', icon.history)}
        ${moreLink('my-schedule', '#/teacher/schedule', 'Мои пары', icon.clipboard)}
        <button class="more-link more-btn" type="button" data-act="password">${icon.lock}<span>Сменить пароль</span></button>
      </nav>
      <button class="more-link more-btn danger logout-btn" type="button" data-act="confirm-logout">${icon.out}<span>Выйти</span></button>
    </div>`));
  },
  'confirm-logout'() {
    openConfirm({
      title: 'Выйти?',
      text: 'Сессия на этом устройстве будет завершена.',
      act: 'logout',
      ok: 'Выйти',
      danger: true,
    });
  },
  'add-teacher'() { openTeacherModal(); },
  'edit-teacher'(el) {
    const id = Number(el.dataset.id);
    const teacher = (S.teachers?.teachers || []).find((item) => item.id === id)
      || (S.teacherDetail?.teacher?.id === id ? S.teacherDetail.teacher : null);
    if (teacher) openTeacherModal(teacher);
  },
  async 'sync-teacher-groups'(el) {
    const id = Number(el.dataset.id);
    const detail = S.teacherDetail;
    const assigned = (detail?.groups || []).map((g) => g.groupId).filter(Boolean);
    const fromSchedule = (detail?.scheduleGroups || []).map((g) => g.groupId).filter(Boolean);
    const ids = [...new Set([...assigned, ...fromSchedule])];
    return api(`/api/teachers/${id}/groups`, { method: 'PUT', body: { groupIds: ids } })
      .then(() => { toast('Группы дополнены из расписания'); return reload(); });
  },
  async 'discover-teachers'() {
    const result = await api('/api/teachers', { method: 'POST', body: { discover: true } });
    toast(result.created?.length ? `Добавлено: ${result.created.length}` : 'Новых ФИО в расписании нет');
    await go('#/teachers');
  },
  async 'revoke-student-access'(el) {
    await api(`/api/students/${el.dataset.id}/access`, { method: 'DELETE' });
    S.accessResult = null;
    toast('Доступ отозван');
    await reload();
  },
  async 'revoke-teacher-access'(el) {
    await api(`/api/teachers/${el.dataset.id}/access`, { method: 'DELETE' });
    S.accessResult = null;
    toast('Доступ отозван');
    await reload();
  },
  async 'delete-student-note'(el) {
    await api(`/api/students/${el.dataset.student}/notes/${el.dataset.id}`, { method: 'DELETE' });
    toast('Заметка удалена');
    await reload();
  },
  async 'delete-student-photo'(el) {
    await api(`/api/students/${el.dataset.id}/photo`, { method: 'DELETE' });
    toast('Фото удалено');
    await reload();
  },
  async 'smtp-test'() {
    const form = document.querySelector('form[data-form="save-settings"]');
    const to = form?.smtpFrom?.value || form?.smtpUser?.value || S.me?.email || '';
    await api('/api/settings/smtp-test', { method: 'POST', body: { to } });
    toast(`Тестовое письмо отправлено${to ? `: ${to}` : ''}`);
  },
  async 'telegram-test'() {
    const result = await api('/api/settings/telegram-test', { method: 'POST', body: {} });
    const uname = result?.status?.username ? `@${result.status.username}` : '';
    toast(result?.status?.running
      ? `Бот онлайн${uname ? ` · ${uname}` : ''} · меню команд обновлено`
      : 'Тест отправлен');
    if (can('settings.manage')) {
      S.settings = await api('/api/settings');
      if (S.me) S.me.settings = S.settings;
      render();
    }
  },
  async 'telegram-restart'() {
    const result = await api('/api/settings/telegram-restart', { method: 'POST', body: {} });
    toast(result?.result?.ok
      ? `Бот перезапущен${result.result.username ? ` · @${result.result.username}` : ''}`
      : (result?.result?.error || 'Бот не запущен — проверьте токен и включение'));
    if (can('settings.manage')) {
      S.settings = await api('/api/settings');
      if (S.me) S.me.settings = S.settings;
      render();
    }
  },
  'groups-tab'(el) {
    S.groupsTab = el?.dataset.tab === 'archive' ? 'archive' : 'active';
    render();
  },
  async 'promote-preview'() {
    const preview = await api('/api/groups/promote/preview');
    S._promotePreview = preview;
    openPromoteModal(preview);
  },
  async 'promote-apply'() {
    const result = await api('/api/groups/promote', { method: 'POST', body: {} });
    const moved = result.applied?.filter((a) => a.action === 'promote').length || 0;
    const archived = result.applied?.filter((a) => a.action === 'archive').length || 0;
    toast(`Готово: переведено ${moved}, в архив ${archived}`);
    closeModal();
    S.overview = null;
    await reload();
  },
  async 'preview-schedule'(el) {
    const groupId = Number(el?.dataset.group || S.route?.groupId || 0) || undefined;
    S._scheduleImportGroupId = groupId || null;
    const body = groupId ? { groupId } : {};
    if (el) {
      el.disabled = true;
      const prev = el.textContent;
      el.textContent = 'Сверяю…';
      try {
        const preview = await api('/api/schedule/preview', { method: 'POST', body });
        S.schedulePreview = preview;
        openSchedulePreviewModal(preview, groupId);
      } finally {
        el.disabled = false;
        el.textContent = prev;
      }
      return;
    }
    const preview = await api('/api/schedule/preview', { method: 'POST', body });
    S.schedulePreview = preview;
    openSchedulePreviewModal(preview, groupId);
  },
  async 'import-schedule'(el) {
    const label = el?.textContent || '';
    const groupId = S._scheduleImportGroupId || Number(S.route?.groupId || 0) || undefined;
    if (el) {
      el.disabled = true;
      el.textContent = 'Загружаю…';
    }
    try {
      const result = await api('/api/schedule/import', {
        method: 'POST',
        body: groupId ? { groupId, persistUrl: true } : {},
      });
      closeModal();
      const d = result.diff || {};
      const dedupe = result.dedupedSubjects ? ` · дубли предметов: −${result.dedupedSubjects}` : '';
      const scope = groupId ? 'для группы' : 'целиком';
      toast(`Обновлено ${scope}: ${result.saved} пар (+${d.addedCount || 0} / −${d.removedCount || 0} / ~${d.changedCount || 0})${dedupe}`);
      await reload();
    } finally {
      if (el) {
        el.disabled = false;
        el.textContent = label || 'Применить Excel';
      }
    }
  },
  async 'autosync-schedule'(el) {
    const groupId = Number(el?.dataset.group || S.route?.groupId || 0) || undefined;
    const label = el?.textContent || '';
    if (el) {
      el.disabled = true;
      el.textContent = 'Сверяю…';
    }
    try {
      const summary = await api('/api/schedule/autosync', {
        method: 'POST',
        body: groupId ? { groupId } : {},
      });
      if (summary.skipped) {
        toast(summary.reason === 'busy' ? 'Сверка уже идёт' : 'Автосверка пропущена');
        return;
      }
      const updated = summary.updated || 0;
      const failed = summary.failed || 0;
      if (failed && !updated) toast(`Не удалось сверить: ${summary.results?.[0]?.error || 'ошибка'}`);
      else if (updated) toast(`Обновлено групп: ${updated}${failed ? ` · ошибок: ${failed}` : ''}`);
      else toast('С Excel всё совпадает — менять нечего');
      await reload();
    } finally {
      if (el) {
        el.disabled = false;
        el.textContent = label || 'Сверить сейчас';
      }
    }
  },
  'schedule-week'(el) {
    S.scheduleWeekType = el.dataset.week || 'upper';
    S.scheduleWeekIndex = el.dataset.weekIndex != null && el.dataset.weekIndex !== ''
      ? Number(el.dataset.weekIndex)
      : null;
    reload();
  },
  async 'schedule-constructor'(el) {
    const groupId = Number(el.dataset.group);
    if (!window.ScheduleConstructor) {
      toast('Конструктор не загружен');
      return;
    }
    await window.ScheduleConstructor.open(groupId);
  },
  'schedule-upload'(el) {
    const groupId = Number(el.dataset.group);
    if (!window.ScheduleConstructor) {
      toast('Конструктор не загружен');
      return;
    }
    openModal(modalWrap(window.ScheduleConstructor.uploadModalHtml(groupId)));
    setTimeout(() => {
      document.getElementById('pc-open-constructor')?.addEventListener('click', async () => {
        closeModal();
        await window.ScheduleConstructor.open(groupId);
      });
      document.getElementById('pc-upload-file')?.addEventListener('change', async (ev) => {
        const file = ev.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            await api('/api/schedule/sources/upload', {
              method: 'POST',
              body: {
                groupId,
                fileName: file.name,
                fileBase64: String(reader.result || ''),
              },
            });
            toast('Файл загружен');
            closeModal();
            await window.ScheduleConstructor.open(groupId);
          } catch (err) {
            toast(err.message || 'Ошибка загрузки');
          }
        };
        reader.readAsDataURL(file);
      });
      document.getElementById('pc-upload-probe')?.addEventListener('click', async () => {
        const url = document.getElementById('pc-upload-url')?.value?.trim();
        if (!url) { toast('Укажите ссылку'); return; }
        try {
          await api('/api/schedule/sources/link', {
            method: 'POST',
            body: { groupId, url },
          });
          toast('Источник подключён');
          closeModal();
          await window.ScheduleConstructor.open(groupId);
        } catch (err) {
          toast(err.message || 'Ошибка');
        }
      });
    }, 30);
  },
  'schedule-day'(el) {
    const day = Number(el.dataset.day) || 1;
    S.scheduleFocusDay = day;
    localStorage.setItem('journal_schedule_day', String(day));
    render();
  },
  'add-day-pair-slot'() {
    const list = document.getElementById('day-pair-list');
    if (!list) return;
    const next = (list.querySelectorAll('[data-pair-card]').length || 0) + 1;
    if (next > 12) { toast('Максимум 12 пар'); return; }
    const focusDay = S.scheduleFocusDay || 1;
    const tpl = document.createElement('div');
    tpl.innerHTML = `<article class="pair-field-card" data-pair-card="${next}">
      <div class="pair-field-head">
        <strong>Пара ${next}</strong>
        <span class="muted mono">день ${focusDay} · п.${next}</span>
        <label class="lock-toggle" title="Не перезаписывать из Excel">
          <input type="checkbox" name="locked"> замок
        </label>
      </div>
      <input type="hidden" name="pairNum" value="${next}">
      <input type="hidden" name="id" value="">
      <label class="field"><span>Предмет</span><input name="subjectName" maxlength="200" placeholder="Название предмета"></label>
      <div class="threshold-grid">
        <label class="field"><span>Вид</span><input name="lessonKind" maxlength="80" placeholder="лекция / практика"></label>
        <label class="field"><span>Преподаватель</span><input name="teacher" maxlength="120" placeholder="Фамилия И.О."></label>
      </div>
      <div class="threshold-grid">
        <label class="field"><span>Аудитория</span><input name="room" maxlength="80" placeholder="409"></label>
        <label class="field"><span>Начало</span><input name="timeStart" maxlength="8" placeholder="09:00"></label>
        <label class="field"><span>Конец</span><input name="timeEnd" maxlength="8" placeholder="10:30"></label>
      </div>
    </article>`;
    list.appendChild(tpl.firstElementChild);
    list.lastElementChild?.querySelector('input[name="subjectName"]')?.focus();
  },
  'subject-sort'(el) {
    S.subjectSort = el.dataset.sort || 'lessons';
    localStorage.setItem('journal_subject_sort', S.subjectSort);
    render();
  },
  'pick-schedule-subject'(el) {
    const form = el.closest('form');
    const input = form?.querySelector('input[name="subjectName"]');
    if (!input) return;
    input.value = el.dataset.name || '';
    form.querySelectorAll('.subject-pick-chips .chip').forEach((chip) => {
      chip.classList.toggle('on', chip === el);
    });
    input.focus();
  },
  'add-user'() { openUserModal(); },
  'edit-user'(el) {
    const user = (S.users?.users || []).find((item) => item.id === Number(el.dataset.id));
    if (user) openUserModal(user);
  },
  'delete-user'(el) {
    openConfirm({
      title: 'Удалить пользователя?',
      text: 'Сессии будут сброшены. Данные журнала не затронуты.',
      act: 'confirm-delete-user',
      id: el.dataset.id,
      ok: 'Удалить',
    });
  },
  async 'confirm-delete-user'(el) {
    await api(`/api/users/${el.dataset.id}`, { method: 'DELETE' });
    closeModal();
    toast('Пользователь удалён');
    await go('#/users');
  },
  'add-schedule-entry'(el) {
    openScheduleEntryModal(null, {
      groupId: el.dataset.group,
      weekday: el.dataset.weekday || S.scheduleFocusDay,
      pair: el.dataset.pair,
    });
  },
  'edit-schedule-entry'(el) {
    const entry = S.schedule?.entries?.find((item) => item.id === Number(el.dataset.id));
    if (entry) openScheduleEntryModal(entry);
  },
  'delete-schedule-entry'(el) {
    openConfirm({
      title: 'Удалить пару?',
      text: 'Пара исчезнет из расписания. Отметки посещаемости за прошлые дни сохранятся.',
      act: 'confirm-delete-schedule-entry',
      id: el.dataset.id,
      ok: 'Удалить',
    });
  },
  async 'confirm-delete-schedule-entry'(el) {
    await api(`/api/schedule/entries/${el.dataset.id}`, { method: 'DELETE' });
    closeModal();
    toast('Пара удалена');
    await reload();
  },
  'clear-schedule-week'(el) {
    const groupId = Number(el.dataset.group);
    const week = el.dataset.week || '';
    const weekLabel = week === 'upper' ? 'верхнюю неделю' : week === 'lower' ? 'нижнюю неделю' : 'всё расписание группы';
    S._clearSchedule = { groupId, weekType: week || 'all' };
    openConfirm({
      title: 'Очистить расписание?',
      text: `Удалить ${weekLabel}. Отметки посещаемости за прошлые дни сохранятся.`,
      act: 'confirm-clear-schedule-week',
      id: String(groupId),
      ok: 'Очистить',
    });
  },
  async 'confirm-clear-schedule-week'() {
    const payload = S._clearSchedule;
    if (!payload) return;
    const result = await api('/api/schedule/clear', {
      method: 'POST',
      body: { groupId: payload.groupId, weekType: payload.weekType },
    });
    closeModal();
    toast(result.removed ? `Удалено пар: ${result.removed}` : 'Уже пусто');
    await reload();
  },
  'copy-schedule-week'(el) {
    S._copySchedule = {
      groupId: Number(el.dataset.group),
      fromWeekType: el.dataset.from,
      toWeekType: el.dataset.to,
    };
    const toLabel = el.dataset.to === 'upper' ? 'верхнюю' : 'нижнюю';
    openConfirm({
      title: 'Скопировать неделю?',
      text: `Целевая ${toLabel} неделя будет заменена копией. Совпадающие пары не дублируются.`,
      act: 'confirm-copy-schedule-week',
      id: el.dataset.group,
      ok: 'Скопировать',
      danger: false,
    });
  },
  async 'confirm-copy-schedule-week'() {
    const payload = S._copySchedule;
    if (!payload) return;
    const result = await api('/api/schedule/copy-week', { method: 'POST', body: payload });
    closeModal();
    toast(`Скопировано пар: ${result.copied}`);
    S.scheduleWeekType = payload.toWeekType;
    await reload();
  },
  'dedupe-subjects'(el) {
    const groupId = el.dataset.group ? Number(el.dataset.group) : null;
    const count = (S.subjectDupes?.clusters || []).filter((c) => !groupId || c.groupId === groupId).length;
    S._dedupeGroupId = groupId;
    openConfirm({
      title: 'Объединить дубли?',
      text: count
        ? `Найдено кластеров: ${count}. Одинаковые предметы (с учётом регистра и пунктуации) сольются в один.`
        : 'Явных дублей нет — всё равно проверю и объединю похожие названия, если найдутся.',
      act: 'confirm-dedupe-subjects',
      id: String(groupId || ''),
      ok: 'Объединить',
      danger: false,
    });
  },
  async 'confirm-dedupe-subjects'() {
    const result = await api('/api/subjects/dedupe', {
      method: 'POST',
      body: { groupId: S._dedupeGroupId || undefined },
    });
    closeModal();
    toast(result.merged ? `Объединено предметов: ${result.merged}` : 'Дублей не найдено');
    await reload();
  },
  'merge-subjects'(el) {
    const keepId = Number(el.dataset.keep);
    const ids = String(el.dataset.ids || '').split(',').map(Number).filter(Boolean);
    openConfirm({
      title: 'Объединить предметы?',
      text: 'Занятия, зачёты и оценки перейдут в один предмет. Дубликаты удалятся.',
      act: 'confirm-merge-subjects',
      id: String(keepId),
      ok: 'Объединить',
      danger: false,
    });
    S._mergeSubjects = { keepId, mergeIds: ids };
  },
  async 'confirm-merge-subjects'() {
    const payload = S._mergeSubjects;
    if (!payload) return;
    const result = await api('/api/subjects/merge', { method: 'POST', body: payload });
    closeModal();
    toast(`Объединено: ${result.merged}`);
    await reload();
  },
  async 'cleanup-subjects'(el) {
    el.disabled = true;
    try {
      const result = await api('/api/subjects/cleanup', { method: 'POST', body: {} });
      toast(result.removed ? `Удалено пустых: ${result.removed}` : 'Пустых предметов нет');
      await reload();
    } finally {
      el.disabled = false;
    }
  },
  async 'audit-search'() {
    const input = document.getElementById('audit-q');
    S.auditQ = String(input?.value || '').trim();
    S.auditOffset = 0;
    await reload();
  },
  async 'audit-filter'(el) {
    S.auditAction = el.dataset.action || '';
    S.auditOffset = 0;
    await reload();
  },
  async 'audit-more'() {
    const data = S.audit;
    if (!data) return;
    S.auditOffset = (data.offset || 0) + (data.items?.length || 0);
    const params = new URLSearchParams({
      limit: '80',
      offset: String(S.auditOffset),
    });
    if (S.auditQ) params.set('q', S.auditQ);
    if (S.auditAction) params.set('action', S.auditAction);
    const next = await api(`/api/audit?${params}`);
    S.audit = {
      ...next,
      items: [...(data.items || []), ...(next.items || [])],
      offset: data.offset || 0,
    };
    render();
  },
  'pair-filter'(el) {
    S.pairFilter = el.dataset.filter || 'all';
    document.querySelectorAll('.pair-filter-chips .chip').forEach((chip) => {
      chip.classList.toggle('on', chip.dataset.filter === S.pairFilter);
    });
    applyPairPeopleVisibility();
    focusNextOpenPerson();
  },
  async 'pair-mark'(el) {
    const list = document.querySelector('.pair-modal-people');
    const scrollTop = list?.scrollTop || 0;
    const row = el.closest('.person');
    const buttons = [...row.querySelectorAll('.seg button')];
    const current = buttons.find((button) => button.classList.contains('on'))?.dataset.status || '';
    const next = current === el.dataset.status ? '' : el.dataset.status;
    const prevStatus = current;
    buttons.forEach((button) => button.classList.toggle('on', button.dataset.status === next));
    row.dataset.status = next;
    row.classList.add(next ? 'just-marked' : 'just-cleared');
    setTimeout(() => row.classList.remove('just-marked', 'just-cleared'), 280);
    const commentInput = row.querySelector('[data-act-input="pair-comment"]');
    S.lastPairMark = {
      groupId: Number(el.dataset.group),
      date: el.dataset.date,
      scheduleEntryId: Number(el.dataset.entry),
      studentId: Number(el.dataset.student),
      prevStatus,
      nextStatus: next,
    };
    try {
      const data = await api('/api/calendar/pair-attendance', {
        method: 'PUT',
        body: {
          groupId: Number(el.dataset.group),
          date: el.dataset.date,
          scheduleEntryId: Number(el.dataset.entry),
          studentId: Number(el.dataset.student),
          status: next || null,
          comment: commentInput ? commentInput.value : undefined,
        },
      });
      S.calendarDay = data.day;
      S.activePairId = Number(el.dataset.entry);
      S.pairModalOpen = true;
      const pair = data.day.pairs.find((item) => item.scheduleEntryId === Number(el.dataset.entry));
      if (pair) {
        recomputePairStats(pair, data.day);
        updatePairModalChrome(pair, data.day);
      }
      applyPairPeopleVisibility();
      if (list) list.scrollTop = scrollTop;
      if (next) focusNextOpenPerson(row);
      else if (!next && prevStatus) toast('Отметка снята');
    } catch (error) {
      buttons.forEach((button) => button.classList.toggle('on', button.dataset.status === prevStatus));
      row.dataset.status = prevStatus;
      throw error;
    }
  },
  'pair-fill-present'(el) {
    S.pairCopyConfirm = null;
    S.pairConfirm = {
      groupId: Number(el.dataset.group),
      date: el.dataset.date,
      scheduleEntryId: Number(el.dataset.entry),
      fill: 'present',
    };
    const host = document.getElementById('pair-confirm-host');
    if (host) host.innerHTML = pairConfirmBarHtml();
    else render();
  },
  'pair-fill-absent'(el) {
    S.pairCopyConfirm = null;
    S.pairConfirm = {
      groupId: Number(el.dataset.group),
      date: el.dataset.date,
      scheduleEntryId: Number(el.dataset.entry),
      fill: 'absent-open',
    };
    const host = document.getElementById('pair-confirm-host');
    if (host) host.innerHTML = pairConfirmBarHtml();
    else render();
  },
  'pair-fill-clear'(el) {
    const day = S.calendarDay;
    const pair = day?.pairs?.find((item) => item.scheduleEntryId === Number(el.dataset.entry));
    askClearPairList(pair, day, {
      groupId: el.dataset.group,
      date: el.dataset.date,
      scheduleEntryId: el.dataset.entry,
    });
  },
  'pair-fill-cancel'() {
    S.pairConfirm = null;
    closeConfirmDialog();
    if (S.pairModalOpen && document.querySelector('.pair-modal')) {
      const host = document.getElementById('pair-confirm-host');
      if (host) host.innerHTML = pairConfirmBarHtml();
      return;
    }
    if (!document.querySelector('.pair-modal')) render();
  },
  'close-confirm'() {
    closeConfirmDialog();
  },
  async 'confirm-pair-fill'() {
    const payload = S.pairConfirm || S._pairFill;
    if (!payload) return;
    closeConfirmDialog();
    const q = document.getElementById('q');
    if (q) S.q = q.value;
    const list = document.querySelector('.pair-modal-people');
    const scrollTop = list?.scrollTop || 0;
    const fill = payload.fill === 'absent-open'
      ? 'absent-open'
      : payload.fill === 'clear'
        ? 'clear'
        : 'present';
    const data = await api('/api/calendar/pair-attendance', {
      method: 'PUT',
      body: {
        groupId: payload.groupId,
        date: payload.date,
        scheduleEntryId: payload.scheduleEntryId,
        fill,
      },
    });
    S.calendarDay = data.day;
    S.activePairId = payload.scheduleEntryId;
    S.pairConfirm = null;
    S._pairFillReturn = false;
    if (fill === 'clear') S.lastPairCopy = null;
    const pair = data.day.pairs.find((item) => item.scheduleEntryId === payload.scheduleEntryId);
    const toastMsg = fill === 'absent-open'
      ? 'Пустые отмечены «нет»'
      : fill === 'clear'
        ? 'Список очищен'
        : 'Все отмечены на паре';
    if (S.pairModalOpen && pair && document.querySelector('.pair-modal')) {
      recomputePairStats(pair, data.day);
      refreshPairPeopleList(pair, data.day, { scrollTop });
      if (fill !== 'clear') focusNextOpenPerson();
      toast(toastMsg);
      return;
    }
    render();
    toast(toastMsg);
  },
  async 'copy-pair-attendance'(el) {
    const day = S.calendarDay;
    if (!day) return;
    const fromId = Number(el.dataset.from);
    const toId = Number(el.dataset.to);
    const fromPair = day.pairs.find((item) => item.scheduleEntryId === fromId);
    const toPair = day.pairs.find((item) => item.scheduleEntryId === toId);
    if (!fromPair || !toPair) return;
    if (!pairHasMarks(fromPair)) {
      toast('На исходной паре ещё нет отметок');
      return;
    }
    S.pairConfirm = null;
    const payload = {
      groupId: Number(el.dataset.group),
      date: el.dataset.date,
      fromScheduleEntryId: fromId,
      toScheduleEntryId: toId,
      fromPairNum: Number(el.dataset.fromNum || fromPair.pairNum),
      toPairNum: Number(el.dataset.toNum || toPair.pairNum),
      fromSubject: fromPair.subjectName || '',
      toSubject: toPair.subjectName || '',
    };

    // Повторный клик по той же связке / одинаковый список → подтвердить очистку цели.
    const sameList = pairMarksEqual(fromPair, toPair);
    const sameLink = S.lastPairCopy
      && Number(S.lastPairCopy.fromScheduleEntryId) === fromId
      && Number(S.lastPairCopy.toScheduleEntryId) === toId
      && Number(S.lastPairCopy.groupId) === payload.groupId
      && S.lastPairCopy.date === payload.date;
    if ((sameList || sameLink) && pairHasMarks(toPair)) {
      askClearPairList(toPair, day, {
        groupId: payload.groupId,
        date: payload.date,
        scheduleEntryId: toId,
      });
      return;
    }

    askCopyPairAttendance(payload);
  },
  'pair-copy-cancel'() {
    S.pairCopyConfirm = null;
    closeConfirmDialog();
    if (S.pairModalOpen && document.querySelector('.pair-modal')) {
      const host = document.getElementById('pair-confirm-host');
      if (host) host.innerHTML = pairConfirmBarHtml();
      return;
    }
    if (!document.querySelector('.pair-modal')) render();
  },
  async 'confirm-pair-copy'(el) {
    const payload = S.pairCopyConfirm;
    if (!payload) return;
    closeConfirmDialog();
    const mode = ['fill-empty', 'here-only', 'away-only'].includes(el?.dataset?.mode)
      ? el.dataset.mode
      : 'replace';
    const keepModal = S.pairModalOpen;
    const activeId = S.activePairId || payload.toScheduleEntryId;
    const list = document.querySelector('.pair-modal-people');
    const scrollTop = list?.scrollTop || 0;
    const data = await api('/api/calendar/copy-pair-attendance', {
      method: 'POST',
      body: {
        groupId: payload.groupId,
        date: payload.date,
        fromScheduleEntryId: payload.fromScheduleEntryId,
        toScheduleEntryId: payload.toScheduleEntryId,
        mode,
      },
    });
    S.calendarDay = data.day;
    S.pairCopyConfirm = null;
    S.lastPairCopy = {
      groupId: payload.groupId,
      date: payload.date,
      fromScheduleEntryId: payload.fromScheduleEntryId,
      toScheduleEntryId: payload.toScheduleEntryId,
      mode,
    };
    S.activePairId = keepModal ? activeId : payload.toScheduleEntryId;
    const target = data.day.pairs.find((item) => item.scheduleEntryId === payload.toScheduleEntryId);
    if (target) recomputePairStats(target, data.day);
    const toastMsg = mode === 'fill-empty'
      ? `Дописано с ${data.fromPairNum}-й → ${data.toPairNum}-ю: ${data.copied}${data.skipped ? ` · пропуск ${data.skipped}` : ''}`
      : mode === 'here-only'
        ? `Только «здесь» с ${data.fromPairNum}-й → ${data.toPairNum}-ю: ${data.copied}`
        : mode === 'away-only'
          ? `Только «нет» с ${data.fromPairNum}-й → ${data.toPairNum}-ю: ${data.copied}`
          : `Перенесено с ${data.fromPairNum}-й → ${data.toPairNum}-ю: ${data.copied}`;
    const undoToast = {
      actionLabel: 'Снять',
      action: async () => {
        const cleared = await api('/api/calendar/pair-attendance', {
          method: 'PUT',
          body: {
            groupId: payload.groupId,
            date: payload.date,
            scheduleEntryId: payload.toScheduleEntryId,
            fill: 'clear',
          },
        });
        S.calendarDay = cleared.day;
        S.lastPairCopy = null;
        if (S.pairModalOpen && document.querySelector('.pair-modal')) {
          const shown = cleared.day.pairs.find((item) => item.scheduleEntryId === Number(S.activePairId || activeId));
          if (shown) {
            recomputePairStats(shown, cleared.day);
            refreshPairPeopleList(shown, cleared.day);
          }
        } else {
          render();
        }
        toast('Копия снята');
      },
      timeout: 6000,
    };
    if (keepModal && document.querySelector('.pair-modal')) {
      const shown = data.day.pairs.find((item) => item.scheduleEntryId === Number(activeId));
      if (shown) {
        recomputePairStats(shown, data.day);
        refreshPairPeopleList(shown, data.day, { scrollTop });
      }
      toast(toastMsg, mode === 'replace' ? undoToast : {});
      return;
    }
    render();
    toast(toastMsg, mode === 'replace' ? undoToast : {});
  },
  async 'undo-pair-mark'() {
    const last = S.lastPairMark;
    if (!last || !S.pairModalOpen) return;
    const data = await api('/api/calendar/pair-attendance', {
      method: 'PUT',
      body: {
        groupId: last.groupId,
        date: last.date,
        scheduleEntryId: last.scheduleEntryId,
        studentId: last.studentId,
        status: last.prevStatus || null,
      },
    });
    S.calendarDay = data.day;
    const pair = data.day.pairs.find((item) => item.scheduleEntryId === last.scheduleEntryId);
    const list = document.querySelector('.pair-modal-people');
    const scrollTop = list?.scrollTop || 0;
    if (pair) {
      recomputePairStats(pair, data.day);
      refreshPairPeopleList(pair, data.day, { scrollTop });
    }
    S.lastPairMark = null;
    toast('Отметка отменена');
  },
  async export(el) {
    const kind = el.dataset.kind;
    const params = new URLSearchParams();
    if (el.dataset.group) params.set('groupId', el.dataset.group);
    if (el.dataset.subject) params.set('subjectId', el.dataset.subject);
    if (el.dataset.student) params.set('studentId', el.dataset.student);
    if (el.dataset.format) params.set('format', el.dataset.format);
    const qs = params.toString() ? `?${params}` : '';
    el.classList.add('busy');
    try {
      const response = await fetch(`/api/export/${kind}${qs}`, {
        headers: { Authorization: `Bearer ${S.token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Не удалось выгрузить');
      }
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
      const filename = decodeURIComponent(match?.[1] || match?.[2] || `${kind}.csv`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast(filename.endsWith('.xlsx') ? 'Excel скачан' : 'CSV скачан');
    } finally {
      el.classList.remove('busy');
    }
  },
  'add-group'() { openGroupModal(null); },
  async 'probe-group-schedule'(el) {
    const form = el.closest('form') || document.querySelector('#modal-root form[data-form="save-group"]');
    if (!form) return;
    const id = Number(el.dataset.id || form.querySelector('input[name="id"]')?.value || 0) || null;
    const url = String(form.querySelector('input[name="scheduleUrl"]')?.value || '').trim();
    el.disabled = true;
    const prev = el.textContent;
    el.textContent = 'Читаю…';
    try {
      const body = {};
      if (id) body.groupId = id;
      if (url) body.url = url;
      const probe = await api('/api/schedule/probe', { method: 'POST', body });
      if (url && form.querySelector('input[name="scheduleUrl"]') && probe.urls?.[0]) {
        form.querySelector('input[name="scheduleUrl"]').value = probe.urls[0].includes('/edit')
          ? url
          : url;
      }
      const group = id
        ? {
          ...(S.overview?.groups || []).find((item) => item.id === id),
          scheduleUrl: url || probe.group?.scheduleUrl || '',
          scheduleCode: form.querySelector('input[name="scheduleCode"]')?.value || '',
          scheduleAliases: String(form.querySelector('input[name="scheduleAliases"]')?.value || '')
            .split(/[,;\n+|]+/).map((part) => part.trim()).filter(Boolean),
          name: form.querySelector('input[name="name"]')?.value || '',
          id,
        }
        : {
          name: form.querySelector('input[name="name"]')?.value || '',
          scheduleUrl: url,
          scheduleCode: form.querySelector('input[name="scheduleCode"]')?.value || '',
          scheduleAliases: String(form.querySelector('input[name="scheduleAliases"]')?.value || '')
            .split(/[,;\n+|]+/).map((part) => part.trim()).filter(Boolean),
        };
      const elderUserId = form.querySelector('select[name="elderUserId"]')?.value;
      if (elderUserId != null) group.elderUserId = elderUserId === '' ? null : Number(elderUserId);
      openGroupModal(group, probe);
      toast(probe.codes?.length ? `Найдено кодов: ${probe.codes.length}` : 'Коды не найдены');
    } finally {
      el.disabled = false;
      el.textContent = prev;
    }
  },
  async 'import-group-schedule'(el) {
    const form = el.closest('form') || document.querySelector('#modal-root form[data-form="save-group"]');
    const id = Number(el.dataset.id || form?.querySelector('input[name="id"]')?.value || 0);
    if (!id) return;
    if (form) {
      const schedule = readGroupScheduleFields(form, Object.fromEntries(new FormData(form).entries()));
      const name = form.querySelector('input[name="name"]')?.value;
      await api(`/api/groups/${id}`, {
        method: 'PATCH',
        body: {
          name,
          scheduleCode: schedule.scheduleCode,
          scheduleUrl: schedule.scheduleUrl,
          scheduleAliases: schedule.scheduleAliases,
        },
      });
    }
    el.disabled = true;
    const prev = el.textContent;
    el.textContent = 'Гружу…';
    try {
      const result = await api('/api/schedule/import', {
        method: 'POST',
        body: { groupId: id, persistUrl: true },
      });
      toast(`В группу загружено пар: ${result.saved}`);
      closeModal();
      await reload();
    } finally {
      el.disabled = false;
      el.textContent = prev || 'Подтянуть пары в группу';
    }
  },
  async 'edit-group'(el) {
    const group = S.overview?.groups.find((item) => item.id === Number(el.dataset.id));
    if (!group) return;
    if (can('elders.appoint') && !S.users) {
      try { S.users = await api('/api/users'); } catch { /* список старост опционален */ }
    }
    if (can('settings.manage') && !S.settings) {
      try { S.settings = await api('/api/settings'); } catch { /* telegram-блок опционален */ }
    }
    openGroupModal(group);
  },
  'delete-group'(el) {
    openConfirm({
      title: 'Удалить группу?',
      text: 'Удалятся ученики, предметы, посещаемость, зачёты и оценки этой группы.',
      act: 'confirm-delete-group',
      id: el.dataset.id,
      ok: 'Удалить',
    });
  },
  async 'confirm-delete-group'(el) {
    const id = Number(el.dataset.id);
    await api(`/api/groups/${id}`, { method: 'DELETE' });
    toast('Группа удалена');
    await go(S.route?.groupId === id ? '#/groups' : (location.hash || '#/'));
  },
  'add-student'(el) { openStudentModal(null, el.dataset.group ? Number(el.dataset.group) : undefined); },
  'edit-student'(el) {
    const student = S.overview?.students.find((item) => item.id === Number(el.dataset.id));
    if (student) openStudentModal(student);
  },
  'delete-student'(el) {
    openConfirm({
      title: 'Удалить ученика?',
      text: 'Его отметки, зачёты и оценки тоже исчезнут.',
      act: 'confirm-delete-student',
      id: el.dataset.id,
      ok: 'Удалить',
    });
  },
  async 'confirm-delete-student'(el) {
    await api(`/api/students/${el.dataset.id}`, { method: 'DELETE' });
    toast('Ученик удалён');
    closeModal();
    await reload();
  },
  'add-subject'(el) { openSubjectModal(null, el.dataset.group ? Number(el.dataset.group) : undefined); },
  'edit-subject'(el) {
    const id = Number(el.dataset.id);
    const subject = S.journal?.subject?.id === id ? S.journal.subject : S.overview?.subjects.find((item) => item.id === id);
    if (subject) openSubjectModal(subject);
  },
  'delete-subject'(el) {
    openConfirm({
      title: 'Удалить предмет?',
      text: 'Удалятся план посещаемости, зачёты и оценки по этому предмету.',
      act: 'confirm-delete-subject',
      id: el.dataset.id,
      ok: 'Удалить',
    });
  },
  async 'confirm-delete-subject'(el) {
    const id = Number(el.dataset.id);
    const subject = S.journal?.subject?.id === id
      ? S.journal.subject
      : S.overview?.subjects.find((item) => item.id === id);
    const key = normalizeSubjectKey(subject?.name || '');
    const siblings = (S.journal?.subject?.id === id
      ? (S.journal.siblings || [])
      : (S.overview?.subjects || [])
    ).filter((row) => row.id !== id && normalizeSubjectKey(row.name) === key);
    await api(`/api/subjects/${id}`, { method: 'DELETE' });
    toast('Предмет удалён');
    if (siblings.length > 1) {
      await go(`#/subjects/hub/${encodeURIComponent(key)}`);
      return;
    }
    if (siblings.length === 1) {
      await go(`#/subject/${siblings[0].id}/attendance`);
      return;
    }
    const stayInCatalog = S.route?.name === 'subject-hub' || S.route?.name === 'subjects';
    await go(stayInCatalog ? '#/subjects' : (subject?.groupId ? `#/group/${subject.groupId}` : '#/subjects'));
  },
  'add-lesson'() { openLessonModal(); },
  'edit-lesson'(el) {
    const lesson = S.journal?.lessons.find((item) => item.id === Number(el.dataset.id));
    if (lesson) openLessonModal(lesson);
  },
  'delete-lesson'(el) {
    openConfirm({
      title: 'Удалить занятие?',
      text: 'Отметки этого занятия исчезнут из плана посещаемости.',
      act: 'confirm-delete-lesson',
      id: el.dataset.id,
      ok: 'Удалить',
    });
  },
  async 'confirm-delete-lesson'() {
    const subjectId = S.route.subjectId;
    await api(`/api/lessons/${S.route.lessonId}`, { method: 'DELETE' });
    toast('Занятие удалено');
    await go(`#/subject/${subjectId}/attendance`);
  },
  'fill-present'(el) {
    openConfirm({
      title: 'Все присутствовали?',
      text: 'Текущие отметки этого занятия заменятся на «здесь».',
      act: 'confirm-fill-present',
      id: el.dataset.id,
      ok: 'Отметить',
      danger: false,
    });
  },
  async 'confirm-fill-present'(el) {
    await api(`/api/lessons/${el.dataset.id}/attendance`, { method: 'PUT', body: { fill: 'present' } });
    closeModal();
    toast('Все отмечены');
    await reload();
  },
  async mark(el) {
    const row = el.closest('.person');
    const buttons = [...row.querySelectorAll('.seg button')];
    const current = buttons.find((button) => button.classList.contains('on'))?.dataset.status || '';
    const next = current === el.dataset.status ? '' : el.dataset.status;
    buttons.forEach((button) => button.classList.toggle('on', button.dataset.status === next));
    updateStat();
    const commentInput = row.querySelector('[data-act-input="lesson-comment"]');
    try {
      await api(`/api/lessons/${el.dataset.lesson}/attendance`, {
        method: 'PUT',
        body: {
          studentId: Number(el.dataset.student),
          status: next || null,
          comment: commentInput ? commentInput.value : undefined,
        },
      });
    } catch (error) {
      await reload();
      throw error;
    }
  },
  'add-credit'() { openCreditModal(); },
  'edit-credit'(el) {
    const credit = S.journal?.credits.find((item) => item.id === Number(el.dataset.id));
    if (credit) openCreditModal(credit);
  },
  'delete-credit'() {
    openConfirm({
      title: 'Удалить из плана?',
      text: 'Результаты этого зачёта или экзамена исчезнут.',
      act: 'confirm-delete-credit',
      ok: 'Удалить',
    });
  },
  async 'confirm-delete-credit'() {
    const subjectId = S.route.subjectId;
    await api(`/api/credits/${S.route.creditId}`, { method: 'DELETE' });
    toast('Удалено из плана');
    await go(`#/subject/${subjectId}/credits`);
  },
  async result(el) {
    const row = el.closest('.person');
    const buttons = [...row.querySelectorAll('.seg button')];
    const current = buttons.find((button) => button.classList.contains('on'))?.dataset.result || '';
    const next = current === el.dataset.result ? '' : el.dataset.result;
    buttons.forEach((button) => button.classList.toggle('on', button.dataset.result === next));
    updateStat();
    try {
      await api(`/api/credits/${el.dataset.credit}/results`, {
        method: 'PUT',
        body: { studentId: Number(el.dataset.student), result: next || null },
      });
    } catch (error) {
      await reload();
      throw error;
    }
  },
  'add-work'() { openWorkModal(); },
  'edit-work'(el) {
    const work = S.journal?.works.find((item) => item.id === Number(el.dataset.id));
    if (work) openWorkModal(work);
  },
  'delete-work'(el) {
    openConfirm({
      title: 'Удалить колонку?',
      text: 'Оценки этой работы исчезнут.',
      act: 'confirm-delete-work',
      id: el.dataset.id,
      ok: 'Удалить',
    });
  },
  async 'confirm-delete-work'(el) {
    await api(`/api/works/${el.dataset.id}`, { method: 'DELETE' });
    toast('Колонка удалена');
    closeModal();
    await reload();
  },
  'pick-grade'(el) { openGrade(el.dataset.work, el.dataset.student); },
  async 'set-grade'(el) {
    await api(`/api/works/${el.dataset.work}/grades`, {
      method: 'PUT',
      body: { studentId: Number(el.dataset.student), value: el.dataset.value === '' ? null : Number(el.dataset.value) },
    });
    closeModal();
    await reload();
  },
  'filter-group'(el) {
    const input = document.getElementById('q');
    if (input) S.q = input.value;
    const raw = el.getAttribute('data-id');
    S.groupFilter = raw == null || raw === '' ? '' : String(raw);
    render();
  },
};

async function onSubmit(event) {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  if (form.dataset.busy === '1') return;
  form.dataset.busy = '1';
  const data = Object.fromEntries(new FormData(form).entries());
  const submit = form.querySelector('[type="submit"]');
  if (submit) submit.disabled = true;
  try {
    if (form.dataset.form === 'login') {
      const errBox = form.querySelector('#login-error');
      if (errBox) { errBox.hidden = true; errBox.textContent = ''; }
      if (submit) submit.textContent = 'Вхожу…';
      const username = String(form.username?.value ?? data.username ?? '').trim();
      const password = String(form.password?.value ?? data.password ?? '').trim();
      if (!username || !password) throw new Error('Введите логин и пароль');
      localStorage.removeItem('journal_token');
      S.token = '';
      const result = await api('/api/login', { method: 'POST', body: { username, password } });
      if (!result?.token) throw new Error('Сервер не выдал сессию');
      S.token = result.token;
      localStorage.setItem('journal_token', result.token);
      if (submit) submit.textContent = 'Открываю…';
      S.stats = null;
      await boot();
      api('/api/stats').then((stats) => {
        S.stats = stats;
        if ((S.route?.name || 'home') === 'home') render();
      }).catch(() => {});
      return;
    }
    if (form.dataset.form === 'password') {
      if (data.next !== data.repeat) throw new Error('Пароли не совпадают');
      if (String(data.next).length < 6) throw new Error('Пароль минимум 6 символов');
      const result = await api('/api/password', { method: 'POST', body: { current: data.current, next: data.next } });
      if (result?.token) {
        S.token = result.token;
        localStorage.setItem('journal_token', result.token);
      }
      toast('Пароль изменён');
      closeModal();
      await reload();
      return;
    }
    if (form.dataset.form === 'save-settings') {
      const scheduleUrls = String(data.scheduleUrls || '')
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
      const excelEnabled = !!form.querySelector('input[name="excelEnabled"]')?.checked;
      const scheduleAutoSync = !!form.querySelector('input[name="scheduleAutoSync"]')?.checked;
      const gradesEnabled = !!form.querySelector('input[name="gradesEnabled"]')?.checked;
      const smtpEnabled = !!form.querySelector('input[name="smtpEnabled"]')?.checked;
      const smtpSecure = !!form.querySelector('input[name="smtpSecure"]')?.checked;
      const telegramEnabled = !!form.querySelector('input[name="telegramEnabled"]')?.checked;
      const telegramMultiMode = !!form.querySelector('input[name="telegramMultiMode"]')?.checked;
      const promotionKeepOldAlias = !!form.querySelector('input[name="promotionKeepOldAlias"]')?.checked;
      const promotionCourseUrls = {};
      for (const course of [1, 2, 3, 4]) {
        const url = String(data[`courseUrl${course}`] || '').trim();
        if (url) promotionCourseUrls[String(course)] = url;
      }
      const body = {
        institutionName: data.institutionName,
        institutionSubtitle: data.institutionSubtitle,
        institutionKind: data.institutionKind || 'college',
        excelEnabled,
        gradesEnabled,
        scheduleAutoSync: excelEnabled ? scheduleAutoSync : false,
        scheduleAutoSyncMinutes: Number(data.scheduleAutoSyncMinutes) || 5,
        attendanceExcellent: Number(data.attendanceExcellent),
        attendanceGood: Number(data.attendanceGood),
        attendanceWarn: Number(data.attendanceWarn),
        scheduleUrls,
        smtpEnabled,
        smtpHost: data.smtpHost || '',
        smtpPort: Number(data.smtpPort) || 587,
        smtpSecure,
        smtpUser: data.smtpUser || '',
        smtpFrom: data.smtpFrom || '',
        smtpFromName: data.smtpFromName || '',
        telegramEnabled,
        telegramChatId: data.telegramChatId || '',
        telegramAdminIds: data.telegramAdminIds || '',
        telegramMultiMode,
        telegramBindings: telegramMultiMode ? readTelegramBindingsFromForm(form) : (S.settings?.telegramBindings || []),
        academicYearStart: Number(data.academicYearStart) || new Date().getFullYear(),
        maxCourse: Number(data.maxCourse) || 4,
        promotionKeepOldAlias,
        promotionCourseUrls,
      };
      if (data.smtpPass) body.smtpPass = data.smtpPass;
      if (data.telegramBotToken) body.telegramBotToken = data.telegramBotToken;
      S.settings = await api('/api/settings', { method: 'PUT', body });
      if (S.me) S.me.settings = S.settings;
      toast('Настройки сохранены');
      await reload();
      return;
    }
    if (form.dataset.form === 'grant-student-access') {
      const id = Number(form.dataset.id);
      const result = await api(`/api/students/${id}/access`, {
        method: 'POST',
        body: { username: data.username || '', email: data.email || '' },
      });
      S.accessResult = { ...result, studentId: id };
      toast(result.mailed ? 'Доступ выдан, письмо отправлено' : 'Доступ выдан');
      await reload();
      return;
    }
    if (form.dataset.form === 'grant-teacher-access') {
      const id = Number(form.dataset.id);
      const result = await api(`/api/teachers/${id}/access`, {
        method: 'POST',
        body: { username: data.username || '', email: data.email || '' },
      });
      S.accessResult = { ...result, teacherId: id };
      toast(result.mailed ? 'Доступ выдан, письмо отправлено' : 'Доступ выдан');
      await reload();
      return;
    }
    if (form.dataset.form === 'add-student-note') {
      const id = Number(form.dataset.id);
      await api(`/api/students/${id}/notes`, { method: 'POST', body: { body: data.body } });
      toast('Заметка сохранена');
      await reload();
      return;
    }
    if (form.dataset.form === 'save-teacher-groups') {
      const id = Number(form.dataset.id);
      const groupIds = [...form.querySelectorAll('input[name="groupIds"]:checked')].map((el) => Number(el.value));
      await api(`/api/teachers/${id}/groups`, { method: 'PUT', body: { groupIds } });
      toast('Группы сохранены');
      await reload();
      return;
    }
    if (form.dataset.form === 'save-teacher') {
      const body = {
        fullName: data.fullName,
        shortName: data.shortName || '',
        email: data.email || '',
      };
      if (data.id) {
        await api(`/api/teachers/${data.id}`, { method: 'PATCH', body });
        toast('Педагог сохранён');
        closeModal();
        await go(`#/teachers/${data.id}`);
      } else {
        const created = await api('/api/teachers', { method: 'POST', body });
        const pairs = created.scheduleCount || 0;
        const groups = (created.groups || []).length;
        toast(pairs ? `Добавлен · ${pairs} пар · ${groups} групп` : 'Педагог добавлен · пары в расписании не найдены');
        closeModal();
        await go(`#/teachers/${created.id}`);
      }
      return;
    }
    if (form.dataset.form === 'save-user') {
      const groups = [...form.querySelectorAll('input[name="groupIds"]:checked')].map((el) => {
        const groupId = Number(el.value);
        const roleSelect = form.querySelector(`select[name="groupRole-${groupId}"]`);
        return {
          groupId,
          groupRole: roleSelect?.value
            || (data.role === 'elder' ? 'elder' : data.role === 'student' ? 'student' : 'teacher'),
        };
      });
      const permissions = data.role === 'admin'
        ? undefined
        : [...form.querySelectorAll('input[name="permissions"]:checked')].map((el) => el.value);
      const body = {
        username: data.username,
        email: data.email || '',
        displayName: data.displayName || '',
        role: data.role,
        groups,
        permissions,
        active: form.querySelector('input[name="active"]')
          ? !!form.querySelector('input[name="active"]').checked
          : true,
      };
      if (data.password) body.password = data.password;
      if (data.id) await api(`/api/users/${data.id}`, { method: 'PATCH', body });
      else {
        if (!data.password) throw new Error('Укажите пароль');
        await api('/api/users', { method: 'POST', body });
      }
      toast(data.id ? 'Пользователь сохранён' : 'Пользователь создан');
      closeModal();
      await go('#/users');
      return;
    }
    if (form.dataset.form === 'save-group') {
      const schedule = readGroupScheduleFields(form, data);
      if (data.id) {
        const body = {
          name: data.name,
          scheduleCode: schedule.scheduleCode,
          scheduleUrl: schedule.scheduleUrl,
          scheduleAliases: schedule.scheduleAliases,
        };
        if (Object.prototype.hasOwnProperty.call(data, 'elderUserId')) {
          body.elderUserId = data.elderUserId === '' ? null : Number(data.elderUserId);
        }
        if (form.querySelector('select[name="archived"]')) {
          body.archived = data.archived === '1' || data.archived === 1;
        }
        if (form.querySelector('input[name="studyStartYear"]')) {
          body.studyStartYear = data.studyStartYear === '' ? null : Number(data.studyStartYear);
          body.studyEndYear = data.studyEndYear === '' ? null : Number(data.studyEndYear);
        }
        if (form.querySelector('select[name="course"]') && data.course !== '') {
          body.course = Number(data.course);
          body.renameToCourse = !!form.querySelector('input[name="renameToCourse"]')?.checked;
        }
        await api(`/api/groups/${data.id}`, { method: 'PATCH', body });
        if (can('settings.manage') && form.querySelector('input[name="telegramChatId"]')) {
          const chatId = String(data.telegramChatId || '').trim();
          const topicRaw = String(data.telegramTopicId || '').trim();
          const settings = S.settings || {};
          const bindings = [...(settings.telegramBindings || [])]
            .filter((b) => Number(b.groupId) !== Number(data.id));
          if (chatId || topicRaw) {
            bindings.push({
              groupId: Number(data.id),
              chatId: chatId || settings.telegramChatId || '',
              topicId: topicRaw ? Number(topicRaw) : null,
            });
          }
          S.settings = await api('/api/settings', {
            method: 'PUT',
            body: { telegramBindings: bindings },
          });
          if (S.me) S.me.settings = S.settings;
        }
      } else {
        await api('/api/groups', {
          method: 'POST',
          body: {
            name: data.name,
            scheduleCode: schedule.scheduleCode,
            scheduleUrl: schedule.scheduleUrl,
            scheduleAliases: schedule.scheduleAliases,
          },
        });
      }
      toast(data.id ? 'Группа сохранена' : 'Группа создана');
    } else if (form.dataset.form === 'save-schedule-entry') {
      const body = {
        groupId: Number(data.groupId),
        weekType: data.weekType,
        weekday: Number(data.weekday),
        pairNum: Number(data.pairNum),
        timeStart: data.timeStart || '',
        timeEnd: data.timeEnd || '',
        subjectName: data.subjectName,
        lessonKind: data.lessonKind || '',
        teacher: data.teacher || '',
        room: data.room || '',
        locked: !!form.querySelector('input[name="locked"]')?.checked,
      };
      if (data.id) await api(`/api/schedule/entries/${data.id}`, { method: 'PATCH', body });
      else await api('/api/schedule/entries', { method: 'POST', body });
      toast(data.id ? 'Пара сохранена' : 'Пара добавлена');
    } else if (form.dataset.form === 'save-schedule-day') {
      const cards = [...form.querySelectorAll('[data-pair-card]')];
      const pairs = cards.map((card) => ({
        pairNum: Number(card.querySelector('input[name="pairNum"]')?.value || 0),
        subjectName: card.querySelector('input[name="subjectName"]')?.value || '',
        lessonKind: card.querySelector('input[name="lessonKind"]')?.value || '',
        teacher: card.querySelector('input[name="teacher"]')?.value || '',
        room: card.querySelector('input[name="room"]')?.value || '',
        timeStart: card.querySelector('input[name="timeStart"]')?.value || '',
        timeEnd: card.querySelector('input[name="timeEnd"]')?.value || '',
        locked: !!card.querySelector('input[name="locked"]')?.checked,
      }));
      const result = await api('/api/schedule/day', {
        method: 'PUT',
        body: {
          groupId: Number(form.dataset.group),
          weekType: form.dataset.week || 'upper',
          weekday: Number(form.dataset.weekday),
          pairs,
        },
      });
      toast(`День сохранён: ${result.saved} пар${result.removed ? `, убрано ${result.removed}` : ''}`);
      await reload();
      return;
    } else if (form.dataset.form === 'save-student') {
      const body = { fullName: data.fullName, groupId: Number(data.groupId) };
      if (data.id) await api(`/api/students/${data.id}`, { method: 'PATCH', body });
      else await api('/api/students', { method: 'POST', body });
      toast(data.id ? 'Ученик сохранён' : 'Ученик добавлен');
    } else if (form.dataset.form === 'save-subject') {
      if (data.id) {
        await api(`/api/subjects/${data.id}`, { method: 'PATCH', body: { name: data.name } });
        toast('Предмет сохранён');
      } else {
        const groupIds = [...form.querySelectorAll('input[name="groupIds"]:checked')].map((el) => Number(el.value));
        if (!groupIds.length) {
          toast('Выберите хотя бы одну группу');
          form.dataset.busy = '';
          if (submit) { submit.disabled = false; }
          return;
        }
        const result = await api('/api/subjects', {
          method: 'POST',
          body: { name: data.name, groupIds },
        });
        const created = result.created || groupIds.length;
        const skipped = result.skipped || 0;
        toast(skipped
          ? `Добавлено в ${created} · уже было: ${skipped}`
          : (created > 1 ? `Предмет добавлен в ${created} групп` : 'Предмет добавлен'));
        closeModal();
        if (created > 1 && result.name) {
          await go(`#/subjects/hub/${encodeURIComponent(normalizeSubjectKey(result.name))}`);
          return;
        }
        await reload();
        return;
      }
    } else if (form.dataset.form === 'save-lesson') {
      const body = { date: data.date, topic: data.topic };
      if (data.id) await api(`/api/lessons/${data.id}`, { method: 'PATCH', body });
      else await api(`/api/subjects/${S.route.subjectId}/lessons`, { method: 'POST', body });
      toast(data.id ? 'Занятие сохранено' : 'Занятие добавлено в план');
    } else if (form.dataset.form === 'save-credit') {
      const body = { title: data.title, date: data.date, kind: data.kind };
      if (data.id) await api(`/api/credits/${data.id}`, { method: 'PATCH', body });
      else await api(`/api/subjects/${S.route.subjectId}/credits`, { method: 'POST', body });
      toast(data.id ? 'Сохранено' : 'Добавлено в план зачётов');
    } else if (form.dataset.form === 'save-work') {
      const body = { title: data.title, date: data.date };
      if (data.id) await api(`/api/works/${data.id}`, { method: 'PATCH', body });
      else await api(`/api/subjects/${S.route.subjectId}/works`, { method: 'POST', body });
      toast(data.id ? 'Колонка сохранена' : 'Колонка добавлена');
    }
    closeModal();
    await reload();
  } catch (error) {
    const message = error.message || 'Ошибка';
    toast(message);
    const errBox = form.querySelector('#login-error');
    if (errBox) {
      errBox.hidden = false;
      errBox.textContent = message;
    }
    form.dataset.busy = '';
    if (submit) {
      submit.disabled = false;
      if (form.dataset.form === 'login') submit.textContent = 'Войти';
    }
  }
}

function report(error) {
  if (error?.status === 401) {
    localStorage.removeItem('journal_token');
    S.token = '';
    S.me = null;
    boot();
    return;
  }
  toast(error?.message || 'Ошибка');
}

document.addEventListener('pointerdown', (event) => {
  const markBtn = event.target.closest('[data-act="pair-mark"], [data-act="mark"], [data-act="result"]');
  if (markBtn) event.preventDefault();
}, { passive: false });

document.addEventListener('click', (event) => {
  if (event.target.classList?.contains('backdrop')) {
    actions['close-modal']();
    return;
  }
  const el = event.target.closest('[data-act]');
  if (!el) return;
  const action = actions[el.dataset.act];
  if (!action) return;
  event.preventDefault();
  Promise.resolve(action(el)).catch(report);
});

document.addEventListener('submit', (event) => {
  onSubmit(event).catch(report);
});

const commentTimers = new WeakMap();

async function saveCommentInput(el) {
  const comment = String(el.value || '').trim();
  if (el.dataset.actInput === 'pair-comment') {
    const data = await api('/api/calendar/pair-attendance', {
      method: 'PUT',
      body: {
        groupId: Number(el.dataset.group),
        date: el.dataset.date,
        scheduleEntryId: Number(el.dataset.entry),
        studentId: Number(el.dataset.student),
        status: el.closest('.person')?.querySelector('.seg button.on')?.dataset.status || null,
        comment,
      },
    });
    S.calendarDay = data.day;
    S.activePairId = Number(el.dataset.entry);
    S.pairModalOpen = true;
    const note = el.closest('.person')?.querySelector('.person-note');
    if (note) note.textContent = comment;
    else if (comment) {
      const name = el.closest('.person')?.querySelector('.person-name');
      if (name && !name.querySelector('.person-note')) {
        const span = document.createElement('span');
        span.className = 'person-note';
        span.textContent = comment;
        name.appendChild(span);
      }
    }
    return;
  }
  if (el.dataset.actInput === 'lesson-comment') {
    const status = el.closest('.person')?.querySelector('.seg button.on')?.dataset.status || null;
    await api(`/api/lessons/${el.dataset.lesson}/attendance`, {
      method: 'PUT',
      body: {
        studentId: Number(el.dataset.student),
        status,
        comment,
      },
    });
  }
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target?.id === 'audit-q') {
    event.preventDefault();
    Promise.resolve(actions['audit-search']()).catch(report);
  }
}, true);

document.addEventListener('input', (event) => {
  if (event.target.id === 'q') {
    S.q = event.target.value;
    applySearchVisibility();
    return;
  }
  const el = event.target.closest('[data-act-input]');
  if (!el) return;
  clearTimeout(commentTimers.get(el));
  commentTimers.set(el, setTimeout(() => {
    saveCommentInput(el).catch(report);
  }, 450));
});

document.addEventListener('change', (event) => {
  const excelToggle = event.target.closest('input[name="excelEnabled"][data-act-change="toggle-excel-settings"]');
  if (excelToggle) {
    const block = excelToggle.closest('form')?.querySelector('.excel-settings-block');
    if (block) block.hidden = !excelToggle.checked;
    return;
  }
  const tgMulti = event.target.closest('input[name="telegramMultiMode"][data-act-change="toggle-telegram-multi"]');
  if (tgMulti) {
    const block = tgMulti.closest('form')?.querySelector('.telegram-bindings-block');
    if (block) block.hidden = !tgMulti.checked;
    return;
  }
  const studentPhoto = event.target.closest('input[data-act-change="upload-student-photo"]');
  if (studentPhoto?.files?.[0]) {
    const id = Number(studentPhoto.dataset.id);
    const file = studentPhoto.files[0];
    fileToDataUrl(file).then((photo) => api(`/api/students/${id}/photo`, { method: 'POST', body: { photo } }))
      .then(() => { toast('Фото сохранено'); return reload(); })
      .catch(report);
    studentPhoto.value = '';
    return;
  }
  const teacherPhoto = event.target.closest('input[data-act-change="upload-teacher-photo"]');
  if (teacherPhoto?.files?.[0]) {
    const id = Number(teacherPhoto.dataset.id);
    const file = teacherPhoto.files[0];
    fileToDataUrl(file).then((photo) => api(`/api/teachers/${id}/photo`, { method: 'POST', body: { photo } }))
      .then(() => { toast('Фото сохранено'); return reload(); })
      .catch(report);
    teacherPhoto.value = '';
    return;
  }
  const roleSelect = event.target.closest('select[name="role"][data-act-change="role-defaults"]');
  if (roleSelect) {
    const form = roleSelect.closest('form[data-form="save-user"]');
    if (form) {
      let defaults = {};
      try { defaults = JSON.parse(form.dataset.roleDefaults || '{}'); } catch { defaults = {}; }
      const next = new Set(defaults[roleSelect.value] || []);
      for (const box of form.querySelectorAll('input[name="permissions"]')) {
        box.checked = roleSelect.value === 'admin' ? true : next.has(box.value);
        box.disabled = roleSelect.value === 'admin';
      }
      const groupsBlock = form.querySelector('.field .check-list');
      if (groupsBlock) groupsBlock.style.opacity = roleSelect.value === 'admin' ? '0.45' : '1';
      const fallbackRole = roleSelect.value === 'elder'
        ? 'elder'
        : roleSelect.value === 'student'
          ? 'student'
          : 'teacher';
      for (const select of form.querySelectorAll('select[name^="groupRole-"]')) {
        if (roleSelect.value === 'elder' || roleSelect.value === 'student') select.value = fallbackRole;
      }
    }
    return;
  }
  const el = event.target.closest('[data-act-input]');
  if (!el) return;
  clearTimeout(commentTimers.get(el));
  saveCommentInput(el).catch(report);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (S.pairCopyConfirm) {
      actions['pair-copy-cancel']();
      return;
    }
    if (S.pairConfirm) {
      actions['pair-fill-cancel']();
      return;
    }
    actions['close-modal']();
    return;
  }
  if (!S.pairModalOpen) return;
  const tag = event.target?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target?.isContentEditable) return;
  const map = {
    1: 'present', 2: 'late', 3: 'excused', 4: 'absent',
    Digit1: 'present', Digit2: 'late', Digit3: 'excused', Digit4: 'absent',
  };
  if ((event.key === 'z' || event.key === 'Z' || event.key === 'я' || event.key === 'Я') && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    Promise.resolve(actions['undo-pair-mark']()).catch(report);
    return;
  }
  const status = map[event.key] || map[event.code];
  if (!status) return;
  const focus = document.querySelector('.pair-modal-people .person.mark-focus:not([hidden])')
    || document.querySelector('.pair-modal-people .person:not([hidden])');
  const btn = focus?.querySelector(`.seg button[data-status="${status}"]`);
  if (!btn) return;
  event.preventDefault();
  Promise.resolve(actions['pair-mark'](btn)).catch(report);
});

window.addEventListener('hashchange', () => { boot().catch(report); });

window.JournalScheduleHost = {
  api,
  toast,
  esc,
  closeModal,
  openModalHtml(html, opts = {}) {
    const wide = opts.wide
      || /pc-wizard|pc-modal|modal-wide|pair-modal/.test(String(html));
    openModal(`<div class="backdrop"><div class="sheet${wide ? ' sheet-wide sheet-parser' : ''}">${html}</div></div>`);
  },
  afterSave() {
    reload().catch(report);
  },
};

boot().catch(report);
