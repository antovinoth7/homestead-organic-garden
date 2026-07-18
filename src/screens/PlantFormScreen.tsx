import React, { useMemo } from 'react';
import { View } from 'react-native';
import { usePlantFormState } from '../hooks/usePlantFormState';
import { PlantAddForm } from '../components/forms/PlantAddForm';
import { PlantEditForm } from '../components/forms/PlantEditForm';
import DiscardChangesModal from '../components/modals/DiscardChangesModal';
import PhotoSourceModal from '../components/modals/PhotoSourceModal';
import { useTheme } from '../theme';
import { createStyles } from '../styles/plantFormStyles';

export default function PlantFormScreen(): React.JSX.Element {
  const formState = usePlantFormState();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {!formState.plantId ? (
        <PlantAddForm formState={formState} />
      ) : (
        <PlantEditForm formState={formState} />
      )}
      <DiscardChangesModal
        visible={formState.showDiscardModal}
        styles={styles}
        onKeepEditing={() => formState.setShowDiscardModal(false)}
        onDiscard={formState.handleDiscard}
      />
      <PhotoSourceModal
        visible={formState.showPhotoSourceModal}
        onClose={() => formState.setShowPhotoSourceModal(false)}
        onCamera={formState.openCamera}
        onLibrary={formState.openImageLibrary}
      />
    </View>
  );
}
