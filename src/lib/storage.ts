import {
  AppState,
  DEFAULT_APP_STATE,
  DailyLogs,
  KazaCounts,
  Madhhab,
  Snapshot,
  createEmptyCounts
} from '../types/kaza';

const STORAGE_KEY = 'kaza_takip_state_v1';
const IDB_NAME = 'KazaTakipDB';
const IDB_STORE = 'state';
const IDB_KEY = 'current';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function writeToIDB(state: AppState): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(state, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Silent fallback; localStorage remains primary
  }
}

async function readFromIDB(): Promise<AppState | null> {
  try {
    const db = await openDB();
    const result = await new Promise<AppState | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve((req.result as AppState) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return result;
  } catch {
    return null;
  }
}

function sanitizeCounts(raw: Partial<KazaCounts> | undefined): KazaCounts {
  const base = createEmptyCounts();
  if (!raw) return base;
  return {
    sabah: Math.max(0, Math.floor(Number(raw.sabah) || 0)),
    ogle: Math.max(0, Math.floor(Number(raw.ogle) || 0)),
    ikindi: Math.max(0, Math.floor(Number(raw.ikindi) || 0)),
    aksam: Math.max(0, Math.floor(Number(raw.aksam) || 0)),
    yatsi: Math.max(0, Math.floor(Number(raw.yatsi) || 0)),
    vitir: Math.max(0, Math.floor(Number(raw.vitir) || 0)),
    oruc: Math.max(0, Math.floor(Number(raw.oruc) || 0))
  };
}

export interface PersistenceStatus {
  verified: boolean;
  persistentGranted: boolean;
  lastSavedAt: string | null;
  engine: string;
}

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      return await navigator.storage.persist();
    }
  } catch {
    // Ignore if unsupported (e.g. file:// origin)
  }
  return false;
}

export function sanitizeState(raw: Partial<AppState> | null | undefined): AppState {
  if (!raw) return { ...DEFAULT_APP_STATE };
  return {
    counts: sanitizeCounts(raw.counts),
    initialCounts: sanitizeCounts(raw.initialCounts),
    totalCompleted: Math.max(0, Math.floor(Number(raw.totalCompleted) || 0)),
    dailyGoal: Math.max(1, Math.min(60, Math.floor(Number(raw.dailyGoal) || 6))),
    madhhab: raw.madhhab === 'safii' ? 'safii' : 'hanefi',
    includeOruc: typeof raw.includeOruc === 'boolean' ? raw.includeOruc : true,
    lockAccidentalEdits: Boolean(raw.lockAccidentalEdits),
    theme: raw.theme === 'light' ? 'light' : 'dark',
    fontScale:
      raw.fontScale === 'normal' || raw.fontScale === 'xlarge' ? raw.fontScale : 'large',
    dailyLogs: raw.dailyLogs && typeof raw.dailyLogs === 'object' ? raw.dailyLogs : {},
    history: Array.isArray(raw.history) ? raw.history.slice(0, 500) : [],
    snapshots: Array.isArray(raw.snapshots) ? raw.snapshots.slice(0, 30) : []
  };
}

declare global {
  interface Window {
    __KAZA_EMBEDDED_STATE__?: Partial<AppState>;
  }
}

function isStateEmpty(s: AppState): boolean {
  const c = s.counts;
  const total =
    c.sabah + c.ogle + c.ikindi + c.aksam + c.yatsi + c.vitir + c.oruc;
  return total === 0 && s.totalCompleted === 0 && s.history.length === 0;
}

export async function loadAppState(): Promise<AppState> {
  let existing: AppState | null = null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      existing = sanitizeState(JSON.parse(raw) as Partial<AppState>);
    }
  } catch {
    // Fallback to IndexedDB
  }

  if (!existing) {
    const idbState = await readFromIDB();
    if (idbState) {
      existing = sanitizeState(idbState);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      } catch {
        // Ignore quota errors
      }
    }
  }

  const embeddedRaw =
    typeof window !== 'undefined' ? window.__KAZA_EMBEDDED_STATE__ : undefined;
  if (embeddedRaw) {
    const embedded = sanitizeState(embeddedRaw);
    if (!existing || (isStateEmpty(existing) && !isStateEmpty(embedded))) {
      saveAppState(embedded);
      return embedded;
    }
  }

  return existing ?? { ...DEFAULT_APP_STATE };
}

