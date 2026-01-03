export type ID = string;

export interface Exercise {
  id: ID;
  name: string;
}

export interface WorkoutTemplate {
  id: ID;
  name: string;
  exerciseIds: ID[];
}

export interface WorkoutSession {
  id: ID;
  date: string; // ISO string
  templateId: ID;
}

export interface SetEntry {
  id: ID;
  sessionId: ID;
  exerciseId: ID;
  weight: number;
  reps: number;
  order: number;
}

export interface TemplateWithExercises extends WorkoutTemplate {
  exercises: Exercise[];
}

export interface SessionWithSets extends WorkoutSession {
  sets: SetEntry[];
}

export interface ExerciseHistoryEntry {
  sessionId: ID;
  date: string;
  bestSet?: Pick<SetEntry, 'weight' | 'reps'>;
}

export interface TemplateDraft {
  id?: ID;
  name: string;
  exercises: Array<Pick<Exercise, 'id' | 'name'>>;
}
