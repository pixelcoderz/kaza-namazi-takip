import { DailyLogs, KazaCounts, Madhhab, PrayerKey } from '../types/kaza';

export interface DateCalculatorInput {
  birthDate: string; // YYYY-MM-DD
  pubertyAge: number; // default 15
  prayerStartDate: string; // YYYY-MM-DD
  gender: 'erkek' | 'kadin';
  monthlyExcusedDays: number; // default 7 for women
  nifasDays: number; // optional postpartum days
  calendarType: 'miladi' | 'hicri';
  madhhab: Madhhab;
  orucDays?: number;
}

export interface YearCalculatorInput {
  years: number;
  months: number;
  calendarType: 'miladi' | 'hicri';
  madhhab: Madhhab;
  orucDays?: number;
}

export function getActivePrayerKeys(madhhab: Madhhab): PrayerKey[] {
  return madhhab === 'hanefi'
    ? ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi', 'vitir']
    : ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'];
}

export function getTotalPrayerCount(counts: KazaCounts, madhhab: Madhhab): number {
  const keys = getActivePrayerKeys(madhhab);
  return keys.reduce((sum, key) => sum + (counts[key] || 0), 0);
}

export function calculateFromDates(input: DateCalculatorInput): {
  counts: KazaCounts;
  effectiveDays: number;
  pubertyDateStr: string;
} {
  const birth = new Date(`${input.birthDate}T00:00:00`);
  const start = new Date(`${input.prayerStartDate}T00:00:00`);

  if (Number.isNaN(birth.getTime()) || Number.isNaN(start.getTime())) {
    return {
      counts: { sabah: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0, vitir: 0, oruc: 0 },
      effectiveDays: 0,
      pubertyDateStr: ''
    };
  }

  // Fıkıh kaynaklarına göre 15 kamerî yıl (~14.55 miladi yıl) varsayılan sınır
  const pubertyDate = new Date(birth.getTime());
  if (input.calendarType === 'hicri') {
    const daysToAdd = Math.round(input.pubertyAge * 354.37);
    pubertyDate.setDate(pubertyDate.getDate() + daysToAdd);
  } else {
    pubertyDate.setFullYear(pubertyDate.getFullYear() + input.pubertyAge);
  }

  const diffMs = start.getTime() - pubertyDate.getTime();
  let rawDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  if (input.gender === 'kadin' && rawDays > 0) {
    const approxMonths = rawDays / 29.53;
    const excusedTotal = Math.round(approxMonths * Math.max(0, input.monthlyExcusedDays)) +
      Math.max(0, input.nifasDays || 0);
    rawDays = Math.max(0, rawDays - excusedTotal);
  }

  const effectiveDays = Math.max(0, rawDays);
  const vitirCount = input.madhhab === 'hanefi' ? effectiveDays : 0;

  return {
    counts: {
      sabah: effectiveDays,
      ogle: effectiveDays,
      ikindi: effectiveDays,
      aksam: effectiveDays,
      yatsi: effectiveDays,
      vitir: vitirCount,
      oruc: Math.max(0, Math.floor(input.orucDays || 0))
    },
    effectiveDays,
    pubertyDateStr: pubertyDate.toISOString().slice(0, 10)
  };
}

export function calculateFromYears(input: YearCalculatorInput): {
  counts: KazaCounts;
  effectiveDays: number;
} {
  const daysPerYear = input.calendarType === 'hicri' ? 354.37 : 365.25;
  const totalYears = Math.max(0, input.years) + Math.max(0, input.months) / 12;
  const effectiveDays = Math.max(0, Math.round(totalYears * daysPerYear));
  const vitirCount = input.madhhab === 'hanefi' ? effectiveDays : 0;

  return {
    counts: {
      sabah: effectiveDays,
      ogle: effectiveDays,
      ikindi: effectiveDays,
      aksam: effectiveDays,
      yatsi: effectiveDays,
      vitir: vitirCount,
      oruc: Math.max(0, Math.floor(input.orucDays || 0))
    },
    effectiveDays
  };
}

export function formatDaysAsYMD(days: number): string {
  if (days <= 0) return 'Borç kalmadı';
  const years = Math.floor(days / 365);
  const remAfterYears = days % 365;
  const months = Math.floor(remAfterYears / 30);
  const remDays = remAfterYears % 30;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} Yıl`);
  if (months > 0) parts.push(`${months} Ay`);
  if (remDays > 0 || parts.length === 0) parts.push(`${remDays} Gün`);
  return parts.join(' ');
}

export function estimateFinishDate(remainingPrayers: number, dailyGoal: number): string {
  if (remainingPrayers <= 0) return 'Tamamlandı';
  const goal = Math.max(1, dailyGoal);
  const daysNeeded = Math.ceil(remainingPrayers / goal);
  const target = new Date();
  target.setDate(target.getDate() + daysNeeded);

  return target.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function getTodayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computeStreaks(dailyLogs: DailyLogs): {
  currentStreak: number;
  bestStreak: number;
} {
  const activeDates = Object.keys(dailyLogs)
    .filter((k) => (dailyLogs[k]?.completedCount || 0) > 0)
    .sort();

  if (activeDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Compute best streak
  let best = 1;
  let run = 1;
  for (let i = 1; i < activeDates.length; i++) {
    const prev = new Date(`${activeDates[i - 1]}T00:00:00`);
    const curr = new Date(`${activeDates[i]}T00:00:00`);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      run++;
      if (run > best) best = run;
    } else if (diffDays > 1) {
      run = 1;
    }
  }

  // Compute current streak ending today or yesterday
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = formatDateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  let current = 0;
  let cursor: Date | null = null;
  if ((dailyLogs[todayKey]?.completedCount || 0) > 0) {
    cursor = new Date(today);
  } else if ((dailyLogs[yesterdayKey]?.completedCount || 0) > 0) {
    cursor = new Date(yesterday);
  }

  while (cursor) {
    const k = formatDateKey(cursor);
    if ((dailyLogs[k]?.completedCount || 0) > 0) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return { currentStreak: current, bestStreak: best };
}
