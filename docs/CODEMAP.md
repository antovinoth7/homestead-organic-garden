# Codemap

> **Generated file — do not edit.** Regenerate with `npm run codemap`.
> Snapshot: 2026-08-15 — src/: 604 files, 109,558 lines.
>
> Files marked ⚠️ exceed 800 lines: search inside them (Grep) instead of reading them whole.

## Large files (search, don't read whole)

- src/screens/CalendarScreen.tsx (2144)
- src/utils/plantHelpers.ts (1958)
- src/styles/bedCreationWizardStyles.ts (1906)
- src/styles/plantFormStyles.ts (1719)
- src/styles/calendarStyles.ts (1615)
- src/services/tasks.ts (1477)
- src/hooks/usePlantFormState.ts (1202)
- src/services/plants.ts (1126)
- src/types/database.types.ts (999)
- src/components/BedRowLayout.tsx (984)
- src/screens/CatalogPlantDetailScreen.tsx (970)
- src/hooks/useBedCreationWizard.ts (937)
- src/services/plantCatalog.ts (879)
- src/lib/imageStorage.ts (873)
- src/screens/BedWizardSteps/GuildTemplateStep.tsx (831)
- src/screens/PlantsScreen.tsx (827)

## src/

### src/__tests__/components/ — 8 files, 1,137 lines

- SeasonBlock.test.tsx (318)
- PlotCard.test.tsx (230)
- ForecastOverlay.test.tsx (163)
- PlotCarousel.test.tsx (127)
- bedRotationSummary.test.ts (100)
- ReferenceThumb.test.tsx (98)
- bedSuccessionTimeline.harvest.test.ts (60)
- DraggablePlantRow.test.ts (41)

### src/__tests__/config/ — 10 files, 635 lines

- referenceAssets.test.ts (146)
- organicInputs.entries.test.ts (126)
- kanyakumariPlantingWindows.test.ts (67)
- organicInputs.test.ts (63)
- zones.test.ts (47)
- districtCoordinates.test.ts (45)
- organicInputs.seasonalRhythm.test.ts (45)
- kanyakumariPlantingCalendar.test.ts (36)
- iconRegistry.test.ts (35)
- almanac.test.ts (25)

### src/__tests__/config/beds/ — 5 files, 288 lines

- legumeRelevance.test.ts (81)
- smartNextCrops.test.ts (62)
- rotationRules.test.ts (61)
- bedTypeMeta.test.ts (49)
- plantingSequence.test.ts (35)

### src/__tests__/fixtures/ — 5 files, 216 lines

- today.fixtures.ts (83)
- plant.fixtures.ts (64)
- task.fixtures.ts (30)
- bed.fixtures.ts (23)
- journal.fixtures.ts (16)

### src/__tests__/hooks/ — 3 files, 377 lines

- journalFormValidation.test.ts (196)
- plantFormValidation.test.ts (104)
- blockReasonForStep.test.ts (77)

### src/__tests__/lib/ — 3 files, 425 lines

- offlineQueue.test.ts (172)
- dataCache.test.ts (153)
- storage.test.ts (100)

### src/__tests__/migrations/ — 1 files, 76 lines

- 005_repair_farm_config.test.ts (76)

### src/__tests__/mocks/ — 1 files, 4 lines

- fileMock.js (4)

### src/__tests__/policy/ — 1 files, 54 lines

- noFunctionalEmoji.test.ts (54)

### src/__tests__/services/ — 9 files, 1,692 lines

- alerts.test.ts (524)
- weatherResponse.test.ts (205)
- weather.test.ts (204)
- offlineSync.test.ts (202)
- taskSkip.test.ts (153)
- beds.test.ts (141)
- plantCatalog.localSuitability.test.ts (93)
- careTaskScheduling.test.ts (87)
- preMonsoonTasks.test.ts (83)

### src/__tests__/utils/ — 67 files, 8,362 lines

