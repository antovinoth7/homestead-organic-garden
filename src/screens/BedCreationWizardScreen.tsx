import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useBedCreationWizard } from '@/hooks/useBedCreationWizard';
import { createStyles } from '@/styles/bedCreationWizardStyles';
import DiscardChangesModal from '@/components/modals/DiscardChangesModal';
import type {
  BedCreationWizardNavigationProp,
  BedCreationWizardRouteProp,
} from '@/types/navigation.types';

// Step components
import { BedTypeStep } from './BedWizardSteps/BedTypeStep';
import { LandConditionsStep } from './BedWizardSteps/LandConditionsStep';
import { BedSizeStep } from './BedWizardSteps/BedSizeStep';
import { GuildTemplateStep } from './BedWizardSteps/GuildTemplateStep';
import { BedLayoutStep } from './BedWizardSteps/BedLayoutStep';
import { BedConfirmStep } from './BedWizardSteps/BedConfirmStep';
import { BedSuccessStep } from './BedWizardSteps/BedSuccessStep';

const STEP_LABELS = ['Crop Type', 'Your Land', 'Bed Size', 'Crops', 'Arrange', 'Review', 'Done'];
// Maps display indices (0–5) to actual wizard step numbers
const VISIBLE_STEPS = [1, 2, 3, 4, 5, 6] as const;

