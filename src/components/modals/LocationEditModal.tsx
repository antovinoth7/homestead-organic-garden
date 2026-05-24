import React, { useMemo, useState, useCallback } from 'react';
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
import FloatingLabelInput from '@/components/FloatingLabelInput';
import { LocationProfileEditor } from '@/components/LocationProfileEditor';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/locationModalStyles';
import { LocationProfile } from '@/types/database.types';
import type { EditModalState } from '@/hooks/useLocationManager';

interface Props {
  editModal: EditModalState | null;
  editCount: number;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
  onChangeValue: (text: string) => void;
  onChangeShortName: (text: string) => void;
  onChangeTab: (tab: 'name' | 'plot' | 'soil') => void;
  setEditModal: React.Dispatch<React.SetStateAction<EditModalState | null>>;
  updateProfile: (patch: Partial<LocationProfile>) => void;
}

const isValidLat = (v: string): boolean => {
  const n = parseFloat(v);
  return !isNaN(n) && n >= -90 && n <= 90;
};
const isValidLng = (v: string): boolean => {
  const n = parseFloat(v);
  return !isNaN(n) && n >= -180 && n <= 180;
};

export function LocationEditModal({
  editModal,
  editCount,
  saving,
  onSave,
  onClose,
  onChangeValue,
  onChangeShortName,
  onChangeTab,
  setEditModal,
  updateProfile,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [latText, setLatText] = useState('');
  const [lngText, setLngText] = useState('');
  const [latTouched, setLatTouched] = useState(false);
  const [lngTouched, setLngTouched] = useState(false);

  const landCents = editModal?.profile?.land_cents ?? 0;

  const syncCoords = useCallback(() => {
    const lat = editModal?.profile?.latitude;
    const lng = editModal?.profile?.longitude;
    setLatText(lat != null ? String(lat) : '');
    setLngText(lng != null ? String(lng) : '');
    setLatTouched(false);
    setLngTouched(false);
  }, [editModal?.profile?.latitude, editModal?.profile?.longitude]);

  React.useEffect(() => {
    if (editModal?.activeTab === 'plot') syncCoords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editModal?.activeTab]);

  const handleTabChange = useCallback(
    (tab: 'name' | 'plot' | 'soil') => {
      onChangeTab(tab);
    },
    [onChangeTab]
  );

  const handleLandCentsChange = useCallback(
    (delta: number) => {
      const next = Math.max(0, landCents + delta);
      updateProfile({ land_cents: next });
    },
    [landCents, updateProfile]
  );

  const handleLatBlur = useCallback(() => {
    setLatTouched(true);
    if (latText === '') {
      updateProfile({ latitude: null });
    } else if (isValidLat(latText)) {
      updateProfile({ latitude: Math.round(parseFloat(latText) * 1e6) / 1e6 });
    }
  }, [latText, updateProfile]);

  const handleLngBlur = useCallback(() => {
    setLngTouched(true);
    if (lngText === '') {
      updateProfile({ longitude: null });
    } else if (isValidLng(lngText)) {
      updateProfile({ longitude: Math.round(parseFloat(lngText) * 1e6) / 1e6 });
    }
  }, [lngText, updateProfile]);

  const isNew = editModal?.original === '';
  const title =
    editModal?.type === 'parent'
      ? isNew
        ? 'New Farm Plot'
        : 'Edit Farm Plot'
      : isNew
      ? 'New Section'
      : 'Rename Section';

  const activeTab = editModal?.activeTab ?? 'name';
  const latInvalid = latTouched && latText !== '' && !isValidLat(latText);
  const lngInvalid = lngTouched && lngText !== '' && !isValidLng(lngText);

  return (
    <Modal
      visible={!!editModal}
      transparent
      animationType="fade"
      hardwareAccelerated
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, styles.modalContentTall]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {editModal?.type === 'parent' && (
            <View style={styles.modalTabRow}>
              {(['name', 'plot', 'soil'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.modalTab, activeTab === tab && styles.modalTabActive]}
                  onPress={() => handleTabChange(tab)}
                >
                  <Text
                    style={[styles.modalTabText, activeTab === tab && styles.modalTabTextActive]}
                  >
                    {tab === 'name' ? 'Name' : tab === 'plot' ? 'Plot' : 'Soil'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentPadding}
          >
            {activeTab === 'name' && (
              <>
                <FloatingLabelInput
                  label="Name"
                  value={editModal?.value ?? ''}
                  onChangeText={onChangeValue}
                  autoFocus
                  autoCorrect={false}
                />
                {editModal?.type === 'parent' && (
                  <View style={styles.shortNameWrap}>
                    <FloatingLabelInput
                      label="Short name (3–5 letters)"
                      value={editModal?.shortName ?? ''}
                      onChangeText={onChangeShortName}
                      autoCorrect={false}
                      maxLength={5}
                      autoCapitalize="characters"
                    />
                    <Text style={styles.modalHint}>
                      Used in auto-generated plant names, e.g. Tomato (
                      {editModal?.shortName || 'ABC'})
                    </Text>
                  </View>
                )}
                {editModal && (
                  <Text style={styles.modalHint}>
                    Used by {editCount} plant{editCount === 1 ? '' : 's'}.
                  </Text>
                )}
              </>
            )}

            {activeTab === 'plot' && editModal?.type === 'parent' && (
              <>
                <View style={styles.plotSection}>
                  <Text style={styles.plotSectionTitle}>Land Area</Text>
                  <View style={styles.plotStepperRow}>
                    <Text style={styles.plotStepperLabel}>Size</Text>
                    <View style={styles.plotStepperControls}>
                      <TouchableOpacity
                        style={styles.plotStepperButton}
                        onPress={() => handleLandCentsChange(-1)}
                      >
                        <Text style={styles.plotStepperButtonText}>−</Text>
                      </TouchableOpacity>
                      <View>
                        <Text style={styles.plotStepperValue}>{landCents}</Text>
                        <Text style={styles.plotStepperUnit}>cents</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.plotStepperButton}
                        onPress={() => handleLandCentsChange(1)}
                      >
                        <Text style={styles.plotStepperButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.modalHint}>1 cent = 40.47 sqm</Text>
                </View>

                <View style={styles.plotSection}>
                  <Text style={styles.plotSectionTitle}>Plot Coordinates (optional)</Text>
                  <View style={styles.coordRow}>
                    <View style={styles.coordField}>
                      <Text style={styles.coordLabel}>Latitude</Text>
                      <TextInput
                        style={[styles.coordInput, latInvalid && styles.coordInputError]}
                        value={latText}
                        onChangeText={setLatText}
                        onBlur={handleLatBlur}
                        keyboardType="decimal-pad"
                        placeholder="8.0883"
                        placeholderTextColor={theme.inputPlaceholder}
                      />
                    </View>
                    <View style={styles.coordField}>
                      <Text style={styles.coordLabel}>Longitude</Text>
                      <TextInput
                        style={[styles.coordInput, lngInvalid && styles.coordInputError]}
                        value={lngText}
                        onChangeText={setLngText}
                        onBlur={handleLngBlur}
                        keyboardType="decimal-pad"
                        placeholder="77.5500"
                        placeholderTextColor={theme.inputPlaceholder}
                      />
                    </View>
                  </View>
                  <Text style={styles.coordTip}>
                    Open Google Maps → long-press your plot → copy the coordinates shown.
                  </Text>
                </View>
              </>
            )}

            {activeTab === 'soil' && editModal ? (
              <LocationProfileEditor
                editModal={editModal}
                setEditModal={setEditModal}
                updateProfile={updateProfile}
              />
            ) : null}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalFooterButton, styles.modalFooterButtonPrimary]}
              onPress={onSave}
              disabled={saving}
            >
              <Text style={styles.modalFooterButtonTextPrimary}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