- rowLayoutEngine.test.ts (523)
- growthStage.test.ts (371)
- rowLayoutEngine.bedTypes.test.ts (343)
- plotBriefLine.test.ts (289)
- upcomingJobs.test.ts (237)
- plotGrouping.test.ts (228)
- weatherWords.test.ts (205)
- catalogValidation.test.ts (199)
- plantFilters.test.ts (197)
- bedPreview.test.ts (190)
- catalogDraft.test.ts (190)
- filterAndSortBeds.test.ts (186)
- quickStartPlanner.test.ts (186)
- bedStatus.test.ts (183)
- catalogSummaries.test.ts (178)
- seasonHelpers.test.ts (176)
- carePlanDisplay.test.ts (165)
- catalogSearch.test.ts (159)
- needsActionItems.test.ts (156)
- diseases.test.ts (155)
- plantHistory.test.ts (153)
- pests.test.ts (148)
- riskHelpers.test.ts (142)
- taskSummary.test.ts (142)
- plantWatering.test.ts (141)
- plantingNow.test.ts (134)
- plantHelpersA2.test.ts (133)
- plantPickerItems.test.ts (132)
- offlineQueueLogic.test.ts (127)
- plantNameGenerator.test.ts (125)
- plantPhotos.test.ts (124)
- rotationRules.rowLevel.test.ts (118)
- sowNowChips.test.ts (117)
- scrollSpy.test.ts (109)
- journalEntryOptions.test.ts (107)
- bedEditReconcile.test.ts (104)
- journalStats.test.ts (102)
- plantTypeFromName.test.ts (101)
- seasonProgress.test.ts (100)
- plantClassification.test.ts (98)
- recipeQuantity.test.ts (81)
- activityRows.test.ts (76)
- plantHealth.test.ts (75)
- backupManifest.test.ts (74)
- plantCareDefaultsA2.test.ts (72)
- plantEntryMapper.test.ts (72)
- taskBed.test.ts (69)
- locationHelpers.test.ts (68)
- imageCompression.test.ts (67)
- harvestStats.test.ts (64)
- progressiveList.test.ts (64)
- dateHelpers.test.ts (55)
- plotBedCounts.test.ts (55)
- voiceInput.test.ts (50)
- recurringTaskStatus.test.ts (48)
- plantCompanions.test.ts (47)
- bedOccupancy.test.ts (44)
- locations.test.ts (42)
- referencePlantCoverage.test.ts (41)
- landCents.test.ts (38)
- perennialCare.test.ts (38)
- dataRegistrySnapshot.test.ts (33)
- cropFamilyFromName.test.ts (26)
- seasonLabel.test.ts (26)
- svgArc.test.ts (26)
- plantCapacity.test.ts (21)
- growSpecFormat.test.ts (17)

### src/components/ — 71 files, 11,649 lines

