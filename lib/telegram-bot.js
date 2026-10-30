/**
 * Telegram-бот журнала: long polling, команды группы, автопостинг расписания.
 * Без внешних зависимостей — только fetch к Bot API.
 */

const TG_API = 'https://api.telegram.org';
const POLL_TIMEOUT = 25;
const ALLOWED_UPDATES = ['message', 'callback_query'];

const STATUS_EMOJI = {
  present: '✅',
  late: '✅',
  absent: '❌',
  excused: '🟣',
  unmarked: '➖',
};

const WEEKDAY_RU = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEKDAY_FULL = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function todayISOLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function nowHmLocal() {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** DD.MM.YYYY | D.M.YYYY | YYYY-MM-DD → YYYY-MM-DD */
export function parseBotDate(raw, fallback = todayISOLocal()) {
  const text = String(raw || '').trim();
  if (!text) return fallback;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const m = text.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const dt = new Date(year, month - 1, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null;
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function formatBotDate(iso) {
  const [y, m, d] = String(iso).split('-');
  return `${d}.${m}.${y}`;
}

function normGroupKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[\s._]+/g, '')
    .replace(/[–—−\-]/g, '')
    .replace(/\\/g, '/');
}

function chunkText(text, max = 3900) {
  const src = String(text || '');
  if (src.length <= max) return [src];
  const parts = [];
  let rest = src;
  while (rest.length > max) {
    let cut = rest.lastIndexOf('\n', max);
    if (cut < max * 0.5) cut = max;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^\n+/, '');
  }
  if (rest) parts.push(rest);
  return parts;
}