export function saveAppState(state: AppState): { verified: boolean; savedAt: string } {
  const savedAt = new Date().toISOString();
  let verified = false;
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
    const readBack = localStorage.getItem(STORAGE_KEY);
    verified = readBack === serialized;
  } catch {
    verified = false;
  }
  void writeToIDB(state);
  return { verified, savedAt };
}

export function createSnapshot(
  state: AppState,
  reason: string,
  dedupeDaily = false
): Snapshot[] {
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);

  if (dedupeDaily) {
    const alreadyToday = state.snapshots.some(
      (s) => s.reason === reason && s.timestamp.slice(0, 10) === todayKey
    );
    if (alreadyToday) {
      return state.snapshots;
    }
  }

  const snap: Snapshot = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: now.toISOString(),
    reason,
    counts: { ...state.counts },
    initialCounts: { ...state.initialCounts },
    totalCompleted: state.totalCompleted
  };

  return [snap, ...state.snapshots].slice(0, 30);
}

interface CompactPayload {
  v: 1;
  c: KazaCounts;
  i: KazaCounts;
  tc: number;
  m: Madhhab;
  dg: number;
  io: boolean;
  dl: DailyLogs;
}

function toBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

function fromBase64Utf8(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function encodeRecoveryCode(state: AppState): string {
  // Keep last 45 days of logs so code stays compact for WhatsApp/SMS
  const logKeys = Object.keys(state.dailyLogs).sort().slice(-45);
  const recentLogs: DailyLogs = {};
  for (const k of logKeys) {
    recentLogs[k] = state.dailyLogs[k];
  }

  const payload: CompactPayload = {
    v: 1,
    c: state.counts,
    i: state.initialCounts,
    tc: state.totalCompleted,
    m: state.madhhab,
    dg: state.dailyGoal,
    io: state.includeOruc,
    dl: recentLogs
  };

  return `KAZA1:${toBase64Utf8(JSON.stringify(payload))}`;
}

export function decodeRecoveryCode(codeInput: string): Partial<AppState> | null {
  try {
    const match = codeInput.trim().match(/KAZA1:([A-Za-z0-9+/=]+)/);
    if (!match) return null;
    const json = fromBase64Utf8(match[1]);
    const parsed = JSON.parse(json) as Partial<CompactPayload>;
    if (parsed.v !== 1 || !parsed.c) return null;

    return {
      counts: sanitizeCounts(parsed.c),
      initialCounts: sanitizeCounts(parsed.i ?? parsed.c),
      totalCompleted: Math.max(0, Math.floor(Number(parsed.tc) || 0)),
      madhhab: parsed.m === 'safii' ? 'safii' : 'hanefi',
      dailyGoal: Math.max(1, Math.min(60, Math.floor(Number(parsed.dg) || 6))),
      includeOruc: typeof parsed.io === 'boolean' ? parsed.io : true,
      dailyLogs: parsed.dl && typeof parsed.dl === 'object' ? parsed.dl : {}
    };
  } catch {
    return null;
  }
}

export function formatWhatsAppBackup(state: AppState): string {
  const dateStr = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const totalNamaz =
    state.counts.sabah +
    state.counts.ogle +
    state.counts.ikindi +
    state.counts.aksam +
    state.counts.yatsi +
    (state.madhhab === 'hanefi' ? state.counts.vitir : 0);

  const lines = [
    `🕌 *Kaza Namazı Takip Yedeği* (${dateStr})`,
    `• Sabah: ${state.counts.sabah}`,
    `• Öğle: ${state.counts.ogle}`,
    `• İkindi: ${state.counts.ikindi}`,
    `• Akşam: ${state.counts.aksam}`,
    `• Yatsı: ${state.counts.yatsi}`
  ];

  if (state.madhhab === 'hanefi') {
    lines.push(`• Vitir: ${state.counts.vitir}`);
  }
  if (state.includeOruc) {
    lines.push(`• Oruç Borcu: ${state.counts.oruc} gün`);
  }

  lines.push(
    ``,
    `📊 Toplam Kalan Namaz: *${totalNamaz}*`,
    `✅ Şimdiye Kadar Kılınan: *${state.totalCompleted}*`,
    ``,
    `🔑 *Kurtarma Kodu (Uygulamaya yapıştırarak geri yükleyebilirsiniz):*`,
    encodeRecoveryCode(state)
  );

  return lines.join('\n');
}
