/** Validate parsed schedule slots */

export function validateSlots(slots = [], { requireTime = false } = {}) {
  const errors = [];
  const warnings = [];
  const seen = new Map();

  for (const slot of slots) {
    const key = `${slot.weekIndex}|${slot.weekday}|${slot.pairNum}`;
    if (seen.has(key)) {
      errors.push({
        code: 'duplicate_slot',
        message: `Дубликат пары ${slot.pairNum} (неделя ${slot.weekIndex}, день ${slot.weekday})`,
        slot,
      });
    } else {
      seen.set(key, slot);
    }

    if (!slot.subjectName) {
      errors.push({ code: 'missing_subject', message: 'Нет названия дисциплины', slot });
    }
    if (!slot.weekday || slot.weekday < 1 || slot.weekday > 7) {
      errors.push({ code: 'bad_weekday', message: 'Некорректный день недели', slot });
    }
    if (!slot.pairNum || slot.pairNum < 1) {
      errors.push({ code: 'bad_pair', message: 'Некорректный номер пары', slot });
    }
    if (requireTime && (!slot.timeStart || !slot.timeEnd)) {
      warnings.push({ code: 'missing_time', message: 'Нет времени занятия', slot });
    }
    if (!slot.teacher) {
      warnings.push({ code: 'missing_teacher', message: 'Нет преподавателя', slot });
    }
    if (!slot.room) {
      warnings.push({ code: 'missing_room', message: 'Нет аудитории', slot });
    }
    if (slot.status === 'warn' || (slot.parseWarnings || []).length) {
      warnings.push({
        code: 'parse_warn',
        message: (slot.parseWarnings || []).join(', ') || 'Неоднозначный разбор',
        slot,
      });
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    counts: {
      slots: slots.length,
      errors: errors.length,
      warnings: warnings.length,
      ok: slots.filter((s) => s.status !== 'warn' && s.subjectName).length,
    },
  };
}
