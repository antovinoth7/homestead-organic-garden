import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS } from '@/lib/storage';
import { getFarmConfig } from '@/services/farmCapacity';
import { logger } from '@/utils/logger';

export type OnboardingStatus = 'loading' | 'needed' | 'complete';

export interface UseOnboardingStatusResult {
  status: OnboardingStatus;
  markComplete: () => Promise<void>;
}

/**
 * Decides whether the first-run onboarding flow should be shown.
 *
 * Onboarding is shown only when the persisted flag is absent AND the user has no
 * prior farm configuration. Existing users (who already saved a FarmConfig, i.e.
 * it carries `updated_at`) are auto-marked complete so they never see onboarding.
 */
export function useOnboardingStatus(): UseOnboardingStatusResult {
  const [status, setStatus] = useState<OnboardingStatus>('loading');

  const markComplete = useCallback(async () => {
    try {
      await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, 'true');
    } catch (error) {
      logger.warn('Failed to persist onboarding flag', error as Error);
    }
    setStatus('complete');
  }, []);

  useEffect(() => {
    let active = true;

    const resolve = async (): Promise<void> => {
      try {
        const flag = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
        if (flag === 'true') {
          if (active) setStatus('complete');
          return;
        }

        // Returning user who configured the farm before onboarding existed.
        const config = await getFarmConfig();
        if (config?.updated_at) {
          await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, 'true');
          if (active) setStatus('complete');
          return;
        }

        if (active) setStatus('needed');
      } catch (error) {
        // On failure, don't trap the user behind onboarding — let them into the app.
        logger.warn('Failed to resolve onboarding status', error as Error);
        if (active) setStatus('complete');
      }
    };

    void resolve();
    return () => {
      active = false;
    };
  }, []);

  return { status, markComplete };
}
