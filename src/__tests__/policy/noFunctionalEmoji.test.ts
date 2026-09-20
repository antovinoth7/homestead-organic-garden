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
const EMOJI = /\p{Extended_Pictographic}/u;
const ALLOWED_DATA_PATHS = [
  'config/pests/',
  'config/diseases/',
  'config/organicInputs/',
  'utils/plantHelpers.ts',
  'utils/logger.ts',
];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.test.tsx')
      ? [path]
      : [];
  });
}

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

describe('functional UI emoji policy', () => {
  it('keeps Unicode emoji out of source except backward-compatible catalog data', () => {
    const violations = sourceFiles(SOURCE_ROOT).flatMap((path) => {
      const repoPath = relative(SOURCE_ROOT, path).split(sep).join('/');
      if (ALLOWED_DATA_PATHS.some((allowed) => repoPath.startsWith(allowed))) return [];
      const lines = withoutComments(readFileSync(path, 'utf8')).split(/\r?\n/);
      return lines.flatMap((line, index) =>
        EMOJI.test(line) ? [`${repoPath}:${index + 1}`] : []
      );
    });

    expect(violations).toEqual([]);
  });
});
