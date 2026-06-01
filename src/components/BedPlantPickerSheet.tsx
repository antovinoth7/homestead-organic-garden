import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { getAllPlants } from '@/services/plants';
import { getGuildTemplate } from '@/config/beds';
import { getPlantEmoji } from '@/utils/plantHelpers';
import { createStyles } from '@/styles/bedPlantPickerStyles';
import type { BedLayer, BedType, Plant, PlantEntry } from '@/types/database.types';
import type { PlantRow } from '@/config/beds/guildTemplates';
import type { Step2Data, Step3Data } from '@/hooks/useBedCreationWizard';

interface Props {
  visible: boolean;
  onClose: () => void;
  bedType: BedType | null;
  step2?: Step2Data;
  step3?: Step3Data;
  currentEntries: PlantEntry[];
  preselectedLayer: BedLayer | null;
  onAdd: (name: string, layer: BedLayer, spacingCm: number) => void;
}

const MIN_ROW_GAP_CM = 10;

type Tab = 'guild' | 'myplants';

const LAYER_OPTIONS: { value: BedLayer; label: string }[] = [
  { value: 'canopy', label: 'Canopy' },
  { value: 'understory', label: 'Mid' },
  { value: 'ground_cover', label: 'Ground' },
  { value: 'root', label: 'Root' },
  { value: 'climber', label: 'Climber' },
];

const LAYER_LABEL: Record<BedLayer, string> = {
  canopy: 'Canopy',
  understory: 'Main Crop',
  ground_cover: 'Ground Cover',
  climber: 'Climber',
  root: 'Root Crop',
};

// ─── Guild Tab ────────────────────────────────────────────────────────────────

interface GuildTabProps {
  bedType: BedType | null;
  currentEntries: PlantEntry[];
  preselectedLayer: BedLayer | null;
  searchQuery: string;
  onAdd: (name: string, layer: BedLayer, spacingCm: number) => void;
}

function GuildTab({
  bedType,
  currentEntries,
  preselectedLayer,
  searchQuery,
  onAdd,
}: GuildTabProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const template = useMemo(() => (bedType ? getGuildTemplate(bedType) : null), [bedType]);

  const plantRowNames = useMemo(
    () => new Set(template?.plant_rows.map((r) => r.name) ?? []),
    [template]
  );

  const companionItems = useMemo<PlantRow[]>(() => {
    if (!template) return [];
    const seen = new Set<string>();
    const rows: PlantRow[] = [];
    for (const row of template.plant_rows) {
      for (const comp of row.companion_plants) {
        if (!plantRowNames.has(comp) && !seen.has(comp)) {
          seen.add(comp);
          rows.push({
            name: comp,
            layer: 'ground_cover',
            spacing_cm: 25,
            crop_family: 'flower',
            companion_plants: [],
            is_companion: true,
          });
        }
      }
    }
    return rows;
  }, [template, plantRowNames]);

  if (!template) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="leaf-outline" size={28} color={theme.textTertiary} />
        <Text style={styles.emptyStateText}>
          Select a bed type in Step 1 to see guild suggestions.
        </Text>
      </View>
    );
  }

  // Show all guild plants — no dedup filter; display count badge if already added
  const available = template.plant_rows;
  const availableCompanions = companionItems;

  const prioritised = preselectedLayer
    ? [
        ...available.filter((r) => r.layer === preselectedLayer),
        ...available.filter((r) => r.layer !== preselectedLayer),
      ]
    : available;

  const q = searchQuery.toLowerCase();
  const filtered = q ? prioritised.filter((r) => r.name.toLowerCase().includes(q)) : prioritised;
  const filteredCompanions = q
    ? availableCompanions.filter((r) => r.name.toLowerCase().includes(q))
    : availableCompanions;

  const renderRow = (row: PlantRow, isCompanion: boolean, count: number): React.JSX.Element => (
    <View key={row.name} style={styles.guildPlantRow}>
      <Text style={styles.guildEmoji}>{getPlantEmoji(row.name)}</Text>
      <View style={styles.guildMeta}>
        <View style={styles.nameRow}>
          <Text style={styles.guildName}>{row.name}</Text>
          {count > 0 && (
            <View style={[styles.guildLayerBadge, { backgroundColor: theme.primary }]}>
              <Text style={[styles.guildLayerBadgeText, { color: theme.textInverse }]}>
                ×{count}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.guildBadgeRow}>
          <View style={styles.guildLayerBadge}>
            <Text style={styles.guildLayerBadgeText}>{LAYER_LABEL[row.layer]}</Text>
          </View>
          <Text style={styles.spacingTag}>↔ {row.spacing_cm}cm</Text>
          <Text style={styles.spacingTag}>
            ↕ {row.row_gap_cm ?? Math.max(row.spacing_cm, MIN_ROW_GAP_CM)}cm row gap
          </Text>
          {isCompanion && (
            <View style={[styles.guildLayerBadge, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.guildLayerBadgeText, { color: theme.primary }]}>
                ★ companion
              </Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.guildAddBtn}
        onPress={() => onAdd(row.name, row.layer, row.spacing_cm)}
        activeOpacity={0.75}
      >
        <Text style={styles.guildAddBtnText}>+ Add</Text>
      </TouchableOpacity>
    </View>
  );

  if (filtered.length === 0 && filteredCompanions.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="search-outline" size={28} color={theme.textTertiary} />
        <Text style={styles.emptyStateText}>No plants match your search.</Text>
      </View>
    );
  }

  return (
    <>
      {preselectedLayer && filtered.some((r) => r.layer === preselectedLayer) && (
        <Text style={styles.sectionLabel}>
          BEST FOR THIS ROW ({LAYER_LABEL[preselectedLayer].toUpperCase()})
        </Text>
      )}
      {filtered.map((r) => {
        const count = currentEntries.filter((e) => e.name === r.name).length;
        return renderRow(r, false, count);
      })}
      {filteredCompanions.length > 0 && (
        <Text style={styles.sectionLabel}>COMPANION SUGGESTIONS</Text>
      )}
      {filteredCompanions.map((r) => {
        const count = currentEntries.filter((e) => e.name === r.name).length;
        return renderRow(r, true, count);
      })}
    </>
  );
}

