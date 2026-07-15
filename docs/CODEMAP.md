# Codemap

> **Generated file — do not edit.** Regenerate with `npm run codemap`.
> Snapshot: 2026-07-12 — src/: 446 files, 88,342 lines.
>
> Files marked ⚠️ exceed 800 lines: search inside them (Grep) instead of reading them whole.

## Large files (search, don't read whole)

- src/styles/bedCreationWizardStyles.ts (1885)
- src/utils/plantHelpers.ts (1874)
- src/screens/CatalogPlantDetailScreen.tsx (1864)
- src/screens/CalendarScreen.tsx (1791)
- src/styles/plantFormStyles.ts (1756)
- src/styles/calendarStyles.ts (1540)
- src/hooks/usePlantFormState.ts (1405)
- src/services/tasks.ts (1259)
- src/services/plantProfiles.ts (1023)
- src/components/BedRowLayout.tsx (982)
- src/services/plants.ts (958)
- src/hooks/useBedCreationWizard.ts (938)
- src/lib/imageStorage.ts (873)
- src/screens/PlantsScreen.tsx (860)
- src/services/plantCatalog.ts (836)

## src/

### src/__tests__/components/ — 3 files, 199 lines

- bedRotationSummary.test.ts (98)
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

### src/__tests__/hooks/ — 2 files, 181 lines

- plantFormValidation.test.ts (104)
- blockReasonForStep.test.ts (77)

### src/__tests__/lib/ — 2 files, 129 lines

- offlineQueue.test.ts (104)
- dataCache.test.ts (25)

### src/__tests__/mocks/ — 1 files, 4 lines

- fileMock.js (4)

### src/__tests__/services/ — 6 files, 776 lines

- alerts.test.ts (189)
- offlineSync.test.ts (154)
- beds.test.ts (141)
- weather.test.ts (122)
- careTaskScheduling.test.ts (87)
- preMonsoonTasks.test.ts (83)

### src/__tests__/utils/ — 38 files, 4,438 lines

- rowLayoutEngine.test.ts (523)
- growthStage.test.ts (371)
- rowLayoutEngine.bedTypes.test.ts (343)
- filterAndSortBeds.test.ts (186)
- quickStartPlanner.test.ts (186)
- bedStatus.test.ts (181)
- seasonHelpers.test.ts (176)
- carePlanDisplay.test.ts (165)
- pests.test.ts (133)
- diseases.test.ts (128)
- offlineQueueLogic.test.ts (125)
- plantPhotos.test.ts (124)
- rotationRules.rowLevel.test.ts (118)
- scrollSpy.test.ts (109)
- bedEditReconcile.test.ts (104)
- plantHistory.test.ts (101)
- plantTypeFromName.test.ts (101)
- plantHelpersA2.test.ts (100)
- plantClassification.test.ts (98)
- taskSummary.test.ts (92)
- recipeQuantity.test.ts (81)
- plantingNow.test.ts (78)
- plantWatering.test.ts (76)
- backupManifest.test.ts (74)
- plantCareDefaultsA2.test.ts (72)
- plantEntryMapper.test.ts (72)
- taskBed.test.ts (69)
- imageCompression.test.ts (67)
- harvestStats.test.ts (64)
- dateHelpers.test.ts (55)
- voiceInput.test.ts (50)
- bedOccupancy.test.ts (44)
- locations.test.ts (42)
- dataRegistrySnapshot.test.ts (33)
- cropFamilyFromName.test.ts (26)
- svgArc.test.ts (26)
- plantHealth.test.ts (24)
- plantCapacity.test.ts (21)

### src/components/ — 66 files, 10,768 lines

