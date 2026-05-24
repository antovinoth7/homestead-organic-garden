import { getPreMonsoonTasks, getDaysToSWMonsoon } from '@/utils/preMonsoonTasks';

describe('Pre-Monsoon Task Scheduler', () => {
  describe('getDaysToSWMonsoon', () => {
    it('returns positive days when before June 1', () => {
      const may11 = new Date(2026, 4, 11); // May 11
      const days = getDaysToSWMonsoon(may11);
      expect(days).toBe(21);
    });

    it('returns 0 on June 1', () => {
      const jun1 = new Date(2026, 5, 1); // June 1
      const days = getDaysToSWMonsoon(jun1);
      expect(days).toBe(0);
    });

    it('returns negative after June 1', () => {
      const jun15 = new Date(2026, 5, 15); // June 15
      const days = getDaysToSWMonsoon(jun15);
      expect(days).toBeLessThan(0);
    });

    it('returns large positive early in the year', () => {
      const jan1 = new Date(2026, 0, 1);
      const days = getDaysToSWMonsoon(jan1);
      expect(days).toBeGreaterThan(100);
    });
  });

  describe('getPreMonsoonTasks', () => {
    it('returns 5 tasks when daysToSWMonsoon is exactly 21', () => {
      const tasks = getPreMonsoonTasks(21);
      expect(tasks).toHaveLength(5);
    });

    it('returns 5 tasks when daysToSWMonsoon is 1 (just before monsoon)', () => {
      const tasks = getPreMonsoonTasks(1);
      expect(tasks).toHaveLength(5);
    });

    it('returns 5 tasks when daysToSWMonsoon is 0 (monsoon day)', () => {
      const tasks = getPreMonsoonTasks(0);
      expect(tasks).toHaveLength(5);
    });

    it('returns empty array when daysToSWMonsoon is 22 (outside window)', () => {
      const tasks = getPreMonsoonTasks(22);
      expect(tasks).toHaveLength(0);
    });

    it('returns empty array when daysToSWMonsoon is negative (monsoon already started)', () => {
      const tasks = getPreMonsoonTasks(-5);
      expect(tasks).toHaveLength(0);
    });

    it('each task has required fields', () => {
      const tasks = getPreMonsoonTasks(10);
      tasks.forEach((task) => {
        expect(task.id).toBeTruthy();
        expect(task.title).toBeTruthy();
        expect(task.description).toBeTruthy();
        expect(task.icon).toBeTruthy();
        expect(task.category).toBeTruthy();
      });
    });

    it('task IDs are unique', () => {
      const tasks = getPreMonsoonTasks(15);
      const ids = tasks.map((t) => t.id);
      expect(new Set(ids).size).toBe(5);
    });

    it('tasks cover expected categories', () => {
      const tasks = getPreMonsoonTasks(10);
      const categories = tasks.map((t) => t.category);
      expect(categories).toContain('bed_prep');
      expect(categories).toContain('input');
      expect(categories).toContain('infrastructure');
      expect(categories).toContain('planting');
    });
  });
});
