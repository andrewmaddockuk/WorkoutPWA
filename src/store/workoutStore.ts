import {
  Exercise,
  ExerciseHistoryEntry,
  ID,
  SetEntry,
  TemplateDraft,
  TemplateWithExercises,
  WorkoutSession,
  WorkoutTemplate
} from '../types';

const DB_NAME = 'workout-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

const defaultTemplates: Array<TemplateDraft> = [
  {
    name: 'Push',
    exercises: [
      { name: 'Bench Press' },
      { name: 'Overhead Press' },
      { name: 'Dips' }
    ]
  },
  {
    name: 'Pull',
    exercises: [
      { name: 'Pull Ups' },
      { name: 'Barbell Row' },
      { name: 'Biceps Curl' }
    ]
  },
  {
    name: 'Legs',
    exercises: [
      { name: 'Back Squat' },
      { name: 'Romanian Deadlift' },
      { name: 'Walking Lunge' }
    ]
  }
];

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('exercises')) {
        db.createObjectStore('exercises', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('templates')) {
        const store = db.createObjectStore('templates', { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
      }
      if (!db.objectStoreNames.contains('sessions')) {
        const store = db.createObjectStore('sessions', { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('templateId', 'templateId', { unique: false });
      }
      if (!db.objectStoreNames.contains('sets')) {
        const store = db.createObjectStore('sets', { keyPath: 'id' });
        store.createIndex('sessionId', 'sessionId', { unique: false });
        store.createIndex('exerciseId', 'exerciseId', { unique: false });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });

  return dbPromise;
}

async function transaction<T>(storeNames: string[], mode: IDBTransactionMode, callback: (tx: IDBTransaction) => Promise<T> | T): Promise<T> {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeNames, mode);
    const result = callback(tx);
    tx.oncomplete = () => {
      if (result instanceof Promise) {
        result.then(resolve).catch(reject);
      } else {
        resolve(result);
      }
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function uuid(): ID {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function ensureSeeded() {
  const db = await openDatabase();
  const tx = db.transaction(['meta'], 'readonly');
  const metaStore = tx.objectStore('meta');
  const seeded = await new Promise<boolean>((resolve) => {
    const req = metaStore.get('seeded');
    req.onsuccess = () => resolve(Boolean(req.result?.value));
    req.onerror = () => resolve(false);
  });
  await new Promise((resolve) => {
    tx.oncomplete = () => resolve(null);
  });
  if (seeded) return;

  await transaction(['meta', 'exercises', 'templates'], 'readwrite', async (tx) => {
    const exerciseStore = tx.objectStore('exercises');
    const templateStore = tx.objectStore('templates');
    const meta = tx.objectStore('meta');

    for (const template of defaultTemplates) {
      const exerciseIds: ID[] = [];
      for (const ex of template.exercises) {
        const id = uuid();
        exerciseIds.push(id);
        exerciseStore.put({ id, name: ex.name } satisfies Exercise);
      }
      templateStore.put({ id: uuid(), name: template.name, exerciseIds } satisfies WorkoutTemplate);
    }

    meta.put({ key: 'seeded', value: true });
  });
}

async function getExercisesByIds(ids: ID[]): Promise<Exercise[]> {
  const db = await openDatabase();
  const tx = db.transaction(['exercises'], 'readonly');
  const store = tx.objectStore('exercises');

  const results: Exercise[] = [];
  for (const id of ids) {
    const exercise = await new Promise<Exercise | undefined>((resolve) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result as Exercise | undefined);
      req.onerror = () => resolve(undefined);
    });
    if (exercise) results.push(exercise);
  }

  return results;
}

async function getTemplates(): Promise<TemplateWithExercises[]> {
  await ensureSeeded();
  const db = await openDatabase();
  const tx = db.transaction(['templates', 'exercises'], 'readonly');
  const templateStore = tx.objectStore('templates');

  const templates: WorkoutTemplate[] = await new Promise((resolve) => {
    const req = templateStore.getAll();
    req.onsuccess = () => resolve(req.result as WorkoutTemplate[]);
  });

  const results: TemplateWithExercises[] = [];
  for (const template of templates) {
    const exercises = await getExercisesByIds(template.exerciseIds);
    results.push({ ...template, exercises });
  }
  return results;
}

async function saveTemplate(draft: TemplateDraft): Promise<TemplateWithExercises> {
  const templateId = draft.id ?? uuid();
  const exerciseIds: ID[] = [];
  const exercisesToSave: Exercise[] = draft.exercises.map((ex) => {
    const id = ex.id ?? uuid();
    exerciseIds.push(id);
    return { id, name: ex.name };
  });

  await transaction(['templates', 'exercises'], 'readwrite', (tx) => {
    const exerciseStore = tx.objectStore('exercises');
    exercisesToSave.forEach((exercise) => exerciseStore.put(exercise));
    const templateStore = tx.objectStore('templates');
    templateStore.put({ id: templateId, name: draft.name, exerciseIds } satisfies WorkoutTemplate);
  });

  return { id: templateId, name: draft.name, exerciseIds, exercises: exercisesToSave };
}

async function deleteSet(id: ID): Promise<void> {
  await transaction(['sets'], 'readwrite', (tx) => {
    tx.objectStore('sets').delete(id);
  });
}

async function createSession(templateId: ID): Promise<WorkoutSession> {
  const session: WorkoutSession = { id: uuid(), date: new Date().toISOString(), templateId };
  await transaction(['sessions'], 'readwrite', (tx) => {
    tx.objectStore('sessions').add(session);
  });
  return session;
}

async function saveSet(entry: Omit<SetEntry, 'id'>): Promise<SetEntry> {
  const setEntry: SetEntry = { ...entry, id: uuid() };
  await transaction(['sets'], 'readwrite', (tx) => {
    tx.objectStore('sets').put(setEntry);
  });
  return setEntry;
}

async function getSetsForSession(sessionId: ID): Promise<SetEntry[]> {
  const db = await openDatabase();
  const tx = db.transaction(['sets'], 'readonly');
  const store = tx.objectStore('sets').index('sessionId');

  const sets: SetEntry[] = [];
  await new Promise<void>((resolve) => {
    const req = store.openCursor(IDBKeyRange.only(sessionId));
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        sets.push(cursor.value as SetEntry);
        cursor.continue();
      } else {
        resolve();
      }
    };
  });
  return sets.sort((a, b) => a.order - b.order);
}

async function getSession(sessionId: ID): Promise<WorkoutSession | undefined> {
  const db = await openDatabase();
  const tx = db.transaction(['sessions'], 'readonly');
  const store = tx.objectStore('sessions');
  const session = await new Promise<WorkoutSession | undefined>((resolve) => {
    const req = store.get(sessionId);
    req.onsuccess = () => resolve(req.result as WorkoutSession | undefined);
    req.onerror = () => resolve(undefined);
  });
  return session;
}

async function getLastSessionForExercise(exerciseId: ID): Promise<{ session?: WorkoutSession; sets: SetEntry[] }> {
  const db = await openDatabase();
  const setIndex = db.transaction(['sets'], 'readonly').objectStore('sets').index('exerciseId');
  const sessionIds = new Set<ID>();

  await new Promise<void>((resolve) => {
    const req = setIndex.openCursor(IDBKeyRange.only(exerciseId));
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        sessionIds.add((cursor.value as SetEntry).sessionId);
        cursor.continue();
      } else {
        resolve();
      }
    };
  });

  if (!sessionIds.size) return { sets: [] };

  const sessions: WorkoutSession[] = [];
  for (const id of sessionIds) {
    const session = await getSession(id);
    if (session) sessions.push(session);
  }

  sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latest = sessions[0];
  if (!latest) return { sets: [] };
  const sets = (await getSetsForSession(latest.id)).filter((s) => s.exerciseId === exerciseId);
  return { session: latest, sets };
}