- BedRowLayout.tsx (984) ⚠️ large — Grep/search inside, do not read whole
- BedTopDownMap.tsx (778)
- PlantFilterSheet.tsx (510)
- BedPlantPickerSheet.tsx (489)
- BedSuccessionTimeline.tsx (410)
- BedFilterSheet.tsx (349)
- FloatingTabBar.tsx (319)
- PlantCard.tsx (313)
- DashboardHero.tsx (303)
- JournalEntryCard.tsx (254)
- PlantEntryResolverSheet.tsx (253)
- WeatherDeck.tsx (235)
- BedCard.tsx (233)
- LocationProfileEditor.tsx (223)
- DetailCareGuidanceSection.tsx (218)
- BedLayerStack.tsx (202)
- GrowthStageTimeline.tsx (195)
- PlantPickerSheet.tsx (194)
- OptionPickerSheet.tsx (179)
- FieldHelp.tsx (172)
- HarvestHistorySection.tsx (171)
- BedRotationView.tsx (168)
- CoconutSection.tsx (168)
- FloatingLabelInput.tsx (165)
- BedsQuickScroll.tsx (159)
- LocationPickerSheet.tsx (152)
- NeedsAttentionScroll.tsx (151)
- CollapsibleSection.tsx (149)
- StagePickerSheet.tsx (134)
- PlantKeyInfoSection.tsx (133)
- ThemedDropdown.tsx (133)
- DraggablePlantRow.tsx (131)
- VoiceDictation.tsx (128)
- ImageZoomModal.tsx (124)
- SegmentedTabs.tsx (119)
- TaskCard.tsx (114)
- HarvestWeightInput.tsx (110)
- CareScheduleSection.tsx (109)
- GrowthStageSection.tsx (108)
- GardenIcon.tsx (106)
- DetailQuickInfoSection.tsx (105)
- ErrorBoundary.tsx (100)
- PickerField.tsx (99)
- WeatherPlotCard.tsx (98)
- BottomSheetModal.tsx (97)
- BedZoneIllustration.tsx (96)
- DetailNutritionSection.tsx (96)
- ShowMoreFooter.tsx (91)
- RotationStatusCard.tsx (87)
- ZoomableImagePage.tsx (87)
- PrepCard.tsx (85)
- ReferenceThumb.tsx (80)
- PinGrowthStageModal.tsx (74)
- BedContextSection.tsx (71)
- TipStrip.tsx (66)
- UndoToast.tsx (65)
- PlantCategoryTabs.tsx (61)
- ClearBedCta.tsx (60)
- VoiceInputButton.tsx (57)
- OfflineBanner.tsx (53)
- ScreenHeader.tsx (53)
- HarvestInfoSection.tsx (52)
- CompanionPlantingSection.tsx (51)
- SectionHeader.tsx (49)
- HarvestYieldChart.tsx (45)
- WeatherCard.tsx (45)
- PlantInfoRow.tsx (40)
- SheetHandle.tsx (40)
- FieldLabelWithHelp.tsx (39)
- PlantNotesSection.tsx (33)
- FieldErrorText.tsx (29)

### src/components/calendar/ — 3 files, 569 lines

- SwipeableTaskCard.tsx (333)
- MonthCalendarView.tsx (126)
- WeekCalendarView.tsx (110)

### src/components/catalog/ — 15 files, 1,468 lines

- VarietyDetailModal.tsx (206)
- CatalogDetailRow.tsx (150)
- PestDiseasePickerModal.tsx (134)
- CatalogChipList.tsx (110)
- ReassignPlantsModal.tsx (109)
- CatalogTextEditSheet.tsx (104)
- CatalogRangeEditSheet.tsx (99)
- CatalogSearchResultRow.tsx (90)
- CatalogRangeRow.tsx (87)
- catalogEditor.ts (70)
- CatalogBrowseRow.tsx (66)
- CatalogDangerFooter.tsx (66)
- CatalogTextBlock.tsx (66)
- RecentSearchChips.tsx (57)
- CatalogSearchBar.tsx (54)

### src/components/catalog/sections/ — 6 files, 875 lines

- GrowingInfoSection.tsx (229)
- CoreCareSection.tsx (208)
- PlantInfoSection.tsx (186)
- PruningSection.tsx (129)
- TolerancesSection.tsx (77)
- PlantingSection.tsx (46)

### src/components/forms/ — 19 files, 3,496 lines

- EditCareScheduleSection.tsx (485)
- JournalPestDiseaseSection.tsx (425)
- PlantEditForm.tsx (338)
- AddPlantPlacementSection.tsx (252)
- AddPlantBasicsSection.tsx (218)
- EditCareGuidanceSection.tsx (213)
- EditPlantHealthSection.tsx (209)
- EditCoconutSection.tsx (188)
- EditBasicInfoSection.tsx (180)
- JournalHarvestSection.tsx (167)
- EditLocationSection.tsx (162)
- AddPlantCarePlanSection.tsx (142)
- PlantAddForm.tsx (114)
- EditQuickInfoSection.tsx (110)
- EditNutritionSection.tsx (96)
- CarePlanSummary.tsx (57)
- JournalMilestoneSection.tsx (56)
- FormSectionCard.tsx (49)
- EditBeneficialsSection.tsx (35)

