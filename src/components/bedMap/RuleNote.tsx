import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/bedCreationWizardStyles';

interface RuleNoteProps {
  walkingPathCm: number;
  edgeBufferCm: number;
  edgeBufferEWCm: number;
}

// Friendly bed-type label inferred from the walking-path width, which the engine
// sets per construction category (raised 45 / in-ground 60 / food-forest 90).
function bedTypeLabel(walkingPathCm: number): string {
  if (walkingPathCm >= 90) return 'Food forest';
  if (walkingPathCm >= 60) return 'In-ground bed';
  return 'Raised bed';
}

/**
 * Single enterprise-clean line explaining how the edge/path gaps are derived for
 * the chosen bed type. Numbers are sourced from props so the note never drifts
 * from the markers drawn around the canvas.
 */
export function RuleNote({
  walkingPathCm,
  edgeBufferCm,
  edgeBufferEWCm,
}: RuleNoteProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const edgeMax = Math.max(edgeBufferCm, edgeBufferEWCm);
  const note = `${bedTypeLabel(walkingPathCm)}: ${walkingPathCm} cm access path at each end · ${edgeMax} cm edge setback on every side (¼ of plant spacing).`;

  return (
    <View style={styles.tdmRuleNote}>
      <Ionicons name="information-circle-outline" size={13} color={theme.textTertiary} />
      <Text style={styles.tdmRuleNoteText}>{note}</Text>
    </View>
  );
}
