import type { Template } from '../types';

const DB_NAME = 'AIOrchestrationDB';
const STORE_NAME = 'templates';
const DB_VERSION = 1;

let db: IDBDatabase;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error opening IndexedDB:', request.error);
      reject('Error opening IndexedDB');
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        // Use 'name' as the unique key for each template
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'name' });
      }
    };
  });
}

/**
 * Adds a new template or updates an existing one with the same name.
 * @param template The template object to save.
 */
export async function addTemplate(template: Template): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    // put() will add or update if the key (name) already exists
    const request = store.put(template);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error('Error adding/updating template:', request.error);
      reject('Error adding/updating template');
    };
  });
}

/**
 * Retrieves all saved templates from IndexedDB.
 * @returns A promise that resolves to an array of templates.
 */
export async function getAllTemplates(): Promise<Template[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.error('Error fetching templates:', request.error);
      reject('Error fetching templates');
    };
  });
}