### src/components/modals/ — 11 files, 1,834 lines

- CreateTaskModal.tsx (462)
- PlotEditModal.tsx (415)
- SkipTaskModal.tsx (175)
- AlertDialog.tsx (159)
- SectionEditSheet.tsx (137)
- TaskCompletionModal.tsx (111)
- ConfirmDeleteModal.tsx (101)
- LocationReassignModal.tsx (80)
- PhotoSourceModal.tsx (71)
- DiscardChangesModal.tsx (65)
- BedCapacityModal.tsx (58)

### src/components/organicInput/ — 5 files, 532 lines

- OrganicInputListView.tsx (229)
- OrganicInputHero.tsx (109)
- OrganicInputCard.tsx (88)
- RecipeScaler.tsx (61)
- InputStatStrip.tsx (45)

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

### src/components/reference/ — 8 files, 902 lines

- ReferenceListView.tsx (212)
- ReferenceDetailView.tsx (186)
- ReferenceHero.tsx (139)
- ActionPlanCard.tsx (116)
- ReferenceListCard.tsx (89)
- RiskInGardenCard.tsx (74)
- ReferenceFilterChips.tsx (56)
- types.ts (30)

### src/components/today/ — 6 files, 1,154 lines

- PlotCard.tsx (356)
- SeasonBlock.tsx (260)
- ForecastOverlay.tsx (256)
- PlotCarousel.tsx (127)
- TodayHeader.tsx (82)
- NeedsActionRow.tsx (73)

### src/config/ — 6 files, 841 lines

- referenceImages.gen.ts (248)
- iconRegistry.ts (181)
- kanyakumariPlantingCalendar.ts (136)
- referenceKeys.ts (107)
- almanac.ts (106)
- referenceAssets.ts (63)

### src/config/beds/ — 15 files, 1,649 lines

- guildTemplates.ts (510)
- soilPrepEngine.ts (206)
- rotationRules.ts (156)
- bedPlantCatalog.ts (120)
- transitionInputs.ts (119)
- bedRecommendations.ts (99)
- greenManureEngine.ts (88)
- bedSizeEngine.ts (65)
- plantingSequence.ts (56)
- layerMeta.ts (51)
- companionRules.ts (49)
- dynamicAccumulators.ts (44)
- bedTypeMeta.ts (34)
- index.ts (34)
- legumeRelevance.ts (18)

### src/config/diseases/ — 1 files, 88 lines

- index.ts (88)

### src/config/diseases/kanyakumari/ — 6 files, 2,001 lines

- fungal1.ts (588)
- fungal2.ts (506)
- bacterial.ts (414)
- viral.ts (408)
- physiological.ts (60)
- index.ts (25)

### src/config/organicInputs/ — 3 files, 626 lines

- index.ts (322)
- recipes.ts (170)
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

### src/config/zones/ — 5 files, 425 lines

- highRainfall.ts (222)
- districtCoordinates.ts (80)
- districts.ts (53)
- index.ts (40)
- types.ts (30)

### src/hooks/ — 32 files, 6,494 lines

- usePlantFormState.ts (1202) ⚠️ large — Grep/search inside, do not read whole
- useBedCreationWizard.ts (937) ⚠️ large — Grep/search inside, do not read whole
- useCalendarData.ts (602)
- useLocationManager.ts (567)
- useCatalogEntryForm.ts (497)
- useTodayBrief.ts (473)
- useVoiceInput.ts (218)
- usePinchZoom.ts (185)
- usePlantFormData.ts (180)
- usePlantDetail.ts (110)
- useSectionScrollSpy.ts (110)
- usePlantCatalogManager.ts (108)
- useBedData.ts (101)
- useCatalogSearch.ts (101)
- useFarmCapacity.ts (96)
- journalFormValidation.ts (94)
- usePlantHistory.ts (86)
- useWeatherByPlot.ts (86)
- usePlantPhotos.ts (72)
- useOnboardingStatus.ts (68)
- useWeather.ts (68)
- useWeatherLocations.ts (67)
- bedWizardValidation.ts (65)
- plantFormValidation.ts (62)
- useCrossBedStatus.ts (58)
- useBedDetail.ts (53)
- useBedOptions.ts (50)
- useLandCents.ts (47)
- useOwnerName.ts (44)
- useKeyboardHeight.ts (31)
- useOfflineStatus.ts (31)
- useKeyboardVisible.ts (25)

