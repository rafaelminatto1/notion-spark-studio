
import { useState, useEffect, useCallback } from 'react';

interface IndexedDBConfig {
  dbName: string;
  version: number;
  objectStores: {
    name: string;
    keyPath?: string;
    autoIncrement?: boolean;
    indexes?: { name: string; keyPath: string; unique?: boolean }[];
  }[];
}

const DEFAULT_CONFIG: IndexedDBConfig = {
  dbName: 'NotionCloneDB',
  version: 1,
  objectStores: [
    {
      name: 'files',
      keyPath: 'id',
      indexes: [
        { name: 'parentId', keyPath: 'parentId' },
        { name: 'type', keyPath: 'type' },
        { name: 'updatedAt', keyPath: 'updatedAt' }
      ]
    },
    {
      name: 'media',
      keyPath: 'id',
      indexes: [
        { name: 'type', keyPath: 'type' },
        { name: 'createdAt', keyPath: 'createdAt' }
      ]
    },
    {
      name: 'workspace',
      keyPath: 'id'
    }
  ]
};

export const useIndexedDB = (config: IndexedDBConfig = DEFAULT_CONFIG) => {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDB = async () => {
      try {
        const request = indexedDB.open(config.dbName, config.version);
        
        request.onerror = () => {
          setError('Erro ao abrir banco de dados');
        };

        request.onsuccess = () => {
          setDb(request.result);
          setIsReady(true);
        };

        request.onupgradeneeded = (event) => {
          const database = (event.target as IDBOpenDBRequest).result;
          
          config.objectStores.forEach(storeConfig => {
            if (!database.objectStoreNames.contains(storeConfig.name)) {
              const store = database.createObjectStore(storeConfig.name, {
                keyPath: storeConfig.keyPath,
                autoIncrement: storeConfig.autoIncrement
              });

              storeConfig.indexes?.forEach(index => {
                store.createIndex(index.name, index.keyPath, { unique: index.unique });
              });
            }
          });
        };
      } catch (err) {
        setError('IndexedDB não suportado');
      }
    };

    initDB();
  }, [config]);

  const get = useCallback(async <T>(storeName: string, key: string): Promise<T | null> => {
    if (!db) return null;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  const getAll = useCallback(async <T>(storeName: string): Promise<T[]> => {
    if (!db) return [];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  const set = useCallback(async <T>(storeName: string, data: T): Promise<void> => {
    if (!db) return;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  const remove = useCallback(async (storeName: string, key: string): Promise<void> => {
    if (!db) return;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  const clear = useCallback(async (storeName: string): Promise<void> => {
    if (!db) return;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  const query = useCallback(async <T>(
    storeName: string, 
    indexName?: string, 
    query?: IDBValidKey | IDBKeyRange
  ): Promise<T[]> => {
    if (!db) return [];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let request: IDBRequest;
      if (indexName) {
        const index = store.index(indexName);
        request = query ? index.getAll(query) : index.getAll();
      } else {
        request = query ? store.getAll(query) : store.getAll();
      }

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  return {
    isReady,
    error,
    get,
    getAll,
    set,
    remove,
    clear,
    query
  };
};
