/**
 * Props React Native supports at runtime but leaves out of the legacy `types/`
 * this project compiles against (they appear only in `types_generated`).
 */
import 'react-native';

declare module 'react-native/Libraries/Lists/FlatList' {
  // The type parameter must keep RN's name to merge with its declaration.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface FlatListProps<ItemT> {
    /**
     * Memoize FlatList's per-cell renderer (`FlatList.js` `_memoizedRenderer`).
     * Without it every FlatList render hands each mounted cell a new
     * `renderItem`, so every cell re-runs even when nothing it shows changed.
     * Safe only when `renderItem`'s identity changes whenever its output would.
     */
    strictMode?: boolean | undefined;
  }
}
