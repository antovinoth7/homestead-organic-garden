import { PendingCompletionQueue } from '@/utils/pendingCompletionQueue';

interface Item {
  id: string;
}

const DELAY = 5000;

const setup = (
  commit: (items: Item[]) => Promise<void> = async () => undefined
): {
  queue: PendingCompletionQueue<Item>;
  commit: jest.Mock;
  onError: jest.Mock;
  changes: () => number;
} => {
  const queue = new PendingCompletionQueue<Item>(DELAY);
  const commitMock = jest.fn(commit);
  const onError = jest.fn();
  queue.setHandlers({ commit: commitMock, onError });
  let changes = 0;
  queue.subscribe(() => {
    changes += 1;
  });
  return { queue, commit: commitMock, onError, changes: () => changes };
};

/** Lets the flush promise chain settle under fake timers. */
const settle = async (): Promise<void> => {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
};

describe('PendingCompletionQueue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('shows a tick as done at once but saves only when the window closes', async () => {
    const { queue, commit } = setup();
    queue.add([{ id: 'a' }]);
    expect(queue.getSnapshot().pending).toEqual([{ id: 'a' }]);
    expect(queue.isDone('a')).toBe(true);

    jest.advanceTimersByTime(DELAY - 1);
    expect(commit).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(commit).toHaveBeenCalledWith([{ id: 'a' }]);
    expect(queue.getSnapshot().pending).toEqual([]);
    expect(queue.getSnapshot().saving).toEqual([{ id: 'a' }]);

    await settle();
    expect(queue.getSnapshot().saving).toEqual([]);
    expect(queue.isDone('a')).toBe(false);
  });

  it('never saves an undone batch', () => {
    const { queue, commit } = setup();
    queue.add([{ id: 'a' }, { id: 'b' }]);
    expect(queue.undo()).toEqual([{ id: 'a' }, { id: 'b' }]);
    jest.advanceTimersByTime(DELAY * 2);
    expect(commit).not.toHaveBeenCalled();
    expect(queue.getSnapshot().pending).toEqual([]);
  });

  it('undoes one item and still saves the rest on time', () => {
    const { queue, commit } = setup();
    queue.add([{ id: 'a' }, { id: 'b' }]);
    expect(queue.undoOne('a')).toBe(true);
    expect(queue.undoOne('missing')).toBe(false);
    jest.advanceTimersByTime(DELAY);
    expect(commit).toHaveBeenCalledWith([{ id: 'b' }]);
  });

  it('cancels the timer when the last item is undone', () => {
    const { queue, commit } = setup();
    queue.add([{ id: 'a' }]);
    queue.undoOne('a');
    jest.advanceTimersByTime(DELAY);
    expect(commit).not.toHaveBeenCalled();
  });

  it('saves the waiting batch before opening a new window', () => {
    const { queue, commit } = setup();
    queue.add([{ id: 'a' }]);
    queue.add([{ id: 'b' }]);
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith([{ id: 'a' }]);
    expect(queue.undo()).toEqual([{ id: 'b' }]);
  });

  it('ignores a second tick on something already done', () => {
    const { queue } = setup();
    queue.add([{ id: 'a' }]);
    queue.add([{ id: 'a' }]);
    expect(queue.getSnapshot().pending).toEqual([{ id: 'a' }]);
  });

  it('saves straight away on flush (leaving the tab, app backgrounded)', async () => {
    const { queue, commit } = setup();
    queue.add([{ id: 'a' }]);
    await queue.flush();
    expect(commit).toHaveBeenCalledWith([{ id: 'a' }]);
    jest.advanceTimersByTime(DELAY);
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('does nothing on flush with nothing waiting', async () => {
    const { queue, commit } = setup();
    await queue.flush();
    expect(commit).not.toHaveBeenCalled();
  });

  it('reports a failed save and clears it from the done list', async () => {
    const failure = new Error('offline and queue full');
    const { queue, onError } = setup(async () => {
      throw failure;
    });
    queue.add([{ id: 'a' }]);
    await queue.flush();
    expect(onError).toHaveBeenCalledWith([{ id: 'a' }], failure);
    expect(queue.isDone('a')).toBe(false);
  });

  it('notifies subscribers with a new snapshot on every change', () => {
    const { queue, changes } = setup();
    const before = queue.getSnapshot();
    queue.add([{ id: 'a' }]);
    expect(changes()).toBe(1);
    expect(queue.getSnapshot()).not.toBe(before);
  });
});