async function getExerciseHistory(exerciseId: ID): Promise<ExerciseHistoryEntry[]> {
  const db = await openDatabase();
  const setIndex = db.transaction(['sets'], 'readonly').objectStore('sets').index('exerciseId');
  const setsBySession = new Map<ID, SetEntry[]>();

  await new Promise<void>((resolve) => {
    const req = setIndex.openCursor(IDBKeyRange.only(exerciseId));
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        const entry = cursor.value as SetEntry;
        const list = setsBySession.get(entry.sessionId) ?? [];
        list.push(entry);
        setsBySession.set(entry.sessionId, list);
        cursor.continue();
      } else {
        resolve();
      }
    };
  });

  const history: ExerciseHistoryEntry[] = [];
  for (const [sessionId, sets] of setsBySession.entries()) {
    const session = await getSession(sessionId);
    if (!session) continue;
    const bestSet = sets.reduce<ExerciseHistoryEntry['bestSet']>((best, current) => {
      if (!best) return { weight: current.weight, reps: current.reps };
      if (current.weight > best.weight) return { weight: current.weight, reps: current.reps };
      if (current.weight === best.weight && current.reps > best.reps) return { weight: current.weight, reps: current.reps };
      return best;
    }, undefined);
    history.push({ sessionId, date: session.date, bestSet });
  }

  return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

async function getTemplateById(templateId: ID): Promise<TemplateWithExercises | undefined> {
  const db = await openDatabase();
  const tx = db.transaction(['templates'], 'readonly');
  const req = tx.objectStore('templates').get(templateId);
  const template = await new Promise<WorkoutTemplate | undefined>((resolve) => {
    req.onsuccess = () => resolve(req.result as WorkoutTemplate | undefined);
    req.onerror = () => resolve(undefined);
  });
  if (!template) return undefined;
  const exercises = await getExercisesByIds(template.exerciseIds);
  return { ...template, exercises };
}

async function clearStore() {
  await transaction(['templates', 'exercises', 'sessions', 'sets', 'meta'], 'readwrite', (tx) => {
    tx.objectStore('templates').clear();
    tx.objectStore('exercises').clear();
    tx.objectStore('sessions').clear();
    tx.objectStore('sets').clear();
    tx.objectStore('meta').clear();
  });
}

export const workoutStore = {
  getTemplates,
  saveTemplate,
  createSession,
  saveSet,
  getSetsForSession,
  getLastSessionForExercise,
  getExerciseHistory,
  deleteSet,
  getTemplateById,
  clearStore
};
