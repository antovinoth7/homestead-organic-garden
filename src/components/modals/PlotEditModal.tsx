import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  KeyboardAvoidingView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VoiceDictation from '@/components/VoiceDictation';
import { LocationProfileEditor } from '@/components/LocationProfileEditor';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plotEditStyles';
import { SQM_PER_CENT } from '@/services/farmCapacity';
import { LocationProfile } from '@/types/database.types';
import { toLocalDateString } from '@/utils/dateHelpers';
import type { EditModalState } from '@/hooks/useLocationManager';

interface Props {
  editModal: EditModalState | null;
  editCount: number;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
  onDelete: () => void;
  onChangeValue: (text: string) => void;
  onChangeShortName: (text: string) => void;
  setEditModal: React.Dispatch<React.SetStateAction<EditModalState | null>>;
  updateProfile: (patch: Partial<LocationProfile>) => void;
}

const NOTES_LIMIT = 200;

const isValidLat = (v: string): boolean => {
  const n = parseFloat(v);
  return !isNaN(n) && n >= -90 && n <= 90;
};
const isValidLng = (v: string): boolean => {
  const n = parseFloat(v);
  return !isNaN(n) && n >= -180 && n <= 180;
};

const formatDateDisplay = (isoDate: string): string => {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const isSoilTestStale = (isoDate?: string | null): boolean => {
  if (!isoDate) return false;
  const tested = new Date(isoDate).getTime();
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  return Date.now() - tested > oneYear;
};

/**
 * Full-page editor for a farm plot: identity, soil profile, soil test and notes,
 * then delete — one scroll, no tabs, so nothing about a plot is hidden behind a
 * tap. Presented as a modal rather than a route so the edit draft can stay in
 * `useLocationManager` alongside the listing.
 */
export function PlotEditModal({
  editModal,
  editCount,
  saving,
  onSave,
  onClose,
  onDelete,
  onChangeValue,
  onChangeShortName,
  setEditModal,
  updateProfile,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [latText, setLatText] = useState('');
  const [lngText, setLngText] = useState('');
  const [latTouched, setLatTouched] = useState(false);
  const [lngTouched, setLngTouched] = useState(false);

  const visible = editModal?.type === 'parent';
  const profile = editModal?.profile ?? {};
  const landCents = profile.land_cents ?? 0;
  const notes = profile.notes ?? '';
  const isNew = editModal?.original === '';
  const isStale = isSoilTestStale(profile.lastSoilTestDate);

  // Seed the coordinate text boxes from the saved profile each time the editor
  // opens; they are local state so a half-typed value never round-trips.
  const editingKey = visible ? editModal?.original ?? '' : null;
  useEffect(() => {
    if (editingKey === null) return;
    const lat = editModal?.profile?.latitude;
    const lng = editModal?.profile?.longitude;
    setLatText(lat != null ? String(lat) : '');
    setLngText(lng != null ? String(lng) : '');
    setLatTouched(false);
    setLngTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingKey]);

  const handleLandCentsChange = useCallback(
    (delta: number) => {
      updateProfile({ land_cents: Math.max(0, landCents + delta) });
    },
    [landCents, updateProfile]
  );

  const handleDecrement = useCallback(() => handleLandCentsChange(-1), [handleLandCentsChange]);
  const handleIncrement = useCallback(() => handleLandCentsChange(1), [handleLandCentsChange]);

  // Commit on every keystroke, not on blur: a Save press does not blur the
  // focused input before the save handler reads state, so a blur-only commit
  // loses the last-typed field (longitude, typically).
  const handleLatChange = useCallback(
    (text: string) => {
      setLatText(text);
      if (text === '') {
        updateProfile({ latitude: null });
      } else if (isValidLat(text)) {
        updateProfile({ latitude: Math.round(parseFloat(text) * 1e6) / 1e6 });
      }
    },
    [updateProfile]
  );

  const handleLngChange = useCallback(
    (text: string) => {
      setLngText(text);
      if (text === '') {
        updateProfile({ longitude: null });
      } else if (isValidLng(text)) {
        updateProfile({ longitude: Math.round(parseFloat(text) * 1e6) / 1e6 });
      }
    },
    [updateProfile]
  );

  const handleLatBlur = useCallback(() => setLatTouched(true), []);
  const handleLngBlur = useCallback(() => setLngTouched(true), []);

  const handleNotesChange = useCallback(
    (text: string) => updateProfile({ notes: text.slice(0, NOTES_LIMIT) }),
    [updateProfile]
  );

  const openDatePicker = useCallback(
    () => setEditModal((prev) => (prev ? { ...prev, showDatePicker: true } : prev)),
    [setEditModal]
  );

  const handleDateChange = useCallback(
    (_: unknown, selectedDate?: Date) => {
      setEditModal((prev) =>
        prev
          ? {
              ...prev,
              showDatePicker: Platform.OS === 'ios',
              profile: {
                ...(prev.profile ?? {}),
                lastSoilTestDate: selectedDate
                  ? toLocalDateString(selectedDate)
                  : prev.profile?.lastSoilTestDate ?? null,
              },
            }
          : prev
      );
    },
    [setEditModal]
  );

  const latInvalid = latTouched && latText !== '' && !isValidLat(latText);
  const lngInvalid = lngTouched && lngText !== '' && !isValidLng(lngText);
  const sqmLabel = `${Math.round(landCents * SQM_PER_CENT).toLocaleString('en-IN')} sqm`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      hardwareAccelerated
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.page}
      >
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={18} color={theme.textInverse} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {isNew ? 'New farm plot' : 'Edit farm plot'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={onSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={[styles.saveButtonText, saving && styles.saveButtonTextDisabled]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 22) + 12 },
          ]}
        >
          {/* ── Identity ── */}
          <View style={styles.card}>
            <View style={[styles.fieldRow, styles.fieldRowFirst]}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={editModal?.value ?? ''}
                onChangeText={onChangeValue}
                placeholder="Kanyakumari Field"
                placeholderTextColor={theme.inputPlaceholder}
                autoCorrect={false}
                selectionColor={theme.primary}
              />
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Short name</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMono]}
                value={editModal?.shortName ?? ''}
                onChangeText={onChangeShortName}
                placeholder="KNK"
                placeholderTextColor={theme.inputPlaceholder}
                autoCorrect={false}
                autoCapitalize="characters"
                maxLength={5}
                selectionColor={theme.primary}
              />
            </View>
            <Text style={styles.shortNameHint}>
              Plants here are named like Tomato ({editModal?.shortName || 'KNK'})
            </Text>

            <View style={styles.cardDivider} />

            <View style={styles.fieldRow}>
              <View style={styles.sizeLabelWrap}>
                <Text style={styles.fieldLabel}>Size</Text>
                <Text style={styles.sizeSubtitle}>{sqmLabel}</Text>
              </View>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={handleDecrement}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease size by one cent"
                >
                  <Text style={styles.stepperButtonText}>−</Text>
                </TouchableOpacity>
                <View style={styles.stepperValueWrap}>
                  <Text style={styles.stepperValue}>{landCents}</Text>
                  <Text style={styles.stepperUnit}> cents</Text>
                </View>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={handleIncrement}
                  accessibilityRole="button"
                  accessibilityLabel="Increase size by one cent"
                >
                  <Text style={styles.stepperButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.coordRow}>
              <Text style={[styles.fieldLabel, styles.coordLabel]}>Coordinates</Text>
              <View style={styles.coordInputs}>
                <TextInput
                  style={[styles.coordInput, latInvalid && styles.coordInputError]}
                  value={latText}
                  onChangeText={handleLatChange}
                  onBlur={handleLatBlur}
                  keyboardType="decimal-pad"
                  placeholder="8.0883"
                  placeholderTextColor={theme.inputPlaceholder}
                  accessibilityLabel="Latitude"
                />
                <TextInput
                  style={[styles.coordInput, lngInvalid && styles.coordInputError]}
                  value={lngText}
                  onChangeText={handleLngChange}
                  onBlur={handleLngBlur}
                  keyboardType="decimal-pad"
                  placeholder="77.5500"
                  placeholderTextColor={theme.inputPlaceholder}
                  accessibilityLabel="Longitude"
                />
              </View>
            </View>
            <Text style={styles.coordTip}>
              Optional — Google Maps → long-press your plot → copy the coordinates.
            </Text>
          </View>

          {/* ── Soil profile ── */}
          {editModal && (
            <LocationProfileEditor editModal={editModal} updateProfile={updateProfile} />
          )}

          {/* ── Soil test + notes ── */}
          <View style={styles.card}>
            <TouchableOpacity style={styles.dateRow} onPress={openDatePicker}>
              <View style={styles.dateIconTile}>
                <Ionicons name="calendar" size={17} color={theme.primary} />
              </View>
              <View style={styles.dateContent}>
                <Text style={styles.dateLabel}>Last soil test</Text>
                <Text style={profile.lastSoilTestDate ? styles.dateValue : styles.datePlaceholder}>
                  {profile.lastSoilTestDate
                    ? formatDateDisplay(profile.lastSoilTestDate)
                    : 'Tap to select date'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
            </TouchableOpacity>

            {isStale && (
              <View style={styles.staleBanner}>
                <Ionicons name="warning-outline" size={14} color={theme.warningDark} />
                <Text style={styles.staleBannerText}>
                  Soil test is over 1 year old — consider retesting.
                </Text>
              </View>
            )}

            {editModal?.showDatePicker && (
              <DateTimePicker
                value={profile.lastSoilTestDate ? new Date(profile.lastSoilTestDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={handleDateChange}
              />
            )}

            <View style={styles.notesDivider} />

            <View style={styles.notesHeader}>
              <Text style={styles.notesLabel}>Notes</Text>
              <VoiceDictation value={notes} onChangeText={handleNotesChange} />
            </View>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. Floods during heavy rain, coconut shade after 2pm..."
              placeholderTextColor={theme.inputPlaceholder}
              value={notes}
              onChangeText={handleNotesChange}
              multiline
              maxLength={NOTES_LIMIT}
              selectionColor={theme.primary}
            />
            <Text style={styles.notesCounter}>
              {notes.length} / {NOTES_LIMIT}
            </Text>
          </View>

          {/* ── Delete ── */}
          {!isNew && (
            <>
              <TouchableOpacity style={styles.deleteCard} onPress={onDelete}>
                <View style={styles.deleteIconTile}>
                  <Ionicons name="trash-outline" size={16} color={theme.error} />
                </View>
                <View style={styles.deleteTextWrap}>
                  <Text style={styles.deleteTitle}>Delete plot</Text>
                  <Text style={styles.deleteSubtitle}>
                    {editCount > 0
                      ? `${editCount} plant${editCount === 1 ? '' : 's'} would need a new plot first`
                      : 'Nothing is planted here'}
                  </Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.usageLine}>
                Used by {editCount} plant{editCount === 1 ? '' : 's'}.
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