### src/lib/ — 6 files, 1,509 lines

- imageStorage.ts (873) ⚠️ large — Grep/search inside, do not read whole
- offlineQueue.ts (169)
- dataCache.ts (165)
- firebase.ts (146)
- storage.ts (109)
- offlineWrite.ts (47)

### src/migrations/ — 8 files, 426 lines

- index.ts (109)
- 003_consolidate_plant_profiles.ts (96)
- farmConfigRepairLogic.ts (55)
- 004_backfill_lifecycle_type.ts (49)
- 002_seed_catalog_enrichment.ts (41)
- 005_repair_farm_config.ts (39)
- 001_backfill_district.ts (31)
- types.ts (6)

### src/navigation/ — 1 files, 197 lines

- AppNavigator.tsx (197)

### src/screens/ — 28 files, 10,556 lines

- CalendarScreen.tsx (2144) ⚠️ large — Grep/search inside, do not read whole
- CatalogPlantDetailScreen.tsx (970) ⚠️ large — Grep/search inside, do not read whole
- PlantsScreen.tsx (827) ⚠️ large — Grep/search inside, do not read whole
- JournalFormScreen.tsx (710)
- JournalScreen.tsx (566)
- MyFarmScreen.tsx (538)
- BedListScreen.tsx (516)
- SettingsScreen.tsx (433)
- ArchivedPlantsScreen.tsx (390)
- PlantDetailScreen.tsx (380)
- BedCreationWizardScreen.tsx (369)
- BedDetailScreen.tsx (366)
- TodayScreen.tsx (322)
- OnboardingScreen.tsx (317)
- ManagePlantCatalogScreen.tsx (285)
- InputRecipesScreen.tsx (242)
- OrganicInputDetailScreen.tsx (242)
- BedPlantPickerScreen.tsx (159)
- AuthScreen.tsx (146)
- ProfileScreen.tsx (135)
- MoreScreen.tsx (134)
- DiseaseDetailScreen.tsx (63)
- PestDetailScreen.tsx (60)
- BedRotationScreen.tsx (56)
- OrganicInputListScreen.tsx (52)
- DiseaseListScreen.tsx (48)
- PestListScreen.tsx (48)
- PlantFormScreen.tsx (38)

### src/screens/BedWizardSteps/ — 6 files, 2,401 lines

- GuildTemplateStep.tsx (831) ⚠️ large — Grep/search inside, do not read whole
- LandConditionsStep.tsx (498)
- BedLayoutStep.tsx (419)
- BedSizeStep.tsx (273)
- BedConfirmStep.tsx (226)
- BedTypeStep.tsx (154)

### src/services/ — 19 files, 7,579 lines

- tasks.ts (1477) ⚠️ large — Grep/search inside, do not read whole
- plants.ts (1126) ⚠️ large — Grep/search inside, do not read whole
- plantCatalog.ts (879) ⚠️ large — Grep/search inside, do not read whole
- backup.ts (592)
- plantProfiles.ts (558)
- journal.ts (430)
- alertsLogic.ts (395)
- weather.ts (345)
- plantCareProfiles.ts (307)
- farmCapacity.ts (232)
- beds.ts (227)
- locations.ts (197)
- BedTaskResolver.ts (181)
- offlineSync.ts (156)
- todayBrief.ts (135)
- bedLogic.ts (116)
- taskSchedulingLogic.ts (107)
- weatherLogic.ts (100)
- alerts.ts (19)

