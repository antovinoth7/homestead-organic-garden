# Codemap

> **Generated file — do not edit.** Regenerate with `npm run codemap`.
> Snapshot: 2026-07-27 — src/: 498 files, 94,447 lines.
>
> Files marked ⚠️ exceed 800 lines: search inside them (Grep) instead of reading them whole.

## Large files (search, don't read whole)

- src/screens/CalendarScreen.tsx (2079)
- src/utils/plantHelpers.ts (1958)
- src/styles/bedCreationWizardStyles.ts (1886)
- src/screens/CatalogPlantDetailScreen.tsx (1879)
- src/styles/plantFormStyles.ts (1719)
- src/styles/calendarStyles.ts (1577)
- src/services/tasks.ts (1471)
- src/hooks/usePlantFormState.ts (1202)
- src/services/plants.ts (1126)
- src/services/plantProfiles.ts (1023)
- src/components/BedRowLayout.tsx (982)
- src/hooks/useBedCreationWizard.ts (937)
- src/screens/PlantsScreen.tsx (933)
- src/lib/imageStorage.ts (873)
- src/services/plantCatalog.ts (836)

## src/

### src/__tests__/components/ — 3 files, 201 lines

- bedRotationSummary.test.ts (100)
- bedSuccessionTimeline.harvest.test.ts (60)
- DraggablePlantRow.test.ts (41)

### src/__tests__/config/ — 6 files, 316 lines

- referenceAssets.test.ts (101)
- organicInputs.test.ts (63)
- zones.test.ts (47)
- organicInputs.seasonalRhythm.test.ts (45)
- districtCoordinates.test.ts (35)
- almanac.test.ts (25)

### src/__tests__/config/beds/ — 5 files, 292 lines

- legumeRelevance.test.ts (81)
- smartNextCrops.test.ts (62)
- rotationRules.test.ts (61)
- bedTypeMeta.test.ts (53)
- plantingSequence.test.ts (35)

### src/__tests__/fixtures/ — 4 files, 85 lines

- task.fixtures.ts (30)
- bed.fixtures.ts (23)
- journal.fixtures.ts (16)
- plant.fixtures.ts (16)

### src/__tests__/hooks/ — 3 files, 377 lines

- journalFormValidation.test.ts (196)
- plantFormValidation.test.ts (104)
- blockReasonForStep.test.ts (77)

### src/__tests__/lib/ — 2 files, 172 lines

- offlineQueue.test.ts (104)
- dataCache.test.ts (68)

### src/__tests__/mocks/ — 1 files, 4 lines

- fileMock.js (4)

### src/__tests__/services/ — 7 files, 1,227 lines

- alerts.test.ts (487)
- offlineSync.test.ts (154)
- taskSkip.test.ts (153)
- beds.test.ts (141)
- weather.test.ts (122)
- careTaskScheduling.test.ts (87)
- preMonsoonTasks.test.ts (83)

### src/__tests__/utils/ — 50 files, 5,703 lines

- rowLayoutEngine.test.ts (523)
- growthStage.test.ts (371)
- rowLayoutEngine.bedTypes.test.ts (343)
- bedPreview.test.ts (190)
- filterAndSortBeds.test.ts (186)
- quickStartPlanner.test.ts (186)
- bedStatus.test.ts (183)
- seasonHelpers.test.ts (176)
- carePlanDisplay.test.ts (165)
- plantHistory.test.ts (153)
- pests.test.ts (148)
- diseases.test.ts (143)
- plantWatering.test.ts (141)
- plantingNow.test.ts (134)
- plantHelpersA2.test.ts (133)
- plantPickerItems.test.ts (132)
- offlineQueueLogic.test.ts (125)
- plantNameGenerator.test.ts (125)
- plantPhotos.test.ts (124)
- rotationRules.rowLevel.test.ts (118)
- riskHelpers.test.ts (114)
- scrollSpy.test.ts (109)
- journalEntryOptions.test.ts (107)
- bedEditReconcile.test.ts (104)
- journalStats.test.ts (102)
- plantTypeFromName.test.ts (101)
- plantClassification.test.ts (98)
- recipeQuantity.test.ts (81)
- activityRows.test.ts (76)
- backupManifest.test.ts (74)
- plantCareDefaultsA2.test.ts (72)
- plantEntryMapper.test.ts (72)
- taskSummary.test.ts (71)
- taskBed.test.ts (69)
- imageCompression.test.ts (67)
- harvestStats.test.ts (64)
- progressiveList.test.ts (64)
- dateHelpers.test.ts (55)
- voiceInput.test.ts (50)
- recurringTaskStatus.test.ts (48)
- plantCompanions.test.ts (47)
- bedOccupancy.test.ts (44)
- locations.test.ts (42)
- dataRegistrySnapshot.test.ts (33)
- cropFamilyFromName.test.ts (26)
- seasonLabel.test.ts (26)
- svgArc.test.ts (26)
- plantHealth.test.ts (24)
- plantCapacity.test.ts (21)
- growSpecFormat.test.ts (17)

