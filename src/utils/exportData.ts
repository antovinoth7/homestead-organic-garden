import * as FileSystem from 'expo-file-system/legacy';
import { shareAsync, isAvailableAsync } from 'expo-sharing';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db, auth, refreshAuthToken } from '@/lib/firebase';
import { logger } from '@/utils/logger';

export async function exportPlantsAsJson(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  await refreshAuthToken();

  const q = query(collection(db, 'plants'), where('user_id', '==', user.uid), limit(1000));
  const snapshot = await getDocs(q);
  const plants = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  logger.info(`exportData: fetched ${plants.length} plants from Firestore`);

  const json = JSON.stringify({ exportedAt: new Date().toISOString(), plants }, null, 2);
  const path = `${FileSystem.cacheDirectory}plants_export_${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(path, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await isAvailableAsync();
  if (!canShare) {
    logger.warn('exportData: sharing not available on this device');
    return;
  }
  await shareAsync(path, {
    mimeType: 'application/json',
    dialogTitle: 'Export Plants',
  });
}