- BedRowLayout.tsx (982) ⚠️ large — Grep/search inside, do not read whole
- BedTopDownMap.tsx (773)
- PlantFilterSheet.tsx (482)
- BedPlantPickerSheet.tsx (474)
- BedSuccessionTimeline.tsx (408)
- LocationProfileEditor.tsx (369)
- ThemedDropdown.tsx (346)
- BedFilterSheet.tsx (333)
- FloatingTabBar.tsx (319)
- PlantCard.tsx (307)
- TodayProgressCard.tsx (247)
- PlantEntryResolverSheet.tsx (245)
- BedCard.tsx (236)
- WeatherDeck.tsx (233)
- JournalEntryCard.tsx (223)
- DetailCareGuidanceSection.tsx (206)
- GrowthStageTimeline.tsx (197)
- BedLayerStack.tsx (192)
- FieldHelp.tsx (172)
- BedRotationView.tsx (168)
- CoconutSection.tsx (168)
- HarvestHistorySection.tsx (166)
- NeedsAttentionScroll.tsx (148)
- FloatingLabelInput.tsx (140)
- CollapsibleSection.tsx (137)
- PlantKeyInfoSection.tsx (133)
- DraggablePlantRow.tsx (131)
- SegmentedTabs.tsx (119)
- ImageZoomModal.tsx (116)
- TaskCard.tsx (114)
- BedsQuickScroll.tsx (113)
- VoiceDictation.tsx (112)
- GrowthStageSection.tsx (108)
- DetailQuickInfoSection.tsx (105)
- HarvestWeightInput.tsx (104)
- WeatherPlotCard.tsx (104)
- ErrorBoundary.tsx (100)
- BedZoneIllustration.tsx (96)
- DetailNutritionSection.tsx (93)
- RotationStatusCard.tsx (87)
- PrepCard.tsx (85)
- ZoomableImagePage.tsx (82)
- CareScheduleSection.tsx (75)
- BedContextSection.tsx (71)
- HarvestInfoSection.tsx (68)
- PinGrowthStageModal.tsx (67)
- PlantCatalogList.tsx (66)
- UndoToast.tsx (65)
- TipStrip.tsx (64)
- PlantCategoryTabs.tsx (61)
- ClearBedCta.tsx (60)
- FarmHealthCard.tsx (60)
- PlantNowSection.tsx (56)
- InputReminderStrip.tsx (53)
- OfflineBanner.tsx (53)
- ScreenHeader.tsx (53)
- CompanionPlantingSection.tsx (51)
- VoiceInputButton.tsx (47)
- ReferenceThumb.tsx (46)
- HarvestYieldChart.tsx (45)
- WeatherCard.tsx (45)
- AlmanacHighlight.tsx (43)
- PlantInfoRow.tsx (40)
- FieldLabelWithHelp.tsx (39)
- PlantTasksSection.tsx (34)
- PlantNotesSection.tsx (33)

### src/components/calendar/ — 3 files, 487 lines

- SwipeableTaskCard.tsx (251)
- MonthCalendarView.tsx (126)
- WeekCalendarView.tsx (110)

### src/components/forms/ — 17 files, 3,428 lines

- PlantEditForm.tsx (598)
- EditCareScheduleSection.tsx (452)
- WizardStep1.tsx (271)
- EditPlantHealthSection.tsx (268)
- WizardStep2.tsx (261)
- PlantAddWizard.tsx (243)
- EditCareGuidanceSection.tsx (205)
- EditCoconutSection.tsx (198)
- EditBasicInfoSection.tsx (186)
- EditLocationSection.tsx (178)
- WizardStep3.tsx (154)
- EditQuickInfoSection.tsx (110)
- EditNutritionSection.tsx (96)
- EditRelationshipsSection.tsx (75)
- CarePlanSummary.tsx (57)
- EditSafetySection.tsx (41)
- EditBeneficialsSection.tsx (35)

### src/components/modals/ — 9 files, 1,914 lines

- PestDiseaseModal.tsx (762)
- CreateTaskModal.tsx (431)
- LocationEditModal.tsx (299)
- TaskCompletionModal.tsx (105)
- LocationReassignModal.tsx (78)
- PhotoSourceModal.tsx (72)
- ConfirmDeleteModal.tsx (65)
- BedCapacityModal.tsx (51)
- DiscardChangesModal.tsx (51)

### src/components/plantDetail/ — 9 files, 712 lines

- PlantHistorySection.tsx (165)
- PlantDetailCareSection.tsx (115)
- ExpandableBlock.tsx (92)
- PlantPicturesSection.tsx (83)
- ExpandableText.tsx (66)
- PlantSectionHeader.tsx (58)
- PlantDetailHero.tsx (50)
- PlantDetailInfoSection.tsx (50)
- DetailCard.tsx (33)

### src/config/ — 4 files, 218 lines

- almanac.ts (113)
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

### src/hooks/ — 24 files, 5,346 lines

- usePlantFormState.ts (1405) ⚠️ large — Grep/search inside, do not read whole
- useBedCreationWizard.ts (938) ⚠️ large — Grep/search inside, do not read whole
- useCalendarData.ts (595)
- useLocationManager.ts (578)
- usePlantFormData.ts (217)
- usePinchZoom.ts (185)
- useVoiceInput.ts (174)
- usePlantDetail.ts (108)
- usePlantCatalogManager.ts (105)
- useFarmCapacity.ts (96)
- useSectionScrollSpy.ts (94)
- useBedData.ts (91)
- usePlantHistory.ts (86)
- useTodayTasks.ts (80)
- usePlantPhotos.ts (72)
- useOnboardingStatus.ts (68)
- useWeatherLocations.ts (67)
- bedWizardValidation.ts (65)
- plantFormValidation.ts (65)
- useWeather.ts (65)
- useCrossBedStatus.ts (58)
- useBedDetail.ts (53)
- useBedOptions.ts (50)
- useOfflineStatus.ts (31)

