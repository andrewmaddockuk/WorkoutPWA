import styles from '../styles/HomeScreen.module.css';

interface Props {
  onNavigate: (screen: 'templates' | 'planner' | 'workout' | 'stats') => void;
}

const actions = [
  {
    key: 'templates' as const,
    title: 'Create Workouts',
    description: 'Build and edit templates so you can log faster later.'
  },
  {
    key: 'planner' as const,
    title: 'Plan Workouts',
    description: 'Schedule upcoming sessions on the days you expect to train.'
  },
  {
    key: 'workout' as const,
    title: 'Do Workouts',
    description: 'Pick a template or start fresh and capture sets, reps, and weight.'
  },
  {
    key: 'stats' as const,
    title: 'Stats',
    description: 'Review best sets over time for each exercise.'
  }
];

function HomeScreen({ onNavigate }: Props) {
  return (
    <div className={styles.grid}>
      {actions.map((action) => (
        <button key={action.key} className={styles.card} onClick={() => onNavigate(action.key)}>
          <div className={styles.cardText}>
            <h2>{action.title}</h2>
            <p>{action.description}</p>
          </div>
          <span aria-hidden className={styles.chevron}>
            →
          </span>
        </button>
      ))}
    </div>
  );
}

export default HomeScreen;
