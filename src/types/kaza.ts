export type PrayerKey = 'sabah' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi' | 'vitir';

export type Madhhab = 'hanefi' | 'safii';

export type FontScale = 'normal' | 'large' | 'xlarge';

export type ThemeMode = 'dark' | 'light';

export interface KazaCounts {
  sabah: number;
  ogle: number;
  ikindi: number;
  aksam: number;
  yatsi: number;
  vitir: number;
  oruc: number;
}

export interface DailyLogEntry {
  completedCount: number;
  details: Partial<Record<PrayerKey | 'oruc', number>>;
}

export type DailyLogs = Record<string, DailyLogEntry>;

export interface HistoryEvent {
  id: string;
  timestamp: string;
  dateKey?: string;
  prayerKey?: PrayerKey | 'oruc';
  beforeCount?: number;
  afterCount?: number;
  type:
    | 'decrement'
    | 'increment'
    | 'full_day'
    | 'calculate'
    | 'manual_edit'
    | 'restore'
    | 'reset';
  label: string;
  delta?: number;
}

export interface Snapshot {
  id: string;
  timestamp: string;
  reason: string;
  counts: KazaCounts;
  initialCounts: KazaCounts;
  totalCompleted: number;
}

export interface AppState {
  counts: KazaCounts;
  initialCounts: KazaCounts;
  totalCompleted: number;
  dailyGoal: number;
  madhhab: Madhhab;
  includeOruc: boolean;
  lockAccidentalEdits: boolean;
  theme: ThemeMode;
  fontScale: FontScale;
  dailyLogs: DailyLogs;
  history: HistoryEvent[];
  snapshots: Snapshot[];
}

export const PRAYER_META: {
  key: PrayerKey;
  label: string;
  rekat: string;
  hukm: string;
}[] = [
  { key: 'sabah', label: 'Sabah', rekat: '2 Rekat Farz', hukm: 'Farz' },
  { key: 'ogle', label: 'Öğle', rekat: '4 Rekat Farz', hukm: 'Farz' },
  { key: 'ikindi', label: 'İkindi', rekat: '4 Rekat Farz', hukm: 'Farz' },
  { key: 'aksam', label: 'Akşam', rekat: '3 Rekat Farz', hukm: 'Farz' },
  { key: 'yatsi', label: 'Yatsı', rekat: '4 Rekat Farz', hukm: 'Farz' },
  { key: 'vitir', label: 'Vitir', rekat: '3 Rekat Vacip', hukm: 'Vacip (Hanefî)' }
];

export function createEmptyCounts(): KazaCounts {
  return {
    sabah: 0,
    ogle: 0,
    ikindi: 0,
    aksam: 0,
    yatsi: 0,
    vitir: 0,
    oruc: 0
  };
}

export const DEFAULT_APP_STATE: AppState = {
  counts: createEmptyCounts(),
  initialCounts: createEmptyCounts(),
  totalCompleted: 0,
  dailyGoal: 6,
  madhhab: 'hanefi',
  includeOruc: true,
  lockAccidentalEdits: false,
  theme: 'dark',
  fontScale: 'large',
  dailyLogs: {},
  history: [],
  snapshots: []
};
