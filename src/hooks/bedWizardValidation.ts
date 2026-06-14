import type { WizardStep, WizardStepData } from '@/hooks/useBedCreationWizard';

// ─── Per-step validation ──────────────────────────────────────────────────────
//
// Pure, Firebase-free helpers so they can be unit-tested in isolation. The hook
// wires these to the live step data; the screen renders `blockReasonForStep`
// next to the disabled Next button.

export function canProceedStep(step: WizardStep, data: Partial<WizardStepData>): boolean {
  switch (step) {
    case 1:
      return !!data[1]?.bed_type;
    case 2: {
      const s2 = data[2];
      if (!s2) return false;
      if (!s2.name?.trim()) return false;
      if (s2.prev_crop_family === 'solanaceae') return false;
      return true;
    }
    case 3: {
      const s3 = data[3];
      return !!s3 && s3.width_m > 0 && s3.length_m > 0;
    }
    case 4:
      return (data[4]?.plant_entries.length ?? 0) > 0; // at least one crop required
    case 5:
      return true; // layout designer — always proceed
    case 6:
      return true; // notes optional; name was validated in Step 2
    default:
      return false;
  }
}

/**
 * Human-readable explanation of why the current step can't advance yet, or null
 * when it's valid. Surfaced inline next to the disabled Next button so the user
 * isn't left guessing. `directionMissing` is computed in the hook (location-aware).
 */
export function blockReasonForStep(
  step: WizardStep,
  data: Partial<WizardStepData>,
  directionMissing: boolean
): string | null {
  if (canProceedStep(step, data) && !directionMissing) return null;
  switch (step) {
    case 1:
      return 'Choose a crop type to continue.';
    case 2: {
      const s2 = data[2];
      if (!s2?.name?.trim()) return 'Enter a bed name to continue.';
      if (s2.prev_crop_family === 'solanaceae')
        return 'Solanaceae was planted here — choose a different previous crop to continue.';
      if (directionMissing) return 'Choose a section/direction to continue.';
      return null;
    }
    case 3:
      return 'Enter a width and length greater than 0.';
    case 4:
      return 'Add at least one crop to continue.';
    default:
      return null;
  }
}
