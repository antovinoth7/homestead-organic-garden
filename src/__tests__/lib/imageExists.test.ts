/* The repository's Jest preset is Node-only, so this test stubs the native
 * modules `imageStorage` imports and drives `imageExists` with fake timers. */
/* eslint-disable import/first */
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///docs/',
  getInfoAsync: jest.fn(),
}));
jest.mock('expo-media-library/legacy', () => ({}));
jest.mock('expo-constants', () => ({ __esModule: true, default: { appOwnership: null } }));
jest.mock('@/utils/logger', () => ({
  logger: { warn: jest.fn(), debug: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

import * as FileSystem from 'expo-file-system/legacy';
import { imageExists } from '@/lib/imageStorage';
import { logger } from '@/utils/logger';

const getInfoAsync = FileSystem.getInfoAsync as jest.Mock;

describe('imageExists', () => {
  beforeAll(() => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('leaves no timer behind once a fast check settles', async () => {
    getInfoAsync.mockResolvedValue({ exists: true });

    await expect(imageExists('file:///docs/garden_images/a.jpg')).resolves.toBe(true);

    // Every call used to leave a live 2 s timer that later logged a false timeout.
    expect(jest.getTimerCount()).toBe(0);
    await jest.advanceTimersByTimeAsync(5000);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('still gives up after 2 s when the file system never answers', async () => {
    getInfoAsync.mockReturnValue(new Promise(() => undefined));

    const result = imageExists('file:///docs/garden_images/slow.jpg');
    await jest.advanceTimersByTimeAsync(2000);

    await expect(result).resolves.toBe(false);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('reports a missing file without waiting for the timeout', async () => {
    getInfoAsync.mockResolvedValue({ exists: false });

    await expect(imageExists('file:///docs/garden_images/gone.jpg')).resolves.toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });
});
