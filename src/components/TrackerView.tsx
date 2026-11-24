import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Lock,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { AppState, PRAYER_META, PrayerKey } from '../types/kaza';
import {
  estimateFinishDate,
  formatDateKey,
  formatDaysAsYMD,
  getActivePrayerKeys,
  getTodayKey,
  getTotalPrayerCount
} from '../lib/calculator';
import { PersistenceStatus } from '../lib/storage';
import { AYET_AND_HADIS_LIST } from '../data/religiousContent';
import { MosqueSilhouette, PrayerIcon } from './PrayerIcons';

interface TrackerViewProps {
  state: AppState;
  persistenceStatus: PersistenceStatus;
  canInstallDirect: boolean;
  onTriggerInstall: () => void;
  onAdjustCount: (key: PrayerKey | 'oruc', delta: number) => void;
  onSetCountDirect: (key: PrayerKey | 'oruc', newVal: number) => void;
  onCompleteFullDay: () => void;
  onGoToCalculator: () => void;
  onOpenHistory: () => void;
}

export const TrackerView: React.FC<TrackerViewProps> = ({
  state,
  persistenceStatus,
  canInstallDirect,
  onTriggerInstall,
  onAdjustCount,
  onSetCountDirect,
  onCompleteFullDay,
  onGoToCalculator,
  onOpenHistory
}) => {
  const [editingKey, setEditingKey] = useState<PrayerKey | 'oruc' | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [wisdomIdx, setWisdomIdx] = useState<number>(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    return dayOfYear % AYET_AND_HADIS_LIST.length;
  });

  const activeKeys = getActivePrayerKeys(state.madhhab);
  const totalRemaining = getTotalPrayerCount(state.counts, state.madhhab);
  const totalInitial = getTotalPrayerCount(state.initialCounts, state.madhhab);
  const denom = Math.max(totalInitial, totalRemaining + state.totalCompleted, 1);
  const progressPct =
    totalRemaining === 0 && totalInitial === 0
      ? 0
      : Math.min(100, Math.round(((denom - totalRemaining) / denom) * 100));

  const avgDaysRemaining = Math.round(totalRemaining / activeKeys.length);
  const todayKey = getTodayKey();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterdayDate);

  const todayDone = state.dailyLogs[todayKey]?.completedCount || 0;
  const yesterdayDone = state.dailyLogs[yesterdayKey]?.completedCount || 0;
  const finishDateStr = estimateFinishDate(totalRemaining, state.dailyGoal);

  const wisdom = AYET_AND_HADIS_LIST[wisdomIdx];

  const openDirectEdit = (key: PrayerKey | 'oruc') => {
    if (state.lockAccidentalEdits) return;
    setEditingKey(key);
    setEditValue(String(state.counts[key]));
  };

  const saveDirectEdit = () => {
    if (!editingKey) return;
    const parsed = Math.max(0, Math.floor(Number(editValue) || 0));
    onSetCountDirect(editingKey, parsed);
    setEditingKey(null);
  };

  return (
    <div className="stack-gap">
      {canInstallDirect && (
        <button
          type="button"
          className="primary-btn"
          style={{ minHeight: 50 }}
          onClick={onTriggerInstall}
        >
          <Download size={20} />
          <span>Uygulamayı Telefona Kur (Ana Ekrana Ekle)</span>
        </button>
      )}

      {/* Hero Card matching Kaza Tracker's silhouette + total */}
      <div className="card hero-card">
        <div className="hero-mosque-bg">
          <MosqueSilhouette />
        </div>
        <div className="hero-content">
          <div className="hero-top-row">
            <p className="hero-label">Toplam Kalan Kaza</p>
            <span
              className="verified-pill"
              title={
                persistenceStatus.lastSavedAt
                  ? `Son doğrulama: ${new Date(persistenceStatus.lastSavedAt).toLocaleTimeString('tr-TR')}`
                  : 'Cihazda otomatik saklanır'
              }
            >
              <ShieldCheck size={14} />
              <span>{persistenceStatus.verified ? 'Kayıt Doğrulandı' : 'Yerel Kayıt'}</span>
            </span>
          </div>

          <p className="hero-total tabular-nums">{totalRemaining.toLocaleString('tr-TR')}</p>
          <p className="hero-ymd">
            {totalRemaining > 0
              ? `${formatDaysAsYMD(avgDaysRemaining)} • ${state.madhhab === 'hanefi' ? 'Vitir dahil' : 'Şâfiî'}`
              : 'Henüz borç girilmedi veya tüm borçlar tamamlandı'}
          </p>

          <div className="progress-track" aria-label="Tamamlanma oranı">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="progress-meta">
            <span>İlerleme: %{progressPct}</span>
            <span>Kılınan: {state.totalCompleted.toLocaleString('tr-TR')}</span>
          </div>
        </div>
      </div>

      {/* Empty state helper for first-time setup */}
      {totalRemaining === 0 && totalInitial === 0 && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--fs-base)', fontWeight: 700, margin: '0 0 12px' }}>
            Başlamak için ergenlik tarihiyle kaza borcunuzu hesaplayabilir veya başka
            uygulamadaki mevcut sayılarınızı girebilirsiniz.
          </p>
          <button type="button" className="primary-btn" onClick={onGoToCalculator}>
            Kaza Borcunu Hesapla / Aktar
          </button>
        </div>
      )}

      {/* Lock banner if accidental edit protection is active */}
      {state.lockAccidentalEdits && (
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderColor: 'var(--gold)',
            padding: '10px 14px'
          }}
        >
          <Lock size={20} style={{ color: 'var(--gold)', flexShrink: 0 }} />
          <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700 }}>
            Yanlış Dokunma Kilidi Açık: Sadece yeşil (−) düşme tuşları çalışır.
          </span>
        </div>
      )}

      {/* Quick 1-Day Complete Button */}
      <button
        type="button"
        className="full-day-btn"
        disabled={totalRemaining === 0}
        onClick={onCompleteFullDay}
      >
        <CheckCircle2 size={22} />
        <span>1 Günlük Tam Kaza Kıldım (−1 Gün)</span>
      </button>

      {/* Prayer Rows */}
      <div className="prayer-list">
        {PRAYER_META.filter((p) => activeKeys.includes(p.key)).map((prayer) => {
          const count = state.counts[prayer.key];
          return (
            <div key={prayer.key} className="prayer-row">
              <div className="prayer-row-left">
                <div className="prayer-icon-box">
                  <PrayerIcon type={prayer.key} size={24} />
                </div>
                <div className="prayer-text-col">
                  <p className="prayer-name">{prayer.label}</p>
                  <p className="prayer-rekat">{prayer.rekat}</p>
                </div>
              </div>

              <div className="prayer-controls">
                <button
                  type="button"
                  className="counter-btn minus"
                  aria-label={`${prayer.label} 1 kaza düş`}
                  disabled={count <= 0}
                  onClick={() => onAdjustCount(prayer.key, -1)}
                >
                  −
                </button>

                <button
                  type="button"
                  className="prayer-count-btn tabular-nums"
                  title={
                    state.lockAccidentalEdits
                      ? 'Kilit açık'
                      : 'Sayıyı doğrudan düzenlemek için dokunun'
                  }
                  onClick={() => openDirectEdit(prayer.key)}
                >
                  {count.toLocaleString('tr-TR')}
                </button>

                {!state.lockAccidentalEdits && (
                  <button
                    type="button"
                    className="counter-btn plus"
                    aria-label={`${prayer.label} 1 kaza ekle`}
                    onClick={() => onAdjustCount(prayer.key, 1)}
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Optional Oruç Row */}
        {state.includeOruc && (
          <div className="prayer-row" style={{ borderColor: 'var(--gold-bg)' }}>
            <div className="prayer-row-left">
              <div className="prayer-icon-box" style={{ color: 'var(--gold)' }}>
                <PrayerIcon type="oruc" size={24} />
              </div>
              <div className="prayer-text-col">
                <p className="prayer-name">Oruç Kazası</p>
                <p className="prayer-rekat">Gün / Ramazan</p>
              </div>
            </div>

            <div className="prayer-controls">
              <button
                type="button"
                className="counter-btn minus"
                aria-label="Oruç 1 gün düş"
                disabled={state.counts.oruc <= 0}
                onClick={() => onAdjustCount('oruc', -1)}
              >
                −
              </button>

              <button
                type="button"
                className="prayer-count-btn tabular-nums"
                onClick={() => openDirectEdit('oruc')}
              >
                {state.counts.oruc.toLocaleString('tr-TR')}
              </button>

              {!state.lockAccidentalEdits && (
                <button
                  type="button"
                  className="counter-btn plus"
                  aria-label="Oruç 1 gün ekle"
                  onClick={() => onAdjustCount('oruc', 1)}
                >
                  +
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Recent History Strip */}
      <button type="button" className="history-strip-btn" onClick={onOpenHistory}>
        <div className="history-strip-left">
          <span className="history-strip-chip">
            Bugün: <strong>{todayDone}</strong> vakit
          </span>
          <span className="history-strip-chip">
            Dün: <strong>{yesterdayDone}</strong> vakit
          </span>
        </div>
        <span className="history-strip-cta">
          <span>Geçmişi Gör</span>
          <ArrowRight size={18} />
        </span>
      </button>

      {/* Daily Goal & Estimated Completion */}
      <div className="card">
        <div className="goal-grid">
          <div className="stat-box">
            <p className="stat-label">Günlük Hedef</p>
            <p className="stat-value tabular-nums" style={{ color: 'var(--emerald)' }}>
              {todayDone} / {state.dailyGoal} vakit
            </p>
          </div>
          <div className="stat-box">
            <p className="stat-label">Tahmini Bitiş</p>
            <p className="stat-value" style={{ color: 'var(--gold)' }}>
              {finishDateStr}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Ayet / Hadis Card */}
      <div className="card wisdom-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: '8px'
          }}
        >
          <span className="wisdom-badge">
            {wisdom.kind === 'ayet' ? 'Günün Ayeti' : 'Sahih Hadis-i Şerif'}
          </span>
          <button
            type="button"
            className="secondary-btn"
            style={{ minHeight: '40px', padding: '6px 14px' }}
            onClick={() => setWisdomIdx((i) => (i + 1) % AYET_AND_HADIS_LIST.length)}
          >
            <RefreshCw size={16} />
            <span>Değiştir</span>
          </button>
        </div>
        <p className="wisdom-text">“{wisdom.text}”</p>
        <p className="wisdom-source">{wisdom.source}</p>
      </div>

      {/* Direct Count Edit Modal */}
      {editingKey && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3 className="section-title" style={{ marginBottom: '6px' }}>
              Sayıyı Düzenle
            </h3>
            <p className="section-subtitle">
              {editingKey === 'oruc'
                ? 'Oruç Kazası'
                : PRAYER_META.find((p) => p.key === editingKey)?.label}{' '}
              için yeni kaza sayısını girin. (Önceki değer otomatik yedeklenir.)
            </p>
            <div className="field-group">
              <input
                type="number"
                min={0}
                className="input-control tabular-nums"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="secondary-btn"
                style={{ flex: 1 }}
                onClick={() => setEditingKey(null)}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className="primary-btn"
                style={{ flex: 1 }}
                onClick={saveDirectEdit}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
