import { useEffect, useMemo, useState } from 'react';
import { ExerciseHistoryEntry, TemplateWithExercises } from '../types';
import { workoutStore } from '../store/workoutStore';
import styles from '../styles/StatsPanel.module.css';

interface Props {
  templates: TemplateWithExercises[];
  onBack: () => void;
}

function StatsPanel({ templates, onBack }: Props) {
  const [exerciseId, setExerciseId] = useState<string>('');
  const [history, setHistory] = useState<ExerciseHistoryEntry[]>([]);

  const exercises = useMemo(() => {
    const map = new Map<string, string>();
    templates.forEach((template) => {
      template.exercises.forEach((exercise) => {
        map.set(exercise.id, exercise.name);
      });
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [templates]);

  useEffect(() => {
    if (exerciseId) {
      workoutStore.getExerciseHistory(exerciseId).then(setHistory);
    }
  }, [exerciseId]);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <button onClick={onBack} className={styles.back}>
          ← Home
        </button>
        <h2>Stats</h2>
      </div>

      <label className={styles.field}>
        <span>Exercise</span>
        <select value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
          <option value="">Choose an exercise</option>
          {exercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
            </option>
          ))}
        </select>
      </label>

      {exerciseId && history.length === 0 && <p className={styles.muted}>No history yet.</p>}

      {history.length > 0 && (
        <div className={styles.history}>
          {history.map((entry) => (
            <div key={entry.sessionId} className={styles.historyCard}>
              <p className={styles.date}>{new Date(entry.date).toLocaleDateString()}</p>
              {entry.bestSet ? (
                <p className={styles.best}>Best: {entry.bestSet.weight} kg × {entry.bestSet.reps}</p>
              ) : (
                <p className={styles.muted}>No sets recorded</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StatsPanel;