// ─── My Plants Tab ────────────────────────────────────────────────────────────

interface MyPlantsTabProps {
  currentEntries: PlantEntry[];
  preselectedLayer: BedLayer | null;
  searchQuery: string;
  onAdd: (name: string, layer: BedLayer, spacingCm: number) => void;
}

function MyPlantsTab({
  currentEntries,
  preselectedLayer,
  searchQuery,
  onAdd,
}: MyPlantsTabProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [layerMap, setLayerMap] = useState<Record<string, BedLayer>>({});

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return plants;
    return plants.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.plant_variety ?? '').toLowerCase().includes(q)
    );
  }, [plants, searchQuery]);

  useEffect(() => {
    getAllPlants()
      .then((all) => {
        setPlants(all.filter((p) => !p.is_deleted));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleSelect = useCallback((plantId: string, defaultLayer: BedLayer): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(plantId)) {
        next.delete(plantId);
      } else {
        next.add(plantId);
        setLayerMap((m) => ({ ...m, [plantId]: m[plantId] ?? defaultLayer }));
      }
      return next;
    });
  }, []);

  const setLayer = useCallback((plantId: string, layer: BedLayer): void => {
    setLayerMap((prev) => ({ ...prev, [plantId]: layer }));
  }, []);

  const handleAddSelected = useCallback((): void => {
    for (const id of selectedIds) {
      const plant = plants.find((p) => p.id === id);
      if (!plant) continue;
      const layer = layerMap[id] ?? preselectedLayer ?? 'understory';
      onAdd(plant.name, layer, plant.spacing_cm ?? 30);
    }
  }, [selectedIds, plants, layerMap, preselectedLayer, onAdd]);

  if (loading) {
    return <ActivityIndicator style={styles.loader} color={theme.primary} />;
  }

  if (plants.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="leaf-outline" size={28} color={theme.textTertiary} />
        <Text style={styles.emptyStateText}>
          No plants found in your garden yet.{'\n'}Create plants in the Plants tab first.
        </Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.myPlantsListContent}
        renderItem={({ item }) => {
          const isSelected = selectedIds.has(item.id);
          const defaultLayer =
            (item.bed_layer as BedLayer | undefined) ?? preselectedLayer ?? 'understory';
          const chosenLayer = layerMap[item.id] ?? defaultLayer;
          const colSpacing = item.spacing_cm ?? 30;
          const addedCount = currentEntries.filter((e) => e.name === item.name).length;
          return (
            <TouchableOpacity
              style={[styles.myPlantRow, isSelected && styles.myPlantRowSelected]}
              onPress={() => toggleSelect(item.id, defaultLayer)}
              activeOpacity={0.7}
            >
              <View style={styles.nameRow}>
                <Text style={styles.myPlantName}>{item.name}</Text>
                {addedCount > 0 && (
                  <View style={[styles.guildLayerBadge, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.guildLayerBadgeText, { color: theme.textInverse }]}>
                      ×{addedCount}
                    </Text>
                  </View>
                )}
              </View>
              {item.plant_variety ? (
                <Text style={styles.myPlantVariety}>{item.plant_variety}</Text>
              ) : null}
              <View style={styles.spacingTagRow}>
                <Text style={styles.spacingTag}>↔ {colSpacing}cm</Text>
                <Text style={styles.spacingTag}>
                  ↕ {Math.max(colSpacing, MIN_ROW_GAP_CM)}cm row gap
                </Text>
              </View>
              {isSelected && (
                <View style={styles.layerPicker}>
                  {LAYER_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.layerChip,
                        chosenLayer === opt.value && styles.layerChipActive,
                      ]}
                      onPress={() => setLayer(item.id, opt.value)}
                    >
                      <Text style={styles.layerChipText}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
      <TouchableOpacity
        style={[styles.addSelectedBtn, selectedIds.size === 0 && styles.addSelectedBtnDisabled]}
        onPress={handleAddSelected}
        disabled={selectedIds.size === 0}
      >
        <Text style={styles.addSelectedText}>
          {selectedIds.size === 0
            ? 'Select plants above'
            : `Add ${selectedIds.size} plant${selectedIds.size > 1 ? 's' : ''}`}
        </Text>
      </TouchableOpacity>
    </>
  );
}

// ─── Main Sheet ───────────────────────────────────────────────────────────────

export function BedPlantPickerSheet({
  visible,
  onClose,
  bedType,
  step2: _step2,
  step3: _step3,
  currentEntries,
  preselectedLayer,
  onAdd,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [activeTab, setActiveTab] = useState<Tab>('guild');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible) {
      setActiveTab('guild');
      setSearchQuery('');
    }
  }, [visible]);

  const handleAdd = useCallback(
    (name: string, layer: BedLayer, spacingCm: number): void => {
      onAdd(name, layer, spacingCm);
    },
    [onAdd]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetOverlay} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Add Plant to Bed</Text>

          {/* Tab bar */}
          <View style={styles.tabBar}>
            {(['guild', 'myplants'] as Tab[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'guild' ? 'Guild' : 'My Plants'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search bar */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search-outline" size={16} color={theme.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search plants…"
              placeholderTextColor={theme.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          {/* Tab content (scrollable) */}
          <FlatList
            data={[]}
            renderItem={null}
            keyExtractor={() => ''}
            ListHeaderComponent={
              <>
                {activeTab === 'guild' ? (
                  <GuildTab
                    bedType={bedType}
                    currentEntries={currentEntries}
                    preselectedLayer={preselectedLayer}
                    searchQuery={searchQuery}
                    onAdd={handleAdd}
                  />
                ) : (
                  <MyPlantsTab
                    currentEntries={currentEntries}
                    preselectedLayer={preselectedLayer}
                    searchQuery={searchQuery}
                    onAdd={handleAdd}
                  />
                )}

                {/* Info note */}
                <View style={styles.infoNote}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={theme.textSecondary}
                  />
                  <Text style={styles.infoNoteText}>
                    {`Don't see a plant? Go to the Plants tab to create it first, then return here.`}
                  </Text>
                </View>
              </>
            }
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
