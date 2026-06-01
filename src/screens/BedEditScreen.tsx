import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { getBed, updateBed } from '@/services/beds';
import { createStyles } from '@/styles/bedEditStyles';
import { logger } from '@/utils/logger';
import type { SunlightLevel } from '@/types/database.types';
import type {
  BedEditScreenNavigationProp,
  BedEditScreenRouteProp,
} from '@/types/navigation.types';

const SUNLIGHT_OPTIONS: { value: SunlightLevel; label: string }[] = [
  { value: 'full_sun', label: 'Full Sun' },
  { value: 'partial_sun', label: 'Partial' },
  { value: 'shade', label: 'Shade' },
];

export default function BedEditScreen(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BedEditScreenNavigationProp>();
  const route = useRoute<BedEditScreenRouteProp>();
  const { bedId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [parentLocation, setParentLocation] = useState('');
  const [childLocation, setChildLocation] = useState('');
  const [sunlight, setSunlight] = useState<SunlightLevel>('full_sun');
  const [isRaisedBed, setIsRaisedBed] = useState(false);
  const [isPermanent, setIsPermanent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getBed(bedId)
      .then((bed) => {
        if (cancelled || !bed) return;
        setName(bed.name);
        setNotes(bed.notes ?? '');
        setParentLocation(bed.parent_location ?? '');
        setChildLocation(bed.child_location ?? '');
        setSunlight(bed.sunlight);
        setIsRaisedBed(bed.is_raised_bed);
        setIsPermanent(bed.is_permanent);
      })
      .catch((err) => {
        if (cancelled) return;
        logger.warn('BedEditScreen: failed to load bed', err as Error);
        setLoadError('Failed to load bed. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bedId]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a bed name.');
      return;
    }
    setSaving(true);
    try {
      await updateBed(bedId, {
        name: name.trim(),
        notes: notes.trim() || null,
        parent_location: parentLocation.trim() || null,
        child_location: childLocation.trim() || null,
        sunlight,
        is_raised_bed: isRaisedBed,
        is_permanent: isPermanent,
      });
      navigation.goBack();
    } catch (err) {
      logger.warn('BedEditScreen: save failed', err as Error);
      Alert.alert('Save failed', 'Could not save changes. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }, [
    bedId,
    name,
    notes,
    parentLocation,
    childLocation,
    sunlight,
    isRaisedBed,
    isPermanent,
    navigation,
  ]);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>{loadError}</Text>
        <TouchableOpacity style={styles.saveButton} onPress={() => navigation.goBack()}>
          <Text style={styles.saveButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Bed</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.fieldLabel}>Bed Name</Text>
        <TextInput
          style={styles.fieldInput}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Mangarai Bed"
          placeholderTextColor={theme.inputPlaceholder}
          returnKeyType="done"
        />

        <Text style={styles.fieldLabel}>Sunlight</Text>
        <View style={styles.segmentedRow}>
          {SUNLIGHT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.segmentButton, sunlight === opt.value && styles.segmentButtonActive]}
              onPress={() => setSunlight(opt.value)}
            >
              <Text
                style={[styles.segmentText, sunlight === opt.value && styles.segmentTextActive]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Parent Location</Text>
        <TextInput
          style={styles.fieldInput}
          value={parentLocation}
          onChangeText={setParentLocation}
          placeholder="e.g. Backyard"
          placeholderTextColor={theme.inputPlaceholder}
          returnKeyType="done"
        />

        <Text style={styles.fieldLabel}>Section / Area</Text>
        <TextInput
          style={styles.fieldInput}
          value={childLocation}
          onChangeText={setChildLocation}
          placeholder="e.g. North corner"
          placeholderTextColor={theme.inputPlaceholder}
          returnKeyType="done"
        />

        <Text style={styles.fieldLabel}>Notes</Text>
        <TextInput
          style={[styles.fieldInput, styles.fieldInputMultiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any notes about this bed…"
          placeholderTextColor={theme.inputPlaceholder}
          multiline
          returnKeyType="default"
        />

        <View style={styles.divider} />

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Raised bed</Text>
          <Switch
            value={isRaisedBed}
            onValueChange={setIsRaisedBed}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={theme.textInverse}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Permanent bed</Text>
          <Switch
            value={isPermanent}
            onValueChange={setIsPermanent}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={theme.textInverse}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
