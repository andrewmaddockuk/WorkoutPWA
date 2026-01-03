import { useMemo, useState } from 'react';
import { LastSessionMap } from '../App';
import { SetEntry, TemplateWithExercises } from '../types';
import styles from '../styles/ActiveWorkout.module.css';

interface Props {
  template: TemplateWithExercises;
  setsByExercise: Record<string, SetEntry[]>;
  onSaveSet: (exerciseId: string, weight: number, reps: number) => Promise<void>;
  onDeleteSet: (setId: string, exerciseId: string) => Promise<void>;
  onFinish: () => void;
  lastSessionSummaries: LastSessionMap;
  onOpenHistory: (exerciseId: string, name: string) => void;
}

function ActiveWorkout({
  template,
  setsByExercise,
  onSaveSet,
  onDeleteSet,
  onFinish,
  lastSessionSummaries,
  onOpenHistory
}: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h2>{template.name}</h2>
        <button className={styles.finish} onClick={onFinish}>
          Finish Workout
        </button>
      </div>

      <div className={styles.exercises}>
        {template.exercises.map((exercise) => {
          const savedSets = setsByExercise[exercise.id] ?? [];
          const nextOrder = savedSets.length;
          const lastSummary = lastSessionSummaries[exercise.id]?.summary;
          const previousWeight = savedSets[savedSets.length - 1]?.weight;

          return (
            <div key={exercise.id} className={styles.exerciseCard}>
              <div className={styles.exerciseHeader}>
                <button
                  className={styles.exerciseName}
                  onClick={() => onOpenHistory(exercise.id, exercise.name)}
                >
                  {exercise.name}
                </button>
                {lastSummary && <span className={styles.last}>{lastSummary}</span>}
              </div>

              <div className={styles.sets}>
                {savedSets.map((set, index) => (
                  <div key={set.id} className={styles.savedSet}>
                    <div>
                      <div className={styles.setLabel}>Set {index + 1}</div>
                      <div className={styles.savedValues}>
                        <span>{set.weight} kg</span>
                        <span>×</span>
                        <span>{set.reps} reps</span>
                      </div>
                    </div>
                    <button
                      className={styles.delete}
                      onClick={() => onDeleteSet(set.id, exercise.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}

                <NewSetRow
                  order={nextOrder + 1}
                  onSave={(weight, reps) => onSaveSet(exercise.id, weight, reps)}
                  previousWeight={previousWeight}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface NewSetRowProps {
  order: number;
  previousWeight?: number;
  onSave: (weight: number, reps: number) => Promise<void>;
}

function NewSetRow({ order, onSave, previousWeight }: NewSetRowProps) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

  const canSave = useMemo(() => weight.trim() !== '' && reps.trim() !== '', [weight, reps]);

  async function handleSave() {
    if (!canSave) return;
    await onSave(Number(weight), Number(reps));
    setReps('');
    setWeight(weight); // keep last weight for quick entry
  }

  function copyPreviousWeight() {
    if (weight === '' && previousWeight !== undefined) {
      setWeight(String(previousWeight));
    }
  }

  return (
    <div className={styles.newSet}>
      <div className={styles.setLabel}>Set {order}</div>
      <div className={styles.inputs}>
        <label>
          <span>Weight</span>
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onFocus={copyPreviousWeight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="kg"
          />
        </label>
        <label>
          <span>Reps</span>
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="reps"
          />
        </label>
      </div>
      <button className={styles.save} onClick={handleSave} disabled={!canSave}>
        Save set
      </button>
    </div>
  );
}

export default ActiveWorkout;
