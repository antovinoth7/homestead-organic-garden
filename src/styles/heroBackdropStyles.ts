import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // Fills the hero behind its content. Edges written out: absoluteFill is a
  // registered style and cannot be spread into a style object.
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
