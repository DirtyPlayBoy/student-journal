/** RBAC: роли, каталог прав и пресеты. */

export const ROLES = Object.freeze({
  admin: { key: 'admin', label: 'Администратор' },
  teacher: { key: 'teacher', label: 'Преподаватель' },
  elder: { key: 'elder', label: 'Староста' },
  student: { key: 'student', label: 'Ученик' },
});

export const ROLE_KEYS = Object.freeze(Object.keys(ROLES));

export const PERMISSIONS = Object.freeze([
  {
    key: 'users.manage',
    label: 'Пользователи',
    description: 'Создавать пользователей, права и доступы',
    category: 'Администрирование',
  },
  {
    key: 'groups.manage',
    label: 'Группы: создание и удаление',
    description: 'Создавать и удалять учебные группы',
    category: 'Администрирование',
  },
  {
    key: 'groups.rename',
    label: 'Переименование групп',
    description: 'Менять название и код расписания',
    category: 'Группы',
  },
  {
    key: 'elders.appoint',
    label: 'Назначение старост',
    description: 'Назначать старосту группы',
    category: 'Группы',
  },
  {
    key: 'schedule.view',
    label: 'Смотреть расписание',
    description: 'Календарь и сетка пар без правок',
    category: 'Расписание',
  },
  {
    key: 'schedule.manage',
    label: 'Редактировать расписание',
    description: 'Добавлять и менять пары, преподавателя, аудиторию',
    category: 'Расписание',
  },
  {
    key: 'schedule.import',
    label: 'Импорт из Excel',
    description: 'Подтягивать сетку из Google Sheets по ссылке',
    category: 'Расписание',
  },
  {
    key: 'students.manage',
    label: 'Ученики',
    description: 'Добавлять и править учеников',
    category: 'Журнал',
  },
  {
    key: 'teachers.manage',
    label: 'Педагоги',
    description: 'Добавлять педагогов и выдавать им доступ',
    category: 'Журнал',
  },
  {
    key: 'subjects.manage',
    label: 'Добавлять предметы',
    description: 'Создавать предметы, объединять дубли и чистить пустые',
    category: 'Журнал',
  },
  {
    key: 'attendance.mark',
    label: 'Посещаемость',
    description: 'Ставить отметки на парах',
    category: 'Журнал',
  },
  {
    key: 'grades.manage',
    label: 'Оценки и зачёты',
    description: 'Работы, оценки, зачёты и экзамены',
    category: 'Журнал',
  },
  {
    key: 'notes.manage',
    label: 'Заметки об учениках',
    description: 'Приватные комментарии педагогов (ученикам не видны)',
    category: 'Журнал',
  },
  {
    key: 'stats.view',
    label: 'Статистика',
    description: 'Сводки и выгрузки',
    category: 'Журнал',
  },
  {
    key: 'diary.own',
    label: 'Свой дневник',
    description: 'Свои пропуски, оценки и расписание группы',
    category: 'Дневник',
  },
  {
    key: 'settings.manage',
    label: 'Настройки заведения',
    description: 'Название, пороги явки, Excel, SMTP, оценки',
    category: 'Администрирование',
  },
]);

export const PERMISSION_KEYS = Object.freeze(PERMISSIONS.map((item) => item.key));

export const ROLE_DEFAULTS = Object.freeze({
  admin: Object.freeze(['*']),
  teacher: Object.freeze([
    'groups.rename',
    'schedule.view',
    'schedule.manage',
    'students.manage',
    'teachers.manage',
    'subjects.manage',
    'attendance.mark',
    'grades.manage',
    'notes.manage',
    'stats.view',
  ]),
  elder: Object.freeze([
    'schedule.view',
    'attendance.mark',
    'stats.view',
  ]),
  student: Object.freeze([
    'schedule.view',
    'diary.own',
  ]),
});

export function roleLabel(role) {
  return ROLES[role]?.label || role || 'Пользователь';
}

export function isRole(value) {
  return ROLE_KEYS.includes(value);
}

export function defaultPermissionsForRole(role) {
  if (role === 'admin') return [...PERMISSION_KEYS];
  return [...(ROLE_DEFAULTS[role] || [])];
}

export function normalizePermissionList(list) {
  if (!Array.isArray(list)) return [];
  const allowed = new Set(PERMISSION_KEYS);
  return [...new Set(list.map(String).filter((key) => allowed.has(key)))];
}

export function permissionsEqual(a, b) {
  const left = [...new Set(a || [])].sort();
  const right = [...new Set(b || [])].sort();
  if (left.length !== right.length) return false;
  return left.every((key, index) => key === right[index]);
}

export function catalog() {
  const byCategory = new Map();
  for (const item of PERMISSIONS) {
    if (!byCategory.has(item.category)) byCategory.set(item.category, []);
    byCategory.get(item.category).push({ ...item });
  }
  return {
    roles: ROLE_KEYS.map((key) => ({ ...ROLES[key], defaults: defaultPermissionsForRole(key) })),
    permissions: PERMISSIONS.map((item) => ({ ...item })),
    categories: [...byCategory.entries()].map(([name, items]) => ({ name, items })),
  };
}
