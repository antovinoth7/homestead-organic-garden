import { buildPestDiseasePickerRows } from '@/utils/pestDiseasePickerRows';
import type { PestDiseasePickerGroup } from '@/utils/pestDiseasePickerRows';
import type { PestEntry } from '@/types/database.types';

function pest(id: string, name: string, extra: Partial<PestEntry> = {}): PestEntry {
  return {
    id,
    name,
    category: 'sap_sucking',
    emoji: '🐛',
    identification: '',
    damageDescription: '',
    organicPrevention: [],
    organicTreatments: [],
    plantsAffected: [],
    ...extra,
  };
}

const GROUPS: PestDiseasePickerGroup[] = [
  {
    label: 'Sap-Sucking',
    entries: [
      pest('aphids', 'Aphids', { scientificName: 'Aphidoidea' }),
      pest('whitefly', 'Spiralling Whitefly'),
    ],
  },
  { label: 'Mites & Spiders', entries: [pest('red-mite', 'Red Spider Mite')] },
];

describe('buildPestDiseasePickerRows', () => {
  it('puts a header above each group, in group order', () => {
    const rows = buildPestDiseasePickerRows(GROUPS, [], '');

    expect(rows.map((row) => (row.kind === 'label' ? `# ${row.label}` : row.entry.name))).toEqual([
      '# Sap-Sucking',
      'Aphids',
      'Spiralling Whitefly',
      '# Mites & Spiders',
      'Red Spider Mite',
    ]);
  });

  it('carries the group label onto each entry row for its badge', () => {
    const rows = buildPestDiseasePickerRows(GROUPS, [], 'mite');
    const entry = rows.find((row) => row.kind === 'entry');

    expect(entry?.kind === 'entry' && entry.categoryLabel).toBe('Mites & Spiders');
  });

  it('hides names already linked, case-insensitively', () => {
    const rows = buildPestDiseasePickerRows(GROUPS, ['aphids', ' Red Spider Mite '], '');

    expect(rows.map((row) => row.key)).toEqual(['label:Sap-Sucking', 'whitefly']);
  });

  it('matches the query against name and scientific name, and drops emptied headers', () => {
    expect(buildPestDiseasePickerRows(GROUPS, [], 'aphidoidea').map((row) => row.key)).toEqual([
      'label:Sap-Sucking',
      'aphids',
    ]);
    expect(buildPestDiseasePickerRows(GROUPS, [], 'nothing')).toEqual([]);
  });
});
