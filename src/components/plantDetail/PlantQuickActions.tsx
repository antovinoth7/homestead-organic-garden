import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plantQuickActionsStyles';

interface Props {
  onLogHarvest: () => void;
  onLogPest: () => void;
  onAddNote: () => void;
  onAddCareTask: () => void;
}

interface Action {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}

/** Row of primary "log/create" shortcuts at the top of the plant Care tab. */
export function PlantQuickActions({
  onLogHarvest,
  onLogPest,
  onAddNote,
  onAddCareTask,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const actions: Action[] = [
    { key: 'harvest', label: 'Harvest', icon: 'basket', onPress: onLogHarvest },
    { key: 'pest', label: 'Pest/Disease', icon: 'bug', onPress: onLogPest },
    { key: 'note', label: 'Note', icon: 'create-outline', onPress: onAddNote },
    { key: 'task', label: 'Care Task', icon: 'calendar', onPress: onAddCareTask },
  ];

  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.key}
          style={styles.action}
          onPress={action.onPress}
          activeOpacity={0.7}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={action.icon} size={20} color={theme.primary} />
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
