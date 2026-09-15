import { getTamilNaduPlantingWindows } from '@/config/tamilNaduPlantingCalendar';
import type { TamilNaduPlantingRule } from '@/config/tamilNaduPlantingCalendar';
import { getTaxonomy } from '@/config/plants/catalogTaxonomy';
import { comparePlantNames } from '@/utils/plantSort';
import type { CatalogListItem } from '@/utils/catalogListItems';
import type { AgroClimaticZoneId } from '@/config/zones';

/**
 * What the Sow Now view shows, or why it shows nothing.
 *
 * `message` is set when there is nothing to list — an empty list with no
 * explanation reads as a bug, and there are two quite different reasons for it.
 */
export interface SowNowView {
  items: CatalogListItem[];
  message: string | null;
}

/** Garden-plant counts keyed by plant name, for the row's count chip. */
type CountsByName = Readonly<Record<string, number>>;

function toRows(
  rules: readonly TamilNaduPlantingRule[],
  counts: CountsByName,
  closingNames: ReadonlySet<string>
): CatalogListItem[] {
  // One row per plant: a crop with a January and a July window is still one crop.
  const byName = new Map<string, TamilNaduPlantingRule>();
  for (const rule of rules) {
    if (!byName.has(rule.plantName)) byName.set(rule.plantName, rule);
  }

  const sorted = [...byName.values()].sort((a, b) => comparePlantNames(a.plantName, b.plantName));
  return sorted.map((rule, index) => {
    const action = rule.action === 'transplant' ? 'Transplant' : 'Sow';
    const closing = closingNames.has(rule.plantName) ? ' · last month' : '';
    return {
      kind: 'browse' as const,
      name: rule.plantName,
      plantType: rule.plantType,
      habit: getTaxonomy(rule.plantName, rule.plantType).habit,
      count: counts[rule.plantName] ?? 0,
      subtitle: `${action} · ${rule.windowLabel}${closing}`,
      isFirst: index === 0,
      isLast: index === sorted.length - 1,
    };
  });
}

function section(
  title: string,
  rules: readonly TamilNaduPlantingRule[],
  counts: CountsByName,
  closingNames: ReadonlySet<string> = new Set()
): CatalogListItem[] {
  const rows = toRows(rules, counts, closingNames);
  if (rows.length === 0) return [];
  return [{ kind: 'section' as const, title, count: rows.length }, ...rows];
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * The catalog's Sow Now view: what can go in the ground this month, and what
 * opens next.
 *
 * A window closing at the end of the month is marked on its own row rather than
 * given a section — `getTamilNaduPlantingWindows` returns `closing` as a subset
 * of `current`, so a section would list those crops twice.
 *
 * Reads `getTamilNaduPlantingWindows`, which is the app's single source for
 * sowing windows — `kanyakumariPlantingCalendar` is only an adapter over it.
 *
 * Expect a short list. `TAMIL_NADU_PLANTING_RULES` deliberately covers only the
 * crops TNAU states a home-garden window for — 14 plants, all vegetables and
 * greens — because every rule carries `evidenceIds` and a `reviewStatus`, and an
 * earlier over-broad list was trimmed on purpose. Widening it is a sourced-data
 * task, not something this view should paper over.
 */
export function buildSowNowView(
  zoneId: AgroClimaticZoneId | null,
  counts: CountsByName,
  date: Date = new Date()
): SowNowView {
  if (!zoneId) {
    return {
      items: [],
      message: 'Set your farm location in Settings to see this month’s sowing windows.',
    };
  }

  const windows = getTamilNaduPlantingWindows(zoneId, date);

  if (windows.state === 'review_expired') {
    return {
      items: [],
      message:
        'The sowing windows are past their review date, so they are hidden rather than shown stale.',
    };
  }

  const nextMonth = MONTHS[windows.openingNextMonth - 1] ?? '';
  // `closing` is a subset of `current`, not a separate set — listing it as its
  // own section showed those crops twice. The urgency belongs on the row.
  const closingNames = new Set(windows.closing.map((rule) => rule.plantName));
  const items = [
    ...section('Sow now', windows.current, counts, closingNames),
    ...section(`Opens in ${nextMonth}`, windows.openingNext, counts),
  ];

  if (items.length === 0) {
    return {
      items: [],
      message: `No reviewed sowing window opens this month for your zone. Check back in ${nextMonth}.`,
    };
  }

  return { items, message: null };
}