### src/lib/ — 6 files, 1,360 lines

- imageStorage.ts (873) ⚠️ large — Grep/search inside, do not read whole
- firebase.ts (146)
- dataCache.ts (113)
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

### src/navigation/ — 1 files, 198 lines

- AppNavigator.tsx (198)

### src/screens/ — 29 files, 11,457 lines

- CatalogPlantDetailScreen.tsx (1864) ⚠️ large — Grep/search inside, do not read whole
- CalendarScreen.tsx (1791) ⚠️ large — Grep/search inside, do not read whole
- PlantsScreen.tsx (860) ⚠️ large — Grep/search inside, do not read whole
- JournalFormScreen.tsx (636)
- JournalScreen.tsx (589)
- TodayScreen.tsx (529)
- BedListScreen.tsx (516)
- MyFarmScreen.tsx (448)
- BedCreationWizardScreen.tsx (365)
- BedDetailScreen.tsx (365)
- SettingsScreen.tsx (344)
- OnboardingScreen.tsx (317)
- DiseaseDetailScreen.tsx (310)
- PestDetailScreen.tsx (310)
- PlantDetailScreen.tsx (281)
- ArchivedPlantsScreen.tsx (255)
- OrganicInputDetailScreen.tsx (229)
- InputRecipesScreen.tsx (192)
- OrganicInputListScreen.tsx (176)
- BedPlantPickerScreen.tsx (159)
- DiseaseListScreen.tsx (147)
- PestListScreen.tsx (147)
- AuthScreen.tsx (146)
- ProfileScreen.tsx (120)
- MoreScreen.tsx (119)
- ManagePlantCatalogScreen.tsx (92)
- BedRotationScreen.tsx (56)
- SeasonalAlmanacScreen.tsx (56)
- PlantFormScreen.tsx (38)

### src/screens/BedWizardSteps/ — 6 files, 2,331 lines

- GuildTemplateStep.tsx (798)
- LandConditionsStep.tsx (493)
- BedLayoutStep.tsx (414)
- BedSizeStep.tsx (271)
- BedConfirmStep.tsx (215)
- BedTypeStep.tsx (140)

### src/services/ — 18 files, 7,087 lines

- tasks.ts (1259) ⚠️ large — Grep/search inside, do not read whole
- plantProfiles.ts (1023) ⚠️ large — Grep/search inside, do not read whole
- plants.ts (958) ⚠️ large — Grep/search inside, do not read whole
- plantCatalog.ts (836) ⚠️ large — Grep/search inside, do not read whole
- backup.ts (592)
- journal.ts (430)
- plantCareProfiles.ts (307)
- alertsLogic.ts (306)
- farmCapacity.ts (231)
- beds.ts (227)
- locations.ts (197)
- BedTaskResolver.ts (176)
- weather.ts (138)
- offlineSync.ts (136)
- bedLogic.ts (116)
- weatherLogic.ts (78)
- taskSchedulingLogic.ts (60)
- alerts.ts (17)

### src/styles/ — 73 files, 16,718 lines

