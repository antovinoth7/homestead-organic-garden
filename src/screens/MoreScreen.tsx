import React from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { TAB_BAR_HEIGHT } from '../components/FloatingTabBar';
import { auth } from '../lib/firebase';
import { signOut } from '@firebase/auth';
import { invalidateAll } from '../lib/dataCache';
import { createStyles } from '../styles/moreStyles';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { getErrorMessage } from '../utils/errorLogging';
import { useOwnerName } from '@/hooks/useOwnerName';

export default function MoreScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { ownerName } = useOwnerName();

  const email = auth.currentUser?.email ?? '';

  // With a saved name the bold line is the name and the email drops to a
  // quiet second line; without one the email takes the bold slot alone.
  const primaryLine = ownerName || email || 'Not signed in';
  const secondaryLine = ownerName ? email : '';

  const goToProfile = React.useCallback((): void => {
    navigation.navigate('Profile');
  }, [navigation]);

  const handleSignOut = async (): Promise<void> => {
    try {
      invalidateAll();
      await signOut(auth);
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error) || 'Failed to sign out');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.accountHeader}>
          <TouchableOpacity style={styles.avatarWrap} onPress={goToProfile} activeOpacity={0.85}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={38} color={theme.primary} />
            </View>
            <View style={styles.avatarBadge}>
              <Ionicons name="pencil" size={11} color={theme.primary} />
            </View>
          </TouchableOpacity>
          <View style={styles.accountText}>
            <Text style={styles.accountName} numberOfLines={1}>
              {primaryLine}
            </Text>
            {secondaryLine ? (
              <Text style={styles.accountEmail} numberOfLines={1}>
                {secondaryLine}
              </Text>
            ) : null}
            <TouchableOpacity style={styles.signOutPill} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={15} color={theme.textInverse} />
              <Text style={styles.signOutPillText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) + 16 }}
      >
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MyFarm')}>
          <View style={styles.menuIcon}>
            <Ionicons name="map-outline" size={20} color={theme.primary} />
          </View>
          <Text style={styles.menuText}>My Farm</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ManagePlantCatalog')}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="list-outline" size={20} color={theme.primary} />
          </View>
          <Text style={styles.menuText}>Manage Plant Catalog</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PestList')}>
          <View style={styles.menuIcon}>
            <Ionicons name="bug-outline" size={20} color={theme.primary} />
          </View>
          <Text style={styles.menuText}>Pests</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('DiseaseList')}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="medical-outline" size={20} color={theme.primary} />
          </View>
          <Text style={styles.menuText}>Diseases</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('OrganicInputList')}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="flask-outline" size={20} color={theme.primary} />
          </View>
          <Text style={styles.menuText}>Organic Inputs</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
          <View style={styles.menuIcon}>
            <Ionicons name="settings-outline" size={20} color={theme.primary} />
          </View>
          <Text style={styles.menuText}>Settings</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
