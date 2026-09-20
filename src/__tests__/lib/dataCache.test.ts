import {
  getCached,
  peekCached,
  setCached,
  invalidate,
  invalidatePrefix,
  invalidateAll,
  dedup,
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

describe('dataCache dedup vs. invalidation', () => {
  const deferred = <T>(): { promise: Promise<T>; resolve: (value: T) => void } => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
      resolve = res;
    });
    return { promise, resolve };
  };

  // Lets a pending microtask/timer settle so the in-flight fetch and the
  // invalidation land on distinguishable timestamps.
  const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 2));

  beforeEach(() => {
    invalidateAll();
  });

  it('shares one in-flight request between concurrent callers', async () => {
    let calls = 0;
    const fetcher = async (): Promise<string> => {
      calls += 1;
      return 'value';
    };

    const [a, b] = await Promise.all([dedup('k', fetcher), dedup('k', fetcher)]);

    expect(calls).toBe(1);
    expect(a).toBe('value');
    expect(b).toBe('value');
    expect(getCached('k')).toBe('value');
  });

  it('caches a read that completes with no intervening invalidation', async () => {
    const gate = deferred<string>();
    const inFlight = dedup('k', () => gate.promise);
    gate.resolve('fresh');
    await inFlight;
    expect(getCached('k')).toBe('fresh');
  });

  it('does not repopulate the cache with a read that started before an invalidate', async () => {
    const gate = deferred<string>();
    const inFlight = dedup('k', () => gate.promise);

    // A mutation commits and invalidates while the read is still in flight.
    await tick();
    invalidate('k');

    gate.resolve('stale-pre-mutation-value');
    await expect(inFlight).resolves.toBe('stale-pre-mutation-value');

    // The caller still receives its result, but the invalidation must stand so
    // the next read refetches instead of serving pre-mutation data.
    expect(peekCached('k')).toBeNull();
  });

  it('does not repopulate after invalidateAll (e.g. sign-out)', async () => {
    const gate = deferred<string>();
    const inFlight = dedup('k', () => gate.promise);

    await tick();
    invalidateAll();

    gate.resolve('previous-account-data');
    await inFlight;

    expect(peekCached('k')).toBeNull();
  });

  it('does not repopulate after a matching invalidatePrefix', async () => {
    const gate = deferred<string[]>();
    const inFlight = dedup('taskLogs:plant:1', () => gate.promise);

    await tick();
    invalidatePrefix('taskLogs:');

    gate.resolve(['stale']);
    await inFlight;

    expect(peekCached('taskLogs:plant:1')).toBeNull();
  });
});
