import { useEffect, useMemo, useState } from 'react';
import { PlanEntry, TemplateWithExercises } from '../types';
import styles from '../styles/PlanWorkouts.module.css';

interface Props {
  templates: TemplateWithExercises[];
  plans: PlanEntry[];
  onSavePlan: (plan: Omit<PlanEntry, 'id'> & { id?: string }) => void | Promise<void>;
  onDeletePlan: (id: string) => void | Promise<void>;
  onBack: () => void;
}

function PlanWorkouts({ templates, plans, onSavePlan, onDeletePlan, onBack }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(templates[0]?.id ?? '');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    if (!selectedTemplate && templates.length) {
      setSelectedTemplate(templates[0].id);
    }
  }, [selectedTemplate, templates]);

  const templatesById = useMemo(
    () => new Map(templates.map((t) => [t.id, t])),
    [templates]
  );

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.date.localeCompare(b.date)),
    [plans]
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!date || !selectedTemplate) return;
    await onSavePlan({ date, templateId: selectedTemplate });
    setDate('');
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <button onClick={onBack} className={styles.back}>
          ← Home
        </button>
        <h2>Plan Workouts</h2>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>Day</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>

        <label className={styles.field}>
          <span>Template</span>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            required
          >
            <option value="" disabled>
              Choose template
            </option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" className={styles.primary}>
          Add to calendar
        </button>
      </form>

      <div className={styles.planList}>
        {sortedPlans.length === 0 && <p className={styles.muted}>No plans yet. Schedule your week.</p>}
        {sortedPlans.map((plan) => {
          const template = templatesById.get(plan.templateId);
          return (
            <div key={plan.id} className={styles.planRow}>
              <div>
                <p className={styles.planDate}>{plan.date}</p>
                <p className={styles.planName}>{template?.name ?? 'Template removed'}</p>
              </div>
              <button className={styles.delete} onClick={() => onDeletePlan(plan.id)}>
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PlanWorkouts;