### src/components/ — 71 files, 11,664 lines

- BedRowLayout.tsx (982) ⚠️ large — Grep/search inside, do not read whole
- BedTopDownMap.tsx (773)
- BedPlantPickerSheet.tsx (483)
- PlantFilterSheet.tsx (481)
- BedSuccessionTimeline.tsx (408)
- LocationProfileEditor.tsx (369)
- BedFilterSheet.tsx (332)
- FloatingTabBar.tsx (319)
- PlantCard.tsx (313)
- DashboardHero.tsx (303)
- JournalEntryCard.tsx (254)
- PlantEntryResolverSheet.tsx (253)
- ThemedDropdown.tsx (237)
- BedCard.tsx (236)
- WeatherDeck.tsx (233)
- DetailCareGuidanceSection.tsx (210)
- GrowthStageTimeline.tsx (197)
- BedLayerStack.tsx (192)
- PlantPickerSheet.tsx (191)
- SeasonPanel.tsx (174)
- FieldHelp.tsx (172)
- HarvestHistorySection.tsx (172)
- BedRotationView.tsx (168)
- CoconutSection.tsx (168)
- FloatingLabelInput.tsx (165)
- LocationPickerSheet.tsx (152)
- BedsQuickScroll.tsx (151)
- NeedsAttentionScroll.tsx (144)
- CollapsibleSection.tsx (137)
- PlantKeyInfoSection.tsx (133)
- DraggablePlantRow.tsx (131)
- StagePickerSheet.tsx (129)
- SegmentedTabs.tsx (119)
- ImageZoomModal.tsx (116)
- TaskCard.tsx (114)
- VoiceDictation.tsx (112)
- HarvestWeightInput.tsx (110)
- CareScheduleSection.tsx (109)
- GrowthStageSection.tsx (108)
- DetailQuickInfoSection.tsx (105)
- WeatherPlotCard.tsx (104)
- ErrorBoundary.tsx (100)
- BottomSheetModal.tsx (97)
- BedZoneIllustration.tsx (96)
- DetailNutritionSection.tsx (93)
- PickerField.tsx (91)
- ShowMoreFooter.tsx (91)
- RotationStatusCard.tsx (87)
- PrepCard.tsx (85)
- ZoomableImagePage.tsx (82)
- PinGrowthStageModal.tsx (74)
- BedContextSection.tsx (71)
- PlantCatalogList.tsx (66)
- UndoToast.tsx (65)
- TipStrip.tsx (64)
- PlantCategoryTabs.tsx (61)
- ClearBedCta.tsx (60)
- OfflineBanner.tsx (53)
- ScreenHeader.tsx (53)
- HarvestInfoSection.tsx (52)
- CompanionPlantingSection.tsx (51)
- SectionHeader.tsx (49)
- VoiceInputButton.tsx (47)
- ReferenceThumb.tsx (46)
- HarvestYieldChart.tsx (45)
- WeatherCard.tsx (45)
- PlantInfoRow.tsx (40)
- SheetHandle.tsx (40)
- FieldLabelWithHelp.tsx (39)
- PlantNotesSection.tsx (33)
- FieldErrorText.tsx (29)

