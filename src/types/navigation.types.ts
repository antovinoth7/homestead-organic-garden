import {
  NavigatorScreenParams,
  CompositeNavigationProp,
  RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  JournalEntry,
  JournalEntryType,
  BedType,
  BedLayer,
  SunlightLevel,
  TaskType,
} from './database.types';
// Type-only: erased at compile time, so this stays a one-way dependency on the util.
import type { BedLifecycle } from '@/utils/bedStatus';

// ─── Stack param lists ────────────────────────────────────────────────────────

// Root stack: "Main" wraps the whole authed area (AuthedStack), not just the
// tabs — naming it "AppTabs" too used to trigger React Navigation's duplicate
// nested-screen-name warning against AuthedStack's own "AppTabs" screen.
export type RootStackParamList = {
  Main: NavigatorScreenParams<AuthedStackParamList>;
  Auth: undefined;
};

export type AuthedStackParamList = {
  AppTabs: NavigatorScreenParams<RootTabParamList>;
  Onboarding: undefined;
};

export type BedsStackParamList = {
  // The filters are set by the Today plot card's bed counts, which open this list
  // scoped to the lifecycle tapped and the plot it was counted for.
  BedList: { lifecycleFilter?: BedLifecycle; plotFilter?: string } | undefined;
  BedDetail: { bedId: string };
  BedCreationWizard:
    | {
        prefillType?: BedType;
        resolvedEntry?: { wizardEntryId: string; plantId: string };
        // When set, the wizard runs in edit mode, prefilled from this bed.
        editBedId?: string;
      }
    | undefined;
  BedPlantPicker: { bedId: string };
  BedRotation: undefined;
  PlantForm: PlantsStackParamList['PlantForm'];
  PlantDetail: { plantId: string };
};

export type RootTabParamList = {
  Home: { refresh?: number } | undefined;
  Plants: NavigatorScreenParams<PlantsStackParamList>;
  Beds: NavigatorScreenParams<BedsStackParamList>;
  'Care Plan':
    | {
        resetFilters?: boolean;
        filterOverdue?: boolean;
        openCreateTask?: boolean;
        prefillPlantId?: string;
        prefillTaskType?: TaskType;
      }
    | undefined;
  Journal: NavigatorScreenParams<JournalStackParamList> | undefined;
  More: NavigatorScreenParams<MoreStackParamList>;
};

export interface PlantFormPrefill {
  name: string;
  variety?: string | null;
  bedId: string;
  bedName: string;
  bedLayer: BedLayer;
  spacingCm: number;
  sunlight?: SunlightLevel;
  parentLocation?: string;
  childLocation?: string;
}

export type PlantsStackParamList = {
  PlantsList:
    | {
        healthFilter?: string;
        /**
         * Parent location name, or `UNASSIGNED_PLOT_ID` — scopes the list to one
         * plot by preselecting the filter sheet's Location filter.
         */
        plotFilter?: string;
        refresh?: number;
        savedPlantId?: string;
        savedPlantName?: string;
      }
    | undefined;
  ArchivedPlants: undefined;
  PlantDetail: { plantId: string };
  PlantForm:
    | {
        plantId?: string;
        prefill?: PlantFormPrefill;
        returnTo?: { wizardEntryId: string };
      }
    | undefined;
  PestDetail: { pestId: string };
  DiseaseDetail: { diseaseId: string };
};

export type JournalStackParamList = {
  JournalList: { refresh?: number } | undefined;
  JournalForm:
    | {
        entry?: JournalEntry;
        initialEntryType?: JournalEntryType;
        initialPlantId?: string;
      }
    | undefined;
};

export type MoreStackParamList = {
  MoreHome: undefined;
  Profile: undefined;
  ManagePlantCatalog: undefined;
  CatalogPlantDetail: {
    plantName: string;
    plantType: import('./database.types').PlantType;
    isCreating?: boolean;
  };
  PestList: undefined;
  PestDetail: { pestId: string };
  DiseaseList: undefined;
  DiseaseDetail: { diseaseId: string };
  OrganicInputList: undefined;
  OrganicInputDetail: { inputId: string };
  Settings: undefined;
  MyFarm: undefined;
  InputRecipes: { initialTab?: string } | undefined;
};

// ─── Global declaration (makes useNavigation() auto-typed) ───────────────────

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}

// ─── Per-screen convenience types ────────────────────────────────────────────

// TodayScreen (Home tab) — navigates to tabs
export type TodayScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'Home'>;
export type TodayScreenRouteProp = RouteProp<RootTabParamList, 'Home'>;

