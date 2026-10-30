import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseBotDate, formatBotDate, normalizeTelegramSettings } from '../lib/telegram-bot.js';

describe('telegram bot helpers', () => {
  it('parses DD.MM.YYYY dates', () => {
    assert.equal(parseBotDate('30.10.2026'), '2026-10-30');
    assert.equal(parseBotDate('1.2.2026'), '2026-02-01');
    assert.equal(parseBotDate('2026-10-30'), '2026-10-30');
    assert.equal(parseBotDate('bad', '2026-01-01'), null);
  });

  it('formats ISO to bot date', () => {
    assert.equal(formatBotDate('2026-10-30'), '30.10.2026');
  });

  it('normalizes telegram settings', () => {
    const s = normalizeTelegramSettings({
      telegramEnabled: '1',
      telegramBotToken: '1:AA',
      telegramChatId: '-1001',
      telegramAdminIds: '1, 2',
      telegramMultiMode: '1',
      telegramBindings: JSON.stringify([{ groupId: 5, chatId: '-1001', topicId: 12 }]),
      telegramSchedulePosts: JSON.stringify([{ groupId: 5, mode: 'weekdays', time: '08:00', chatId: '-1001' }]),
    });
    assert.equal(s.telegramEnabled, true);
    assert.equal(s.telegramMultiMode, true);
    assert.equal(s.telegramBindings[0].topicId, 12);
    assert.equal(s.telegramSchedulePosts[0].mode, 'weekdays');
  });
});
