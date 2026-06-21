import React, { useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/colors';
import { DrainageQuality, NutrientLevel } from '@/types/database.types';
import { createStyles } from '@/styles/myFarmStyles';
import FieldLabelWithHelp from '@/components/FieldLabelWithHelp';
import { LocationEditModal } from '@/components/modals/LocationEditModal';
import { LocationReassignModal } from '@/components/modals/LocationReassignModal';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';
import { useLocationManager, hasSoilData } from '@/hooks/useLocationManager';
import { calcUsableSqm, calcMaxBeds, calcCapacityFromProfiles } from '@/services/farmCapacity';

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

  const onChangeTab = useCallback(
    (tab: 'name' | 'plot' | 'soil') =>
      setEditModal((prev) => (prev ? { ...prev, activeTab: tab } : prev)),
    [setEditModal]
  );

  const onReplacementChange = useCallback(
    (value: string) => setReassignModal((prev) => (prev ? { ...prev, replacement: value } : prev)),
    [setReassignModal]
  );

  const totalCents = useMemo(() => calcCapacityFromProfiles(locationProfiles), [locationProfiles]);
  const usableSqm = useMemo(() => calcUsableSqm(totalCents), [totalCents]);
  const maxBeds = useMemo(() => calcMaxBeds(usableSqm), [usableSqm]);
  const hasAnySize = totalCents > 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>My Farm</Text>
        <View style={styles.headerSpacer} />
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
          <View>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderText}>
                <FieldLabelWithHelp
                  label="Farm Plots"
                  helpText={LOCATION_HELP.parentLocations}
                  helpLabel="Farm Plots"
                  style={styles.sectionTitleRow}
                  labelStyle={styles.sectionTitle}
                />
              </View>
              <TouchableOpacity
                style={styles.sectionAddButton}
                onPress={() =>
                  setEditModal({
                    type: 'parent',
                    original: '',
                    value: '',
                    shortName: '',
                    profile: {},
                    activeTab: 'name',
                  })
                }
                disabled={saving}
              >
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Aggregate capacity */}
            {hasAnySize ? (
              <View style={styles.capacityRow}>
                <View style={styles.capacityStat}>
                  <Text style={styles.capacityValue}>{totalCents}</Text>
                  <Text style={styles.capacityLabel}>cents total</Text>
                </View>
                <View style={styles.capacityStat}>
                  <Text style={styles.capacityValue}>{usableSqm}</Text>
                  <Text style={styles.capacityLabel}>sqm usable</Text>
                </View>
                <View style={styles.capacityStat}>
                  <Text style={styles.capacityValue}>{maxBeds}</Text>
                  <Text style={styles.capacityLabel}>max beds</Text>
                </View>
              </View>
            ) : (
              parentLocations.length > 0 && (
                <Text style={styles.capacityEmpty}>
                  Add land area in a plot&apos;s Plot tab to see capacity.
                </Text>
              )
            )}

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
              parentLocations.map((location) => {
                const profile = locationProfiles[location];
                const showSoilStrip = hasSoilData(profile);
                const hasSize = (profile?.land_cents ?? 0) > 0;
                const hasCoords = profile?.latitude != null && profile?.longitude != null;
                return (
                  <View key={location} style={styles.locationRow}>
                    <View style={styles.locationInfo}>
                      <View style={styles.locationNameRow}>
                        <Text style={styles.locationName}>{location}</Text>
                        {shortNames[location] ? (
                          <View style={styles.shortNameBadge}>
                            <Text style={styles.shortNameBadgeText}>{shortNames[location]}</Text>
                          </View>
                        ) : null}
                        {hasSize && (
                          <View style={styles.sizeBadge}>
                            <Text style={styles.sizeBadgeText}>{profile!.land_cents} cents</Text>
                          </View>
                        )}
                        {hasCoords && (
                          <View style={styles.coordBadge}>
                            <Ionicons name="location" size={10} color={theme.primary} />
                            <Text style={styles.coordBadgeText}>
                              {formatCoord(profile!.latitude!, profile!.longitude!)}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.locationMeta}>
                        {parentCounts[location] || 0} plant
                        {(parentCounts[location] || 0) === 1 ? '' : 's'}
                      </Text>
                      {showSoilStrip && (
                        <View style={styles.profileSummaryStrip}>
                          {profile?.soilPH != null && (
                            <View style={styles.profileBadge}>
                              <Text style={styles.profileBadgeText}>
                                pH {profile.soilPH.toFixed(1)}
                              </Text>
                            </View>
                          )}
                          {profile?.drainageQuality && (
                            <View style={styles.profileBadge}>
                              <Ionicons
                                name="water-outline"
                                size={10}
                                color={deriveDrainageColor(profile.drainageQuality, theme)}
                              />
                              <Text style={styles.profileBadgeText}>{profile.drainageQuality}</Text>
                            </View>
                          )}
                          {(profile?.nitrogenLevel ||
                            profile?.phosphorusLevel ||
                            profile?.potassiumLevel) && (
                            <View style={styles.profileBadge}>
                              <View style={styles.npkDotRow}>
                                <View
                                  style={[
                                    styles.npkDot,
                                    {
                                      backgroundColor: deriveNpkColor(
                                        profile?.nitrogenLevel,
                                        theme
                                      ),
                                    },
                                  ]}
                                />
                                <View
                                  style={[
                                    styles.npkDot,
                                    {
                                      backgroundColor: deriveNpkColor(
                                        profile?.phosphorusLevel,
                                        theme
                                      ),
                                    },
                                  ]}
                                />
                                <View
                                  style={[
                                    styles.npkDot,
                                    {
                                      backgroundColor: deriveNpkColor(
                                        profile?.potassiumLevel,
                                        theme
                                      ),
                                    },
                                  ]}
                                />
                              </View>
                              <Text style={styles.profileBadgeText}>NPK</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                    <View style={styles.locationActions}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() =>
                          setEditModal({
                            type: 'parent',
                            original: location,
                            value: location,
                            shortName: shortNames[location] ?? '',
                            profile: locationProfiles[location] ?? {},
                            activeTab: 'name',
                          })
                        }
                      >
                        <Ionicons name="create-outline" size={18} color={theme.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleDeleteRequest('parent', location)}
                      >
                        <Ionicons name="trash-outline" size={18} color={theme.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* ── Sections / Directions (child) ── */}
          <View style={styles.childSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderText}>
                <FieldLabelWithHelp
                  label="Sections / Directions"
                  helpText={LOCATION_HELP.childLocations}
                  helpLabel="Sections / Directions"
                  style={styles.sectionTitleRow}
                  labelStyle={styles.sectionTitle}
                />
              </View>
              <TouchableOpacity
                style={styles.sectionAddButton}
                onPress={() => setEditModal({ type: 'child', original: '', value: '' })}
                disabled={saving}
              >
                <Ionicons name="add" size={22} color="#fff" />
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
              childLocations.map((location) => (
                <View key={location} style={styles.locationRow}>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>{location}</Text>
                    <Text style={styles.locationMeta}>
                      {childCounts[location] || 0} plant
                      {(childCounts[location] || 0) === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <View style={styles.locationActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() =>
                        setEditModal({ type: 'child', original: location, value: location })
                      }
                    >
                      <Ionicons name="create-outline" size={18} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleDeleteRequest('child', location)}
                    >
                      <Ionicons name="trash-outline" size={18} color={theme.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <LocationEditModal
        editModal={editModal}
        editCount={editCount}
        saving={saving}
        onSave={handleRename}
        onClose={() => setEditModal(null)}
        onChangeValue={onChangeValue}
        onChangeShortName={onChangeShortName}
        onChangeTab={onChangeTab}
        setEditModal={setEditModal}
        updateProfile={updateProfile}
      />

      <LocationReassignModal
        reassignModal={reassignModal}
        reassignOptions={reassignOptions}
        reassignCount={reassignCount}
        onConfirm={handleReassignConfirm}
        onClose={() => setReassignModal(null)}
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
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
      />

      <Modal visible={saving} transparent animationType="fade" hardwareAccelerated>
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.savingText}>Updating farm data...</Text>
        </View>
      </Modal>
    </View>
  );
}
