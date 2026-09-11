import { AxiosInstance } from 'axios';

export interface PendingAction {
  id: string;
  type: 'STATUS_UPDATE' | 'RETURN_TICKET' | 'COMPLETE_TICKET';
  ticketId: string;
  payload: any;
  photoBlob?: Blob;
  timestamp: string;
}

const DB_NAME = 'civicguard_offline_db';
const STORE_NAME = 'pending_actions';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queuePendingAction(action: Omit<PendingAction, 'id' | 'timestamp'>): Promise<PendingAction> {
  const db = await openDB();
  const item: PendingAction = {
    ...action,
    id: `act_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    timestamp: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingActions(): Promise<PendingAction[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function removePendingAction(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function syncPendingActions(api: AxiosInstance): Promise<{ synced: number; failed: number }> {
  const actions = await getPendingActions();
  if (actions.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const action of actions) {
    try {
      if (action.type === 'STATUS_UPDATE') {
        await api.patch(`/api/tickets/${action.ticketId}/status`, {
          status: action.payload.status,
        });
        await removePendingAction(action.id);
        synced++;
      } else if (action.type === 'RETURN_TICKET') {
        await api.post(`/api/tickets/${action.ticketId}/return`, {
          reason: action.payload.reason,
          crew_id: action.payload.crew_id,
        });
        await removePendingAction(action.id);
        synced++;
      } else if (action.type === 'COMPLETE_TICKET') {
        const formData = new FormData();
        if (action.photoBlob) {
          formData.append('photo', action.photoBlob, 'resolution.jpg');
        } else if (action.payload.photo_url) {
          formData.append('photo_url', action.payload.photo_url);
        }
        if (action.payload.notes) {
          formData.append('notes', action.payload.notes);
        }

        await api.post(`/api/tickets/${action.ticketId}/complete`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        await removePendingAction(action.id);
        synced++;
      }
    } catch (e) {
      console.warn(`Could not sync action ${action.id}:`, e);
      failed++;
    }
  }

  return { synced, failed };
}
