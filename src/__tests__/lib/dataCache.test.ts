import { getCached, peekCached, setCached, invalidate } from '@/lib/dataCache';

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
