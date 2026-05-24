import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { getAllPlants } from '@/services/plants';
import { DEFAULT_PLANT_CATALOG, PLANT_CATEGORIES } from '@/services/plantCatalog';
import { createStyles } from '@/styles/plantEntryResolverStyles';
import type { EntryResolution, Plant, PlantEntry } from '@/types/database.types';

interface Props {
  visible: boolean;
  entry: PlantEntry | null;
  onClose: () => void;
  onResolve: (resolution: EntryResolution) => void;
  onCreateInForm: (variety: string | null) => void | Promise<void>;
}

type Tab = 'create' | 'link';

function varietiesForName(name: string): string[] {
  const target = name.trim();
  if (!target) return [];
  for (const category of PLANT_CATEGORIES) {
    const varieties = DEFAULT_PLANT_CATALOG.categories[category]?.varieties ?? {};
    if (varieties[target]) return varieties[target];
  }
  return [];
}

export function PlantEntryResolverSheet({
  visible,
  entry,
  onClose,
  onResolve,
  onCreateInForm,
}: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [selectedVariety, setSelectedVariety] = useState<string | null>(null);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [linkablePlants, setLinkablePlants] = useState<Plant[]>([]);
  const [loadingLinkable, setLoadingLinkable] = useState(false);

  const varieties = useMemo(() => (entry ? varietiesForName(entry.name) : []), [entry]);

  useEffect(() => {
    if (!visible || !entry) return;
    const current = entry.resolution ?? { kind: 'placeholder' };
    if (current.kind === 'link') {
      setActiveTab('link');
      setSelectedPlantId(current.plantId);
      setSelectedVariety(null);
    } else if (current.kind === 'create') {
      setActiveTab('create');
      setSelectedVariety(current.variety ?? null);
      setSelectedPlantId(null);
    } else {
      setActiveTab('create');
      setSelectedVariety(null);
      setSelectedPlantId(null);
    }
  }, [visible, entry]);

  useEffect(() => {
    if (!visible || !entry || activeTab !== 'link') return;
    setLoadingLinkable(true);
    getAllPlants()
      .then((all) => {
        const matchName = entry.name.toLowerCase();
        const candidates = all.filter(
          (p) => !p.is_deleted && p.name.toLowerCase() === matchName && !p.bed_id
        );
        setLinkablePlants(candidates);
      })
      .catch(() => setLinkablePlants([]))
      .finally(() => setLoadingLinkable(false));
  }, [visible, entry, activeTab]);

  const handleConfirm = useCallback((): void => {
    if (activeTab === 'create') {
      void onCreateInForm(selectedVariety);
    } else if (selectedPlantId) {
      onResolve({ kind: 'link', plantId: selectedPlantId });
    }
  }, [activeTab, selectedVariety, selectedPlantId, onResolve, onCreateInForm]);

  const handleRevertToPlaceholder = useCallback((): void => {
    onResolve({ kind: 'placeholder' });
  }, [onResolve]);

  if (!entry) return null;

  const canConfirm = activeTab === 'create' || !!selectedPlantId;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{entry.name}</Text>
          <Text style={styles.subtitle}>Resolve this placeholder into a real plant</Text>

          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'create' && styles.tabActive]}
              onPress={() => setActiveTab('create')}
            >
              <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
                Create new
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'link' && styles.tabActive]}
              onPress={() => setActiveTab('link')}
            >
              <Text style={[styles.tabText, activeTab === 'link' && styles.tabTextActive]}>
                Link existing
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll}>
            {activeTab === 'create' ? (
              <>
                <Text style={styles.sectionLabel}>VARIETY (OPTIONAL)</Text>
                {varieties.length > 0 ? (
                  <View style={styles.varietyGrid}>
                    <TouchableOpacity
                      style={[styles.varietyChip, !selectedVariety && styles.varietyChipActive]}
                      onPress={() => setSelectedVariety(null)}
                    >
                      <Text
                        style={[
                          styles.varietyChipText,
                          !selectedVariety && styles.varietyChipTextActive,
                        ]}
                      >
                        No specific variety
                      </Text>
                    </TouchableOpacity>
                    {varieties.map((v) => (
                      <TouchableOpacity
                        key={v}
                        style={[
                          styles.varietyChip,
                          selectedVariety === v && styles.varietyChipActive,
                        ]}
                        onPress={() => setSelectedVariety(v)}
                      >
                        <Text
                          style={[
                            styles.varietyChipText,
                            selectedVariety === v && styles.varietyChipTextActive,
                          ]}
                        >
                          {v}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="leaf-outline" size={24} color={theme.textTertiary} />
                    <Text style={styles.emptyStateText}>
                      No varieties listed for {entry.name}.{'\n'}Continue to add full details in the
                      plant form.
                    </Text>
                  </View>
                )}
              </>
            ) : loadingLinkable ? (
              <ActivityIndicator color={theme.primary} style={styles.loader} />
            ) : linkablePlants.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={24} color={theme.textTertiary} />
                <Text style={styles.emptyStateText}>
                  No un-assigned {entry.name} plants in your garden.{'\n'}
                  Switch to “Create new” or keep as placeholder.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionLabel}>SELECT A PLANT TO MOVE INTO THIS BED</Text>
                {linkablePlants.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.plantRow, selectedPlantId === p.id && styles.plantRowSelected]}
                    onPress={() => setSelectedPlantId(p.id)}
                  >
                    <View style={styles.plantInfo}>
                      <Text style={styles.plantName}>{p.name}</Text>
                      {p.plant_variety ? (
                        <Text style={styles.plantSub}>{p.plant_variety}</Text>
                      ) : null}
                      {p.location ? (
                        <Text style={styles.plantSub}>Currently: {p.location}</Text>
                      ) : null}
                    </View>
                    {selectedPlantId === p.id && (
                      <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}

            {entry.resolution && entry.resolution.kind !== 'placeholder' && (
              <TouchableOpacity style={styles.revertBtn} onPress={handleRevertToPlaceholder}>
                <Text style={styles.revertBtnText}>Revert to placeholder</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, !canConfirm && styles.primaryBtnDisabled]}
              onPress={handleConfirm}
              disabled={!canConfirm}
            >
              <Text style={styles.primaryBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
