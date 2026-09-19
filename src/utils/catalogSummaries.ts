import type { CareFormState } from '@/utils/catalogDraft';
import type { NumericRange } from '@/types/database.types';
import { harvestRangeInYears } from '@/utils/growSpecFormat';

/**
 * Collapsed-card summary lines. Each section shows a one-line digest of what it
 * holds, falling back to a description of the section when nothing is filled.
 */

export function joinSummary(parts: (string | null | undefined)[]): string | undefined {
  const values = parts.map((part) => part?.trim()).filter((part): part is string => Boolean(part));

  return values.length > 0 ? values.join(' • ') : undefined;
}

export function formatRangeLabel(min: string, max: string, unit: string): string | undefined {
  if (min && max) return `${min}-${max} ${unit}`;
  if (min) return `From ${min} ${unit}`;
  if (max) return `Up to ${max} ${unit}`;
  return undefined;
}

export function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Display labels resolved by the caller from the label maps. */
export interface SummaryLabels {
  lifecycleLabel?: string;
  waterRequirementLabel?: string;
  sunlightLabel?: string;
  heatToleranceLabel?: string;
  droughtToleranceLabel?: string;
  growthStageLabel?: string;
}

export function plantInfoSummary(
  careForm: CareFormState | null,
  labels: SummaryLabels
): string {
  return (
    joinSummary([
      careForm?.scientificName,
      labels.lifecycleLabel,
      careForm?.tamilName ? `Tamil: ${careForm.tamilName}` : undefined,
    ]) ?? 'Name, identity, and description'
  );
}

export function coreCareSummary(careForm: CareFormState | null, labels: SummaryLabels): string {
  return (
    joinSummary([
      labels.waterRequirementLabel,
      careForm?.wateringFrequencyDays
        ? `Water every ${careForm.wateringFrequencyDays} days`
        : undefined,
      labels.sunlightLabel,
    ]) ?? 'Water, sunlight, and soil defaults'
  );
}

export function growingInfoSummary(careForm: CareFormState | null): string {
  return (
    joinSummary([
      careForm?.growingSeason,
      formatRangeLabel(careForm?.daysToHarvestMin ?? '', careForm?.daysToHarvestMax ?? '', 'days'),
      careForm?.spacingCm ? `Spacing ${careForm.spacingCm} cm` : undefined,
    ]) ?? 'Harvest timing, spacing, and germination'
  );
}

export function toleranceSummary(labels: SummaryLabels, petToxicity?: boolean): string {
  return (
    joinSummary([
      labels.heatToleranceLabel ? `Heat ${labels.heatToleranceLabel}` : undefined,
      labels.droughtToleranceLabel ? `Drought ${labels.droughtToleranceLabel}` : undefined,
      petToxicity !== undefined ? (petToxicity ? 'Pet toxic' : 'Pet safe') : undefined,
    ]) ?? 'Stress tolerance and safety info'
  );
}

export function pruningSummary(careForm: CareFormState | null, tipsCount: number): string {
  return (
    joinSummary([
      careForm?.pruningFrequencyDays ? `Every ${careForm.pruningFrequencyDays} days` : undefined,
      tipsCount > 0 ? formatCount(tipsCount, 'tip') : undefined,
      careForm?.shapePruningTip ? 'Shape pruning' : undefined,
    ]) ?? 'Timing and pruning guidance'
  );
}

export function plantingSummary(growthStageLabel?: string): string {
  return growthStageLabel ? `Starts at ${growthStageLabel}` : 'Default growth stage';
}

export function pestsSummary(count: number): string {
  return count > 0 ? formatCount(count, 'linked pest', 'linked pests') : 'No linked pests';
}

export function diseasesSummary(count: number): string {
  return count > 0
    ? formatCount(count, 'linked disease', 'linked diseases')
    : 'No linked diseases';
}

export function varietiesSummary(count: number): string {
  return count > 0
    ? formatCount(count, 'saved variety', 'saved varieties')
    : 'No saved varieties';
}

/**
 * Sub-line for a catalog browse row.
 *
 * Description first: it has the widest coverage in the bundled catalog and is
 * what actually separates near-duplicates (Brinjal from Long Brinjal). Only
 * about six in ten bundled plants carry a variety list, so leading with the
 * variety count would leave the line blank on a large minority of rows.
 * Returns undefined when a plant has neither — the row keeps its height.
 */
export function buildCatalogSubtitle(
  description: string | undefined,
  varietyCount: number
): string | undefined {
  const trimmed = description?.trim();
  if (trimmed) return trimmed;
  if (varietyCount > 0) return formatCount(varietyCount, 'variety', 'varieties');
  return undefined;
}

/**
 * Meta line for a catalog browse row, preferred over the description.
 *
 * The row gives this one truncated line, and a description spends it on prose
 * the reader cannot finish — "Wax-coated trailing cucurbit used in…" poses a
 * question instead of answering one. A grower scanning the catalog wants a
 * fact they can compare between rows, so lead with the harvest window, fall
 * back to how long the plant lives, and only then to the description.
 *
 * Returns undefined when a plant carries none of the three — the row keeps its
 * height either way.
 */
export function buildCatalogMetaLine(
  daysToHarvest: NumericRange | undefined,
  lifecycleLabel: string | undefined,
  description: string | undefined,
  varietyCount: number
): string | undefined {
  const days = formatDaysToHarvest(daysToHarvest);
  if (days) return days;
  if (lifecycleLabel) return lifecycleLabel;
  return buildCatalogSubtitle(description, varietyCount);
}

/**
 * "55–70 days", or "55 days" when the range has collapsed to a point. A wait
 * of a year or more reads in years instead: "12–15 years", not "4380–5475 days".
 */
function formatDaysToHarvest(range: NumericRange | undefined): string | undefined {
  if (!range) return undefined;
  if (!Number.isFinite(range.min) || !Number.isFinite(range.max)) return undefined;
  const years = harvestRangeInYears(range);
  const { min, max } = years ?? range;
  const unit = years ? (max === 1 ? 'year' : 'years') : 'days';
  // An en dash, matching how the app writes every other range.
  return min === max ? `${min} ${unit}` : `${min}–${max} ${unit}`;
}
