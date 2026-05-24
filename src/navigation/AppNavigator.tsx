import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { FloatingTabBarProvider, FloatingTabBar } from '../components/FloatingTabBar';

// Screens
import TodayScreen from '../screens/TodayScreen';
import PlantsScreen from '../screens/PlantsScreen';
import ArchivedPlantsScreen from '../screens/ArchivedPlantsScreen';
import PlantFormScreen from '../screens/PlantFormScreen';
import PlantDetailScreen from '../screens/PlantDetailScreen';
import CalendarScreen from '../screens/CalendarScreen';
import JournalScreen from '../screens/JournalScreen';
import JournalFormScreen from '../screens/JournalFormScreen';
import MoreScreen from '../screens/MoreScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ManagePlantCatalogScreen from '../screens/ManagePlantCatalogScreen';
import CatalogPlantDetailScreen from '../screens/CatalogPlantDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PestListScreen from '../screens/PestListScreen';
import PestDetailScreen from '../screens/PestDetailScreen';
import DiseaseListScreen from '../screens/DiseaseListScreen';
import DiseaseDetailScreen from '../screens/DiseaseDetailScreen';
import OrganicInputListScreen from '../screens/OrganicInputListScreen';
import OrganicInputDetailScreen from '../screens/OrganicInputDetailScreen';
// Bed screens
import BedListScreen from '../screens/BedListScreen';
import BedDetailScreen from '../screens/BedDetailScreen';
import BedCreationWizardScreen from '../screens/BedCreationWizardScreen';
import BedPlantPickerScreen from '../screens/BedPlantPickerScreen';
import BedTasksScreen from '../screens/BedTasksScreen';
import MyFarmScreen from '../screens/MyFarmScreen';
import InputRecipesScreen from '../screens/InputRecipesScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const BedsStack = (): React.JSX.Element => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="BedList" component={BedListScreen} />
    <Stack.Screen name="BedDetail" component={BedDetailScreen} />
    <Stack.Screen name="BedCreationWizard" component={BedCreationWizardScreen} />
    <Stack.Screen name="BedPlantPicker" component={BedPlantPickerScreen} />
    <Stack.Screen name="BedTasks" component={BedTasksScreen} />
  </Stack.Navigator>
);

const PlantStack = (): React.JSX.Element => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PlantsList" component={PlantsScreen} />
    <Stack.Screen name="ArchivedPlants" component={ArchivedPlantsScreen} />
    <Stack.Screen name="PlantDetail" component={PlantDetailScreen} />
    <Stack.Screen name="PlantForm" component={PlantFormScreen} />
    <Stack.Screen name="PestDetail" component={PestDetailScreen} />
    <Stack.Screen name="DiseaseDetail" component={DiseaseDetailScreen} />
  </Stack.Navigator>
);

const JournalStack = (): React.JSX.Element => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="JournalList" component={JournalScreen} />
    <Stack.Screen name="JournalForm" component={JournalFormScreen} />
  </Stack.Navigator>
);

const MoreStack = (): React.JSX.Element => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MoreHome" component={MoreScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="ManagePlantCatalog" component={ManagePlantCatalogScreen} />
    <Stack.Screen name="CatalogPlantDetail" component={CatalogPlantDetailScreen} />
    <Stack.Screen name="PestList" component={PestListScreen} />
    <Stack.Screen name="PestDetail" component={PestDetailScreen} />
    <Stack.Screen name="DiseaseList" component={DiseaseListScreen} />
    <Stack.Screen name="DiseaseDetail" component={DiseaseDetailScreen} />
    <Stack.Screen name="OrganicInputList" component={OrganicInputListScreen} />
    <Stack.Screen name="OrganicInputDetail" component={OrganicInputDetailScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="MyFarm" component={MyFarmScreen} />
    <Stack.Screen name="InputRecipes" component={InputRecipesScreen} />
  </Stack.Navigator>
);

export const AppTabs = (): React.JSX.Element => {
  const theme = useTheme();

  return (
    <FloatingTabBarProvider>
      <Tab.Navigator
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';
            if (route.name === 'Home') iconName = 'home';
            else if (route.name === 'Plants') iconName = 'leaf';
            else if (route.name === 'Beds') iconName = 'grid';
            else if (route.name === 'Care Plan') iconName = 'calendar';
            else if (route.name === 'Journal') iconName = 'book';
            else if (route.name === 'More') iconName = 'ellipsis-vertical';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.tabBarActive,
          tabBarInactiveTintColor: theme.tabBarInactive,
          tabBarHideOnKeyboard: true,
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={TodayScreen} />
        <Tab.Screen
          name="Plants"
          component={PlantStack}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('Plants', {
                screen: 'PlantsList',
                params: {},
              });
            },
          })}
        />
        <Tab.Screen
          name="Beds"
          component={BedsStack}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('Beds', {
                screen: 'BedList',
                params: {},
              });
            },
          })}
        />
        <Tab.Screen name="Care Plan" component={CalendarScreen} />
        <Tab.Screen
          name="Journal"
          component={JournalStack}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('Journal', {
                screen: 'JournalList',
                params: {},
              });
            },
          })}
        />
        <Tab.Screen
          name="More"
          component={MoreStack}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('More', {
                screen: 'MoreHome',
                params: {},
              });
            },
          })}
        />
      </Tab.Navigator>
    </FloatingTabBarProvider>
  );
};
