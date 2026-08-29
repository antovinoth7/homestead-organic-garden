/**
 * Firestore hard-delete policy.
 *
 * A silent, automatic mass delete once emptied `task_templates`: the Care Plan's
 * orphan self-heal destroyed tasks whose bed was merely missing from a cached
 * `getBeds()` read. Nothing logged it, and no test covered it, so the loss only
 * surfaced when the collection was inspected by hand.
 *
 * This locks the blast radius down to a reviewed set of files. Adding a
 * `deleteDoc` or `batch.delete` anywhere else fails the suite, which forces the
 * question "what proves this record is really gone?" at review time rather than
 * after the data is destroyed.
 *
 * Adding a path here is allowed — but a destructive call belongs behind an
 * explicit user action or a positive existence check (`plantExists`-style, where
 * a thrown error means *do not delete*). Absence from a list is never evidence.
 */

interface DirectoryEntry {
  name: string;
  isDirectory: () => boolean;
}

const { readdirSync, readFileSync } = jest.requireActual('fs') as {
  readdirSync: (path: string, options: { withFileTypes: true }) => DirectoryEntry[];
  readFileSync: (path: string, encoding: 'utf8') => string;
};
const { join, relative, sep } = jest.requireActual('path') as {
  join: (...parts: string[]) => string;
  relative: (from: string, to: string) => string;
  sep: string;
};

const SOURCE_ROOT = join(process.cwd(), 'src');
const DESTRUCTIVE = /\bdeleteDoc\s*\(|\bbatch\s*\.\s*delete\s*\(/;

/**
 * Files permitted to delete Firestore documents. Each entry is a cascade behind
 * an explicit user action, or the offline queue replaying one.
 */
const ALLOWED_PATHS = [
  // Plant deletion cascade (delete / permanently delete / per-bed purge).
  'services/plants.ts',
  // Task + log cascades, called by the plant and bed deletion paths.
  'services/tasks.ts',
  // Journal entry deletion, user-initiated.
  'services/journal.ts',
  // Replays mutations already authorised when they were enqueued.
  'services/offlineSync.ts',
];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

describe('Firestore hard-delete policy', () => {
  it('confines document deletion to the reviewed cascade paths', () => {
    const violations = sourceFiles(SOURCE_ROOT).flatMap((path) => {
      const repoPath = relative(SOURCE_ROOT, path).split(sep).join('/');
      if (ALLOWED_PATHS.includes(repoPath)) return [];
      const lines = withoutComments(readFileSync(path, 'utf8')).split(/\r?\n/);
      return lines.flatMap((line, index) =>
        DESTRUCTIVE.test(line) ? [`${repoPath}:${index + 1}`] : []
      );
    });

    expect(violations).toEqual([]);
  });

  // Permanent delete removes the templates and the completion history; soft
  // delete keeps both, because the plant can be restored. Asserting on source
  // text is crude, but the service functions need a Firestore emulator to
  // exercise and this pins the distinction against an accidental revert.
  describe('plant deletion cascades', () => {
    const plantsSource = withoutComments(
      readFileSync(join(SOURCE_ROOT, 'services/plants.ts'), 'utf8')
    );

    /** Body of a top-level `export const <name> = async (...) => { … }`. */
    function functionBody(name: string): string {
      const start = plantsSource.indexOf(`export const ${name} =`);
      if (start === -1) throw new Error(`${name} not found in services/plants.ts`);
      const next = plantsSource.indexOf('\nexport const ', start + 1);
      return plantsSource.slice(start, next === -1 ? undefined : next);
    }

    it.each(['deletePlant', 'deletePlantsForBed'])(
      'soft delete (%s) disables tasks rather than deleting them',
      (name) => {
        const body = functionBody(name);
        expect(body).toContain('disableTasksForPlantIds');
        expect(body).not.toContain('deleteTasksForPlantIds');
      }
    );

    it.each(['permanentlyDeletePlant', 'permanentlyDeletePlantsForBed'])(
      'permanent delete (%s) cascades templates and history',
      (name) => {
        expect(functionBody(name)).toContain('deleteTasksForPlantIds');
      }
    );

    it.each(['restorePlant', 'restorePlantsForBed'])(
      'restore (%s) brings the care schedule back',
      (name) => {
        const body = functionBody(name);
        expect(
          body.includes('syncCareTasksForPlant') || body.includes('rebuildCareTasksForAllPlants')
        ).toBe(true);
      }
    );
  });

  it('keeps hooks and screens free of deletion cascades', () => {
    // The regression that motivated this policy lived in a hook, where a delete
    // ran on every screen load. Deletion belongs in the service layer, reached
    // through a named cascade — never inline in a data-loading effect.
    const uiViolations = sourceFiles(SOURCE_ROOT)
      .map((path) => relative(SOURCE_ROOT, path).split(sep).join('/'))
      .filter((repoPath) => repoPath.startsWith('hooks/') || repoPath.startsWith('screens/'))
      .filter((repoPath) => {
        const source = withoutComments(readFileSync(join(SOURCE_ROOT, repoPath), 'utf8'));
        return DESTRUCTIVE.test(source);
      });

    expect(uiViolations).toEqual([]);
  });
});
