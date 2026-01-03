import { FormEvent, useMemo, useState } from 'react';
import { TemplateDraft } from '../types';
import styles from '../styles/TemplateForm.module.css';

interface Props {
  draft: TemplateDraft;
  onClose: () => void;
  onSave: (draft: TemplateDraft) => void | Promise<void>;
}

function TemplateForm({ draft, onClose, onSave }: Props) {
  const [name, setName] = useState(draft.name);
  const [exercises, setExercises] = useState(draft.exercises);

  function updateExercise(index: number, value: string) {
    setExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, name: value } : ex)));
  }

  function addExercise() {
    setExercises((prev) => [...prev, { name: 'New Exercise' }]);
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !exercises.length) return;
    await onSave({ ...draft, name: name.trim(), exercises: exercises.map((ex) => ({ ...ex, name: ex.name.trim() })) });
  }

  const canSave = useMemo(() => Boolean(name.trim()) && exercises.every((ex) => Boolean(ex.name.trim())), [name, exercises]);

  return (
    <div className={styles.backdrop}>
      <form className={styles.sheet} onSubmit={handleSubmit}>
        <div className={styles.header}>
          <h3>{draft.id ? 'Edit Template' : 'New Template'}</h3>
          <button type="button" onClick={onClose} className={styles.close} aria-label="Close">
            ✕
          </button>
        </div>

        <label className={styles.field}>
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <div className={styles.exercises}>
          <div className={styles.exerciseHeader}>
            <span>Exercises</span>
            <button type="button" onClick={addExercise} className={styles.secondary}>
              + Add exercise
            </button>
          </div>
          {exercises.map((exercise, index) => (
            <div className={styles.exerciseRow} key={index}>
              <input
                value={exercise.name}
                onChange={(e) => updateExercise(index, e.target.value)}
                required
              />
              <button type="button" onClick={() => removeExercise(index)} className={styles.ghost}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={onClose} className={styles.ghost}>
            Cancel
          </button>
          <button type="submit" className={styles.primary} disabled={!canSave}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default TemplateForm;