function parseAdminIds(raw) {
  return String(raw || '')
    .split(/[,;\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Number(part))
    .filter((id) => Number.isFinite(id));
}

function parseBindings(raw) {
  let list = raw;
  if (typeof raw === 'string') {
    try { list = JSON.parse(raw || '[]'); } catch { list = []; }
  }
  if (!Array.isArray(list)) return [];
  return list.map((row) => ({
    groupId: Number(row.groupId) || 0,
    chatId: String(row.chatId || '').trim(),
    topicId: row.topicId != null && String(row.topicId).trim() !== ''
      ? Number(row.topicId)
      : null,
  })).filter((row) => row.groupId > 0);
}

function parseSchedulePosts(raw) {
  let list = raw;
  if (typeof raw === 'string') {
    try { list = JSON.parse(raw || '[]'); } catch { list = []; }
  }
  if (!Array.isArray(list)) return [];
  return list.map((row) => ({
    groupId: Number(row.groupId) || 0,
    chatId: String(row.chatId || '').trim(),
    topicId: row.topicId != null && String(row.topicId).trim() !== ''
      ? Number(row.topicId)
      : null,
    mode: ['off', 'daily', 'weekdays', 'weekly'].includes(row.mode) ? row.mode : 'off',
    time: /^\d{2}:\d{2}$/.test(String(row.time || '')) ? String(row.time) : '08:00',
    weekday: Math.min(7, Math.max(1, Number(row.weekday) || 1)),
    lastPostedKey: String(row.lastPostedKey || ''),
  })).filter((row) => row.groupId > 0);
}

export function normalizeTelegramSettings(map = {}) {
  return {
    telegramEnabled: map.telegramEnabled === true || map.telegramEnabled === '1',
    telegramBotToken: String(map.telegramBotToken || '').trim(),
    telegramChatId: String(map.telegramChatId || '').trim(),
    telegramAdminIds: String(map.telegramAdminIds || '').trim(),
    telegramMultiMode: map.telegramMultiMode === true || map.telegramMultiMode === '1',
    telegramBindings: parseBindings(map.telegramBindings),
    telegramSchedulePosts: parseSchedulePosts(map.telegramSchedulePosts),
  };
}

/**
 * @param {object} deps
 * @param {() => object} deps.getSettings
 * @param {(patch: object) => object} deps.patchSettings
 * @param {() => Array<{id:number,name:string,scheduleCode?:string,scheduleAliases?:string[]}>} deps.listGroups
 * @param {(groupId:number, date:string) => object} deps.calendarDay
 * @param {(n:number) => number} deps.weekdayOfDate
 * @param {(msg?: string) => void} [deps.log]
 */
export function createTelegramBot(deps) {
  const log = deps.log || ((msg) => console.log(`[telegram] ${msg}`));

  let running = false;
  let abort = null;
  let offset = 0;
  let me = null;
  let lastError = '';
  let startedAt = null;
  let scheduleTimer = null;
  let pollPromise = null;

  function settings() {
    return normalizeTelegramSettings(deps.getSettings());
  }

  function isAdmin(userId) {
    const ids = parseAdminIds(settings().telegramAdminIds);
    if (!ids.length) return true; // пока админы не заданы — любой (удобно для первичной настройки)
    return ids.includes(Number(userId));
  }

  function findGroup(query, ctx = {}) {
    const groups = deps.listGroups() || [];
    if (!groups.length) return null;

    const binding = settings().telegramBindings.find((b) => {
      if (String(b.chatId) !== String(ctx.chatId)) return false;
      if (b.topicId != null && ctx.topicId != null) return Number(b.topicId) === Number(ctx.topicId);
      if (b.topicId == null && (ctx.topicId == null || ctx.topicId === 0)) return true;
      return b.topicId != null && Number(b.topicId) === Number(ctx.topicId);
    });
    if (!query && binding) {
      return groups.find((g) => g.id === binding.groupId) || null;
    }
    if (!query && groups.length === 1) return groups[0];
    if (!query) return null;

    const key = normGroupKey(query);
    return groups.find((g) => {
      const names = [g.name, g.scheduleCode, ...(g.scheduleAliases || [])];
      return names.some((n) => normGroupKey(n) === key || normGroupKey(n).includes(key) || key.includes(normGroupKey(n)));
    }) || null;
  }

  function resolveTarget(ctx, group) {
    const s = settings();
    if (group) {
      const bind = s.telegramBindings.find((b) => b.groupId === group.id);
      if (bind?.chatId) {
        return {
          chatId: bind.chatId,
          topicId: bind.topicId,
        };
      }
    }
    if (ctx?.chatId) {
      return { chatId: ctx.chatId, topicId: ctx.topicId ?? null };
    }
    return {
      chatId: s.telegramChatId,
      topicId: null,
    };
  }

  async function tg(method, body = {}, token = settings().telegramBotToken) {
    if (!token) throw Object.assign(new Error('Токен бота не задан'), { status: 400 });
    const res = await fetch(`${TG_API}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: abort?.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) {
      const err = new Error(data.description || `Telegram API ${method} failed`);
      err.status = data.error_code || 400;
      err.payload = data;
      throw err;
    }
    return data.result;
  }

  async function sendMessage(chatId, text, extra = {}) {
    const parts = chunkText(text);
    let last = null;
    for (const part of parts) {
      last = await tg('sendMessage', {
        chat_id: chatId,
        text: part,
        disable_web_page_preview: true,
        ...extra,
      });
    }
    return last;
  }

  async function answerCallback(id, text = '') {
    try {
      await tg('answerCallbackQuery', { callback_query_id: id, text: text.slice(0, 180), show_alert: false });
    } catch { /* ignore */ }
  }

  function dayStatusForStudent(studentId, pairs, pairFilter = null) {
    const statuses = [];
    for (const pair of pairs) {
      if (pairFilter != null && Number(pair.pairNum) !== Number(pairFilter)) continue;
      const mark = pair.marks?.[studentId];
      const status = mark?.status || mark;
      if (status) statuses.push(status);
    }
    if (!statuses.length) return 'unmarked';
    if (statuses.includes('absent')) return 'absent';
    if (statuses.includes('excused') && !statuses.some((s) => s === 'present' || s === 'late')) return 'excused';
    if (statuses.includes('excused')) return 'excused';
    if (statuses.includes('late') || statuses.includes('present')) return 'present';
    return 'unmarked';
  }

  function formatAttendance(day, { pairNum = null } = {}) {
    const dateLabel = formatBotDate(day.date);
    const pairLabel = pairNum != null ? ` · ${pairNum} пара` : '';
    const lines = [
      `📋 Посещаемость · ${day.group.name}`,
      `${dateLabel}${day.weekLabel ? ` · ${day.weekLabel}` : ''}${pairLabel}`,
      '',
    ];
    let present = 0;
    let absent = 0;
    let excused = 0;
    let unmarked = 0;
    for (const student of day.students) {
      const status = dayStatusForStudent(student.id, day.pairs || [], pairNum);
      if (status === 'present' || status === 'late') present += 1;
      else if (status === 'absent') absent += 1;
      else if (status === 'excused') excused += 1;
      else unmarked += 1;
      lines.push(`${student.fullName} ${STATUS_EMOJI[status] || STATUS_EMOJI.unmarked}`);
    }
    lines.push('');
    lines.push(`✅ ${present} · ❌ ${absent} · 🟣 ${excused}${unmarked ? ` · ➖ ${unmarked}` : ''}`);
    lines.push('');
    lines.push('✅ здесь · ❌ нет · 🟣 уважительная · ➖ нет отметки');
    return lines.join('\n');
  }

  function formatScheduleDay(day) {
    const dateLabel = formatBotDate(day.date);
    const wd = WEEKDAY_FULL[day.weekday] || '';
    const head = [
      `📅 Расписание · ${day.group.name}`,
      `${wd}, ${dateLabel}${day.weekLabel ? ` · ${day.weekLabel}` : ''}`,
      '',
    ];
    if (day.noSchedule) {
      return [...head, 'На эту дату расписание не настроено.'].join('\n');
    }
    if (!day.pairs?.length) {
      return [...head, 'Пар нет.'].join('\n');
    }
    const body = day.pairs.map((p) => {
      const time = [p.timeStart, p.timeEnd].filter(Boolean).join('–');
      const bits = [
        `${p.pairNum || '—'} пара${time ? ` · ${time}` : ''}`,
        p.subjectName || 'Предмет',
        [p.lessonKind, p.teacher, p.room ? `ауд. ${p.room}` : ''].filter(Boolean).join(' · '),
      ].filter(Boolean);
      return bits.join('\n');
    });
    return [...head, body.join('\n\n')].join('\n');
  }

  function commandsHelp(admin = false) {
    const lines = [
      '🛠 Команды бота журнала',
      '',
      '/pos [дата] [группа] [пара] — посещаемость текстом',
      '  пример: /pos 30.10.2026 А-101',
      '  пример: /pos сегодня А-101 2',
      '/today [группа] — пары на сегодня',
      '/schedule — расписание и автопостинг',
      '/groups — список групп',
      '/whoami — ваш Telegram ID',
      '/chatid — ID чата и темы',
      '/help · /commands — эта справка',
    ];
    if (admin) {
      lines.push('', 'Админ: кнопки /schedule настраивают периодичность скидывания расписания в группу.');
    }
    return lines.join('\n');
  }

  function scheduleKeyboard(group, ctx) {
    const posts = settings().telegramSchedulePosts;
    const job = posts.find((p) => p.groupId === group.id) || { mode: 'off', time: '08:00' };
    const gid = group.id;
    const modeLabel = {
      off: 'выкл',
      daily: `ежедневно ${job.time}`,
      weekdays: `будни ${job.time}`,
      weekly: `раз в неделю ${job.time}`,
    }[job.mode] || 'выкл';
    return {
      inline_keyboard: [
        [
          { text: '📅 Сегодня', callback_data: `sch:today:${gid}` },
          { text: '📆 Завтра', callback_data: `sch:tomorrow:${gid}` },
        ],
        [
          { text: '📋 Явка сегодня', callback_data: `sch:pos:${gid}` },
        ],
        [
          { text: `⏱ Авто: ${modeLabel}`, callback_data: `sch:menu:${gid}` },
        ],
        [
          { text: 'Выкл', callback_data: `sch:mode:${gid}:off` },
          { text: 'Каждый день', callback_data: `sch:mode:${gid}:daily` },
        ],
        [
          { text: 'Будни', callback_data: `sch:mode:${gid}:weekdays` },
          { text: 'Раз в неделю', callback_data: `sch:mode:${gid}:weekly` },
        ],
        [
          { text: '07:30', callback_data: `sch:time:${gid}:07:30` },
          { text: '08:00', callback_data: `sch:time:${gid}:08:00` },
          { text: '08:30', callback_data: `sch:time:${gid}:08:30` },
          { text: '09:00', callback_data: `sch:time:${gid}:09:00` },
        ],
      ],
    };
  }

  function upsertSchedulePost(groupId, patch, ctx = {}) {
    const s = settings();
    const posts = [...s.telegramSchedulePosts];
    let row = posts.find((p) => p.groupId === groupId);
    if (!row) {
      const target = resolveTarget(ctx, { id: groupId });
      row = {
        groupId,
        chatId: target.chatId || s.telegramChatId,
        topicId: target.topicId,
        mode: 'off',
        time: '08:00',
        weekday: 1,
        lastPostedKey: '',
      };
      posts.push(row);
    }
    Object.assign(row, patch);
    if (ctx.chatId) row.chatId = String(ctx.chatId);
    if (ctx.topicId != null) row.topicId = Number(ctx.topicId) || null;
    deps.patchSettings({ telegramSchedulePosts: posts });
    return row;
  }

  function addDaysISO(iso, days) {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d + days);
    return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
  }

  async function reply(ctx, text, extra = {}) {
    const payload = { ...extra };
    if (ctx.topicId != null) payload.message_thread_id = ctx.topicId;
    if (ctx.messageId) payload.reply_to_message_id = ctx.messageId;
    return sendMessage(ctx.chatId, text, payload);
  }

  function parseCommand(text) {
    const raw = String(text || '').trim();
    if (!raw.startsWith('/')) return null;
    const [head, ...rest] = raw.split(/\s+/);
    let cmd = head.slice(1).toLowerCase();
    const at = cmd.indexOf('@');
    if (at >= 0) cmd = cmd.slice(0, at);
    if (cmd === 'commans' || cmd === 'start' || cmd === 'command') cmd = 'commands';
    return { cmd, args: rest, raw };
  }

  async function handlePos(ctx, args) {
    let date = todayISOLocal();
    let groupQuery = '';
    let pairNum = null;
    const leftovers = [];
    for (const arg of args) {
      const low = arg.toLowerCase();
      if (low === 'сегодня' || low === 'today') {
        date = todayISOLocal();
        continue;
      }
      if (low === 'вчера') {
        date = addDaysISO(todayISOLocal(), -1);
        continue;
      }
      const parsed = parseBotDate(arg, null);
      if (parsed) {
        date = parsed;
        continue;
      }
      if (/^\d{1,2}$/.test(arg)) {
        pairNum = Number(arg);
        continue;
      }
      leftovers.push(arg);
    }
    groupQuery = leftovers.join(' ');
    const group = findGroup(groupQuery, ctx);
    if (!group) {
      const names = (deps.listGroups() || []).map((g) => g.name).join(', ') || 'нет групп';
      await reply(ctx, `Укажите группу.\nПример: /pos ${formatBotDate(date)} А-101\nГруппы: ${names}`);
      return;
    }
    const day = deps.calendarDay(group.id, date);
    await reply(ctx, formatAttendance(day, { pairNum }));
  }

  async function handleToday(ctx, args) {
    const group = findGroup(args.join(' '), ctx);
    if (!group) {
      await reply(ctx, 'Укажите группу: /today А-101');
      return;
    }
    const day = deps.calendarDay(group.id, todayISOLocal());
    await reply(ctx, formatScheduleDay(day));
  }

  async function handleSchedule(ctx, args) {
    if (!isAdmin(ctx.userId)) {
      await reply(ctx, 'Команда /schedule доступна админам бота.');
      return;
    }
    const group = findGroup(args.join(' '), ctx);
    if (!group) {
      const groups = deps.listGroups() || [];
      if (!groups.length) {
        await reply(ctx, 'В журнале пока нет групп.');
        return;
      }
      const keyboard = {
        inline_keyboard: groups.slice(0, 24).map((g) => ([{
          text: g.name,
          callback_data: `sch:pick:${g.id}`,
        }])),
      };
      await reply(ctx, 'Выберите группу для расписания и автопостинга:', { reply_markup: keyboard });
      return;
    }
    const job = settings().telegramSchedulePosts.find((p) => p.groupId === group.id);
    const mode = job?.mode || 'off';
    const time = job?.time || '08:00';
    await reply(ctx, [
      `📅 Расписание · ${group.name}`,
      `Автопостинг: ${mode === 'off' ? 'выключен' : `${mode} в ${time}`}`,
      '',
      'Кнопки ниже: вывести пары или настроить периодичность скидывания в этот чат.',
    ].join('\n'), { reply_markup: scheduleKeyboard(group, ctx) });
  }

  async function handleGroups(ctx) {
    const groups = deps.listGroups() || [];
    if (!groups.length) {
      await reply(ctx, 'Групп пока нет.');
      return;
    }
    const s = settings();
    const lines = groups.map((g) => {
      const bind = s.telegramBindings.find((b) => b.groupId === g.id);
      const tag = bind
        ? ` · чат ${bind.chatId}${bind.topicId != null ? ` · тема ${bind.topicId}` : ''}`
        : '';
      return `• ${g.name}${g.scheduleCode ? ` (${g.scheduleCode})` : ''}${tag}`;
    });
    await reply(ctx, `Группы журнала:\n${lines.join('\n')}`);
  }

  async function handleCallback(cq) {
    const data = String(cq.data || '');
    const ctx = {
      chatId: cq.message?.chat?.id,
      topicId: cq.message?.message_thread_id ?? null,
      userId: cq.from?.id,
      messageId: cq.message?.message_id,
    };
    if (!isAdmin(ctx.userId) && !data.startsWith('sch:today:') && !data.startsWith('sch:tomorrow:') && !data.startsWith('sch:pos:')) {
      await answerCallback(cq.id, 'Только для админов бота');
      return;
    }
    const parts = data.split(':');
    if (parts[0] !== 'sch') return;
    const action = parts[1];
    const groupId = Number(parts[2]);
    const group = (deps.listGroups() || []).find((g) => g.id === groupId);
    if (!group) {
      await answerCallback(cq.id, 'Группа не найдена');
      return;
    }

    if (action === 'pick' || action === 'menu') {
      await answerCallback(cq.id);
      const job = settings().telegramSchedulePosts.find((p) => p.groupId === group.id);
      await reply(ctx, [
        `📅 Расписание · ${group.name}`,
        `Автопостинг: ${job?.mode || 'off'}${job?.mode && job.mode !== 'off' ? ` в ${job.time}` : ''}`,
      ].join('\n'), { reply_markup: scheduleKeyboard(group, ctx) });
      return;
    }

    if (action === 'today' || action === 'tomorrow' || action === 'pos') {
      await answerCallback(cq.id);
      const date = action === 'tomorrow' ? addDaysISO(todayISOLocal(), 1) : todayISOLocal();
      const day = deps.calendarDay(group.id, date);
      await reply(ctx, action === 'pos' ? formatAttendance(day) : formatScheduleDay(day));
      return;
    }

    if (action === 'mode') {
      const mode = parts[3];
      if (!isAdmin(ctx.userId)) {
        await answerCallback(cq.id, 'Только админ');
        return;
      }
      const row = upsertSchedulePost(groupId, { mode }, ctx);
      await answerCallback(cq.id, mode === 'off' ? 'Автопостинг выключен' : `Режим: ${mode}`);
      await reply(ctx, `Автопостинг для «${group.name}»: ${row.mode === 'off' ? 'выключен' : `${row.mode} в ${row.time}`}`, {
        reply_markup: scheduleKeyboard(group, ctx),
      });
      return;
    }

    if (action === 'time') {
      const time = parts[3];
      if (!isAdmin(ctx.userId)) {
        await answerCallback(cq.id, 'Только админ');
        return;
      }
      const row = upsertSchedulePost(groupId, { time }, ctx);
      if (row.mode === 'off') upsertSchedulePost(groupId, { mode: 'weekdays', time }, ctx);
      await answerCallback(cq.id, `Время ${time}`);
      const fresh = settings().telegramSchedulePosts.find((p) => p.groupId === groupId);
      await reply(ctx, `Время автопостинга «${group.name}»: ${fresh?.time || time} (${fresh?.mode || 'weekdays'})`, {
        reply_markup: scheduleKeyboard(group, ctx),
      });
    }
  }

  async function handleMessage(msg) {
    const text = msg.text || msg.caption || '';
    const parsed = parseCommand(text);
    if (!parsed) return;

    const ctx = {
      chatId: msg.chat.id,
      topicId: msg.message_thread_id ?? null,
      userId: msg.from?.id,
      messageId: msg.message_id,
      chatType: msg.chat.type,
      isForum: !!msg.chat.is_forum,
    };

    const { cmd, args } = parsed;

    if (cmd === 'whoami') {
      await reply(ctx, `Ваш Telegram ID: ${ctx.userId}\nДобавьте его в «ID админов бота» в настройках журнала.`);
      return;
    }
    if (cmd === 'chatid') {
      await reply(ctx, [
        `Chat ID: ${ctx.chatId}`,
        ctx.topicId != null ? `Topic / тема ID: ${ctx.topicId}` : 'Тема: нет (обычный чат или General)',
        ctx.isForum ? 'Это форум-супергруппа (мульти-темы).' : 'Обычный чат/группа.',
      ].join('\n'));
      return;
    }
    if (cmd === 'help' || cmd === 'commands') {
      await reply(ctx, commandsHelp(isAdmin(ctx.userId)));
      return;
    }
    if (cmd === 'status') {
      const s = settings();
      await reply(ctx, [
        `Бот: ${running ? 'онлайн' : 'офлайн'}`,
        me?.username ? `@${me.username}` : '',
        `Мульти-темы: ${s.telegramMultiMode ? 'да' : 'нет'}`,
        `Админы: ${s.telegramAdminIds || 'не заданы (временно все)'}`,
        lastError ? `Последняя ошибка: ${lastError}` : 'Ошибок нет',
      ].filter(Boolean).join('\n'));
      return;
    }
    if (cmd === 'pos' || cmd === 'посещаемость' || cmd === 'attendance') {
      await handlePos(ctx, args);
      return;
    }
    if (cmd === 'today' || cmd === 'сегодня') {
      await handleToday(ctx, args);
      return;
    }
    if (cmd === 'schedule' || cmd === 'расписание') {
      await handleSchedule(ctx, args);
      return;
    }
    if (cmd === 'groups' || cmd === 'группы') {
      await handleGroups(ctx);
    }
  }

  async function processUpdate(update) {
    try {
      if (update.callback_query) {
        await handleCallback(update.callback_query);
        return;
      }
      if (update.message) {
        await handleMessage(update.message);
      }
    } catch (error) {
      lastError = error.message || String(error);
      log(`update error: ${lastError}`);
      try {
        const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
        const topicId = update.message?.message_thread_id
          ?? update.callback_query?.message?.message_thread_id
          ?? null;
        if (chatId) {
          await sendMessage(chatId, `⚠️ ${lastError.slice(0, 300)}`, topicId != null ? { message_thread_id: topicId } : {});
        }
      } catch { /* ignore */ }
    }
  }

  async function pollLoop() {
    while (running) {
      try {
        const updates = await tg('getUpdates', {
          offset,
          timeout: POLL_TIMEOUT,
          allowed_updates: ALLOWED_UPDATES,
        });
        lastError = '';
        for (const update of updates || []) {
          offset = update.update_id + 1;
          await processUpdate(update);
        }
      } catch (error) {
        if (!running || error.name === 'AbortError') break;
        lastError = error.message || String(error);
        log(`poll: ${lastError}`);
        await new Promise((r) => setTimeout(r, 2500));
      }
    }
  }

  function shouldPostNow(job) {
    if (!job || job.mode === 'off') return false;
    const hm = nowHmLocal();
    if (hm !== job.time) return false;
    const today = todayISOLocal();
    const key = `${today}:${job.time}:${job.mode}`;
    if (job.lastPostedKey === key) return false;
    const wd = deps.weekdayOfDate(today);
    if (job.mode === 'weekdays' && (wd === 7 || wd === 0)) return false;
    if (job.mode === 'weekly' && wd !== Number(job.weekday || 1)) return false;
    return true;
  }

  async function runScheduleTick() {
    const s = settings();
    if (!s.telegramEnabled || !s.telegramBotToken) return;
    for (const job of s.telegramSchedulePosts) {
      if (!shouldPostNow(job)) continue;
      const group = (deps.listGroups() || []).find((g) => g.id === job.groupId);
      if (!group || !job.chatId) continue;
      try {
        const day = deps.calendarDay(group.id, todayISOLocal());
        const extra = job.topicId != null ? { message_thread_id: job.topicId } : {};
        await sendMessage(job.chatId, formatScheduleDay(day), extra);
        const key = `${todayISOLocal()}:${job.time}:${job.mode}`;
        upsertSchedulePost(job.groupId, { lastPostedKey: key });
        log(`auto schedule posted for ${group.name}`);
      } catch (error) {
        lastError = error.message || String(error);
        log(`auto schedule: ${lastError}`);
      }
    }
  }

  function startScheduleTimer() {
    if (scheduleTimer) clearInterval(scheduleTimer);
    scheduleTimer = setInterval(() => {
      runScheduleTick().catch(() => {});
    }, 20_000);
  }

  async function registerCommands() {
    const commands = [
      { command: 'pos', description: 'Посещаемость: /pos дата группа' },
      { command: 'today', description: 'Пары на сегодня' },
      { command: 'schedule', description: 'Расписание и автопостинг' },
      { command: 'groups', description: 'Список групп' },
      { command: 'commands', description: 'Список команд' },
      { command: 'chatid', description: 'ID чата и темы' },
      { command: 'whoami', description: 'Ваш Telegram ID' },
      { command: 'help', description: 'Справка' },
    ];
    await tg('setMyCommands', { commands });
    await tg('setMyCommands', {
      commands,
      scope: { type: 'all_group_chats' },
    }).catch(() => {});
  }

  async function start() {
    const s = settings();
    if (!s.telegramEnabled || !s.telegramBotToken) {
      await stop();
      return { ok: false, reason: 'disabled' };
    }
    await stop({ silent: true });
    abort = new AbortController();
    running = true;
    startedAt = Date.now();
    try {
      me = await tg('getMe');
      await tg('deleteWebhook', { drop_pending_updates: false });
      await registerCommands();
      log(`started as @${me.username || me.id}`);
      startScheduleTimer();
      pollPromise = pollLoop();
      return { ok: true, username: me.username, id: me.id };
    } catch (error) {
      lastError = error.message || String(error);
      running = false;
      log(`start failed: ${lastError}`);
      return { ok: false, error: lastError };
    }
  }

  async function stop({ silent = false } = {}) {
    running = false;
    if (scheduleTimer) {
      clearInterval(scheduleTimer);
      scheduleTimer = null;
    }
    if (abort) {
      try { abort.abort(); } catch { /* */ }
      abort = null;
    }
    if (pollPromise) {
      try { await Promise.race([pollPromise, new Promise((r) => setTimeout(r, 500))]); } catch { /* */ }
      pollPromise = null;
    }
    if (!silent) log('stopped');
  }

  async function restart() {
    await stop({ silent: true });
    return start();
  }

  async function sendTest(text = '✅ Бот журнала подключён.') {
    const s = settings();
    if (!s.telegramBotToken) throw Object.assign(new Error('Укажите токен бота'), { status: 400 });
    if (!s.telegramChatId) throw Object.assign(new Error('Укажите ID чата'), { status: 400 });
    me = await tg('getMe');
    return sendMessage(s.telegramChatId, text);
  }

  function getStatus() {
    const s = settings();
    return {
      enabled: s.telegramEnabled,
      running,
      username: me?.username || null,
      botId: me?.id || null,
      startedAt,
      lastError,
      multiMode: s.telegramMultiMode,
      bindings: s.telegramBindings.length,
      scheduleJobs: s.telegramSchedulePosts.filter((p) => p.mode !== 'off').length,
      chatId: s.telegramChatId || null,
      admins: parseAdminIds(s.telegramAdminIds),
    };
  }

  return {
    start,
    stop,
    restart,
    sendTest,
    getStatus,
    formatAttendance,
    formatScheduleDay,
    parseBotDate,
  };
}
