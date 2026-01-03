import { useEffect, useState } from 'react';
import ActiveWorkout from './components/ActiveWorkout';
import ExerciseHistory from './components/ExerciseHistory';
import TemplateList from './components/TemplateList';
import { SetEntry, TemplateDraft, TemplateWithExercises, WorkoutSession } from './types';
import { workoutStore } from './store/workoutStore';
import styles from './styles/App.module.css';

const screens = {
  templates: 'templates',
  workout: 'workout',
  history: 'history'
} as const;

type Screen = keyof typeof screens;

export interface LastSessionMap {
  [exerciseId: string]: { summary: string } | undefined;
}

function App() {
  const [screen, setScreen] = useState<Screen>('templates');
  const [templates, setTemplates] = useState<TemplateWithExercises[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<TemplateWithExercises | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [setsByExercise, setSetsByExercise] = useState<Record<string, SetEntry[]>>({});
  const [lastSessions, setLastSessions] = useState<LastSessionMap>({});
  const [historyExercise, setHistoryExercise] = useState<{ id: string; name: string } | null>(null);
  const [historyEntries, setHistoryEntries] = useState<Awaited<ReturnType<typeof workoutStore.getExerciseHistory>>>([]);

  useEffect(() => {
    workoutStore.getTemplates().then(setTemplates);
  }, []);

  async function loadLastSessions(exerciseIds: string[]) {
    const summaries: LastSessionMap = {};
    for (const exerciseId of exerciseIds) {
      const last = await workoutStore.getLastSessionForExercise(exerciseId);
      if (last.session && last.sets.length) {
        const setText = last.sets.map((set) => `${set.weight} kg x ${set.reps}`).join(', ');
        summaries[exerciseId] = { summary: `Last: ${setText}` };
      }
    }
    setLastSessions(summaries);
  }

  async function handleStartWorkout(template: TemplateWithExercises) {
    const newSession = await workoutStore.createSession(template.id);
    setSession(newSession);
    setCurrentTemplate(template);
    setSetsByExercise({});
    await loadLastSessions(template.exerciseIds);
    setScreen('workout');
  }

  async function handleSaveTemplate(draft: TemplateDraft) {
    const saved = await workoutStore.saveTemplate(draft);
    const updatedTemplates = await workoutStore.getTemplates();
    setTemplates(updatedTemplates);
    // If we edited the active template, refresh it
    if (currentTemplate && saved.id === currentTemplate.id) {
      setCurrentTemplate(saved);
    }
  }

  function handleAddSet(exerciseId: string, saved: SetEntry) {
    setSetsByExercise((prev) => {
      const existing = prev[exerciseId] ?? [];
      return { ...prev, [exerciseId]: [...existing, saved] };
    });
  }

  async function handleSaveSet(exerciseId: string, weight: number, reps: number) {
    if (!session) return;
    const order = setsByExercise[exerciseId]?.length ?? 0;
    const saved = await workoutStore.saveSet({ sessionId: session.id, exerciseId, weight, reps, order });
    handleAddSet(exerciseId, saved);
  }

  async function handleDeleteSet(setId: string, exerciseId: string) {
    await workoutStore.deleteSet(setId);
    setSetsByExercise((prev) => {
      const filtered = (prev[exerciseId] ?? []).filter((set) => set.id !== setId);
      return { ...prev, [exerciseId]: filtered };
    });
  }

  async function handleFinish() {
    setScreen('templates');
    setSession(null);
    setCurrentTemplate(null);
    setSetsByExercise({});
    setLastSessions({});
    const updatedTemplates = await workoutStore.getTemplates();
    setTemplates(updatedTemplates);
  }

  async function openHistory(exerciseId: string, name: string) {
    const entries = await workoutStore.getExerciseHistory(exerciseId);
    setHistoryExercise({ id: exerciseId, name });
    setHistoryEntries(entries);
    setScreen('history');
  }

  function closeHistory() {
    setHistoryExercise(null);
    setHistoryEntries([]);
    setScreen('workout');
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Workout Logger</h1>
        <p>Offline-first. Yours only.</p>
      </header>

      <main className={styles.main}>
        {screen === 'templates' && (
          <TemplateList
            templates={templates}
            onStartWorkout={handleStartWorkout}
            onSaveTemplate={handleSaveTemplate}
          />
        )}

        {screen === 'workout' && session && currentTemplate && (
          <ActiveWorkout
            template={currentTemplate}
            setsByExercise={setsByExercise}
            onSaveSet={handleSaveSet}
            onDeleteSet={handleDeleteSet}
            onFinish={handleFinish}
            lastSessionSummaries={lastSessions}
            onOpenHistory={openHistory}
          />
        )}

        {screen === 'history' && historyExercise && (
          <ExerciseHistory
            exercise={historyExercise}
            entries={historyEntries}
            onClose={closeHistory}
          />
        )}
      </main>
    </div>
  );
}

export default App;