### src/components/calendar/ — 3 files, 540 lines

- SwipeableTaskCard.tsx (304)
- MonthCalendarView.tsx (126)
- WeekCalendarView.tsx (110)

### src/components/forms/ — 19 files, 3,431 lines

- EditCareScheduleSection.tsx (485)
- JournalPestDiseaseSection.tsx (376)
- PlantEditForm.tsx (338)
- AddPlantPlacementSection.tsx (252)
- AddPlantBasicsSection.tsx (217)
- EditPlantHealthSection.tsx (209)
- EditCareGuidanceSection.tsx (205)
- EditCoconutSection.tsx (188)
- EditBasicInfoSection.tsx (180)
- EditLocationSection.tsx (162)
- JournalHarvestSection.tsx (160)
- AddPlantCarePlanSection.tsx (142)
- PlantAddForm.tsx (114)
- EditQuickInfoSection.tsx (110)
- EditNutritionSection.tsx (96)
- CarePlanSummary.tsx (57)
- JournalMilestoneSection.tsx (56)
- FormSectionCard.tsx (49)
- EditBeneficialsSection.tsx (35)

### src/components/modals/ — 10 files, 1,563 lines

- CreateTaskModal.tsx (431)
- LocationEditModal.tsx (312)
- SkipTaskModal.tsx (175)
- AlertDialog.tsx (159)
- TaskCompletionModal.tsx (111)
- ConfirmDeleteModal.tsx (101)
- LocationReassignModal.tsx (80)
- PhotoSourceModal.tsx (71)
- DiscardChangesModal.tsx (65)
- BedCapacityModal.tsx (58)

### src/components/plantDetail/ — 11 files, 878 lines

- PlantHistorySection.tsx (216)
- PlantPicturesSection.tsx (110)
- PlantDetailCareSection.tsx (96)
- ExpandableBlock.tsx (92)
- ExpandableText.tsx (66)
- PlantQuickActions.tsx (58)
- PlantSectionHeader.tsx (58)
- PlantDetailInfoSection.tsx (56)
- PlantDetailHero.tsx (50)
- PlantDetailGuideSection.tsx (43)
- DetailCard.tsx (33)

### src/components/reference/ — 8 files, 832 lines

- ReferenceListView.tsx (204)
- ReferenceDetailView.tsx (167)
- ActionPlanCard.tsx (116)
- ReferenceHero.tsx (105)
- ReferenceListCard.tsx (86)
- RiskInGardenCard.tsx (70)
- ReferenceFilterChips.tsx (54)
- types.ts (30)

### src/config/ — 4 files, 219 lines

- almanac.ts (114)
- referenceAssets.ts (50)
- referenceKeys.ts (38)
- referenceImages.gen.ts (17)

### src/config/beds/ — 15 files, 1,659 lines

- guildTemplates.ts (510)
- soilPrepEngine.ts (205)
- rotationRules.ts (156)
- bedPlantCatalog.ts (120)
- transitionInputs.ts (119)
- bedRecommendations.ts (99)
- greenManureEngine.ts (88)
- bedSizeEngine.ts (65)
- plantingSequence.ts (56)
- layerMeta.ts (50)
- companionRules.ts (49)
- bedTypeMeta.ts (46)
- dynamicAccumulators.ts (44)
- index.ts (34)
- legumeRelevance.ts (18)

### src/config/diseases/ — 1 files, 79 lines

- index.ts (79)

### src/config/diseases/kanyakumari/ — 6 files, 2,001 lines

- fungal1.ts (588)
- fungal2.ts (506)
- bacterial.ts (414)
- viral.ts (408)
- physiological.ts (60)
- index.ts (25)

### src/config/organicInputs/ — 3 files, 528 lines

- index.ts (225)
- recipes.ts (169)
- seasonalAdaptations.ts (134)

### src/config/pests/ — 1 files, 88 lines

- index.ts (88)

### src/config/pests/kanyakumari/ — 6 files, 2,106 lines

- borersLarvae.ts (673)
- sapSucking.ts (643)
- other.ts (277)
- mites.ts (247)
- beetlesWeevils.ts (241)
- index.ts (25)

