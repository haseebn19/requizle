/**
 * IndexedDB storage adapter for Zustand persist middleware.
 * Provides larger storage than localStorage (~50MB+ vs ~5MB).
 */

const DB_NAME = 'requizle-store';
const DB_VERSION = 1;
const STORE_NAME = 'zustand';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            dbPromise = null;
            reject(new Error('Failed to open IndexedDB for store'));
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });

    return dbPromise;
}

/** Zustand-compatible storage adapter using IndexedDB. */
export const indexedDBStorage = {
    getItem: async (name: string): Promise<string | null> => {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(name);

                request.onsuccess = () => {
                    resolve(request.result ?? null);
                };
                request.onerror = () => {
                    reject(new Error('Failed to read from IndexedDB'));
                };
            });
        } catch {
            // Fallback to localStorage if IndexedDB fails
            return localStorage.getItem(name);
        }
    },

    setItem: async (name: string, value: string): Promise<void> => {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(value, name);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(new Error('Failed to write to IndexedDB'));
            });
        } catch {
            // Fallback to localStorage if IndexedDB fails
            localStorage.setItem(name, value);
        }
    },

    removeItem: async (name: string): Promise<void> => {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.delete(name);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(new Error('Failed to delete from IndexedDB'));
            });
        } catch {
            // Fallback to localStorage if IndexedDB fails
            localStorage.removeItem(name);
        }
    }
};

/** Clear all store data from IndexedDB. */
export async function clearStoreData(): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to clear IndexedDB store'));
        });
    } catch {
        // Also clear localStorage as fallback
        localStorage.removeItem('quiz-storage');
    }
}

/**
 * Migrate data from localStorage to IndexedDB (one-time migration).
 */
export async function migrateFromLocalStorage(key: string): Promise<void> {
    const localData = localStorage.getItem(key);
    if (localData) {
        try {
            await indexedDBStorage.setItem(key, localData);
            localStorage.removeItem(key);
        } catch {
            // Migration failed, data remains in localStorage
        }
    }
}
