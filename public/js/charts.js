'use strict';

window.JournalCharts = (() => {
  const LEVEL = {
    excellent: { label: 'Отлично', hint: 'высокая посещаемость' },
    good: { label: 'Хорошо', hint: 'стабильно' },
    warn: { label: 'Внимание', hint: 'есть пропуски' },
    bad: { label: 'Плохо', hint: 'много пропусков' },
    empty: { label: 'Нет данных', hint: 'ещё нет отметок' },
  };

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }

  function levelMeta(level) {
    return LEVEL[level] || LEVEL.empty;
  }

  function fmtPct(rate) {
    if (rate == null) return '—';
    return `${String(rate).replace('.', ',')}%`;
  }

  function donut({ present = 0, late = 0, absent = 0, excused = 0, unmarked = 0, size = 148 }) {
    const parts = [
      { key: 'present', value: present, color: '#1a6846' },
      { key: 'late', value: late, color: '#a86b24' },
      { key: 'excused', value: excused, color: '#2f6f9a' },
      { key: 'absent', value: absent, color: '#a33b32' },
      { key: 'unmarked', value: unmarked, color: '#d7cbb8' },
    ];
    const total = parts.reduce((sum, part) => sum + part.value, 0);
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.36;
    const stroke = size * 0.14;
    if (!total) {
      return `<svg class="donut" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e8dfd0" stroke-width="${stroke}"/>
        <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" class="donut-center">—</text>
      </svg>`;
    }
    const c = 2 * Math.PI * r;
    let offset = 0;
    const arcs = parts.filter((part) => part.value > 0).map((part) => {
      const len = (part.value / total) * c;
      const node = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${part.color}" stroke-width="${stroke}"
        stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-offset}" stroke-linecap="butt"
        transform="rotate(-90 ${cx} ${cy})"/>`;
      offset += len;
      return node;
    }).join('');
    const attended = present + late;
    const pct = Math.round((attended / total) * 1000) / 10;
    return `<svg class="donut" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
      ${arcs}
      <text x="${cx}" y="${cy - 8}" text-anchor="middle" class="donut-center">${esc(String(pct).replace('.', ','))}%</text>
      <text x="${cx}" y="${cy + 14}" text-anchor="middle" class="donut-sub">явка</text>
    </svg>`;
  }

  function meter(rate, level) {
    const width = rate == null ? 0 : Math.max(0, Math.min(100, rate));
    return `<div class="meter" role="img" aria-label="Посещаемость ${fmtPct(rate)}">
      <div class="meter-track"><div class="meter-fill level-${esc(level)}" style="width:${width}%"></div></div>
      <strong class="meter-value level-text-${esc(level)}">${esc(fmtPct(rate))}</strong>
    </div>`;
  }

  function sparkline(history = []) {
    const items = history.slice(-24);
    if (!items.length) return '<div class="spark empty-spark">Нет занятий</div>';
    const dots = items.map((item) => {
      const cls = item.status || 'none';
      const title = item.date + (item.subjectName ? ` · ${item.subjectName}` : '');
      return `<span class="spark-dot ${cls}" title="${esc(title)}"></span>`;
    }).join('');
    return `<div class="spark" aria-hidden="true">${dots}</div>`;
  }

  function legend() {
    return `<div class="legend">
      <span><i class="swatch present"></i>Был</span>
      <span><i class="swatch late"></i>Опоздал</span>
      <span><i class="swatch excused"></i>Уваж.</span>
      <span><i class="swatch absent"></i>Не был</span>
      <span><i class="swatch unmarked"></i>Не отмечен</span>
    </div>`;
  }

  function levelBadge(level) {
    const meta = levelMeta(level);
    return `<span class="level-badge level-${esc(level)}">${esc(meta.label)}</span>`;
  }

  function stackBars(students) {
    if (!students.length) return '';
    const max = Math.max(...students.map((row) => row.total || 0), 1);
    return `<div class="stack-bars">${students.map((row) => {
      const p = ((row.present || 0) / max) * 100;
      const l = ((row.late || 0) / max) * 100;
      const a = ((row.absent || 0) / max) * 100;
      const u = ((row.unmarked || 0) / max) * 100;
      return `<a class="stack-row" href="#/stats/student/${row.id}">
        <div class="stack-name">${esc(row.fullName)}</div>
        <div class="stack-track">
          <span style="width:${p}%" class="present"></span>
          <span style="width:${l}%" class="late"></span>
          <span style="width:${a}%" class="absent"></span>
          <span style="width:${u}%" class="unmarked"></span>
        </div>
        <div class="stack-pct level-text-${esc(row.level)}">${esc(fmtPct(row.rate))}</div>
      </a>`;
    }).join('')}</div>`;
  }

  return { levelMeta, fmtPct, donut, meter, sparkline, legend, levelBadge, stackBars };
})();
