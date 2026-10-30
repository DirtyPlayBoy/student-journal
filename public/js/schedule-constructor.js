/**
 * Visual schedule parser constructor (wizard + Excel grid).
 * Expects host app to provide: api(), toast(), esc(), closeModal(), openModalHtml(), render(), S
 */
(function (global) {
  const WEEKDAY_LABELS = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  const WEEKDAY_FULL = WEEKDAY_LABELS;
  const FIELD_ROLES = [
    { id: 'subjectName', label: 'Название предмета' },
    { id: 'lessonData', label: 'Данные о занятии' },
    { id: 'teacher', label: 'Преподаватель' },
    { id: 'room', label: 'Аудитория' },
    { id: 'pairNum', label: 'Номер пары' },
    { id: 'time', label: 'Время занятия' },
    { id: 'groupName', label: 'Название группы' },
    { id: 'date', label: 'Дата' },
    { id: 'weekday', label: 'День недели' },
  ];

  const state = {
    groupId: null,
    step: 1,
    sourceId: null,
    preview: null,
    plan: null,
    config: null,
    activeWeekIndex: 0,
    activeWeekday: 1,
    zoom: 1,
    selectedA1: null,
    sheetName: '',
    draftResult: null,
  };

  function host() {
    return global.JournalScheduleHost || {};
  }

  function esc(v) {
    return host().esc ? host().esc(v) : String(v ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  async function api(path, opts) {
    return host().api(path, opts);
  }

  function toast(msg, type) {
    if (host().toast) host().toast(msg, type);
  }

  function emptyConfig(plan) {
    const weeks = (plan?.weeks || [{ weekIndex: 0, label: 'Неделя 1', legacyCode: 'w0' }]).map((w) => ({
      weekIndex: w.weekIndex,
      label: w.label,
      legacyCode: w.legacyCode,
      sheet: '',
      days: {},
    }));
    return {
      version: 1,
      groupCode: '',
      groupId: state.groupId,
      sheet: '',
      separators: [
        { id: 'teacher', field: 'teacher', type: 'start_marker', markers: ['преподаватель', 'преп.', 'преп:', 'преп'], untilMarkers: ['аудитория', 'ауд.', 'ауд:', 'ауд', 'кабинет', 'каб.', 'каб', 'стадион', 'н/к'] },
        { id: 'room', field: 'room', type: 'start_marker', markers: ['аудитория', 'ауд.', 'ауд:', 'ауд', 'кабинет', 'каб.', 'каб'], untilMarkers: ['преподаватель', 'преп.', 'преп:', 'преп'] },
        { id: 'kind', field: 'lessonKind', type: 'between_markers', start: '(', end: ')' },
        { id: 'subject', field: 'subjectName', type: 'remainder' },
      ],
      timeGrid: [
        { pairNum: 1, timeStart: '09:00', timeEnd: '10:30' },
        { pairNum: 2, timeStart: '10:40', timeEnd: '12:10' },
        { pairNum: 3, timeStart: '12:20', timeEnd: '13:50' },
        { pairNum: 4, timeStart: '14:00', timeEnd: '15:30' },
        { pairNum: 5, timeStart: '15:40', timeEnd: '17:10' },
      ],
      timePriority: 'manual',
      weeks,
    };
  }

  function currentSheet() {
    const sheets = state.preview?.workbook?.sheets || [];
    if (!sheets.length) return null;
    return sheets.find((s) => s.name === state.sheetName) || sheets[0];
  }

  function currentWeekConfig() {
    if (!state.config) return null;
    return state.config.weeks.find((w) => w.weekIndex === state.activeWeekIndex) || state.config.weeks[0];
  }

  function ensureDay(week, weekday) {
    if (!week.days) week.days = {};
    const key = String(weekday);
    if (!week.days[key]) {
      week.days[key] = { mode: 'manual', cells: [] };
    }
    return week.days[key];
  }

  function roleColor(a1) {
    const week = currentWeekConfig();
    if (!week) return '';
    for (const [day, mapping] of Object.entries(week.days || {})) {
      if (mapping.dayHeaderCell === a1) return 'role-weekday';
      if ((mapping.cells || []).some((c) => (typeof c === 'string' ? c : c.a1) === a1)) return 'role-subject';
      if (mapping.range && a1InRange(a1, mapping.range)) return 'role-subject';
    }
    return '';
  }

  function a1InRange(a1, range) {
    // lightweight check: exact start/end only for coloring
    return String(range || '').toUpperCase().includes(String(a1 || '').toUpperCase());
  }

  function gridHtml() {
    const sheet = currentSheet();
    if (!sheet) return '<p class="muted">Загрузите Excel, чтобы увидеть таблицу.</p>';
    const zoom = state.zoom;
    const head = [`<th class="pc-corner"></th>`]
      .concat(Array.from({ length: sheet.colCount }, (_, c) => {
        const letter = colLetter(c);
        return `<th>${letter}</th>`;
      })).join('');
    const body = sheet.rows.map((row, r) => {
      const cells = row.map((value, c) => {
        const a1 = `${colLetter(c)}${r + 1}`;
        const role = roleColor(a1);
        const on = state.selectedA1 === a1 ? ' selected' : '';
        return `<td class="pc-cell${on} ${role}" data-a1="${a1}" title="${esc(a1)}">${esc(value)}</td>`;
      }).join('');
      return `<tr><th>${r + 1}</th>${cells}</tr>`;
    }).join('');
    return `<div class="pc-grid-wrap" style="--pc-zoom:${zoom}">
      <table class="pc-grid"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
    </div>`;
  }

  function colLetter(col) {
    let n = col + 1;
    let s = '';
    while (n > 0) {
      const r = (n - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s || 'A';
  }

  function stepsNav() {
    const labels = ['Источник', 'Структура', 'Дни', 'Разделители', 'Время', 'Проверка'];
    const pct = Math.round(((state.step - 1) / (labels.length - 1)) * 100);
    return `<div class="pc-steps-wrap">
      <div class="pc-progress" aria-hidden="true"><span style="width:${pct}%"></span></div>
      <div class="pc-steps" role="tablist">${labels.map((label, i) => {
        const n = i + 1;
        return `<button type="button" role="tab" class="pc-step${state.step === n ? ' on' : ''}${state.step > n ? ' done' : ''}" data-pc-step="${n}" aria-selected="${state.step === n}">
          <em>${n}</em><span>${label}</span>
        </button>`;
      }).join('')}</div>
    </div>`;
  }

  function stepSourceHtml() {
    const sheets = state.preview?.workbook?.sheetNames || [];
    const name = state.preview?.source?.originalName || state.preview?.source?.url || '';
    return `<div class="pc-pane">
      <div class="pc-pane-head">
        <h3>Источник Excel</h3>
        <p class="muted">Загрузите файл или укажите ссылку на Google Sheets — ниже появится таблица.</p>
      </div>
      <div class="pc-source-grid">
        <label class="file-drop" data-pc-drop>
          <input type="file" accept=".xlsx,.xls" data-pc="file" hidden>
          <strong>Файл .xlsx / .xls</strong>
          <span>Перетащите сюда или нажмите, чтобы выбрать</span>
        </label>
        <div class="pc-link-card">
          <strong>Ссылка</strong>
          <div class="pc-link-row">
            <input type="url" data-pc="url" placeholder="Google Sheets или прямая ссылка на .xlsx" value="">
            <button type="button" class="btn btn-primary" data-pc-act="probe-url">Подключить</button>
          </div>
        </div>
      </div>
      ${state.sourceId ? `<div class="pc-source-ok">
        <span class="ok-dot"></span>
        <div>
          <strong>Источник подключён</strong>
          <p class="muted tight">${esc(name || `#${state.sourceId}`)}</p>
        </div>
      </div>` : '<p class="muted pc-source-hint">Пока нет источника — загрузите Excel, чтобы увидеть сетку.</p>'}
      ${sheets.length ? `<label class="field pc-sheet-field"><span>Лист таблицы</span>
        <select data-pc="sheet">${sheets.map((n) => `<option value="${esc(n)}"${n === state.sheetName ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>
      </label>` : ''}
      ${state.preview ? `<div class="pc-grid-toolbar">
        <span class="muted">Клик по ячейке — выбрать для шага «Дни»</span>
        <div class="pc-zoom">
          <button type="button" class="btn btn-ghost btn-small" data-pc-act="zoom-out">−</button>
          <button type="button" class="btn btn-ghost btn-small" data-pc-act="zoom-in">+</button>
        </div>
      </div>` : ''}
      ${gridHtml()}
    </div>`;
  }

  function stepStructureHtml() {
    const plan = state.plan;
    if (!plan) return '<p class="muted">Нет плана группы</p>';
    return `<div class="pc-pane">
      <h3>Структура расписания</h3>
      <label>Тип
        <select data-pc="mode">
          <option value="same"${plan.mode === 'same' ? ' selected' : ''}>Каждую неделю одинаковое</option>
          <option value="cycle"${plan.mode === 'cycle' ? ' selected' : ''}>Повторяющийся цикл</option>
          <option value="calendar_weeks"${plan.mode === 'calendar_weeks' ? ' selected' : ''}>Отдельные календарные недели</option>
          <option value="combined"${plan.mode === 'combined' ? ' selected' : ''}>Комбинированный</option>
        </select>
      </label>
      <label>Недель в цикле
        <input type="number" min="1" max="52" data-pc="cycleLength" value="${plan.cycleLength || 1}">
      </label>
      <label>Контрольная дата
        <input type="date" data-pc="anchorDate" value="${esc(plan.anchorDate || '')}">
      </label>
      <label>Номер недели на контрольную дату (с 0)
        <input type="number" min="0" data-pc="anchorWeekIndex" value="${plan.anchorWeekIndex || 0}">
      </label>
      <div class="section-head"><h4>Недели</h4>
        <button type="button" class="btn btn-ghost btn-small" data-pc-act="add-week">+ Неделя</button>
      </div>
      <div class="pc-weeks-edit">${(plan.weeks || []).map((w) => `
        <div class="pc-week-edit" data-week-id="${w.id}">
          <input data-pc-week-label="${w.weekIndex}" value="${esc(w.label)}">
          <span class="muted">#${w.weekIndex}</span>
          ${plan.mode === 'calendar_weeks' || plan.mode === 'combined' ? `
            <input type="date" data-pc-week-from="${w.weekIndex}" value="${esc(w.dateFrom || '')}" title="С">
            <input type="date" data-pc-week-to="${w.weekIndex}" value="${esc(w.dateTo || '')}" title="По">
          ` : ''}
        </div>`).join('')}</div>
      <button type="button" class="btn btn-primary" data-pc-act="save-plan">Сохранить структуру</button>
    </div>`;
  }

  function stepDaysHtml() {
    const plan = state.plan;
    const week = currentWeekConfig();
    const day = ensureDay(week, state.activeWeekday);
    const cells = (day.cells || []).map((c, i) => {
      const a1 = typeof c === 'string' ? c : c.a1;
      const pair = typeof c === 'object' ? (c.pairNum || i + 1) : i + 1;
      return `<tr>
        <td>${pair}</td>
        <td><code>${esc(a1)}</code></td>
        <td><button type="button" class="btn btn-ghost btn-small" data-pc-act="rm-cell" data-i="${i}">✕</button></td>
      </tr>`;
    }).join('');
    return `<div class="pc-pane pc-split">
      <div>
        <div class="chips">${(plan?.weeks || []).map((w) => `
          <button type="button" class="chip${state.activeWeekIndex === w.weekIndex ? ' on' : ''}" data-pc-week="${w.weekIndex}">${esc(w.label)}</button>
        `).join('')}
          <button type="button" class="chip" data-pc-act="add-week">+</button>
        </div>
        <div class="chips">${[1, 2, 3, 4, 5, 6, 7].map((d) => `
          <button type="button" class="chip${state.activeWeekday === d ? ' on' : ''}" data-pc-day="${d}">${WEEKDAY_LABELS[d]}</button>
        `).join('')}</div>
        <p class="muted">${esc(week?.label || '')} · ${WEEKDAY_FULL[state.activeWeekday]}</p>
        <label>Режим
          <select data-pc="day-mode">
            <option value="manual"${day.mode === 'manual' ? ' selected' : ''}>Ручной (ячейки)</option>
            <option value="range"${day.mode === 'range' ? ' selected' : ''}>Диапазон</option>
            <option value="by_day_header"${day.mode === 'by_day_header' ? ' selected' : ''}>По заголовку дня</option>
          </select>
        </label>
        ${day.mode === 'range' ? `<label>Диапазон <input data-pc="day-range" value="${esc(day.range || '')}" placeholder="C3:C7"></label>` : ''}
        ${day.mode === 'by_day_header' ? `
          <label>Столбец дня <input type="number" data-pc="day-col" value="${day.dayCol ?? 0}"></label>
          <label>Столбец пар <input type="number" data-pc="pair-col" value="${day.pairCol ?? 1}"></label>
          <label>Столбец дисциплин <input type="number" data-pc="disc-col" value="${day.discCol ?? 2}"></label>
        ` : ''}
        <label>Лист недели <input data-pc="week-sheet" value="${esc(week?.sheet || state.sheetName || '')}"></label>
        <div class="editor-actions">
          <button type="button" class="btn btn-primary btn-small" data-pc-act="use-selected">Использовать выбранную ячейку</button>
          <button type="button" class="btn btn-ghost btn-small" data-pc-act="copy-day">Копировать день →</button>
          <button type="button" class="btn btn-ghost btn-small" data-pc-act="copy-week-rules">Копировать неделю →</button>
        </div>
        <table class="pc-mini"><thead><tr><th>Пара</th><th>Ячейка</th><th></th></tr></thead><tbody>${cells || '<tr><td colspan="3" class="muted">Выберите ячейки в таблице</td></tr>'}</tbody></table>
        ${state.selectedA1 ? `<div class="pc-cell-actions card pad">
          <div class="kicker">Ячейка ${esc(state.selectedA1)}</div>
          <p class="muted tight">${esc(cellValue(state.selectedA1) || 'пусто')}</p>
          <label>Использовать как
            <select data-pc="role">
              ${FIELD_ROLES.map((r) => `<option value="${r.id}">${r.label}</option>`).join('')}
            </select>
          </label>
          <button type="button" class="btn btn-primary btn-small" data-pc-act="assign-role">Назначить</button>
        </div>` : ''}
      </div>
      <div>${gridHtml()}</div>
    </div>`;
  }

  function cellValue(a1) {
    const sheet = currentSheet();
    if (!sheet) return '';
    const m = String(a1).match(/^([A-Z]+)(\d+)$/i);
    if (!m) return '';
    let col = 0;
    for (const ch of m[1].toUpperCase()) col = col * 26 + (ch.charCodeAt(0) - 64);
    col -= 1;
    const row = Number(m[2]) - 1;
    return sheet.rows?.[row]?.[col] || '';
  }

  function stepSeparatorsHtml() {
    const sample = state.selectedA1 ? cellValue(state.selectedA1) : 'Математика (практ. занятие) преп. Давыдова М.А. ауд. 603';
    const rules = state.config?.separators || [];
    return `<div class="pc-pane">
      <h3>Разделители</h3>
      <p class="muted">Пример ячейки (или выберите в сетке на шаге «Дни»):</p>
      <textarea data-pc="sample" rows="2">${esc(sample)}</textarea>
      <div class="pc-sep-list">${rules.map((r, i) => `
        <div class="pc-sep-row">
          <strong>${esc(r.field)}</strong>
          <span class="muted">${esc(r.type)}</span>
          <code>${esc((r.markers || [r.start, r.end].filter(Boolean)).join(' / ') || r.pattern || 'remainder')}</code>
          <button type="button" class="btn btn-ghost btn-small" data-pc-act="rm-sep" data-i="${i}">✕</button>
        </div>`).join('')}</div>
      <div class="editor-actions">
        <button type="button" class="btn btn-ghost" data-pc-act="add-sep-teacher">+ преп.</button>
        <button type="button" class="btn btn-ghost" data-pc-act="add-sep-room">+ ауд.</button>
        <button type="button" class="btn btn-ghost" data-pc-act="reset-sep">Сбросить к умолчанию</button>
      </div>
      <button type="button" class="btn btn-primary" data-pc-act="test-sep">Проверить на примере</button>
      <pre class="pc-sep-preview" data-pc="sep-preview"></pre>
    </div>`;
  }

  function stepTimeHtml() {
    const grid = state.config?.timeGrid || [];
    return `<div class="pc-pane">
      <h3>Время занятий</h3>
      <label>Приоритет
        <select data-pc="time-priority">
          <option value="manual"${state.config?.timePriority === 'manual' ? ' selected' : ''}>Ручная сетка</option>
          <option value="excel"${state.config?.timePriority === 'excel' ? ' selected' : ''}>Из Excel</option>
        </select>
      </label>
      <table class="pc-mini"><thead><tr><th>Пара</th><th>Начало</th><th>Конец</th><th></th></tr></thead>
      <tbody>${grid.map((t, i) => `
        <tr>
          <td><input type="number" data-pc-time-pair="${i}" value="${t.pairNum}" min="1" style="width:4rem"></td>
          <td><input data-pc-time-start="${i}" value="${esc(t.timeStart)}" style="width:6rem"></td>
          <td><input data-pc-time-end="${i}" value="${esc(t.timeEnd)}" style="width:6rem"></td>
          <td><button type="button" class="btn btn-ghost btn-small" data-pc-act="rm-time" data-i="${i}">✕</button></td>
        </tr>`).join('')}</tbody></table>
      <button type="button" class="btn btn-ghost" data-pc-act="add-time">+ Пара</button>
    </div>`;
  }

  function stepCheckHtml() {
    const result = state.draftResult;
    if (!result) {
      return `<div class="pc-pane">
        <h3>Проверка парсинга</h3>
        <p class="muted">Нажмите «Проверить», чтобы разобрать таблицу по текущим правилам.</p>
        <button type="button" class="btn btn-primary" data-pc-act="run-preview">Проверить парсинг</button>
      </div>`;
    }
    const slots = result.slots || [];
    const byDay = new Map();
    for (const s of slots) {
      const key = `${s.weekLabel || s.weekIndex}|${s.weekday}`;
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key).push(s);
    }
    const blocks = [...byDay.entries()].map(([key, list]) => {
      const first = list[0];
      return `<section class="pc-preview-day">
        <h4>${esc(first.weekLabel || `Неделя ${first.weekIndex}`)} · ${WEEKDAY_FULL[first.weekday] || first.weekday}</h4>
        ${list.sort((a, b) => a.pairNum - b.pairNum).map((s) => `
          <article class="pc-slot ${s.status === 'warn' ? 'warn' : 'ok'}">
            <div class="kicker">${s.pairNum} пара${s.timeStart ? ` · ${esc(s.timeStart)}–${esc(s.timeEnd)}` : ''} · ${esc(s.sourceCell || '')}</div>
            <strong>${esc(s.subjectName)}</strong>
            <div class="muted">${[s.lessonKind && `Тип: ${s.lessonKind}`, s.teacher && `Преп.: ${s.teacher}`, s.room && `Ауд.: ${s.room}`].filter(Boolean).map(esc).join(' · ')}</div>
            <details><summary>Исходный текст</summary><code>${esc(s.rawText)}</code></details>
          </article>`).join('')}
      </section>`;
    }).join('');
    const v = result.validation || {};
    return `<div class="pc-pane">
      <h3>Проверка парсинга</h3>
      <p>${v.counts?.ok || 0} успешно · ${v.warnings?.length || 0} предупр. · ${v.errors?.length || 0} ошибок</p>
      <div class="editor-actions">
        <button type="button" class="btn btn-ghost" data-pc-act="run-preview">Повторить</button>
        <button type="button" class="btn btn-primary" data-pc-act="apply">Сохранить настройки и подключить</button>
      </div>
      ${blocks || '<p class="muted">Нет распознанных занятий. Настройте дни и ячейки.</p>'}
    </div>`;
  }

  function wizardHtml() {
    const body = {
      1: stepSourceHtml,
      2: stepStructureHtml,
      3: stepDaysHtml,
      4: stepSeparatorsHtml,
      5: stepTimeHtml,
      6: stepCheckHtml,
    }[state.step]();
    const nextLabel = state.step === 1 && !state.sourceId ? 'Пропустить' : 'Далее';
    return `<div class="pc-wizard" id="pc-root">
      <header class="pc-head">
        <div>
          <div class="kicker">Конструктор расписания</div>
          <h2>Настройка парсера</h2>
        </div>
        <button type="button" class="icon-btn dark pc-close" data-pc-act="close" aria-label="Закрыть">✕</button>
      </header>
      ${stepsNav()}
      <div class="pc-body">${body}</div>
      <footer class="pc-foot">
        <button type="button" class="btn btn-ghost" data-pc-act="prev" ${state.step <= 1 ? 'disabled' : ''}>Назад</button>
        <div class="pc-foot-right">
          ${state.step === 6
            ? `<button type="button" class="btn btn-primary" data-pc-act="run-preview">${state.draftResult ? 'Проверить снова' : 'Проверить парсинг'}</button>`
            : `<button type="button" class="btn btn-primary" data-pc-act="next">${nextLabel}</button>`}
        </div>
      </footer>
    </div>`;
  }

  function mount(root) {
    root.innerHTML = wizardHtml();
    bind(root);
  }

  function bind(root) {
    root.querySelectorAll('[data-pc-step]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.step = Number(btn.getAttribute('data-pc-step'));
        mount(root);
      });
    });
    root.querySelector('[data-pc-act="close"]')?.addEventListener('click', () => host().closeModal?.());
    root.querySelector('[data-pc-act="prev"]')?.addEventListener('click', () => {
      state.step = Math.max(1, state.step - 1);
      mount(root);
    });
    root.querySelector('[data-pc-act="next"]')?.addEventListener('click', () => {
      syncInputs(root);
      state.step = Math.min(6, state.step + 1);
      mount(root);
    });

    async function uploadFile(file) {
      if (!file) return;
      if (!/\.xlsx?$/i.test(file.name)) {
        toast('Нужен файл .xlsx или .xls', 'error');
        return;
      }
      const b64 = await fileToBase64(file);
      try {
        const res = await api('/api/schedule/sources/upload', {
          method: 'POST',
          body: {
            groupId: state.groupId,
            fileName: file.name,
            fileBase64: b64,
          },
        });
        state.sourceId = res.sourceId;
        state.preview = res.preview;
        state.sheetName = res.preview?.workbook?.sheetNames?.[0] || '';
        toast('Файл загружен');
        mount(root);
      } catch (err) {
        toast(err.message || 'Ошибка загрузки', 'error');
      }
    }

    root.querySelector('[data-pc="file"]')?.addEventListener('change', async (ev) => {
      await uploadFile(ev.target.files?.[0]);
    });

    const drop = root.querySelector('[data-pc-drop]');
    if (drop) {
      ['dragenter', 'dragover'].forEach((name) => {
        drop.addEventListener(name, (ev) => {
          ev.preventDefault();
          drop.classList.add('drag');
        });
      });
      ['dragleave', 'drop'].forEach((name) => {
        drop.addEventListener(name, (ev) => {
          ev.preventDefault();
          drop.classList.remove('drag');
        });
      });
      drop.addEventListener('drop', async (ev) => {
        await uploadFile(ev.dataTransfer?.files?.[0]);
      });
    }

    root.querySelector('[data-pc-act="zoom-in"]')?.addEventListener('click', () => {
      state.zoom = Math.min(1.6, Number((state.zoom + 0.1).toFixed(2)));
      mount(root);
    });
    root.querySelector('[data-pc-act="zoom-out"]')?.addEventListener('click', () => {
      state.zoom = Math.max(0.7, Number((state.zoom - 0.1).toFixed(2)));
      mount(root);
    });

    root.querySelector('[data-pc-act="probe-url"]')?.addEventListener('click', async () => {
      const url = root.querySelector('[data-pc="url"]')?.value?.trim();
      if (!url) return toast('Укажите ссылку', 'error');
      try {
        const res = await api('/api/schedule/sources/link', {
          method: 'POST',
          body: { groupId: state.groupId, url },
        });
        state.sourceId = res.sourceId;
        state.preview = res.preview;
        state.sheetName = res.preview?.workbook?.sheetNames?.[0] || '';
        toast('Источник подключён');
        mount(root);
      } catch (err) {
        toast(err.message || 'Не удалось подключить', 'error');
      }
    });

    root.querySelector('[data-pc="sheet"]')?.addEventListener('change', (ev) => {
      state.sheetName = ev.target.value;
      const week = currentWeekConfig();
      if (week) week.sheet = state.sheetName;
      if (state.config) state.config.sheet = state.sheetName;
      mount(root);
    });

    root.querySelectorAll('.pc-cell').forEach((td) => {
      td.addEventListener('click', () => {
        state.selectedA1 = td.getAttribute('data-a1');
        mount(root);
      });
    });

    root.querySelectorAll('[data-pc-week]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeWeekIndex = Number(btn.getAttribute('data-pc-week'));
        mount(root);
      });
    });
    root.querySelectorAll('[data-pc-day]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeWeekday = Number(btn.getAttribute('data-pc-day'));
        mount(root);
      });
    });

    root.querySelector('[data-pc="day-mode"]')?.addEventListener('change', (ev) => {
      const week = currentWeekConfig();
      const day = ensureDay(week, state.activeWeekday);
      day.mode = ev.target.value;
      mount(root);
    });

    root.querySelector('[data-pc-act="use-selected"]')?.addEventListener('click', () => {
      if (!state.selectedA1) return toast('Выберите ячейку', 'error');
      const week = currentWeekConfig();
      const day = ensureDay(week, state.activeWeekday);
      day.mode = 'manual';
      day.cells = day.cells || [];
      day.cells.push({ a1: state.selectedA1, pairNum: day.cells.length + 1 });
      mount(root);
    });

    root.querySelector('[data-pc-act="assign-role"]')?.addEventListener('click', () => {
      const role = root.querySelector('[data-pc="role"]')?.value;
      const week = currentWeekConfig();
      const day = ensureDay(week, state.activeWeekday);
      if (!state.selectedA1) return;
      if (role === 'weekday' || role === 'date') {
        day.dayHeaderCell = state.selectedA1;
      } else if (role === 'lessonData' || role === 'subjectName') {
        day.mode = 'manual';
        day.cells = day.cells || [];
        day.cells.push({ a1: state.selectedA1, pairNum: day.cells.length + 1 });
      }
      toast(`Назначено: ${role}`);
      mount(root);
    });

    root.querySelectorAll('[data-pc-act="rm-cell"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const week = currentWeekConfig();
        const day = ensureDay(week, state.activeWeekday);
        day.cells.splice(Number(btn.getAttribute('data-i')), 1);
        mount(root);
      });
    });

    root.querySelector('[data-pc-act="save-plan"]')?.addEventListener('click', async () => {
      syncInputs(root);
      try {
        const weeks = (state.plan.weeks || []).map((w) => ({
          weekIndex: w.weekIndex,
          label: root.querySelector(`[data-pc-week-label="${w.weekIndex}"]`)?.value || w.label,
          dateFrom: root.querySelector(`[data-pc-week-from="${w.weekIndex}"]`)?.value || w.dateFrom,
          dateTo: root.querySelector(`[data-pc-week-to="${w.weekIndex}"]`)?.value || w.dateTo,
          legacyCode: w.legacyCode,
        }));
        const body = {
          mode: root.querySelector('[data-pc="mode"]')?.value,
          cycleLength: Number(root.querySelector('[data-pc="cycleLength"]')?.value),
          anchorDate: root.querySelector('[data-pc="anchorDate"]')?.value,
          anchorWeekIndex: Number(root.querySelector('[data-pc="anchorWeekIndex"]')?.value),
          weeks,
        };
        const res = await api(`/api/schedule/plans/${state.groupId}`, {
          method: 'PUT',
          body,
        });
        state.plan = res.plan;
        // sync config weeks labels
        state.config.weeks = (res.plan.weeks || []).map((w) => {
          const prev = state.config.weeks.find((x) => x.weekIndex === w.weekIndex) || {};
          return {
            weekIndex: w.weekIndex,
            label: w.label,
            legacyCode: w.legacyCode,
            sheet: prev.sheet || '',
            days: prev.days || {},
          };
        });
        toast('Структура сохранена');
        mount(root);
      } catch (err) {
        toast(err.message || 'Ошибка', 'error');
      }
    });

    root.querySelector('[data-pc-act="add-week"]')?.addEventListener('click', async () => {
      try {
        const res = await api(`/api/schedule/plans/${state.groupId}/weeks`, {
          method: 'POST',
          body: {},
        });
        state.plan = res.plan;
        state.config.weeks.push({
          weekIndex: res.plan.weeks.length - 1,
          label: res.plan.weeks[res.plan.weeks.length - 1].label,
          legacyCode: res.plan.weeks[res.plan.weeks.length - 1].legacyCode,
          sheet: '',
          days: {},
        });
        mount(root);
      } catch (err) {
        toast(err.message || 'Ошибка', 'error');
      }
    });

    root.querySelector('[data-pc-act="copy-week-rules"]')?.addEventListener('click', async () => {
      const to = Number(prompt('Скопировать правила текущей недели в weekIndex:', String(state.activeWeekIndex + 1)));
      if (!Number.isFinite(to)) return;
      const res = await api('/api/schedule/parser/copy', {
        method: 'POST',
        body: {
          config: state.config,
          fromWeekIndex: state.activeWeekIndex,
          toWeekIndex: to,
          section: 'days',
        },
      });
      state.config = res.config;
      toast('Скопировано');
      mount(root);
    });

    root.querySelector('[data-pc-act="reset-sep"]')?.addEventListener('click', () => {
      state.config.separators = emptyConfig(state.plan).separators;
      mount(root);
    });
    root.querySelector('[data-pc-act="add-sep-teacher"]')?.addEventListener('click', () => {
      state.config.separators.unshift({
        id: `teacher_${Date.now()}`, field: 'teacher', type: 'start_marker',
        markers: ['преподаватель', 'преп.', 'преп:', 'преп'], untilMarkers: ['аудитория', 'ауд.', 'ауд:', 'ауд', 'кабинет', 'каб.', 'каб', 'стадион', 'н/к'],
      });
      mount(root);
    });
    root.querySelector('[data-pc-act="add-sep-room"]')?.addEventListener('click', () => {
      state.config.separators.splice(1, 0, {
        id: `room_${Date.now()}`, field: 'room', type: 'start_marker',
        markers: ['аудитория', 'ауд.', 'ауд:', 'ауд', 'кабинет', 'каб.', 'каб'], untilMarkers: ['преподаватель', 'преп.', 'преп:', 'преп'],
      });
      mount(root);
    });
    root.querySelector('[data-pc-act="test-sep"]')?.addEventListener('click', async () => {
      syncInputs(root);
      const sample = root.querySelector('[data-pc="sample"]')?.value || '';
      // local quick preview via apply with empty days is heavy; show client hint
      const pre = root.querySelector('[data-pc="sep-preview"]');
      if (pre) pre.textContent = `Пример будет разобран на сервере при проверке:\n${sample}`;
    });

    root.querySelector('[data-pc-act="add-time"]')?.addEventListener('click', () => {
      const n = (state.config.timeGrid?.length || 0) + 1;
      state.config.timeGrid.push({ pairNum: n, timeStart: '00:00', timeEnd: '00:00' });
      mount(root);
    });
    root.querySelectorAll('[data-pc-act="rm-time"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.config.timeGrid.splice(Number(btn.getAttribute('data-i')), 1);
        mount(root);
      });
    });

    root.querySelector('[data-pc-act="run-preview"]')?.addEventListener('click', async () => {
      syncInputs(root);
      if (!state.sourceId) return toast('Сначала загрузите Excel', 'error');
      try {
        const res = await api('/api/schedule/parser/preview', {
          method: 'POST',
          body: {
            groupId: state.groupId,
            sourceId: state.sourceId,
            config: {
              ...state.config,
              groupId: state.groupId,
              sheet: state.sheetName,
            },
          },
        });
        state.draftResult = res;
        state.step = 6;
        toast(`Распознано: ${res.slots?.length || 0}`);
        mount(root);
      } catch (err) {
        toast(err.message || 'Ошибка проверки', 'error');
      }
    });

    root.querySelector('[data-pc-act="apply"]')?.addEventListener('click', async () => {
      syncInputs(root);
      try {
        await api('/api/schedule/parser/apply', {
          method: 'POST',
          body: {
            groupId: state.groupId,
            sourceId: state.sourceId,
            config: { ...state.config, groupId: state.groupId, sheet: state.sheetName },
            force: true,
            name: 'constructor',
          },
        });
        toast('Расписание подключено');
        host().closeModal?.();
        host().afterSave?.();
      } catch (err) {
        toast(err.message || 'Ошибка сохранения', 'error');
      }
    });

    // range / day fields
    const rangeInput = root.querySelector('[data-pc="day-range"]');
    if (rangeInput) {
      rangeInput.addEventListener('change', () => {
        const week = currentWeekConfig();
        const day = ensureDay(week, state.activeWeekday);
        day.range = rangeInput.value.trim().toUpperCase();
        day.mode = 'range';
      });
    }
    ['day-col', 'pair-col', 'disc-col'].forEach((name) => {
      const el = root.querySelector(`[data-pc="${name}"]`);
      el?.addEventListener('change', () => {
        const week = currentWeekConfig();
        const day = ensureDay(week, state.activeWeekday);
        if (name === 'day-col') day.dayCol = Number(el.value);
        if (name === 'pair-col') day.pairCol = Number(el.value);
        if (name === 'disc-col') day.discCol = Number(el.value);
      });
    });
  }

  function syncInputs(root) {
    if (!state.config) return;
    const weekSheet = root.querySelector('[data-pc="week-sheet"]');
    if (weekSheet) {
      const week = currentWeekConfig();
      if (week) week.sheet = weekSheet.value;
    }
    const pri = root.querySelector('[data-pc="time-priority"]');
    if (pri) state.config.timePriority = pri.value;
    (state.config.timeGrid || []).forEach((_, i) => {
      const pair = root.querySelector(`[data-pc-time-pair="${i}"]`);
      const start = root.querySelector(`[data-pc-time-start="${i}"]`);
      const end = root.querySelector(`[data-pc-time-end="${i}"]`);
      if (pair) state.config.timeGrid[i].pairNum = Number(pair.value);
      if (start) state.config.timeGrid[i].timeStart = start.value;
      if (end) state.config.timeGrid[i].timeEnd = end.value;
    });
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function openConstructor(groupId) {
    state.groupId = groupId;
    state.step = 1;
    state.sourceId = null;
    state.preview = null;
    state.selectedA1 = null;
    state.draftResult = null;
    state.activeWeekIndex = 0;
    state.activeWeekday = 1;
    const bundle = await api(`/api/schedule/plans/${groupId}`);
    state.plan = bundle.plan;
    state.config = bundle.activeConfig?.config || emptyConfig(bundle.plan);
    state.sourceId = bundle.source?.id || null;
    if (state.sourceId) {
      try {
        state.preview = await api(`/api/schedule/sources/${state.sourceId}/preview`);
        state.sheetName = state.preview?.workbook?.sheetNames?.[0] || '';
      } catch { /* no preview */ }
    }
    host().openModalHtml?.('<div class="pc-modal-host" id="pc-root"></div>', { wide: true });
    const root = document.getElementById('pc-root');
    if (root) mount(root);
  }

  function uploadModalHtml(groupId) {
    return `<div class="pc-upload-modal">
      <div class="kicker">Расписание</div>
      <h2>Загрузить расписание</h2>
      <p class="muted">Файл Excel или ссылка на Google Sheets. После загрузки можно настроить парсер.</p>
      <div class="pc-upload-tabs">
        <label class="file-drop compact">
          <input type="file" accept=".xlsx,.xls" id="pc-upload-file" hidden>
          <strong>Файл .xlsx / .xls</strong>
          <span>Нажмите, чтобы выбрать</span>
        </label>
        <div class="pc-link-card">
          <strong>Ссылка</strong>
          <input type="url" id="pc-upload-url" placeholder="Google Sheets или .xlsx">
          <button type="button" class="btn btn-ghost btn-block" id="pc-upload-probe">Проверить подключение</button>
        </div>
      </div>
      <div class="sheet-actions">
        <button type="button" class="btn btn-ghost" data-act="close-modal">Отмена</button>
        <button type="button" class="btn btn-primary" id="pc-open-constructor">Настроить парсер</button>
      </div>
    </div>`;
  }

  global.ScheduleConstructor = {
    open: openConstructor,
    uploadModalHtml,
  };
})(window);
