import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Plant, BedLayer } from '@/types/database.types';
import { getAllPlants, updatePlant } from '@/services/plants';
import { getBed } from '@/services/beds';
import { createStyles } from '@/styles/bedPlantPickerStyles';
import type {
  BedPlantPickerNavigationProp,
  BedPlantPickerRouteProp,
} from '@/types/navigation.types';

const LAYER_OPTIONS: { value: BedLayer; label: string }[] = [
  { value: 'canopy', label: 'Canopy' },
  { value: 'understory', label: 'Understory' },
  { value: 'ground_cover', label: 'Ground Cover' },
  { value: 'root', label: 'Root' },
  { value: 'climber', label: 'Climber' },
];

export default function BedPlantPickerScreen(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<BedPlantPickerNavigationProp>();
  const route = useRoute<BedPlantPickerRouteProp>();
  const { bedId } = route.params;

  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [layerMap, setLayerMap] = useState<Record<string, BedLayer>>({});

  useEffect(() => {
    Promise.all([getAllPlants(), getBed(bedId)])
      .then(([allPlants]) => {
        // Show plants not yet assigned to this bed
        const available = allPlants.filter((p) => !p.is_deleted && p.bed_id !== bedId);
        setPlants(available);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bedId]);

  const toggleSelect = useCallback((plantId: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(plantId)) next.delete(plantId);
      else next.add(plantId);
      return next;
    });
  }, []);

  const setLayer = useCallback((plantId: string, layer: BedLayer): void => {
    setLayerMap((prev) => ({ ...prev, [plantId]: layer }));
  }, []);

  const handleConfirm = useCallback(async (): Promise<void> => {
    if (selectedIds.size === 0) {
      navigation.goBack();
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        [...selectedIds].map((id) =>
          updatePlant(id, {
            bed_id: bedId,
            bed_layer: layerMap[id] ?? 'understory',
          })
        )
      );
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to assign plants to bed');
    } finally {
      setSaving(false);
    }
  }, [selectedIds, layerMap, bedId, navigation]);

  const renderItem = ({ item }: { item: Plant }): React.JSX.Element => {
    const isSelected = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.plantRow, isSelected && styles.plantRowSelected]}
        onPress={() => toggleSelect(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.plantRowInfo}>
          <Text style={styles.plantName}>{item.name}</Text>
          {item.plant_variety && <Text style={styles.plantVariety}>{item.plant_variety}</Text>}
          {item.bed_id && item.bed_id !== bedId && (
            <Text style={styles.assignedBadge}>Already in another bed</Text>
          )}
        </View>
        {isSelected && (
          <View style={styles.layerPicker}>
            {LAYER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.layerChip,
                  (layerMap[item.id] ?? 'understory') === opt.value && styles.layerChipActive,
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
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Plants to Bed</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} />
      ) : (
        <FlatList
          data={plants}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity
        style={[
          styles.confirmButton,
          (saving || selectedIds.size === 0) && styles.confirmButtonDisabled,
        ]}
        onPress={handleConfirm}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.confirmText}>
            {selectedIds.size === 0
              ? 'Skip'
              : `Add ${selectedIds.size} plant${selectedIds.size > 1 ? 's' : ''}`}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
