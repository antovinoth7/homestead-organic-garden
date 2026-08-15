import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { Plant } from '../types/database.types';
import { Ionicons } from '@expo/vector-icons';
import { GardenIcon } from '@/components/GardenIcon';
import { getPlantImage, REFERENCE_IMAGE_CACHE_POLICY } from '@/config/referenceAssets';
import { useTheme } from '../theme';
import { getYearsOld } from '../utils/dateHelpers';
import { getPlantWaterStatus, daysSinceLastWatered } from '../utils/plantWatering';
import { createStyles } from '../styles/plantCardStyles';
import Swipeable from 'react-native-gesture-handler/Swipeable';

interface PlantCardProps {
  plant: Plant;
  onPress: (plantId: string) => void;
  onEdit: (plantId: string) => void;
  onDelete: (plantId: string) => void;
  searchQuery?: string;
  onSwipeableOpen?: (ref: Swipeable) => void;
}

function PlantCard({
  plant,
  onPress,
  onEdit,
  onDelete,
  searchQuery = '',
  onSwipeableOpen,
}: PlantCardProps): React.JSX.Element {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [imageError, setImageError] = useState(false);
  const isMountedRef = useRef(true);
  const swipeableRef = useRef<Swipeable>(null);

  useEffect(() => {
    isMountedRef.current = true;
    setImageError(false);
    return () => {
      isMountedRef.current = false;
    };
  }, [plant.photo_url]);

  const referenceImage = getPlantImage(plant.name);

  const getPlantTypeLabel = (): string => {
    const labels: Record<string, string> = {
      vegetable: 'Vegetable',
      herb: 'Herb',
      flower: 'Flower',
      fruit_tree: 'Fruit',
      timber_tree: 'Timber Tree',
      coconut_tree: 'Coconut Tree',
      shrub: 'Shrub',
    };
    return labels[plant.plant_type] || 'Plant';
  };

  const getPlantTypeBg = (): string => {
    const bgs: Record<string, string> = {
      vegetable: '#e8f5e9',
      herb: '#e0f2f1',
      flower: '#fce4ec',
      fruit_tree: '#fff3e0',
      timber_tree: '#e8eaf6',
      coconut_tree: '#efebe9',
      shrub: '#f1f8e9',
    };
    return bgs[plant.plant_type] || '#e8f5e9';
  };

  const isTree = ['fruit_tree', 'timber_tree', 'coconut_tree'].includes(plant.plant_type);
  const age = getYearsOld(plant.planting_date ?? null);

  const getHealthColor = (): string => {
    const colors: Record<string, string> = {
      healthy: theme.success,
      stressed: theme.warning,
      recovering: theme.info,
      sick: theme.error,
    };
    return (plant.health_status ? colors[plant.health_status] : undefined) ?? theme.success;
  };

  const handleImageError = (): void => {
    if (isMountedRef.current) setImageError(true);
  };

  const renderHighlighted = (text: string): React.ReactNode => {
    const query = searchQuery.trim();
    if (!query) return text;
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    return [
      text.slice(0, index),
      <Text key="match" style={styles.highlight}>
        {text.slice(index, index + query.length)}
      </Text>,
      text.slice(index + query.length),
    ];
  };

  const handlePress = useCallback(() => onPress(plant.id), [onPress, plant.id]);

  const handleSwipeableOpen = useCallback(() => {
    if (onSwipeableOpen && swipeableRef.current) {
      onSwipeableOpen(swipeableRef.current);
    }
  }, [onSwipeableOpen]);

  const renderRightActions = useCallback(
    () => (
      <View style={styles.swipeActions}>
        <TouchableOpacity
          style={styles.swipeEditAction}
          onPress={() => {
            swipeableRef.current?.close();
            setTimeout(() => onEdit(plant.id), 150);
          }}
          accessibilityLabel="Edit plant"
          accessibilityRole="button"
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.swipeActionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.swipeDeleteAction}
          onPress={() => {
            swipeableRef.current?.close();
            setTimeout(() => onDelete(plant.id), 150);
          }}
          accessibilityLabel="Delete plant"
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.swipeActionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    ),
    [styles, onEdit, onDelete, plant.id]
  );

  // Watering status shares the single source of truth used by the Today screen
  // and bed cards (midnight-floored, >= comparison, handles never-watered), so
  // the red "overdue" state here can't disagree with the rest of the app.
  const waterStatus = getPlantWaterStatus(plant);
  const daysWatered = daysSinceLastWatered(plant);
  const waterOverdueLabel =
    waterStatus.reason === 'due_today'
      ? 'Water today'
      : waterStatus.reason === 'no_history'
        ? 'Needs water'
        : `${waterStatus.daysOverdue}d overdue`;

  const activePestCount = (plant.pest_disease_history || []).filter((r) => !r.resolved).length;

  // ── Standard List Card ──
  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
      onSwipeableOpen={handleSwipeableOpen}
    >
      <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
        {/* Left health stripe */}
        <View style={[styles.healthStripe, { backgroundColor: getHealthColor() }]} />

        {/* Image with health dot overlay */}
        <View style={styles.imageContainer}>
          {plant.photo_url && !imageError ? (
            <Image
              source={{ uri: plant.photo_url }}
              style={styles.image as ImageStyle}
              contentFit="cover"
              transition={200}
              onError={handleImageError}
              recyclingKey={plant.id}
              cachePolicy="memory-disk"
              priority="normal"
            />
          ) : referenceImage ? (
            <Image
              source={referenceImage}
              style={styles.image as ImageStyle}
              contentFit="cover"
              transition={150}
              recyclingKey={`reference:${plant.name}`}
              cachePolicy={REFERENCE_IMAGE_CACHE_POLICY}
            />
          ) : (
            <View style={[styles.image, styles.placeholder, { backgroundColor: getPlantTypeBg() }]}>
              <GardenIcon name="general.plant" size={32} color={theme.primary} />
              {plant.photo_url && imageError && (
                <View style={styles.missingImageBadge}>
                  <Ionicons name="camera" size={12} color={theme.textTertiary} />
                </View>
              )}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
              {renderHighlighted(plant.name)}
            </Text>
            <Text style={styles.badge} numberOfLines={1} ellipsizeMode="tail">
              {plant.plant_variety || getPlantTypeLabel()}
            </Text>
          </View>

          {plant.variety && <Text style={styles.variety}>{plant.variety}</Text>}

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons
                name={
                  plant.space_type === 'pot'
                    ? 'cube-outline'
                    : plant.space_type === 'bed'
                    ? 'apps'
                    : 'earth'
                }
                size={12}
                color={theme.textTertiary}
              />
              <Text style={styles.metaText}>
                {plant.space_type === 'pot'
                  ? plant.pot_size || 'Pot'
                  : plant.space_type === 'bed'
                  ? plant.bed_name || 'Bed'
                  : 'Ground'}
              </Text>
            </View>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText} numberOfLines={1}>
              {plant.location}
            </Text>

            {isTree && age !== null && age > 0 && (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.ageText}>{age}y</Text>
              </>
            )}
          </View>

          {/* Bottom row: water indicator + health label */}
          <View style={styles.statusRow}>
            {plant.bed_id != null && (
              <View style={styles.bedChip}>
                <Ionicons name="grid-outline" size={10} color={theme.primary} />
                <Text style={styles.bedChipText}>Bed</Text>
              </View>
            )}
            {waterStatus.overdue ? (
              <View style={[styles.statusChip, styles.statusChipOverdue]}>
                <Ionicons name="water" size={12} color={theme.error} />
                <Text style={[styles.statusChipText, styles.statusChipTextOverdue]}>
                  {waterOverdueLabel}
                </Text>
              </View>
            ) : daysWatered !== null ? (
              <View style={styles.statusChip}>
                <Ionicons name="water" size={12} color={theme.info} />
                <Text style={styles.statusChipText}>
                  {daysWatered === 0 ? 'Today' : `${daysWatered}d ago`}
                </Text>
              </View>
            ) : null}
            {plant.health_status && plant.health_status !== 'healthy' && (
              <View
                style={[
                  styles.statusChip,
                  {
                    backgroundColor: getHealthColor() + '18',
                    borderColor: getHealthColor() + '40',
                  },
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: getHealthColor() }]} />
                <Text style={[styles.statusChipText, { color: getHealthColor() }]}>
                  {plant.health_status.charAt(0).toUpperCase() + plant.health_status.slice(1)}
                </Text>
              </View>
            )}
            {activePestCount > 0 && (
              <View style={[styles.statusChip, styles.pestStatusChip]}>
                <Ionicons name="bug" size={12} color={theme.error} />
                <Text style={styles.pestStatusChipText}>{activePestCount} active</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.textTertiary}
          style={styles.chevron}
        />
      </TouchableOpacity>
    </Swipeable>
  );
}

export default React.memo(PlantCard);