export default function BedCreationWizardScreen(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BedCreationWizardNavigationProp>();
  const route = useRoute<BedCreationWizardRouteProp>();
  const prefillType = route.params?.prefillType;

  const wizard = useBedCreationWizard(prefillType);
  const scrollViewRef = useRef<ScrollView>(null);
  const [discardVisible, setDiscardVisible] = useState(false);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [wizard.currentStep]);

  const requestExit = useCallback((): boolean => {
    if (wizard.currentStep === 7) {
      navigation.goBack();
      return true;
    }
    if (wizard.isDirty) {
      setDiscardVisible(true);
      return true;
    }
    navigation.goBack();
    return true;
  }, [wizard.currentStep, wizard.isDirty, navigation]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', requestExit);
      return () => sub.remove();
    }, [requestExit])
  );

  // Consume resolvedEntry handed back by PlantFormScreen after in-form create
  useEffect(() => {
    const resolved = route.params?.resolvedEntry;
    if (!resolved) return;
    wizard.applyResolvedEntry(resolved.wizardEntryId, resolved.plantId);
    navigation.setParams({ resolvedEntry: undefined });
    // wizard.applyResolvedEntry is stable; intentionally not depended on
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.resolvedEntry]);

  const handleSubmit = async (): Promise<void> => {
    if (wizard.submitting) return;
    const bedId = await wizard.submit();
    if (!bedId) {
      Alert.alert('Error', 'Failed to save bed. Check your connection and try again.');
    }
  };

  const handleCreateInForm = async (entryId: string, variety: string | null): Promise<void> => {
    const entry = wizard.stepData[4]?.plant_entries.find((e) => e.id === entryId);
    if (!entry) return;
    const s1 = wizard.stepData[1];
    const s2 = wizard.stepData[2];
    if (!s1?.bed_type || !s2?.name?.trim()) {
      Alert.alert('Bed name required', 'Please complete Step 2 and name your bed first.');
      return;
    }
    try {
      const bedId = await wizard.ensureBedSaved();
      navigation.navigate('Plants', {
        screen: 'PlantForm',
        params: {
          prefill: {
            name: entry.name,
            variety,
            bedId,
            bedName: s2.name.trim(),
            bedLayer: entry.layer,
            spacingCm: entry.spacingCm,
            sunlight: s2?.sunlight,
            parentLocation: s2?.parent_location ?? undefined,
            childLocation: s2?.child_location ?? undefined,
          },
          returnTo: { wizardEntryId: entryId },
        },
      });
    } catch (err) {
      Alert.alert(
        'Error',
        `Failed to save bed before opening plant form: ${(err as Error).message}`
      );
    }
  };

  const renderStep = (): React.JSX.Element => {
    switch (wizard.currentStep) {
      case 1:
        return <BedTypeStep data={wizard.stepData[1]!} onChange={wizard.setStep1} />;
      case 2:
        return (
          <LandConditionsStep
            data={wizard.stepData[2]!}
            onChange={wizard.setStep2}
            solanaceaeBlocked={wizard.solanaceaeBlocked}
            parentOptions={wizard.locationConfig.parentLocations}
            childOptions={wizard.locationConfig.childLocations}
            locationsLoading={wizard.locationLoading}
            bedType={wizard.stepData[1]?.bed_type ?? null}
          />
        );
      case 3:
        return (
          <BedSizeStep
            data={wizard.stepData[3]!}
            onChange={wizard.setStep3}
            bedType={wizard.stepData[1]?.bed_type}
            step2={wizard.stepData[2]}
          />
        );
      case 4:
        return (
          <GuildTemplateStep
            bedType={wizard.stepData[1]?.bed_type ?? null}
            data={wizard.stepData[4] ?? { plant_entries: [] }}
            onChange={wizard.setStep4}
            step2={wizard.stepData[2]}
            step3={wizard.stepData[3]}
          />
        );
      case 5:
        return (
          <BedLayoutStep
            bedType={wizard.stepData[1]?.bed_type ?? null}
            step2={wizard.stepData[2]}
            step3={wizard.stepData[3]!}
            step4={wizard.stepData[4] ?? { plant_entries: [] }}
            solanaceaeBlocked={wizard.solanaceaeBlocked}
            onChangePlants={wizard.setStep4}
            onCreateInFormForEntry={handleCreateInForm}
          />
        );
      case 6:
        return (
          <BedConfirmStep
            stepData={wizard.stepData}
            data={wizard.stepData[6] ?? { notes: '' }}
            onChange={wizard.setStep6}
          />
        );
      case 7:
        return <BedSuccessStep onDone={() => navigation.navigate('BedList')} />;
      default:
        return <BedSuccessStep onDone={() => navigation.navigate('BedList')} />;
    }
  };

  const isLastInputStep = wizard.currentStep === 6;
  const isSuccess = wizard.currentStep === 7;

  return (
    <View style={styles.container}>
      {/* Header */}
      {!isSuccess && (
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={requestExit} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.textInverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Bed</Text>
          <View style={styles.headerSpacer} />
        </View>
      )}

      {/* Progress stepper */}
      {!isSuccess && (
        <View style={styles.progressContainer}>
          <View style={styles.stepRow}>
            {STEP_LABELS.slice(0, 6).map((label, i) => {
              const step = VISIBLE_STEPS[i]!;
              const currentIdx = VISIBLE_STEPS.indexOf(
                wizard.currentStep as (typeof VISIBLE_STEPS)[number]
              );
              const isActive = step === wizard.currentStep;
              const isComplete = currentIdx > i;
              return (
                <React.Fragment key={label}>
                  <View style={styles.stepCol}>
                    <View
                      style={[
                        styles.stepCircle,
                        isActive && styles.stepCircleActive,
                        isComplete && styles.stepCircleComplete,
                      ]}
                    >
                      {isComplete ? (
                        <Ionicons name="checkmark" size={14} color={theme.primary} />
                      ) : (
                        <Text
                          style={[styles.stepCircleText, isActive && styles.stepCircleTextActive]}
                        >
                          {i + 1}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.progressLabel,
                        isActive && styles.progressLabelActive,
                        isComplete && styles.progressLabelComplete,
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                  {i < 5 && (
                    <View
                      style={[styles.stepConnector, isComplete && styles.stepConnectorFilled]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>
      )}

      {/* Step content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.stepContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep()}
      </ScrollView>

      {/* Solanaceae block banner — sits above the footer, not inline with buttons */}
      {!isSuccess && wizard.solanaceaeBlocked && wizard.currentStep === 2 && (
        <View style={styles.blockedBanner}>
          <Ionicons name="warning" size={18} color={theme.error} />
          <Text style={styles.blockedBannerText}>
            Solanaceae was planted here — choose a different previous crop to continue.
          </Text>
        </View>
      )}

      {/* Navigation buttons */}
      {!isSuccess && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {wizard.currentStep > 1 ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={wizard.goBack}
              accessibilityLabel="Back to previous step"
            >
              <Ionicons name="arrow-back" size={18} color="#fff" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          {isLastInputStep ? (
            <TouchableOpacity
              style={[
                styles.nextButton,
                (!wizard.canProceed || wizard.submitting) && styles.nextButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!wizard.canProceed || wizard.submitting}
              accessibilityLabel="Save bed"
            >
              {wizard.submitting ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.nextText}>Saving…</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.nextText}>Save Bed</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, !wizard.canProceed && styles.nextButtonDisabled]}
              onPress={wizard.goNext}
              disabled={!wizard.canProceed}
              accessibilityLabel="Next step"
            >
              <Text style={styles.nextText}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <DiscardChangesModal
        visible={discardVisible}
        styles={styles}
        onKeepEditing={() => setDiscardVisible(false)}
        onDiscard={() => {
          setDiscardVisible(false);
          navigation.goBack();
        }}
      />
    </View>
  );
}