### src/config/zones/ — 5 files, 411 lines

- highRainfall.ts (222)
- districtCoordinates.ts (66)
- districts.ts (53)
- index.ts (40)
- types.ts (30)

### src/hooks/ — 27 files, 5,251 lines

- usePlantFormState.ts (1202) ⚠️ large — Grep/search inside, do not read whole
- useBedCreationWizard.ts (937) ⚠️ large — Grep/search inside, do not read whole
- useCalendarData.ts (602)
- useLocationManager.ts (578)
- usePinchZoom.ts (185)
- usePlantFormData.ts (180)
- useVoiceInput.ts (174)
- usePlantDetail.ts (110)
- useSectionScrollSpy.ts (110)
- usePlantCatalogManager.ts (105)
- useBedData.ts (101)
- useFarmCapacity.ts (96)
- journalFormValidation.ts (94)
- usePlantHistory.ts (86)
- usePlantPhotos.ts (72)
- useOnboardingStatus.ts (68)
- useWeatherLocations.ts (67)
- bedWizardValidation.ts (65)
- useWeather.ts (65)
- plantFormValidation.ts (62)
- useCrossBedStatus.ts (58)
- useBedDetail.ts (53)
- useBedOptions.ts (50)
- useOwnerName.ts (44)
- useKeyboardHeight.ts (31)
- useOfflineStatus.ts (31)
- useKeyboardVisible.ts (25)

### src/lib/ — 6 files, 1,374 lines

- imageStorage.ts (873) ⚠️ large — Grep/search inside, do not read whole
- firebase.ts (146)
- dataCache.ts (127)
- offlineQueue.ts (105)
- storage.ts (76)
- offlineWrite.ts (47)

### src/migrations/ — 6 files, 330 lines

- index.ts (107)
- 003_consolidate_plant_profiles.ts (96)
- 004_backfill_lifecycle_type.ts (49)
- 002_seed_catalog_enrichment.ts (41)
- 001_backfill_district.ts (31)
- types.ts (6)

### src/navigation/ — 1 files, 196 lines

- AppNavigator.tsx (196)

### src/screens/ — 28 files, 11,439 lines

- CalendarScreen.tsx (2079) ⚠️ large — Grep/search inside, do not read whole
- CatalogPlantDetailScreen.tsx (1879) ⚠️ large — Grep/search inside, do not read whole
- PlantsScreen.tsx (933) ⚠️ large — Grep/search inside, do not read whole
- JournalFormScreen.tsx (710)
- JournalScreen.tsx (559)
- BedListScreen.tsx (516)
- TodayScreen.tsx (515)
- MyFarmScreen.tsx (455)
- SettingsScreen.tsx (400)
- ArchivedPlantsScreen.tsx (390)
- PlantDetailScreen.tsx (380)
- BedCreationWizardScreen.tsx (369)
- BedDetailScreen.tsx (365)
- OnboardingScreen.tsx (317)
- OrganicInputDetailScreen.tsx (229)
- InputRecipesScreen.tsx (192)
- OrganicInputListScreen.tsx (176)
- BedPlantPickerScreen.tsx (159)
- AuthScreen.tsx (146)
- ProfileScreen.tsx (135)
- MoreScreen.tsx (134)
- ManagePlantCatalogScreen.tsx (92)
- DiseaseDetailScreen.tsx (62)
- PestDetailScreen.tsx (59)
- BedRotationScreen.tsx (56)
- DiseaseListScreen.tsx (47)
- PestListScreen.tsx (47)
- PlantFormScreen.tsx (38)

### src/screens/BedWizardSteps/ — 6 files, 2,331 lines

- GuildTemplateStep.tsx (798)
- LandConditionsStep.tsx (493)
- BedLayoutStep.tsx (414)
- BedSizeStep.tsx (271)
- BedConfirmStep.tsx (215)
- BedTypeStep.tsx (140)

### src/services/ — 18 files, 7,584 lines

