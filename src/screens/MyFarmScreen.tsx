import React, { useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/colors';
import { DrainageQuality, LocationProfile, NutrientLevel } from '@/types/database.types';
import { createStyles } from '@/styles/myFarmStyles';
import FieldLabelWithHelp from '@/components/FieldLabelWithHelp';
import { PlotEditModal } from '@/components/modals/PlotEditModal';
import { SectionEditSheet } from '@/components/modals/SectionEditSheet';
import { LocationReassignModal } from '@/components/modals/LocationReassignModal';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';
import { useLocationManager, hasSoilData } from '@/hooks/useLocationManager';

const LOCATION_HELP = {
  parentLocations:
    'Your farm plots — e.g. Kanyakumari Field, Backyard. Each plot has its own size, GPS pin, and soil profile.',
  childLocations:
    'Sections shared across plots — e.g. North, South, East, West. Combine with a plot to form a full location: Kanyakumari Field - South.',
} as const;

const deriveNpkColor = (level: NutrientLevel | null | undefined, theme: Theme): string => {
  if (level === 'high') return theme.success;
  if (level === 'medium') return theme.warning;
  if (level === 'low') return theme.error;
  return 'transparent';
};

const deriveDrainageColor = (level: DrainageQuality | null | undefined, theme: Theme): string => {
  if (level === 'excellent') return theme.success;
  if (level === 'good') return theme.primary;
  if (level === 'fair') return theme.warning;
  if (level === 'poor') return theme.error;
  return theme.textTertiary;
};

const formatCoord = (lat: number, lng: number): string => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${latDir} ${Math.abs(lng).toFixed(2)}°${lngDir}`;
};

const plantCountLabel = (count: number, loading: boolean): string =>
  loading ? 'Counting plants…' : `${count} plant${count === 1 ? '' : 's'}`;

type Styles = ReturnType<typeof createStyles>;

interface PlotCardProps {
  name: string;
  shortName: string;
  profile: LocationProfile | undefined;
  count: number;
  plantsLoading: boolean;
  styles: Styles;
  theme: Theme;
  onEdit: (name: string) => void;
  onDelete: (name: string) => void;
}

/** One farm plot: short-name avatar, size, plant count, and a soil chip strip. */
function PlotCard({
  name,
  shortName,
  profile,
  count,
  plantsLoading,
  styles,
  theme,
  onEdit,
  onDelete,
}: PlotCardProps): React.JSX.Element {
  const handleEdit = useCallback(() => onEdit(name), [onEdit, name]);
  const handleDelete = useCallback(() => onDelete(name), [onDelete, name]);

  const hasSize = (profile?.land_cents ?? 0) > 0;
  const hasCoords = profile?.latitude != null && profile?.longitude != null;
  const hasNpk = !!(profile?.nitrogenLevel || profile?.phosphorusLevel || profile?.potassiumLevel);
  const showChips = hasSoilData(profile) || hasCoords;

  return (
    <View style={styles.plotCard}>
      <View style={styles.plotAvatar}>
        <Text style={styles.plotAvatarText}>{shortName || name.slice(0, 3).toUpperCase()}</Text>
      </View>

      <View style={styles.plotBody}>
        <View style={styles.plotTitleRow}>
          <Text style={styles.plotName} numberOfLines={1}>
            {name}
          </Text>
          {hasSize && <Text style={styles.plotCents}>{profile?.land_cents} cents</Text>}
        </View>
        <Text style={styles.plotMeta}>{plantCountLabel(count, plantsLoading)}</Text>

        {showChips && (
          <View style={styles.chipStrip}>
            {profile?.soilPH != null && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>pH {profile.soilPH.toFixed(1)}</Text>
              </View>
            )}
            {profile?.drainageQuality && (
              <View style={styles.chip}>
                <View
                  style={[
                    styles.npkDot,
                    { backgroundColor: deriveDrainageColor(profile.drainageQuality, theme) },
                  ]}
                />
                <Text style={styles.chipText}>{profile.drainageQuality}</Text>
              </View>
            )}
            {hasNpk && (
              <View style={styles.chip}>
                <View style={styles.npkDotRow}>
                  <View
                    style={[
                      styles.npkDot,
                      { backgroundColor: deriveNpkColor(profile?.nitrogenLevel, theme) },
                    ]}
                  />
                  <View
                    style={[
                      styles.npkDot,
                      { backgroundColor: deriveNpkColor(profile?.phosphorusLevel, theme) },
                    ]}
                  />
                  <View
                    style={[
                      styles.npkDot,
                      { backgroundColor: deriveNpkColor(profile?.potassiumLevel, theme) },
                    ]}
                  />
                </View>
                <Text style={styles.chipText}>NPK</Text>
              </View>
            )}
            {hasCoords && (
              <View style={styles.coordChip}>
                <Ionicons name="location" size={10} color={theme.primary} />
                <Text style={styles.coordChipText}>
                  {formatCoord(profile!.latitude!, profile!.longitude!)}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.plotActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEdit}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${name}`}
        >
          <Ionicons name="create-outline" size={16} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${name}`}
        >
          <Ionicons name="trash-outline" size={16} color={theme.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface SectionTileProps {
  name: string;
  count: number;
  plantsLoading: boolean;
  styles: Styles;
  theme: Theme;
  onEdit: (name: string) => void;
}

/** One section tile in the two-up grid. Delete lives inside the rename sheet. */
function SectionTile({
  name,
  count,
  plantsLoading,
  styles,
  theme,
  onEdit,
}: SectionTileProps): React.JSX.Element {
  const handleEdit = useCallback(() => onEdit(name), [onEdit, name]);

  return (
    <TouchableOpacity style={styles.sectionTile} onPress={handleEdit} activeOpacity={0.8}>
      <View style={styles.sectionTileTop}>
        <Text style={styles.sectionTileName} numberOfLines={2}>
          {name}
        </Text>
        <View style={styles.sectionTileEdit}>
          <Ionicons name="create-outline" size={13} color={theme.primary} />
        </View>
      </View>
      <Text style={styles.sectionTileCount}>{plantCountLabel(count, plantsLoading)}</Text>
    </TouchableOpacity>
  );
}

export default function MyFarmScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const { state, actions, derived } = useLocationManager();
  const {
    parentLocations,
    childLocations,
    shortNames,
    locationProfiles,
    loading,
    plantsLoading,
    saving,
    editModal,
    reassignModal,
    deleteConfirm,
  } = state;
  const {
    setEditModal,
    setReassignModal,
    setDeleteConfirm,
    handleRename,
    handleDeleteRequest,
    handleDeleteConfirm,
    handleReassignConfirm,
    updateProfile,
  } = actions;
  const { parentCounts, childCounts, editCount, reassignCount, reassignOptions } = derived;

  const onChangeValue = useCallback(
    (text: string) => setEditModal((prev) => (prev ? { ...prev, value: text } : prev)),
    [setEditModal]
  );

  const onChangeShortName = useCallback(
    (text: string) =>
      setEditModal((prev) =>
        prev
          ? {
              ...prev,
              shortName: text
                .replace(/[^a-zA-Z]/g, '')
                .toUpperCase()
                .slice(0, 5),
            }
          : prev
      ),
    [setEditModal]
  );

  const onReplacementChange = useCallback(
    (value: string) => setReassignModal((prev) => (prev ? { ...prev, replacement: value } : prev)),
    [setReassignModal]
  );

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const closeEditModal = useCallback(() => setEditModal(null), [setEditModal]);
  const closeReassignModal = useCallback(() => setReassignModal(null), [setReassignModal]);
  const closeDeleteConfirm = useCallback(() => setDeleteConfirm(null), [setDeleteConfirm]);

  const handleAddPlot = useCallback(
    () =>
      setEditModal({ type: 'parent', original: '', value: '', shortName: '', profile: {} }),
    [setEditModal]
  );

  const handleEditPlot = useCallback(
    (location: string) =>
      setEditModal({
        type: 'parent',
        original: location,
        value: location,
        shortName: shortNames[location] ?? '',
        profile: locationProfiles[location] ?? {},
      }),
    [setEditModal, shortNames, locationProfiles]
  );

  const handleDeletePlot = useCallback(
    (location: string) => handleDeleteRequest('parent', location),
    [handleDeleteRequest]
  );

  const handleAddSection = useCallback(
    () => setEditModal({ type: 'child', original: '', value: '' }),
    [setEditModal]
  );

  const handleEditSection = useCallback(
    (location: string) => setEditModal({ type: 'child', original: location, value: location }),
    [setEditModal]
  );

  // Both editors hand delete back to the shared request flow, which routes an
  // in-use location to the reassign modal rather than a plain confirm.
  const handleDeleteFromEditor = useCallback(() => {
    const target = editModal;
    if (!target || target.original === '') return;
    setEditModal(null);
    handleDeleteRequest(target.type, target.original);
  }, [editModal, setEditModal, handleDeleteRequest]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>My Farm</Text>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading farm data...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 48) + 16 }}
        >
          {/* ── Farm Plots (parent) ── */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderText}>
              <FieldLabelWithHelp
                label="Farm plots"
                helpText={LOCATION_HELP.parentLocations}
                helpLabel="Farm plots"
                style={styles.sectionTitleRow}
                labelStyle={styles.sectionTitle}
              />
            </View>
            <TouchableOpacity
              style={styles.sectionAddButton}
              onPress={handleAddPlot}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Add farm plot"
            >
              <Ionicons name="add" size={22} color={theme.textInverse} />
            </TouchableOpacity>
          </View>

          {parentLocations.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Ionicons
                name="map-outline"
                size={36}
                color={theme.textTertiary}
                style={styles.emptyStateIcon}
              />
              <Text style={styles.emptyStateTitle}>No farm plots yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Tap + to add your first plot, like &apos;Kanyakumari Field&apos; or
                &apos;Backyard&apos;.
              </Text>
            </View>
          ) : (
            <View style={styles.plotList}>
              {parentLocations.map((location) => (
                <PlotCard
                  key={location}
                  name={location}
                  shortName={shortNames[location] ?? ''}
                  profile={locationProfiles[location]}
                  count={parentCounts[location] || 0}
                  plantsLoading={plantsLoading}
                  styles={styles}
                  theme={theme}
                  onEdit={handleEditPlot}
                  onDelete={handleDeletePlot}
                />
              ))}
            </View>
          )}

          {/* ── Sections / Directions (child) ── */}
          <View style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
            <View style={styles.sectionHeaderText}>
              <FieldLabelWithHelp
                label="Sections / directions"
                helpText={LOCATION_HELP.childLocations}
                helpLabel="Sections / directions"
                style={styles.sectionTitleRow}
                labelStyle={styles.sectionTitle}
              />
              <Text style={styles.sectionSubtitle}>Shared across every plot</Text>
            </View>
            <TouchableOpacity
              style={styles.sectionAddButton}
              onPress={handleAddSection}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Add section"
            >
              <Ionicons name="add" size={22} color={theme.textInverse} />
            </TouchableOpacity>
          </View>

          {childLocations.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Ionicons
                name="compass-outline"
                size={36}
                color={theme.textTertiary}
                style={styles.emptyStateIcon}
              />
              <Text style={styles.emptyStateTitle}>No sections yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Add directions or zones like &quot;North&quot;, &quot;South&quot;, or
                &quot;Front&quot;.
              </Text>
            </View>
          ) : (
            <View style={styles.sectionGrid}>
              {childLocations.map((location) => (
                <SectionTile
                  key={location}
                  name={location}
                  count={childCounts[location] || 0}
                  plantsLoading={plantsLoading}
                  styles={styles}
                  theme={theme}
                  onEdit={handleEditSection}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <PlotEditModal
        editModal={editModal}
        editCount={editCount}
        saving={saving}
        onSave={handleRename}
        onClose={closeEditModal}
        onDelete={handleDeleteFromEditor}
        onChangeValue={onChangeValue}
        onChangeShortName={onChangeShortName}
        setEditModal={setEditModal}
        updateProfile={updateProfile}
      />

      <SectionEditSheet
        editModal={editModal}
        editCount={editCount}
        saving={saving}
        childLocations={childLocations}
        onSave={handleRename}
        onClose={closeEditModal}
        onDelete={handleDeleteFromEditor}
        onChangeValue={onChangeValue}
      />

      <LocationReassignModal
        reassignModal={reassignModal}
        reassignOptions={reassignOptions}
        reassignCount={reassignCount}
        onConfirm={handleReassignConfirm}
        onClose={closeReassignModal}
        onReplacementChange={onReplacementChange}
      />

      <ConfirmDeleteModal
        visible={deleteConfirm !== null}
        title="Delete location?"
        message={
          deleteConfirm
            ? `Remove "${deleteConfirm.target}" from your farm? This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        onCancel={closeDeleteConfirm}
        onConfirm={handleDeleteConfirm}
      />

      <Modal
        visible={saving}
        transparent
        animationType="fade"
        hardwareAccelerated
        statusBarTranslucent
        navigationBarTranslucent
      >
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.savingText}>Updating farm data...</Text>
        </View>
      </Modal>
    </View>
  );
}
