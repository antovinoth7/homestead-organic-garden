import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useFocusEffect,
  useNavigation,
  NavigationProp,
  ParamListBase,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import {
  getArchivedPlants,
  restorePlant,
  permanentlyDeletePlant,
  restorePlantsForBed,
  permanentlyDeletePlantsForBed,
} from '../services/plants';
import { getBeds, getDeletedBeds, restoreBed } from '../services/beds';
import { Plant } from '../types/database.types';
import { createStyles } from '../styles/archivedPlantsStyles';
import { getErrorMessage } from '../utils/errorLogging';
import { ConfirmDeleteModal } from '../components/modals/ConfirmDeleteModal';

const NO_BED_KEY = '__no_bed__';

interface BedGroup {
  bedId: string;
  title: string;
  bedDeleted: boolean;
  data: Plant[];
}

export default function ArchivedPlantsScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [bedNames, setBedNames] = useState<Record<string, string>>({});
  const [deletedBedIds, setDeletedBedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [restoringBedId, setRestoringBedId] = useState<string | null>(null);
  const [pendingPermanentDelete, setPendingPermanentDelete] = useState<Plant | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingGroupDelete, setPendingGroupDelete] = useState<BedGroup | null>(null);
  const [deletingBedId, setDeletingBedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [archivedPlants, activeBeds, deletedBeds] = await Promise.all([
        getArchivedPlants(),
        getBeds(),
        getDeletedBeds(),
      ]);
      const names: Record<string, string> = {};
      for (const b of [...activeBeds, ...deletedBeds]) names[b.id] = b.name;
      setPlants(archivedPlants);
      setBedNames(names);
      setDeletedBedIds(new Set(deletedBeds.map((b) => b.id)));
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Group soft-deleted plants by the bed they belonged to.
  const sections = useMemo<BedGroup[]>(() => {
    const byBed = new Map<string, Plant[]>();
    for (const p of plants) {
      const key = p.bed_id ?? NO_BED_KEY;
      const list = byBed.get(key);
      if (list) list.push(p);
      else byBed.set(key, [p]);
    }
    return [...byBed.entries()].map(([bedId, data]) => ({
      bedId,
      title: bedId === NO_BED_KEY ? 'No bed' : bedNames[bedId] ?? 'Deleted bed',
      bedDeleted: bedId !== NO_BED_KEY && deletedBedIds.has(bedId),
      data,
    }));
  }, [plants, bedNames, deletedBedIds]);

  // Restore a plant; if its bed was also deleted, bring the bed back too so the
  // plant doesn't reappear orphaned under a hidden bed.
  const restoreOne = useCallback(
    async (plant: Plant): Promise<void> => {
      await restorePlant(plant.id);
      if (plant.bed_id && deletedBedIds.has(plant.bed_id)) {
        await restoreBed(plant.bed_id);
      }
    },
    [deletedBedIds]
  );

  const handleRestore = useCallback(
    (plant: Plant): void => {
      Alert.alert('Restore Plant', `Restore ${plant.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            if (restoringId || restoringBedId) return;
            setRestoringId(plant.id);
            try {
              await restoreOne(plant);
              load();
            } catch (error: unknown) {
              Alert.alert('Error', getErrorMessage(error));
            } finally {
              setRestoringId(null);
            }
          },
        },
      ]);
    },
    [restoringId, restoringBedId, restoreOne, load]
  );

  const handleRestoreGroup = useCallback(
    (group: BedGroup): void => {
      const count = group.data.length;
      Alert.alert(
        'Restore Bed',
        `Restore “${group.title}” and ${count} plant${count === 1 ? '' : 's'}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore All',
            onPress: async () => {
              if (restoringId || restoringBedId) return;
              setRestoringBedId(group.bedId);
              try {
                if (group.bedDeleted) await restoreBed(group.bedId);
                await restorePlantsForBed(group.data);
                load();
              } catch (error: unknown) {
                Alert.alert('Error', getErrorMessage(error));
              } finally {
                setRestoringBedId(null);
              }
            },
          },
        ]
      );
    },
    [restoringId, restoringBedId, load]
  );

  const confirmPermanentDelete = useCallback(async (): Promise<void> => {
    const plant = pendingPermanentDelete;
    if (!plant || deletingId !== null) return;
    // Keep the dialog open with a busy spinner until the delete resolves, then
    // remove the row and close — so the button can't be re-tapped mid-flight.
    setDeletingId(plant.id);
    try {
      await permanentlyDeletePlant(plant.id);
      setPlants((prev) => prev.filter((p) => p.id !== plant.id));
      setPendingPermanentDelete(null);
    } catch (error: unknown) {
      setPendingPermanentDelete(null);
      Alert.alert('Error', getErrorMessage(error));
      load();
    } finally {
      setDeletingId(null);
    }
  }, [pendingPermanentDelete, deletingId, load]);

  const handleDeleteGroup = useCallback((group: BedGroup): void => {
    setPendingGroupDelete(group);
  }, []);

  const confirmGroupDelete = useCallback(async (): Promise<void> => {
    const group = pendingGroupDelete;
    if (!group || deletingBedId !== null) return;
    // Keep the dialog open with a busy spinner until the delete resolves, then
    // remove the whole group and close. The optimistic removal used to hide the
    // section immediately, defeating any progress indicator.
    setDeletingBedId(group.bedId);
    const idSet = new Set(group.data.map((p) => p.id));
    try {
      await permanentlyDeletePlantsForBed(group.data);
      setPlants((prev) => prev.filter((p) => !idSet.has(p.id)));
      setPendingGroupDelete(null);
    } catch (error: unknown) {
      setPendingGroupDelete(null);
      Alert.alert('Error', getErrorMessage(error));
      load();
    } finally {
      setDeletingBedId(null);
    }
  }, [pendingGroupDelete, deletingBedId, load]);

  const keyExtractor = useCallback((item: Plant) => item.id, []);

  const renderSectionHeader = useCallback(
    ({ section }: { section: BedGroup }) => {
      const count = section.data.length;
      const isRestoring = restoringBedId === section.bedId;
      const isDeleting = deletingBedId === section.bedId;
      const canRestoreGroup = section.bedId !== NO_BED_KEY;
      const groupBusy = restoringBedId !== null || deletingBedId !== null || restoringId !== null;
      return (
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionTitle} numberOfLines={1}>
              {section.title}
            </Text>
            <Text style={styles.sectionCount}>
              {count} plant{count === 1 ? '' : 's'}
              {section.bedDeleted ? ' · bed deleted' : ''}
            </Text>
          </View>
          <View style={styles.sectionHeaderActions}>
            {canRestoreGroup && (
              <TouchableOpacity
                style={styles.sectionRestoreButton}
                onPress={() => handleRestoreGroup(section)}
                disabled={groupBusy}
              >
                <Ionicons name="arrow-undo" size={16} color={theme.textInverse} />
                <Text style={styles.sectionRestoreText}>
                  {isRestoring ? 'Restoring...' : 'Restore all'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.sectionDeleteButton}
              onPress={() => handleDeleteGroup(section)}
              disabled={groupBusy}
            >
              <Ionicons name="trash-outline" size={16} color={theme.error} />
              <Text style={styles.sectionDeleteText}>
                {isDeleting ? 'Deleting...' : 'Delete all'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [
      styles,
      theme.textInverse,
      theme.error,
      handleRestoreGroup,
      handleDeleteGroup,
      restoringBedId,
      deletingBedId,
      restoringId,
    ]
  );

  const renderItem = useCallback(
    ({ item }: { item: Plant }) => {
      const deletedAt = item.deleted_at
        ? new Date(item.deleted_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : null;

      return (
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.plant_variety || item.plant_type}</Text>
            {!!item.location && <Text style={styles.location}>{item.location}</Text>}
            {deletedAt && <Text style={styles.deletedAt}>Deleted {deletedAt}</Text>}
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={() => handleRestore(item)}
              disabled={
                restoringId === item.id ||
                restoringBedId !== null ||
                deletingBedId !== null ||
                deletingId === item.id
              }
            >
              <Ionicons name="arrow-undo" size={18} color={theme.primary} />
              <Text style={styles.restoreText}>
                {restoringId === item.id ? 'Restoring...' : 'Restore'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setPendingPermanentDelete(item)}
              disabled={
                deletingId === item.id ||
                restoringId === item.id ||
                restoringBedId !== null ||
                deletingBedId !== null
              }
            >
              <Ionicons name="trash-outline" size={16} color={theme.error} />
              <Text style={styles.deleteText}>
                {deletingId === item.id ? 'Deleting...' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [
      styles,
      handleRestore,
      restoringId,
      restoringBedId,
      deletingId,
      deletingBedId,
      theme.primary,
      theme.error,
    ]
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Deleted Plants</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading deleted plants...</Text>
        </View>
      ) : plants.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="archive-outline" size={64} color={theme.border} />
          <Text style={styles.emptyTitle}>No deleted plants</Text>
          <Text style={styles.emptyText}>Deleted plants will appear here for restore.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 48) + 16 },
          ]}
        />
      )}

      <ConfirmDeleteModal
        visible={pendingPermanentDelete !== null}
        title="Delete permanently?"
        message={`This permanently removes “${pendingPermanentDelete?.name ?? 'this plant'}”, its tasks and its photo. This cannot be undone.`}
        confirmLabel="Delete forever"
        busy={deletingId !== null && deletingId === pendingPermanentDelete?.id}
        onCancel={() => setPendingPermanentDelete(null)}
        onConfirm={confirmPermanentDelete}
      />

      <ConfirmDeleteModal
        visible={pendingGroupDelete !== null}
        title="Delete all permanently?"
        message={
          pendingGroupDelete
            ? `This permanently removes all ${pendingGroupDelete.data.length} plant${
                pendingGroupDelete.data.length === 1 ? '' : 's'
              } in “${pendingGroupDelete.title}”, their tasks and photos. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete all forever"
        busy={deletingBedId !== null && deletingBedId === pendingGroupDelete?.bedId}
        onCancel={() => setPendingGroupDelete(null)}
        onConfirm={confirmGroupDelete}
      />
    </View>
  );
}
