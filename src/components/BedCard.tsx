import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useTheme } from '@/theme';
import { BedType } from '@/types/database.types';
import { BedWithCoverage } from '@/hooks/useBedData';
import { bedExpectsLegumes } from '@/config/beds';
import { createStyles } from '@/styles/bedListStyles';

interface Props {
  bed: BedWithCoverage;
  onPress: (bed: BedWithCoverage) => void;
  onDelete: (bed: BedWithCoverage) => void;
  onEdit: (bed: BedWithCoverage) => void;
  onRotation: (bed: BedWithCoverage) => void;
  onSwipeableOpen?: (ref: Swipeable) => void;
}

export const BED_TYPE_EMOJI: Record<BedType, string> = {
  leafy: '🥬',
  fruiting: '🍅',
  spice: '🌿',
  root_legume: '🥕',
  climber_trellis: '🌱',
  three_sisters: '🌽',
  medicinal_guild: '🌾',
};

export const BedCard = React.memo(function BedCard({
  bed,
  onPress,
  onDelete,
  onEdit,
  onRotation,
  onSwipeableOpen,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const swipeableRef = useRef<Swipeable>(null);

  const emoji = BED_TYPE_EMOJI[bed.type] ?? '🌿';
  const showLegume = bedExpectsLegumes(bed.type);
  const lowLegume = showLegume && bed.legume_coverage_pct < 20;
  const stripeColor = lowLegume ? theme.warning ?? '#f59e0b' : theme.success ?? '#22c55e';

  const handlePress = useCallback(() => onPress(bed), [onPress, bed]);
  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    onDelete(bed);
  }, [onDelete, bed]);

  const handleEdit = useCallback(() => {
    swipeableRef.current?.close();
    onEdit(bed);
  }, [onEdit, bed]);

  const handleRotation = useCallback(() => {
    swipeableRef.current?.close();
    onRotation(bed);
  }, [onRotation, bed]);

  const renderRightActions = useCallback(
    () => (
      <View style={styles.swipeActions}>
        <TouchableOpacity
          style={styles.swipeEditAction}
          onPress={handleEdit}
          accessibilityLabel="Edit bed"
          accessibilityRole="button"
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.swipeActionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.swipeDeleteAction}
          onPress={handleDelete}
          accessibilityLabel="Delete bed"
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.swipeActionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    ),
    [styles, handleEdit, handleDelete]
  );

  const renderLeftActions = useCallback(
    () => (
      <View style={styles.swipeLeftActions}>
        <TouchableOpacity
          style={styles.swipeRotationAction}
          onPress={handleRotation}
          accessibilityLabel="View crop rotation"
          accessibilityRole="button"
        >
          <Ionicons name="sync-outline" size={20} color="#fff" />
          <Text style={styles.swipeActionText}>Rotation</Text>
        </TouchableOpacity>
      </View>
    ),
    [styles, handleRotation]
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      overshootRight={false}
      overshootLeft={false}
      friction={2}
      rightThreshold={40}
      leftThreshold={40}
      onSwipeableOpen={() => {
        if (onSwipeableOpen && swipeableRef.current) {
          onSwipeableOpen(swipeableRef.current);
        }
      }}
    >
      <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
        <View style={[styles.cardStripe, { backgroundColor: stripeColor }]} />
        <Text style={styles.cardEmoji}>{emoji}</Text>
        <View style={styles.cardContent}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardName} numberOfLines={1}>
              {bed.name}
            </Text>
            {bed.is_raised_bed && <Text style={styles.raisedTag}>Raised</Text>}
          </View>
          <Text style={styles.cardType} numberOfLines={1}>
            {bed.type.replace(/_/g, ' ')}
          </Text>
          <View style={styles.cardMetaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="leaf-outline" size={12} color={theme.textSecondary} />
              <Text style={styles.metaChipText}>
                {bed.plant_count} plant{bed.plant_count === 1 ? '' : 's'}
              </Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="resize-outline" size={12} color={theme.textSecondary} />
              <Text style={styles.metaChipText}>{bed.dimensions.area_sqm} m²</Text>
            </View>
            {showLegume && (
              <View style={styles.metaChip}>
                <Ionicons
                  name="nutrition-outline"
                  size={12}
                  color={lowLegume ? theme.warning ?? '#f59e0b' : theme.success ?? '#22c55e'}
                />
                <Text
                  style={[
                    styles.metaChipText,
                    { color: lowLegume ? theme.warning ?? '#f59e0b' : theme.success ?? '#22c55e' },
                  ]}
                >
                  {bed.legume_coverage_pct}% legume
                </Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
      </TouchableOpacity>
    </Swipeable>
  );
});