- tasks.ts (1471) ⚠️ large — Grep/search inside, do not read whole
- plants.ts (1126) ⚠️ large — Grep/search inside, do not read whole
- plantProfiles.ts (1023) ⚠️ large — Grep/search inside, do not read whole
- plantCatalog.ts (836) ⚠️ large — Grep/search inside, do not read whole
- backup.ts (592)
- journal.ts (430)
- alertsLogic.ts (374)
- plantCareProfiles.ts (307)
- farmCapacity.ts (231)
- beds.ts (227)
- locations.ts (197)
- BedTaskResolver.ts (176)
- weather.ts (138)
- offlineSync.ts (136)
- bedLogic.ts (116)
- taskSchedulingLogic.ts (107)
- weatherLogic.ts (78)
- alerts.ts (19)

### src/styles/ — 82 files, 17,905 lines

- bedCreationWizardStyles.ts (1886) ⚠️ large — Grep/search inside, do not read whole
- plantFormStyles.ts (1719) ⚠️ large — Grep/search inside, do not read whole
- calendarStyles.ts (1577) ⚠️ large — Grep/search inside, do not read whole
- plantDetailStyles.ts (682)
- bedRowLayoutStyles.ts (633)
- catalogPlantDetailStyles.ts (620)
- journalFormStyles.ts (609)
- managePlantCatalogStyles.ts (538)
- journalStyles.ts (521)
- plantsStyles.ts (499)
- pestDiseaseDetailStyles.ts (421)
- locationModalStyles.ts (399)
- enrichedSectionStyles.ts (393)
- bedListStyles.ts (336)
- plantCardStyles.ts (335)
- referenceDetailStyles.ts (292)
- bedPlantPickerStyles.ts (250)
- bedLayerStackStyles.ts (231)
- pestDiseaseListStyles.ts (223)
- bedDetailStyles.ts (215)
- bedSuccessionTimelineStyles.ts (213)
- archivedPlantsStyles.ts (202)
- plantEditFormStyles.ts (197)
- myFarmStyles.ts (192)
- dashboardHeroStyles.ts (180)
- settingsStyles.ts (178)
- plantEntryResolverStyles.ts (176)
- onboardingStyles.ts (174)
- themedDropdownStyles.ts (164)
- todayStyles.ts (158)
- weatherCardStyles.ts (153)
- collapsibleSectionStyles.ts (152)
- referenceListStyles.ts (143)
- inputRecipesStyles.ts (139)
- plantPickerSheetStyles.ts (133)
- bedRotationStyles.ts (124)
- seasonPanelStyles.ts (124)
- bedsQuickScrollStyles.ts (113)
- moreStyles.ts (113)
- locationPickerSheetStyles.ts (112)
- growthStageTimelineStyles.ts (106)
- profileStyles.ts (106)
- plantAddFormStyles.ts (104)
- taskCardStyles.ts (97)
- stagePickerSheetStyles.ts (94)
- confirmDeleteModalStyles.ts (87)
- alertDialogStyles.ts (86)
- bedCapacityModalStyles.ts (86)
- carePlanSummaryStyles.ts (86)
- needsAttentionScrollStyles.ts (82)
- pickerFieldStyles.ts (82)
- errorBoundaryStyles.ts (76)
- floatingTabBarStyles.ts (76)
- plantSectionHeaderStyles.ts (75)
- imageZoomModalStyles.ts (70)
- expandableBlockStyles.ts (69)
- floatingLabelInputStyles.ts (67)
- authStyles.ts (58)
- plantHistoryTabStyles.ts (58)
- bedTasksStyles.ts (54)
- fieldHelpStyles.ts (53)
- harvestYieldChartStyles.ts (52)
- photoSourceModalStyles.ts (48)
- voiceDictationStyles.ts (48)
- plantPicturesTabStyles.ts (43)
- segmentedTabsStyles.ts (43)
- plantQuickActionsStyles.ts (42)
- referenceThumbStyles.ts (41)
- undoToastStyles.ts (40)
- showMoreFooterStyles.ts (39)
- detailCardStyles.ts (37)
- screenHeaderStyles.ts (36)
- tipStripStyles.ts (33)
- sectionHeaderStyles.ts (32)
- draggablePlantRowStyles.ts (30)
- offlineBannerStyles.ts (30)
- voiceInputButtonStyles.ts (25)
- sheetHandleStyles.ts (22)
- harvestHistorySectionStyles.ts (20)
- fieldErrorTextStyles.ts (19)
- bottomSheetModalStyles.ts (17)
- fieldLabelWithHelpStyles.ts (17)