### src/styles/ — 93 files, 19,570 lines

- bedCreationWizardStyles.ts (1906) ⚠️ large — Grep/search inside, do not read whole
- plantFormStyles.ts (1719) ⚠️ large — Grep/search inside, do not read whole
- calendarStyles.ts (1615) ⚠️ large — Grep/search inside, do not read whole
- plantDetailStyles.ts (687)
- bedRowLayoutStyles.ts (633)
- journalFormStyles.ts (626)
- journalStyles.ts (524)
- plantsStyles.ts (503)
- catalogPlantDetailStyles.ts (437)
- pestDiseaseDetailStyles.ts (435)
- plotEditStyles.ts (431)
- enrichedSectionStyles.ts (393)
- plotCardStyles.ts (383)
- bedListStyles.ts (338)
- plantCardStyles.ts (332)
- organicInputDetailStyles.ts (326)
- managePlantCatalogStyles.ts (305)
- forecastOverlayStyles.ts (298)
- inputRecipesStyles.ts (267)
- myFarmStyles.ts (252)
- bedPlantPickerStyles.ts (250)
- organicInputListStyles.ts (246)
- bedLayerStackStyles.ts (245)
- catalogRowStyles.ts (236)
- seasonBlockStyles.ts (232)
- pestDiseaseListStyles.ts (228)
- bedDetailStyles.ts (218)
- bedSuccessionTimelineStyles.ts (217)
- archivedPlantsStyles.ts (202)
- plantEditFormStyles.ts (197)
- settingsStyles.ts (191)
- dashboardHeroStyles.ts (180)
- plantEntryResolverStyles.ts (176)
- onboardingStyles.ts (174)
- collapsibleSectionStyles.ts (164)
- weatherCardStyles.ts (163)
- todayScreenStyles.ts (160)
- plantPickerSheetStyles.ts (133)
- bedRotationStyles.ts (124)
- sectionSheetStyles.ts (123)
- optionPickerSheetStyles.ts (117)
- moreStyles.ts (113)
- locationPickerSheetStyles.ts (112)
- growthStageTimelineStyles.ts (111)
- bedsQuickScrollStyles.ts (109)
- profileStyles.ts (106)
- plantAddFormStyles.ts (104)
- taskCardStyles.ts (97)
- needsAttentionScrollStyles.ts (94)
- stagePickerSheetStyles.ts (94)
- confirmDeleteModalStyles.ts (87)
- alertDialogStyles.ts (86)
- bedCapacityModalStyles.ts (86)
- carePlanSummaryStyles.ts (86)
- locationModalStyles.ts (86)
- themedDropdownStyles.ts (77)
- errorBoundaryStyles.ts (76)
- floatingTabBarStyles.ts (76)
- plantSectionHeaderStyles.ts (75)
- needsActionListStyles.ts (73)
- pickerFieldStyles.ts (71)
- imageZoomModalStyles.ts (70)
- expandableBlockStyles.ts (69)
- floatingLabelInputStyles.ts (67)
- plotCarouselStyles.ts (65)
- referenceThumbStyles.ts (64)
- catalogSheetStyles.ts (61)
- authStyles.ts (58)
- plantHistoryTabStyles.ts (58)
- bedTasksStyles.ts (54)
- fieldHelpStyles.ts (53)
- catalogDangerStyles.ts (52)
- harvestYieldChartStyles.ts (52)
- photoSourceModalStyles.ts (48)
- voiceDictationStyles.ts (48)
- plantPicturesTabStyles.ts (43)
- segmentedTabsStyles.ts (43)
- plantQuickActionsStyles.ts (42)
- undoToastStyles.ts (40)
- showMoreFooterStyles.ts (39)
- detailCardStyles.ts (37)
- screenHeaderStyles.ts (36)
- sectionHeaderStyles.ts (32)
- draggablePlantRowStyles.ts (30)
- offlineBannerStyles.ts (30)
- tipStripStyles.ts (30)
- voiceInputButtonStyles.ts (25)
- typography.ts (24)
- sheetHandleStyles.ts (22)
- harvestHistorySectionStyles.ts (20)
- fieldErrorTextStyles.ts (19)
- bottomSheetModalStyles.ts (17)
- fieldLabelWithHelpStyles.ts (17)

