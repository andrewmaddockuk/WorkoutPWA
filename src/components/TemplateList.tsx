import { useMemo, useState } from 'react';
import { TemplateDraft, TemplateWithExercises } from '../types';
import TemplateForm from './TemplateForm';
import styles from '../styles/TemplateList.module.css';

interface Props {
  templates: TemplateWithExercises[];
  onStartWorkout: (template: TemplateWithExercises) => void;
  onSaveTemplate: (draft: TemplateDraft) => void | Promise<void>;
}

function TemplateList({ templates, onStartWorkout, onSaveTemplate }: Props) {
  const [editing, setEditing] = useState<TemplateWithExercises | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const sortedTemplates = useMemo(
    () => [...templates].sort((a, b) => a.name.localeCompare(b.name)),
    [templates]
  );

  const initialDraft: TemplateDraft | null = useMemo(() => {
    if (editing) return { id: editing.id, name: editing.name, exercises: editing.exercises };
    if (isCreating) return { name: 'New Template', exercises: [] };
    return null;
  }, [editing, isCreating]);

  function handleCloseForm() {
    setEditing(null);
    setIsCreating(false);
  }

  async function handleSubmit(draft: TemplateDraft) {
    await onSaveTemplate(draft);
    handleCloseForm();
  }

  return (
    <div className={styles.container}>
      <div className={styles.actions}>
        <button className={styles.primary} onClick={() => setIsCreating(true)}>
          + Add Template
        </button>
      </div>

      <div className={styles.list}>
        {sortedTemplates.map((template) => (
          <div key={template.id} className={styles.templateCard}>
            <button className={styles.templateButton} onClick={() => onStartWorkout(template)}>
              <div>
                <div className={styles.titleRow}>
                  <h2>{template.name}</h2>
                  <span className={styles.chevron}>▶</span>
                </div>
                <p className={styles.exercises}>{template.exercises.map((ex) => ex.name).join(' · ')}</p>
              </div>
            </button>
            <div className={styles.cardActions}>
              <button onClick={() => setEditing(template)} className={styles.secondary}>Edit</button>
            </div>
          </div>
        ))}
      </div>

      {initialDraft && (
        <TemplateForm
          draft={initialDraft}
          onClose={handleCloseForm}
          onSave={handleSubmit}
        />
      )}
    </div>
  );
}

export default TemplateList;