### src/theme/ — 2 files, 309 lines

- colors.ts (220)
- index.tsx (89)

### src/types/ — 3 files, 1,070 lines

- database.types.ts (786)
- navigation.types.ts (251)
- offline.types.ts (33)

### src/utils/ — 59 files, 7,642 lines

- plantHelpers.ts (1958) ⚠️ large — Grep/search inside, do not read whole
- rowLayoutEngine.ts (660)
- zipHelper.ts (296)
- carePlanDisplay.ts (244)
- plantLabels.ts (242)
- safeStorage.ts (196)
- quickStartPlanner.ts (180)
- errorTracker.ts (168)
- journalEntryOptions.ts (167)
- logger.ts (161)
- firestoreTimeout.ts (159)
- bedStatus.ts (136)
- taskSummary.ts (127)
- plantingNow.ts (120)
- offlineQueueLogic.ts (117)
- errorLogging.ts (115)
- riskHelpers.ts (112)
- plantNameGenerator.ts (107)
- backupManifest.ts (103)
- bedPreview.ts (101)
- plantPhotos.ts (101)
- plantHistory.ts (99)
- taskConstants.ts (94)
- filterAndSortBeds.ts (93)
- plantEntryMapper.ts (86)
- dateHelpers.ts (83)
- plantWatering.ts (83)
- harvestStats.ts (81)
- networkState.ts (81)
- scrollSpy.ts (80)
- activityRows.ts (78)
- seasonHelpers.ts (78)
- imageCompression.ts (76)
- timelineHarvest.ts (75)
- journalStats.ts (73)
- plantPickerItems.ts (71)
- bedNameGenerator.ts (70)
- bedEditReconcile.ts (52)
- plantCapacity.ts (51)
- farmRotationSummary.ts (48)
- plantTypeFromName.ts (48)
- plantFormConstants.ts (47)
- photoFilename.ts (46)
- recipeQuantityEngine.ts (45)
- appLifecycle.ts (44)
- plantHealth.ts (44)
- svgArc.ts (40)
- preMonsoonTasks.ts (36)
- voiceInput.ts (35)
- progressiveList.ts (32)
- taskBed.ts (30)
- cropFamilyFromName.ts (26)
- recurringTaskStatus.ts (26)
- bedOccupancy.ts (25)
- plantClassification.ts (25)
- growSpecFormat.ts (21)
- haptics.ts (20)
- dragRowMath.ts (16)
- textSanitizer.ts (14)

### src/utils/plantCareDefaults/ — 5 files, 770 lines

- pruning.ts (401)
- varieties.ts (154)
- index.ts (112)
- typeDefaults.ts (98)
- profileKey.ts (5)

### src/utils/plantCareDefaults/overrides/ — 11 files, 3,870 lines

- fruitTrees.ts (739)
- timberCoconutShrubs.ts (559)
- bedVegetables.ts (503)
- vegetables1.ts (483)
- vegetables2.ts (457)
- herbs.ts (407)
- flowers.ts (295)
- herbsSpices.ts (234)
- newShrubs.ts (95)
- intercropFruitTrees.ts (69)
- index.ts (29)

## docs/

- archive/ROADMAP_ARCHIVE.md (1861)
- BED_TAB_ROADMAP_ALIGNMENT.md (76)
- BEST_PRACTICES.md (68)
- CODEMAP.md (633)
- COMPONENTS.md (65)
- CONVENTIONS.md (239)
- DOMAIN_LOGIC.md (44)
- IMAGE_STORAGE.md (38)
- IMPLEMENTATION_ROADMAP.md (349)
- REFERENCE_IMAGES.md (111)
- SCHEMA_MIGRATIONS.md (25)
- SERVICES.md (186)
- TESTING.md (33)