### src/theme/ — 2 files, 319 lines

- colors.ts (230)
- index.tsx (89)

### src/types/ — 4 files, 1,391 lines

- database.types.ts (999) ⚠️ large — Grep/search inside, do not read whole
- navigation.types.ts (261)
- visual.types.ts (82)
- offline.types.ts (49)

### src/utils/ — 78 files, 10,021 lines

- plantHelpers.ts (1958) ⚠️ large — Grep/search inside, do not read whole
- rowLayoutEngine.ts (660)
- zipHelper.ts (296)
- catalogDraft.ts (273)
- plotBriefLine.ts (269)
- safeStorage.ts (256)
- carePlanDisplay.ts (244)
- plantLabels.ts (233)
- plotGrouping.ts (216)
- plantFilters.ts (210)
- weatherWords.ts (204)
- quickStartPlanner.ts (180)
- errorTracker.ts (168)
- journalEntryOptions.ts (167)
- logger.ts (161)
- firestoreTimeout.ts (159)
- taskSummary.ts (156)
- bedStatus.ts (149)
- catalogSearch.ts (137)
- riskHelpers.ts (132)
- catalogValidation.ts (131)
- offlineQueueLogic.ts (130)
- plantingNow.ts (120)
- upcomingJobs.ts (120)
- errorLogging.ts (115)
- catalogSummaries.ts (109)
- plantNameGenerator.ts (107)
- backupManifest.ts (103)
- bedPreview.ts (101)
- plantPhotos.ts (101)
- plantHistory.ts (99)
- taskConstants.ts (99)
- referencePlantCoverage.ts (97)
- filterAndSortBeds.ts (93)
- plantEntryMapper.ts (86)
- seasonProgress.ts (84)
- dateHelpers.ts (83)
- plantWatering.ts (83)
- harvestStats.ts (81)
- networkState.ts (81)
- scrollSpy.ts (80)
- needsActionItems.ts (79)
- activityRows.ts (78)
- seasonHelpers.ts (78)
- imageCompression.ts (76)
- timelineHarvest.ts (75)
- journalStats.ts (73)
- plantPickerItems.ts (71)
- bedNameGenerator.ts (70)
- plantHealth.ts (67)
- sowNowChips.ts (61)
- bedEditReconcile.ts (52)
- catalogFieldHelp.ts (51)
- plantCapacity.ts (51)
- farmRotationSummary.ts (48)
- plantTypeFromName.ts (48)
- plantFormConstants.ts (47)
- photoFilename.ts (46)
- locationHelpers.ts (45)
- recipeQuantityEngine.ts (45)
- appLifecycle.ts (44)
- svgArc.ts (40)
- weatherTone.ts (38)
- preMonsoonTasks.ts (36)
- perennialCare.ts (35)
- voiceInput.ts (35)
- plotBedCounts.ts (34)
- landCents.ts (32)
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

### src/utils/plantCareDefaults/ — 5 files, 778 lines

- pruning.ts (401)
- varieties.ts (162)
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
- CODEMAP.md (777)
- COMPONENTS.md (66)
- CONVENTIONS.md (239)
- DOMAIN_LOGIC.md (44)
- ENTERPRISE_AUDIT.md (416)
- IMAGE_STORAGE.md (38)
- IMPLEMENTATION_ROADMAP.md (349)
- REFERENCE_IMAGES.md (72)
- SCHEMA_MIGRATIONS.md (50)
- SERVICES.md (186)
- tamil-nadu-reference-audit.md (118)
- TESTING.md (33)
- TODAY_SCREEN_RECOMMENDATION.md (629)
