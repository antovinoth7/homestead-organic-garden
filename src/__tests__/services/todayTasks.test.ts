/**
 * Today's task list and the "already done today?" guard, answered from the
 * in-memory cache. Nothing here reaches Firestore: every read is served by the
 * cache the test seeds — which is the behaviour under test, since the guard
 * used to fetch the template's whole completion history from the network on
 * every tap, and Today ran a second query over the template collection.
 */

import { getStoredTodayTasks, getTodayTasks, markTaskDone } from '@/services/tasks';
import { CACHE_KEYS, invalidateAll, setCached } from '@/lib/dataCache';
import { addDaysToDateKey, farmDateKey, farmDateTimeFromKey } from '@/utils/farmDate';
import { makeTaskLog, makeTaskTemplate } from '../fixtures/task.fixtures';

// firebase.ts validates its env at import; the SDK itself is never reached.
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user-id' } },
  refreshAuthToken: jest.fn(async () => true),
}));
// NetInfo is a native module.
jest.mock('@/utils/networkState', () => ({ isNetworkAvailable: jest.fn(() => true) }));
jest.mock('@/lib/storage', () => ({
  KEYS: {
    TASKS: '@garden_tasks',
    TASK_LOGS: '@garden_task_logs',
    PLANTS: '@garden_plants',
    OFFLINE_QUEUE: '@garden_offline_queue',
  },
  getData: jest.fn(async () => []),
  setData: jest.fn(async () => true),
  readData: jest.fn(async () => ({ ok: true, data: [] })),
}));

const todayKey = farmDateKey(new Date())!;
const at = (dayOffset: number, hour: number): string =>
  farmDateTimeFromKey(addDaysToDateKey(todayKey, dayOffset)!, hour)!.toISOString();

beforeEach(() => {
  invalidateAll();
});

describe('getTodayTasks', () => {
  const overdue = makeTaskTemplate({ id: 'overdue', next_due_at: at(-2, 18) });
  const dueToday = makeTaskTemplate({ id: 'today', next_due_at: at(0, 6) });
  const tomorrow = makeTaskTemplate({ id: 'tomorrow', next_due_at: at(1, 6) });
  const disabled = makeTaskTemplate({ id: 'disabled', enabled: false, next_due_at: at(0, 6) });
  const templates = [tomorrow, dueToday, disabled, overdue];

  it('keeps enabled templates due today or overdue, soonest first', async () => {
    setCached(CACHE_KEYS.TASK_TEMPLATES, templates);
    expect((await getTodayTasks()).map((task) => task.id)).toEqual(['overdue', 'today']);
  });

  it('agrees with the cached first paint', async () => {
    setCached(CACHE_KEYS.TASK_TEMPLATES, templates);
    expect(await getStoredTodayTasks()).toEqual(await getTodayTasks());
  });
});

describe('markTaskDone duplicate guard', () => {
  it("recognises today's completion from the cached today logs", async () => {
    const template = makeTaskTemplate({ next_due_at: at(0, 6), frequency_days: 3 });
    setCached(CACHE_KEYS.TODAY_TASK_LOGS, [
      makeTaskLog({ template_id: template.id, done_at: new Date().toISOString() }),
    ]);

    // Resolving at all proves no history query ran: the stub `db` would make
    // one throw, and the fallback would then let the save path run into the
    // same stub.
    await expect(markTaskDone(template)).resolves.toBe(false);
  });
});
