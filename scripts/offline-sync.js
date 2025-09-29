const DB_NAME = "five-offline-db";
const STORE_NAME = "queue";
const DB_VERSION = 1;

let dbPromise = null;
let queueInstance = null;

function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
  });

  return dbPromise;
}

class OfflineQueue {
  constructor() {
    this.fallbackKey = `${DB_NAME}-fallback`;
    this.memoryQueue = [];
  }

  async enqueue(action) {
    const db = await openDatabase();
    if (!db) {
      return this.enqueueFallback(action);
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();
      tx.objectStore(STORE_NAME).add({ ...action, createdAt: Date.now() });
    });
  }

  async list() {
    const db = await openDatabase();
    if (!db) {
      return this.listFallback();
    }

    return runStoreOperation(db, "readonly", (store, resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async remove(id) {
    const db = await openDatabase();
    if (!db) {
      return this.removeFallback(id);
    }

    return runStoreOperation(db, "readwrite", (store, resolve, reject) => {
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear() {
    const db = await openDatabase();
    if (!db) {
      localStorage.removeItem(this.fallbackKey);
      this.memoryQueue = [];
      return;
    }

    return runStoreOperation(db, "readwrite", (store, resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  enqueueFallback(action) {
    const queue = this.listFallback();
    queue.push({ ...action, id: Date.now(), createdAt: Date.now() });
    this.persistFallback(queue);
  }

  listFallback() {
    const persisted = localStorage.getItem(this.fallbackKey);
    if (persisted) {
      try {
        return JSON.parse(persisted);
      } catch (error) {
        console.warn("Falha ao ler fila local", error);
      }
    }
    return [...this.memoryQueue];
  }

  removeFallback(id) {
    const queue = this.listFallback().filter((item) => item.id !== id);
    this.persistFallback(queue);
  }

  persistFallback(queue) {
    this.memoryQueue = queue;
    try {
      localStorage.setItem(this.fallbackKey, JSON.stringify(queue));
    } catch (error) {
      console.warn("Falha ao salvar fila local", error);
    }
  }
}

export function getQueueInstance() {
  if (!queueInstance) {
    queueInstance = new OfflineQueue();
  }
  return queueInstance;
}

function runStoreOperation(db, mode, executor) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    executor(store, resolve, reject);
  });
}

export function listenNetworkChanges({ onOnline, onOffline }) {
  window.addEventListener("online", () => onOnline?.());
  window.addEventListener("offline", () => onOffline?.());
}

export async function bootstrapOfflineQueue() {
  await openDatabase().catch((error) => {
    console.warn("IndexedDB indisponível, fallback em localStorage", error);
  });
  return getQueueInstance();
}
