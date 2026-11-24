import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Calculator,
  CalendarDays,
  CheckSquare,
  Settings,
  Undo2
} from 'lucide-react';
import {
  AppState,
  DEFAULT_APP_STATE,
  HistoryEvent,
  KazaCounts,
  Madhhab,
  PRAYER_META,
  PrayerKey,
  Snapshot,
  createEmptyCounts
} from './types/kaza';
import {
  PersistenceStatus,
  createSnapshot,
  decodeBackupInput,
  loadAppState,
  requestPersistentStorage,
  saveAppState,
  sanitizeState
} from './lib/storage';
import { getActivePrayerKeys, getTodayKey } from './lib/calculator';
import { TrackerView } from './components/TrackerView';
import { CalculatorView } from './components/CalculatorView';
import { StreakView } from './components/StreakView';
import { GuideView } from './components/GuideView';
import {
  BeforeInstallPromptEvent,
  SettingsBackupView
} from './components/SettingsBackupView';

type TabKey = 'tracker' | 'calculator' | 'streak' | 'guide' | 'settings';

export function App() {
  const [state, setState] = useState<AppState>(DEFAULT_APP_STATE);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('tracker');
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>({
    verified: true,
    persistentGranted: false,
    lastSavedAt: null,
    engine: 'Yerel + IndexedDB'
  });
  const [undoSnapshot, setUndoSnapshot] = useState<{
    prevState: AppState;
    message: string;
  } | null>(null);
  const undoTimerRef = useRef<number | null>(null);
  const [installPromptEvent, setInstallPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [pendingBackup, setPendingBackup] = useState<Partial<AppState> | null>(null);

  useEffect(() => {
    const checkHash = () => {
      if (!window.location.hash.includes('yedek=')) return;
      const parsed = decodeBackupInput(window.location.hash);
      if (parsed) setPendingBackup(parsed);
      else clearBackupHash();
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const clearBackupHash = () => {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  };

  useEffect(() => {
    void loadAppState().then((loadedState) => {
      setState(loadedState);
      setLoaded(true);
    });
    void requestPersistentStorage().then((granted) => {
      setPersistenceStatus((prev) => ({
        ...prev,
        persistentGranted: granted,
        engine: granted ? 'Kalıcı Yerel + IndexedDB' : 'Yerel + IndexedDB'
      }));
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const res = saveAppState(state);
    setPersistenceStatus((prev) => ({
      ...prev,
      verified: res.verified,
      lastSavedAt: res.savedAt
    }));
  }, [state, loaded]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    document.documentElement.setAttribute('data-font-scale', state.fontScale);
  }, [state.theme, state.fontScale]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerUndoToast = (prevState: AppState, message: string) => {
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
    }
    setUndoSnapshot({ prevState, message });
    undoTimerRef.current = window.setTimeout(() => {
      setUndoSnapshot(null);
    }, 6500);
  };

  const handleUndo = () => {
    if (!undoSnapshot) return;
    setState(undoSnapshot.prevState);
    setUndoSnapshot(null);
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
    }
  };

  const pushHistory = (
    history: HistoryEvent[],
    type: HistoryEvent['type'],
    label: string,
    extra?: {
      delta?: number;
      dateKey?: string;
      prayerKey?: PrayerKey | 'oruc';
      beforeCount?: number;
      afterCount?: number;
    }
  ): HistoryEvent[] => {
    const entry: HistoryEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      dateKey: extra?.dateKey ?? getTodayKey(),
      prayerKey: extra?.prayerKey,
      beforeCount: extra?.beforeCount,
      afterCount: extra?.afterCount,
      type,
      label,
      delta: extra?.delta
    };
    return [entry, ...history].slice(0, 500);
  };

  const handleAdjustCount = (key: PrayerKey | 'oruc', delta: number) => {
    setState((prev) => {
      const current = prev.counts[key];
      const nextVal = Math.max(0, current + delta);
      const actualDelta = nextVal - current;
      if (actualDelta === 0) return prev;

      const labelName =
        key === 'oruc'
          ? 'Oruç Kazası'
          : PRAYER_META.find((p) => p.key === key)?.label || key;
      const todayKey = getTodayKey();
      const prevDay = prev.dailyLogs[todayKey] || { completedCount: 0, details: {} };

      const completedChange = actualDelta < 0 ? Math.abs(actualDelta) : 0;
      const nextDailyLogs =
        completedChange > 0
          ? {
              ...prev.dailyLogs,
              [todayKey]: {
                completedCount: prevDay.completedCount + completedChange,
                details: {
                  ...prevDay.details,
                  [key]: (prevDay.details[key] || 0) + completedChange
                }
              }
            }
          : prev.dailyLogs;

      const nextSnapshots = createSnapshot(prev, 'Günlük Otomatik Yedek', true);
      const actionLabel =
        actualDelta < 0 ? `${labelName} −1 kılındı` : `${labelName} +1 eklendi`;

      triggerUndoToast(prev, actionLabel);

      return {
        ...prev,
        counts: { ...prev.counts, [key]: nextVal },
        totalCompleted: prev.totalCompleted + completedChange,
        dailyLogs: nextDailyLogs,
        snapshots: nextSnapshots,
        history: pushHistory(
          prev.history,
          actualDelta < 0 ? 'decrement' : 'increment',
          actionLabel,
          {
            delta: actualDelta,
            dateKey: todayKey,
            prayerKey: key,
            beforeCount: current,
            afterCount: nextVal
          }
        )
      };
    });
  };

  const handleCompleteFullDay = () => {
    setState((prev) => {
      const activeKeys = getActivePrayerKeys(prev.madhhab);
      let completedNow = 0;
      const nextCounts = { ...prev.counts };
      const todayKey = getTodayKey();
      const prevDay = prev.dailyLogs[todayKey] || { completedCount: 0, details: {} };
      const nextDetails = { ...prevDay.details };

      for (const k of activeKeys) {
        if (nextCounts[k] > 0) {
          nextCounts[k] -= 1;
          completedNow += 1;
          nextDetails[k] = (nextDetails[k] || 0) + 1;
        }
      }

      if (completedNow === 0) return prev;

      const nextSnapshots = createSnapshot(prev, 'Günlük Otomatik Yedek', true);
      const label = `1 Günlük Tam Kaza (−${completedNow} vakit)`;
      triggerUndoToast(prev, label);

      return {
        ...prev,
        counts: nextCounts,
        totalCompleted: prev.totalCompleted + completedNow,
        dailyLogs: {
          ...prev.dailyLogs,
          [todayKey]: {
            completedCount: prevDay.completedCount + completedNow,
            details: nextDetails
          }
        },
        snapshots: nextSnapshots,
        history: pushHistory(prev.history, 'full_day', label, {
          delta: -completedNow,
          dateKey: todayKey
        })
      };
    });
  };

  const handleSetCountDirect = (key: PrayerKey | 'oruc', newVal: number) => {
    setState((prev) => {
      const current = prev.counts[key];
      const labelName =
        key === 'oruc'
          ? 'Oruç'
          : PRAYER_META.find((p) => p.key === key)?.label || key;
      const nextSnapshots = createSnapshot(prev, `${labelName} Düzenleme Öncesi`);
      triggerUndoToast(prev, `${labelName} sayısı ${newVal} olarak güncellendi`);

      return {
        ...prev,
        counts: { ...prev.counts, [key]: newVal },
        snapshots: nextSnapshots,
        history: pushHistory(
          prev.history,
          'manual_edit',
          `${labelName} elle ${newVal} yapıldı`,
          {
            delta: newVal - current,
            dateKey: getTodayKey(),
            prayerKey: key,
            beforeCount: current,
            afterCount: newVal
          }
        )
      };
    });
  };

  const handleApplyCalculator = (
    newCounts: KazaCounts,
    madhhab: Madhhab,
    reasonLabel: string
  ) => {
    setState((prev) => {
      const nextSnapshots = createSnapshot(prev, `${reasonLabel} Öncesi`);
      triggerUndoToast(prev, `${reasonLabel} uygulandı`);
      return {
        ...prev,
        counts: { ...newCounts },
        initialCounts: { ...newCounts },
        madhhab,
        snapshots: nextSnapshots,
        history: pushHistory(prev.history, 'calculate', reasonLabel, {
          dateKey: getTodayKey()
        })
      };
    });
    setActiveTab('tracker');
  };

  const handleRestoreSnapshot = (snap: Snapshot) => {
    setState((prev) => {
      const nextSnapshots = createSnapshot(prev, 'Geri Dönüş Öncesi Yedek');
      triggerUndoToast(prev, `"${snap.reason}" yedeğine dönüldü`);
      return {
        ...prev,
        counts: { ...snap.counts },
        initialCounts: { ...snap.initialCounts },
        totalCompleted: snap.totalCompleted,
        snapshots: nextSnapshots,
        history: pushHistory(prev.history, 'restore', `Yedek yüklendi: ${snap.reason}`, {
          dateKey: getTodayKey()
        })
      };
    });
    setActiveTab('tracker');
  };

  const handleImportState = (partial: Partial<AppState>, sourceLabel: string) => {
    setState((prev) => {
      const nextSnapshots = createSnapshot(prev, `${sourceLabel} Öncesi`);
      const merged = sanitizeState({
        ...prev,
        ...partial,
        snapshots: nextSnapshots,
        history: pushHistory(prev.history, 'restore', sourceLabel, {
          dateKey: getTodayKey()
        })
      });
      triggerUndoToast(prev, sourceLabel);
      return merged;
    });
  };

  const handleProtectedReset = () => {
    setState((prev) => {
      const nextSnapshots = createSnapshot(prev, 'Sıfırlama Öncesi Yedek');
      triggerUndoToast(prev, 'Tüm sayılar sıfırlandı (Geri alabilirsiniz)');
      return {
        ...prev,
        counts: createEmptyCounts(),
        initialCounts: createEmptyCounts(),
        totalCompleted: 0,
        dailyLogs: {},
        snapshots: nextSnapshots,
        history: pushHistory(prev.history, 'reset', 'Korumalı sıfırlama yapıldı', {
          dateKey: getTodayKey()
        })
      };
    });
  };

  const handleTriggerInstall = async () => {
    if (!installPromptEvent) return;
    await installPromptEvent.prompt();
    setInstallPromptEvent(null);
  };

  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true);

  const canInstallDirect = Boolean(installPromptEvent) && !isStandalone;

  const navItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'tracker', label: 'Takip', icon: <CheckSquare size={22} /> },
    { key: 'calculator', label: 'Hesapla', icon: <Calculator size={22} /> },
    { key: 'streak', label: 'Geçmiş', icon: <CalendarDays size={22} /> },
    { key: 'guide', label: 'Rehber', icon: <BookOpen size={22} /> },
    { key: 'settings', label: 'Ayarlar', icon: <Settings size={22} /> }
  ];

  return (
    <div className="app-shell">
      {/* Desktop Sidebar */}
      <aside className="desktop-sidebar" aria-label="Ana menü">
        <div>
          <div className="sidebar-brand">
            <div>
              <h1 className="sidebar-brand-title">Kaza Takip</h1>
              <p className="sidebar-brand-sub">Namaz & Oruç Takip</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`sidebar-nav-btn ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => setActiveTab(item.key)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div
          style={{
            padding: 12,
            borderRadius: 14,
            backgroundColor: 'var(--bg-input)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 1.5
          }}
        >
          {persistenceStatus.verified
            ? '✓ Kayıt Doğrulandı: Verileriniz sunucusuz (çevrimdışı) olarak cihazınızda güvenle saklanır.'
            : 'Verileriniz bu cihazda otomatik saklanır.'}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'tracker' && (
          <TrackerView
            state={state}
            persistenceStatus={persistenceStatus}
            canInstallDirect={canInstallDirect}
            onTriggerInstall={handleTriggerInstall}
            onAdjustCount={handleAdjustCount}
            onSetCountDirect={handleSetCountDirect}
            onCompleteFullDay={handleCompleteFullDay}
            onGoToCalculator={() => setActiveTab('calculator')}
            onOpenHistory={() => setActiveTab('streak')}
          />
        )}
        {activeTab === 'calculator' && (
          <CalculatorView state={state} onApplyCounts={handleApplyCalculator} />
        )}
        {activeTab === 'streak' && <StreakView state={state} />}
        {activeTab === 'guide' && <GuideView />}
        {activeTab === 'settings' && (
          <SettingsBackupView
            state={state}
            installPromptEvent={installPromptEvent}
            isStandalone={isStandalone}
            onTriggerInstall={handleTriggerInstall}
            onUpdateSettings={(patch) => setState((prev) => ({ ...prev, ...patch }))}
            onRestoreSnapshot={handleRestoreSnapshot}
            onImportState={handleImportState}
            onProtectedReset={handleProtectedReset}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav" aria-label="Alt menü">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`nav-btn ${activeTab === item.key ? 'active' : ''}`}
            onClick={() => setActiveTab(item.key)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Backup Link Restore Confirmation */}
      {pendingBackup && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3 className="section-title">Yedek Bulundu</h3>
            <p className="section-subtitle">
              Bu yedekte kalan{' '}
              <strong>
                {(
                  (pendingBackup.counts?.sabah ?? 0) +
                  (pendingBackup.counts?.ogle ?? 0) +
                  (pendingBackup.counts?.ikindi ?? 0) +
                  (pendingBackup.counts?.aksam ?? 0) +
                  (pendingBackup.counts?.yatsi ?? 0) +
                  (pendingBackup.madhhab === 'safii' ? 0 : pendingBackup.counts?.vitir ?? 0)
                ).toLocaleString('tr-TR')}
              </strong>{' '}
              vakit kaza ve{' '}
              <strong>{(pendingBackup.totalCompleted ?? 0).toLocaleString('tr-TR')}</strong>{' '}
              kılınan kaza kayıtlı. Şu anki bilgilerinizin yerine geri yüklensin mi?
              (Mevcut bilgileriniz Zaman Makinesi’ne yedeklenir.)
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="secondary-btn"
                style={{ flex: 1 }}
                onClick={() => {
                  setPendingBackup(null);
                  clearBackupHash();
                }}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className="primary-btn"
                style={{ flex: 1 }}
                onClick={() => {
                  handleImportState(pendingBackup, 'Yedek Linki ile Geri Yükleme');
                  setPendingBackup(null);
                  clearBackupHash();
                  setActiveTab('tracker');
                }}
              >
                Evet, Geri Yükle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Undo Toast */}
      {undoSnapshot && (
        <div className="undo-toast" role="status" aria-live="polite">
          <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
            {undoSnapshot.message}
          </span>
          <button type="button" className="undo-toast-btn" onClick={handleUndo}>
            <Undo2 size={16} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
            Geri Al
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
