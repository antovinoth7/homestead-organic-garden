/**
 * Delayed save for one-tap completions.
 *
 * Ticking a task on the Care Plan marks it done on screen at once, but the save
 * (task log, next due date, plant last-care stamp, bed stamp, one-shot archive)
 * only runs once the Undo window closes. Undo inside the window therefore never
 * has to reverse a write — it just drops the batch. Anything that ends the
 * window early (leaving the tab, the app going to the background, a second tick)
 * saves straight away instead.
 *
 * Pure TypeScript with an external-store interface, so React subscribes through
 * `useSyncExternalStore` and the timing is unit-testable with fake timers.
 */

export interface PendingCompletionSnapshot<T> {
  /** Inside the Undo window — shown as done, can still be undone. */
  pending: readonly T[];
  /** Being saved right now — shown as done, no longer undoable. */
  saving: readonly T[];
}

export interface PendingCompletionHandlers<T> {
  /** Saves a batch. Throwing hands the batch to `onError`. */
  commit: (items: T[]) => Promise<void>;
  onError?: (items: T[], error: unknown) => void;
}

export class PendingCompletionQueue<T extends { id: string }> {
  private batch: T[] = [];
  private inFlight: T[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<() => void>();
  private handlers: PendingCompletionHandlers<T> | null = null;
  private snapshot: PendingCompletionSnapshot<T> = { pending: [], saving: [] };

  constructor(private readonly delayMs: number) {}

  setHandlers(handlers: PendingCompletionHandlers<T>): void {
    this.handlers = handlers;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): PendingCompletionSnapshot<T> => this.snapshot;

  /**
   * Starts a new Undo window for `items`. A batch still waiting is saved first:
   * one Undo can only ever take back the latest tick, never work the farmer has
   * since moved on from.
   */
  add(items: T[]): void {
    const fresh = items.filter((item) => !this.isDone(item.id));
    if (fresh.length === 0) return;
    void this.flush();
    this.batch = fresh;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, this.delayMs);
    this.emit();
  }

  /** Drops the whole waiting batch. Returns what was undone. */
  undo(): T[] {
    const undone = this.batch;
    if (undone.length === 0) return [];
    this.clearTimer();
    this.batch = [];
    this.emit();
    return undone;
  }

  /** Drops one waiting item; the rest of its batch still saves on time. */
  undoOne(id: string): boolean {
    const next = this.batch.filter((item) => item.id !== id);
    if (next.length === this.batch.length) return false;
    this.batch = next;
    if (next.length === 0) this.clearTimer();
    this.emit();
    return true;
  }

  /** True while an item is waiting or being saved. */
  isDone(id: string): boolean {
    return (
      this.batch.some((item) => item.id === id) || this.inFlight.some((item) => item.id === id)
    );
  }

  /** Saves the waiting batch now. Resolves once the save has settled. */
  async flush(): Promise<void> {
    const items = this.batch;
    if (items.length === 0) return;
    this.clearTimer();
    this.batch = [];
    this.inFlight = [...this.inFlight, ...items];
    this.emit();
    try {
      if (!this.handlers) throw new Error('No commit handler registered');
      await this.handlers.commit(items);
    } catch (error) {
      this.handlers?.onError?.(items, error);
    } finally {
      const ids = new Set(items.map((item) => item.id));
      this.inFlight = this.inFlight.filter((item) => !ids.has(item.id));
      this.emit();
    }
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private emit(): void {
    this.snapshot = { pending: this.batch, saving: this.inFlight };
    for (const listener of this.listeners) listener();
  }
}