// PlantsScreen — navigates within its own stack only
export type PlantsScreenNavigationProp = NativeStackNavigationProp<
  PlantsStackParamList,
  'PlantsList'
>;
export type PlantsScreenRouteProp = RouteProp<PlantsStackParamList, 'PlantsList'>;

// PlantDetailScreen — navigates within PlantsStack AND to Journal tab (composite)
export type PlantDetailScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<PlantsStackParamList, 'PlantDetail'>,
  BottomTabNavigationProp<RootTabParamList>
>;
export type PlantDetailScreenRouteProp = RouteProp<PlantsStackParamList, 'PlantDetail'>;

// PlantFormScreen / usePlantFormState — navigates within PlantsStack AND to other tabs
// (composite, so it can hop to Beds > BedCreationWizard with resolvedEntry params)
export type PlantFormScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<PlantsStackParamList, 'PlantForm'>,
  BottomTabNavigationProp<RootTabParamList>
>;
export type PlantFormScreenRouteProp = RouteProp<PlantsStackParamList, 'PlantForm'>;

// CalendarScreen (Care Plan tab) — receives tab-level params
export type CalendarScreenRouteProp = RouteProp<RootTabParamList, 'Care Plan'>;
export type CalendarScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'Care Plan'>;

// JournalScreen — navigates within JournalStack only
export type JournalScreenNavigationProp = NativeStackNavigationProp<
  JournalStackParamList,
  'JournalList'
>;
export type JournalScreenRouteProp = RouteProp<JournalStackParamList, 'JournalList'>;

// JournalFormScreen — navigates back (pop) within JournalStack
export type JournalFormScreenNavigationProp = NativeStackNavigationProp<
  JournalStackParamList,
  'JournalForm'
>;
export type JournalFormScreenRouteProp = RouteProp<JournalStackParamList, 'JournalForm'>;

// PestListScreen — navigates within MoreStack
export type PestListScreenNavigationProp = NativeStackNavigationProp<
  MoreStackParamList,
  'PestList'
>;

// PestDetailScreen — receives pestId param; also hops to the Care Plan tab to
// open the create-task form from an action-plan step (composite)
export type PestDetailScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<MoreStackParamList, 'PestDetail'>,
  BottomTabNavigationProp<RootTabParamList>
>;
export type PestDetailScreenRouteProp = RouteProp<MoreStackParamList, 'PestDetail'>;

// DiseaseListScreen — navigates within MoreStack
export type DiseaseListScreenNavigationProp = NativeStackNavigationProp<
  MoreStackParamList,
  'DiseaseList'
>;

// DiseaseDetailScreen — receives diseaseId param; also hops to the Care Plan
// tab to open the create-task form from an action-plan step (composite)
export type DiseaseDetailScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<MoreStackParamList, 'DiseaseDetail'>,
  BottomTabNavigationProp<RootTabParamList>
>;
export type DiseaseDetailScreenRouteProp = RouteProp<MoreStackParamList, 'DiseaseDetail'>;

// OrganicInputListScreen — navigates within MoreStack
export type OrganicInputListScreenNavigationProp = NativeStackNavigationProp<
  MoreStackParamList,
  'OrganicInputList'
>;

// OrganicInputDetailScreen — receives inputId param
export type OrganicInputDetailScreenNavigationProp = NativeStackNavigationProp<
  MoreStackParamList,
  'OrganicInputDetail'
>;
export type OrganicInputDetailScreenRouteProp = RouteProp<MoreStackParamList, 'OrganicInputDetail'>;

// ─── Beds stack convenience types (Phase B2) ─────────────────────────────────

export type BedListScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<BedsStackParamList, 'BedList'>,
  BottomTabNavigationProp<RootTabParamList>
>;
export type BedListScreenRouteProp = RouteProp<BedsStackParamList, 'BedList'>;

export type BedDetailScreenNavigationProp = NativeStackNavigationProp<
  BedsStackParamList,
  'BedDetail'
>;
export type BedDetailScreenRouteProp = RouteProp<BedsStackParamList, 'BedDetail'>;

export type BedCreationWizardNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<BedsStackParamList, 'BedCreationWizard'>,
  BottomTabNavigationProp<RootTabParamList>
>;
export type BedCreationWizardRouteProp = RouteProp<BedsStackParamList, 'BedCreationWizard'>;

export type BedPlantPickerNavigationProp = NativeStackNavigationProp<
  BedsStackParamList,
  'BedPlantPicker'
>;
export type BedPlantPickerRouteProp = RouteProp<BedsStackParamList, 'BedPlantPicker'>;

export type BedRotationScreenNavigationProp = NativeStackNavigationProp<
  BedsStackParamList,
  'BedRotation'
>;
