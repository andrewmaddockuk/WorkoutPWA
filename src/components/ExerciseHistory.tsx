import styles from '../styles/ExerciseHistory.module.css';
import { ExerciseHistoryEntry } from '../types';

interface Props {
  exercise: { id: string; name: string };
  entries: ExerciseHistoryEntry[];
  onClose: () => void;
}

function ExerciseHistory({ exercise, entries, onClose }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onClose} className={styles.back}>
          ← Back
        </button>
        <h2>{exercise.name}</h2>
      </div>

      {entries.length === 0 && <p className={styles.empty}>No history yet. Log a set to see it here.</p>}

      <ul className={styles.list}>
        {entries.map((entry) => (
          <li key={entry.sessionId} className={styles.item}>
            <div>
              <div className={styles.date}>{new Date(entry.date).toLocaleDateString()}</div>
              {entry.bestSet ? (
                <div className={styles.set}>Best: {entry.bestSet.weight} kg × {entry.bestSet.reps} reps</div>
              ) : (
                <div className={styles.set}>No sets logged</div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ExerciseHistory;
