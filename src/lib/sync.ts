import { set, get, del } from 'idb-keyval';
import { supabase } from './supabase';

const OFFLINE_RESPONSES_KEY = 'offline_form_responses';

export async function saveResponseOffline(formId: string, responsePayload: any) {
  const existingQueue = (await get<any[]>(OFFLINE_RESPONSES_KEY)) || [];
  existingQueue.push({
    formId,
    payload: responsePayload,
    timestamp: new Date().toISOString()
  });
  await set(OFFLINE_RESPONSES_KEY, existingQueue);
  console.log('Saved response offline:', responsePayload);
}

export async function syncOfflineResponses() {
  if (!navigator.onLine) return;

  const queue = (await get<any[]>(OFFLINE_RESPONSES_KEY)) || [];
  if (queue.length === 0) return;

  console.log('Syncing offline responses...', queue.length);

  const remainingQueue = [];

  for (const item of queue) {
    try {
      const { error } = await supabase.from('form_responses').insert(item.payload);
      if (error) {
        console.error('Failed to sync response:', error);
        remainingQueue.push(item);
      } else {
        console.log('Synced response successfully');
      }
    } catch (err) {
      console.error('Error syncing response:', err);
      remainingQueue.push(item);
    }
  }

  if (remainingQueue.length > 0) {
    await set(OFFLINE_RESPONSES_KEY, remainingQueue);
  } else {
    await del(OFFLINE_RESPONSES_KEY);
  }
}

// Set up online listener
window.addEventListener('online', () => {
  syncOfflineResponses();
});
