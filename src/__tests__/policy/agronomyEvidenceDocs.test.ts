/**
 * The Today season card no longer prints its citations, so the audit document
 * is where a reader now checks what the planting guidance was reviewed against.
 * A document nobody's screen contradicts is a document that rots quietly — this
 * pins it to `TODAY_AGRONOMY_EVIDENCE`, which stays the source of truth because
 * `validUntil` is what withholds expired guidance at runtime.
 */

import { TODAY_AGRONOMY_EVIDENCE } from '@/config/tamilNaduPlantingCalendar';

const { readFileSync } = jest.requireActual('fs') as {
  readFileSync: (path: string, encoding: 'utf8') => string;
};
const { join } = jest.requireActual('path') as {
  join: (...parts: string[]) => string;
};

const AUDIT_DOC = join(process.cwd(), 'docs', 'tamil-nadu-reference-audit.md');

describe('Today agronomy evidence is mirrored in the audit document', () => {
  const doc = readFileSync(AUDIT_DOC, 'utf8');
  const entries = Object.values(TODAY_AGRONOMY_EVIDENCE);

  it('has evidence to document', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries.map((entry) => [entry.id, entry] as const))(
    'documents %s with its title, URL and review date',
    (_id, entry) => {
      expect(doc).toContain(entry.id);
      expect(doc).toContain(entry.title);
      expect(doc).toContain(entry.url);
      expect(doc).toContain(entry.reviewedOn);
      expect(doc).toContain(entry.validUntil);
      expect(doc).toContain(entry.scope);
    }
  );

  it('names the registry as the source of truth', () => {
    expect(doc).toContain('TODAY_AGRONOMY_EVIDENCE');
  });
});
