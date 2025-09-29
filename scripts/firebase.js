import { getQueueInstance } from "./offline-sync.js";

let firebaseApp = null;
let firebaseDb = null;
let firebaseAuth = null;
let isOfflineOnly = false;

const CDN_VERSION = "11.0.0";

async function loadFirebaseModule(path) {
  return import(`https://www.gstatic.com/firebasejs/${CDN_VERSION}/${path}`);
}

export async function initFirebase() {
  if (firebaseApp || isOfflineOnly) {
    return { app: firebaseApp, db: firebaseDb, auth: firebaseAuth, offlineOnly: isOfflineOnly };
  }

  const config = window.FIVE_FIREBASE_CONFIG;

  if (!config || !config.apiKey) {
    console.warn("Firebase config ausente. Executando em modo offline.");
    isOfflineOnly = true;
    return { app: null, db: null, auth: null, offlineOnly: true };
  }

  const { initializeApp } = await loadFirebaseModule("firebase-app.js");
  firebaseApp = initializeApp(config);

  const [{ getFirestore, enableIndexedDbPersistence }, { getAuth, setPersistence, browserLocalPersistence, signInAnonymously }] = await Promise.all([
    loadFirebaseModule("firebase-firestore.js"),
    loadFirebaseModule("firebase-auth.js")
  ]);

  firebaseDb = getFirestore(firebaseApp);
  firebaseAuth = getAuth(firebaseApp);

  try {
    await setPersistence(firebaseAuth, browserLocalPersistence);
    await signInAnonymously(firebaseAuth);
    await enableIndexedDbPersistence(firebaseDb);
  } catch (error) {
    console.warn("Persistência offline não disponível", error);
  }

  navigator.serviceWorker?.ready.then((registration) => {
    registration.active?.postMessage({ type: "firebase-initialized" });
  });

  return { app: firebaseApp, db: firebaseDb, auth: firebaseAuth, offlineOnly: false };
}

export async function authenticateUser({ userId, pin, role, shift }) {
  await initFirebase();

  if (shouldFallbackOffline()) {
    return offlineAuthenticate({ userId, role, shift });
  }

  return onlineAuthenticate({ userId, pin, role, shift });
}

function shouldFallbackOffline() {
  return isOfflineOnly || !firebaseDb;
}

function offlineAuthenticate({ userId, role, shift }) {
  return {
    id: userId,
    role,
    shift,
    offline: true,
    permissions: inferPermissions(role)
  };
}

async function onlineAuthenticate({ userId, pin, role, shift }) {
  const { doc, getDoc } = await loadFirebaseModule("firebase-firestore.js");
  const userRef = doc(firebaseDb, "users", userId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    throw new Error("Colaborador não encontrado");
  }

  const data = snap.data();
  if (String(data.pin) !== String(pin)) {
    throw new Error("PIN inválido");
  }

  return {
    id: userId,
    role: data.role || role,
    shift,
    displayName: data.name || userId,
    permissions: data.permissions || inferPermissions(data.role || role)
  };
}

export async function saveChecklistProgress(payload) {
  if (isOfflineOnly || !firebaseDb) {
    return queueAction({ type: "checklist-progress", payload });
  }

  const { doc, setDoc, serverTimestamp } = await loadFirebaseModule("firebase-firestore.js");
  const target = doc(firebaseDb, "checklists", payload.id);
  return setDoc(target, { ...payload, updatedAt: serverTimestamp() }, { merge: true });
}

export async function registerProductionEvent(payload) {
  if (isOfflineOnly || !firebaseDb) {
    return queueAction({ type: "production-event", payload });
  }

  const { collection, addDoc, serverTimestamp } = await loadFirebaseModule("firebase-firestore.js");
  const target = collection(firebaseDb, "production-events");
  return addDoc(target, { ...payload, createdAt: serverTimestamp() });
}

export async function reportShortage(payload) {
  if (isOfflineOnly || !firebaseDb) {
    return queueAction({ type: "shortage-report", payload });
  }

  const { collection, addDoc, serverTimestamp } = await loadFirebaseModule("firebase-firestore.js");
  const target = collection(firebaseDb, "shortages");
  return addDoc(target, { ...payload, createdAt: serverTimestamp() });
}

export async function syncQueuedActions() {
  if (isOfflineOnly || !firebaseDb) return 0;

  const queue = getQueueInstance();
  const pending = await queue.list();

  if (!pending.length) return 0;

  const { collection, addDoc, serverTimestamp } = await loadFirebaseModule("firebase-firestore.js");

  for (const item of pending) {
    const target = collection(firebaseDb, `offline-${item.type}`);
    await addDoc(target, { ...item.payload, syncedAt: serverTimestamp() });
    await queue.remove(item.id);
  }

  return pending.length;
}

function queueAction(action) {
  const queue = getQueueInstance();
  return queue.enqueue(action);
}

function inferPermissions(role = "garcom") {
  const base = {
    editLists: false,
    viewReports: false,
    closeShift: false
  };

  switch (role) {
    case "cozinha":
    case "bar":
    case "carnes":
      return { ...base, editLists: true };
    case "gerente":
      return { editLists: true, viewReports: true, closeShift: true };
    default:
      return base;
  }
}