- bedCreationWizardStyles.ts (1885) ⚠️ large — Grep/search inside, do not read whole
- plantFormStyles.ts (1756) ⚠️ large — Grep/search inside, do not read whole
- calendarStyles.ts (1540) ⚠️ large — Grep/search inside, do not read whole
- plantDetailStyles.ts (643)
- bedRowLayoutStyles.ts (633)
- catalogPlantDetailStyles.ts (620)
- managePlantCatalogStyles.ts (538)
- plantsStyles.ts (510)
- journalStyles.ts (470)
- todayStyles.ts (455)
- enrichedSectionStyles.ts (388)
- locationModalStyles.ts (378)
- bedListStyles.ts (338)
- plantCardStyles.ts (335)
- plantAddWizardStyles.ts (330)
- journalFormStyles.ts (317)
- referenceDetailStyles.ts (292)
- bedPlantPickerStyles.ts (265)
- bedLayerStackStyles.ts (231)
- bedDetailStyles.ts (215)
- bedSuccessionTimelineStyles.ts (213)
- themedDropdownStyles.ts (201)
- myFarmStyles.ts (192)
- plantEntryResolverStyles.ts (190)
- onboardingStyles.ts (174)
- plantEditFormStyles.ts (168)
- archivedPlantsStyles.ts (160)
- weatherCardStyles.ts (153)
- collapsibleSectionStyles.ts (152)
- referenceListStyles.ts (143)
- inputRecipesStyles.ts (139)
- settingsStyles.ts (136)
- bedRotationStyles.ts (124)
- todayProgressCardStyles.ts (114)
- growthStageTimelineStyles.ts (106)
- taskCardStyles.ts (97)
- profileStyles.ts (95)
- moreStyles.ts (92)
- bedsQuickScrollStyles.ts (89)
- needsAttentionScrollStyles.ts (88)
- photoSourceModalStyles.ts (88)
- bedCapacityModalStyles.ts (86)
- carePlanSummaryStyles.ts (86)
- confirmDeleteModalStyles.ts (82)
- errorBoundaryStyles.ts (76)
- floatingTabBarStyles.ts (76)
- plantSectionHeaderStyles.ts (75)
- seasonalAlmanacStyles.ts (74)
- imageZoomModalStyles.ts (70)
- expandableBlockStyles.ts (69)
- floatingLabelInputStyles.ts (60)
- authStyles.ts (58)
- plantHistoryTabStyles.ts (58)
- almanacHighlightStyles.ts (56)
- bedTasksStyles.ts (54)
- farmHealthCardStyles.ts (53)
- fieldHelpStyles.ts (53)
- harvestYieldChartStyles.ts (52)
- plantNowSectionStyles.ts (49)
- voiceDictationStyles.ts (48)
- plantPicturesTabStyles.ts (43)
- segmentedTabsStyles.ts (43)
- referenceThumbStyles.ts (41)
- undoToastStyles.ts (40)
- inputReminderStripStyles.ts (37)
- screenHeaderStyles.ts (36)
- detailCardStyles.ts (35)
- tipStripStyles.ts (33)
- draggablePlantRowStyles.ts (30)
- offlineBannerStyles.ts (30)
- voiceInputButtonStyles.ts (25)
- harvestHistorySectionStyles.ts (20)
- fieldLabelWithHelpStyles.ts (17)

### src/theme/ — 2 files, 282 lines

- colors.ts (193)
- index.tsx (89)

### src/types/ — 3 files, 1,008 lines

- database.types.ts (743)
- navigation.types.ts (232)
- offline.types.ts (33)

### src/utils/ — 50 files, 6,768 lines

- plantHelpers.ts (1874) ⚠️ large — Grep/search inside, do not read whole
- rowLayoutEngine.ts (660)
- zipHelper.ts (296)
- carePlanDisplay.ts (244)
- plantLabels.ts (242)
- safeStorage.ts (196)
- quickStartPlanner.ts (180)
- errorTracker.ts (168)
- logger.ts (161)
- firestoreTimeout.ts (159)
- taskSummary.ts (151)
- bedStatus.ts (136)
- offlineQueueLogic.ts (117)
- errorLogging.ts (115)
- backupManifest.ts (103)
- plantNameGenerator.ts (100)
- plantingNow.ts (98)
- filterAndSortBeds.ts (93)
- plantPhotos.ts (93)
- plantEntryMapper.ts (86)
- dateHelpers.ts (83)
- harvestStats.ts (81)
- networkState.ts (81)
- scrollSpy.ts (80)
- imageCompression.ts (76)
- timelineHarvest.ts (75)
- plantHistory.ts (74)
- bedNameGenerator.ts (70)
- seasonHelpers.ts (69)
- taskConstants.ts (62)
- plantWatering.ts (59)
- bedEditReconcile.ts (52)
- plantCapacity.ts (51)
- farmRotationSummary.ts (48)
- plantTypeFromName.ts (48)
- plantFormConstants.ts (47)
- photoFilename.ts (46)
- recipeQuantityEngine.ts (45)
- appLifecycle.ts (44)
- plantHealth.ts (41)
- svgArc.ts (37)
- preMonsoonTasks.ts (36)
- voiceInput.ts (35)
- taskBed.ts (30)
- cropFamilyFromName.ts (26)
- bedOccupancy.ts (25)
- plantClassification.ts (25)
- haptics.ts (20)
- dragRowMath.ts (16)
- textSanitizer.ts (14)

### src/utils/plantCareDefaults/ — 5 files, 768 lines

- pruning.ts (401)
- varieties.ts (154)
- index.ts (110)
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
- CODEMAP.md (551)
- COMPONENTS.md (63)
- CONVENTIONS.md (239)
- DOMAIN_LOGIC.md (44)
- IMAGE_STORAGE.md (34)
- IMPLEMENTATION_ROADMAP.md (349)
- SCHEMA_MIGRATIONS.md (25)
- SERVICES.md (186)
- TESTING.md (33)
