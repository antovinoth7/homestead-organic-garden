import {
  getCached,
  peekCached,
  setCached,
  invalidate,
  invalidatePrefix,
} from '@/lib/dataCache';

describe('dataCache peekCached', () => {
  afterEach(() => {
    jest.useRealTimers();
    invalidate('k');
  });

  it('returns entries that getCached considers stale (30s window)', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-20T00:00:00.000Z'));
    setCached('k', { v: 1 });

    jest.setSystemTime(new Date('2026-06-20T00:01:00.000Z')); // 60s later
    expect(getCached('k')).toBeNull();
    expect(peekCached('k')).toEqual({ v: 1 });
  });

  it('returns null for absent and invalidated keys', () => {
    expect(peekCached('k')).toBeNull();
    setCached('k', { v: 2 });
    invalidate('k');
    expect(peekCached('k')).toBeNull();
  });
});

describe('dataCache invalidatePrefix', () => {
  afterEach(() => {
    invalidatePrefix('taskLogs:plant:');
    invalidate('taskLogs', 'k');
  });

  it('clears every key in a dynamic key family', () => {
    setCached('taskLogs:plant:a', [1]);
    setCached('taskLogs:plant:b', [2]);

    invalidatePrefix('taskLogs:plant:');

    expect(peekCached('taskLogs:plant:a')).toBeNull();
    expect(peekCached('taskLogs:plant:b')).toBeNull();
  });

  it('leaves non-matching keys intact', () => {
    // The full-list cache must survive — it is shared with backup and the
    // delete cascades, which do not want it dropped on a History open.
    setCached('taskLogs', [1, 2, 3]);
    setCached('taskLogs:plant:a', [1]);
    setCached('k', { v: 1 });

    invalidatePrefix('taskLogs:plant:');

    expect(peekCached('taskLogs')).toEqual([1, 2, 3]);
    expect(peekCached('k')).toEqual({ v: 1 });
    expect(peekCached('taskLogs:plant:a')).toBeNull();
  });

  it('is a no-op when nothing matches', () => {
    setCached('k', { v: 1 });
    expect(() => invalidatePrefix('nothing:')).not.toThrow();
    expect(peekCached('k')).toEqual({ v: 1 });
  });
});
