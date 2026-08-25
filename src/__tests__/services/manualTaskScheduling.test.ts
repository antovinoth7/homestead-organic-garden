import { isSyncOwnedTemplate } from '@/services/taskSchedulingLogic';
import { makeTaskTemplate } from '../fixtures/task.fixtures';

describe('isSyncOwnedTemplate', () => {
  it('treats a template with no source as sync-owned', () => {
    // Backwards compatibility: every template written before the field existed
    // was already being reconciled by syncCareTasksForPlant.
    expect(isSyncOwnedTemplate(makeTaskTemplate())).toBe(true);
  });

  it('treats an explicit auto template as sync-owned', () => {
    expect(isSyncOwnedTemplate(makeTaskTemplate({ source: 'auto' }))).toBe(true);
  });

  it('treats a null source as sync-owned', () => {
    expect(isSyncOwnedTemplate(makeTaskTemplate({ source: null }))).toBe(true);
  });

  it('excludes a manually-created template from sync', () => {
    expect(isSyncOwnedTemplate(makeTaskTemplate({ source: 'manual' }))).toBe(false);
  });
});
