import type { CareFormState } from '@/utils/catalogDraft';

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
