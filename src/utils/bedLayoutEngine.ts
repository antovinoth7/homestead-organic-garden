import type { Bed, BedPosition, Plant } from '@/types/database.types';

const DEFAULT_SPACING_CM = 30;
const MAX_PLACEMENT_ATTEMPTS = 50;

/**
 * Computes the minimum separation (as a 0–1 fraction) between two plants
 * based on their spacing_cm relative to bed dimensions (in cm).
 */
function getMinSeparation(
  spacingA: number,
  spacingB: number,
  bedWidthCm: number,
  bedLengthCm: number
): { dx: number; dy: number } {
  const avgSpacing = (spacingA + spacingB) / 2;
  return {
    dx: avgSpacing / bedWidthCm,
    dy: avgSpacing / bedLengthCm,
  };
}

/**
 * Checks whether a candidate position conflicts with any already-placed position.
 */
function hasOverlap(
  candidate: BedPosition,
  placed: { pos: BedPosition; spacing: number }[],
  spacingCm: number,
  bedWidthCm: number,
  bedLengthCm: number
): boolean {
  for (const other of placed) {
    const { dx, dy } = getMinSeparation(spacingCm, other.spacing, bedWidthCm, bedLengthCm);
    const distX = Math.abs(candidate.x - other.pos.x);
    const distY = Math.abs(candidate.y - other.pos.y);
    if (distX < dx && distY < dy) {
      return true;
    }
  }
  return false;
}

/**
 * Generates a pseudo-random position within the bed (margins 0.05–0.95)
 * using a deterministic seed-like approach based on index.
 */
function scatterPosition(index: number, _total: number): BedPosition {
  // Use golden ratio for quasi-random distribution
  const phi = (1 + Math.sqrt(5)) / 2;
  const x = ((index * phi) % 1) * 0.9 + 0.05;
  const y = ((index * phi * phi) % 1) * 0.9 + 0.05;
  return { x, y };
}

/**
 * Auto-arranges plants within a bed using a scatter algorithm.
 * Plants with existing `position_in_bed` are preserved.
 * Unpositioned plants are placed to avoid overlaps where possible.
 *
 * @returns Map of plantId → BedPosition (normalized 0–1)
 */
export function autoArrangePlants(plants: Plant[], bed: Bed): Map<string, BedPosition> {
  const result = new Map<string, BedPosition>();
  if (plants.length === 0) return result;

  const bedWidthCm = bed.dimensions.width_m * 100;
  const bedLengthCm = bed.dimensions.length_m * 100;

  // Collect already-placed plants first
  const placed: { pos: BedPosition; spacing: number }[] = [];
  const unpositioned: Plant[] = [];

  for (const plant of plants) {
    if (plant.position_in_bed) {
      result.set(plant.id, plant.position_in_bed);
      placed.push({
        pos: plant.position_in_bed,
        spacing: plant.spacing_cm ?? DEFAULT_SPACING_CM,
      });
    } else {
      unpositioned.push(plant);
    }
  }

  // Place remaining plants using scatter with overlap avoidance
  for (let i = 0; i < unpositioned.length; i++) {
    const plant = unpositioned[i]!;
    const spacing = plant.spacing_cm ?? DEFAULT_SPACING_CM;
    let bestPos = scatterPosition(i + placed.length, plants.length);
    let foundValid = false;

    for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
      const candidate = scatterPosition(i + placed.length + attempt * 7, plants.length + attempt);
      if (!hasOverlap(candidate, placed, spacing, bedWidthCm, bedLengthCm)) {
        bestPos = candidate;
        foundValid = true;
        break;
      }
    }

    // If no valid position found after max attempts, use the first scatter position
    if (!foundValid) {
      bestPos = scatterPosition(i + placed.length, plants.length);
    }

    result.set(plant.id, bestPos);
    placed.push({ pos: bestPos, spacing });
  }

  return result;
}

/**
 * Returns the display radius for a plant circle (in SVG units)
 * based on spacing relative to bed area.
 */
export function getPlantRadius(
  spacingCm: number | null | undefined,
  bedWidthCm: number,
  svgWidth: number
): number {
  const spacing = spacingCm ?? DEFAULT_SPACING_CM;
  const fraction = spacing / bedWidthCm;
  const radius = Math.max(12, Math.min(30, fraction * svgWidth * 0.4));
  return radius;
}
