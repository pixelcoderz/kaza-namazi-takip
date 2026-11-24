import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Trophy
} from 'lucide-react';
import { AppState, HistoryEvent, PRAYER_META } from '../types/kaza';
import { computeStreaks, formatDateKey, getTodayKey } from '../lib/calculator';

interface StreakViewProps {
  state: AppState;
}

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function formatDayHeading(dateKey: string, todayKey: string, yesterdayKey: string): string {
  if (dateKey === todayKey) return 'Bugün';
  if (dateKey === yesterdayKey) return 'Dün';
  const dt = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return dateKey;
  return dt.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long'
  });
}

function getEventBadge(ev: HistoryEvent): { text: string; tone: 'emerald' | 'coral' | 'gold' } {
  if (ev.type === 'decrement') return { text: '−1 Kılındı', tone: 'emerald' };
  if (ev.type === 'full_day') {
    return {
      text: `${ev.delta ?? -6} Vakit`,
      tone: 'emerald'
    };
  }
  if (ev.type === 'increment') return { text: '+1 Eklendi', tone: 'coral' };
  if (ev.type === 'reset') return { text: 'Sıfırlama', tone: 'coral' };
  return { text: 'Düzenleme', tone: 'gold' };
}

export const StreakView: React.FC<StreakViewProps> = ({ state }) => {
  const [subTab, setSubTab] = useState<'history' | 'calendar'>('history');
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const todayKey = getTodayKey();
  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatDateKey(d);
  }, []);

  const { currentStreak, bestStreak } = useMemo(
    () => computeStreaks(state.dailyLogs),
    [state.dailyLogs]
  );

  // Group history events by dateKey (newest day first)
  const groupedDays = useMemo(() => {
    const map = new Map<string, HistoryEvent[]>();
    for (const ev of state.history) {
      const dk = ev.dateKey || ev.timestamp.slice(0, 10);
      const list = map.get(dk);
      if (list) list.push(ev);
      else map.set(dk, [ev]);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [state.history]);

  const monthTitle = cursor.toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric'
  });

  const calendarCells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;

    const cells: { day: number | null; key: string }[] = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ day: null, key: `empty-${i}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      cells.push({ day: d, key: formatDateKey(dt) });
    }
    return cells;
  }, [cursor]);

  const changeMonth = (delta: number) => {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  return (
    <div className="stack-gap">
      {/* 2-Pill Switch */}
      <div className="card" style={{ padding: '12px' }}>
        <div className="pill-row">
          <button
            type="button"
            className={`pill-btn ${subTab === 'history' ? 'active' : ''}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
            onClick={() => setSubTab('history')}
          >
            <Clock size={18} />
            <span>Son Değişiklikler</span>
          </button>
          <button
            type="button"
            className={`pill-btn ${subTab === 'calendar' ? 'active' : ''}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
            onClick={() => setSubTab('calendar')}
          >
            <CalendarDays size={18} />
            <span>Takvim & Seri</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Rich Day-by-Day & Item-by-Item History */}
      {subTab === 'history' && (
        <div className="stack-gap">
          <div className="card">
            <h2 className="section-title">Yapılan Değişiklikler</h2>
            <p className="section-subtitle" style={{ marginBottom: 0 }}>
              Hangi gün kaç kaza düşüldüğü, tek tek yapılan tüm işlemler ve saatleri burada
              kalıcı olarak saklanır.
            </p>
          </div>

          {groupedDays.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <p className="section-subtitle" style={{ marginBottom: 0 }}>
                Henüz bir işlem kaydı yok. Takip ekranından bir vakit düştüğünüzde gün gün
                burada görünecektir.
              </p>
            </div>
          ) : (
            groupedDays.map(([dateKey, events]) => {
              const dayLog = state.dailyLogs[dateKey];
              const dayCompleted = dayLog?.completedCount || 0;
              const detailEntries = dayLog?.details
                ? Object.entries(dayLog.details).filter(([, cnt]) => (cnt || 0) > 0)
                : [];

              return (
                <div key={dateKey} className="card">
                  {/* Day Header */}
                  <div className="history-day-header">
                    <h3 className="history-day-title">
                      {formatDayHeading(dateKey, todayKey, yesterdayKey)}
                    </h3>
                    {dayCompleted > 0 && (
                      <span className="history-day-badge">
                        {dayCompleted} vakit düşüldü
                      </span>
                    )}
                  </div>

                  {/* Per-prayer breakdown chips (e.g. Sabah −2, Yatsı −1) */}
                  {detailEntries.length > 0 && (
                    <div className="history-breakdown-row">
                      {detailEntries.map(([k, cnt]) => {
                        const name =
                          k === 'oruc'
                            ? 'Oruç'
                            : PRAYER_META.find((p) => p.key === k)?.label || k;
                        return (
                          <span key={k} className="history-breakdown-chip">
                            {name} −{cnt}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Individual chronological events */}
                  <div className="history-event-list">
                    {events.map((ev) => {
                      const badge = getEventBadge(ev);
                      const timeStr = new Date(ev.timestamp).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      const hasTransition =
                        typeof ev.beforeCount === 'number' &&
                        typeof ev.afterCount === 'number';

                      return (
                        <div key={ev.id} className="history-event-item">
                          <div className="history-event-main">
                            <span className={`history-badge ${badge.tone}`}>
                              {badge.text}
                            </span>
                            <div className="history-event-text">
                              <span className="history-event-label">{ev.label}</span>
                              {hasTransition && (
                                <span className="history-event-transition tabular-nums">
                                  {ev.beforeCount?.toLocaleString('tr-TR')} →{' '}
                                  {ev.afterCount?.toLocaleString('tr-TR')}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="history-event-time tabular-nums">
                            {timeStr}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Monthly Calendar & Streak */}
      {subTab === 'calendar' && (
        <div className="stack-gap">
          <div className="card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14
              }}
            >
              <button
                type="button"
                className="secondary-btn"
                style={{ minHeight: 46, padding: '8px 12px' }}
                aria-label="Önceki ay"
                onClick={() => changeMonth(-1)}
              >
                <ChevronLeft size={22} />
              </button>
              <h2
                className="section-title"
                style={{
                  margin: 0,
                  textTransform: 'capitalize',
                  fontSize: 'var(--fs-lg)'
                }}
              >
                {monthTitle}
              </h2>
              <button
                type="button"
                className="secondary-btn"
                style={{ minHeight: 46, padding: '8px 12px' }}
                aria-label="Sonraki ay"
                onClick={() => changeMonth(1)}
              >
                <ChevronRight size={22} />
              </button>
            </div>

            <div className="calendar-weekdays">
              {WEEKDAYS.map((w) => (
                <div key={w} className="calendar-weekday">
                  {w}
                </div>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarCells.map((cell) => {
                if (!cell.day) {
                  return <div key={cell.key} className="calendar-day empty" />;
                }
                const completed = (state.dailyLogs[cell.key]?.completedCount || 0) > 0;
                const isToday = cell.key === todayKey;
                return (
                  <div
                    key={cell.key}
                    className={`calendar-day tabular-nums ${
                      completed ? 'completed' : ''
                    } ${isToday ? 'today' : ''}`}
                    title={
                      completed
                        ? `${state.dailyLogs[cell.key].completedCount} kaza kılındı`
                        : 'Kayıt yok'
                    }
                  >
                    {cell.day}
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 18,
                justifyContent: 'center',
                marginTop: 14,
                fontSize: 'var(--fs-xs)',
                fontWeight: 700,
                color: 'var(--text-secondary)'
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: 'var(--emerald)'
                  }}
                />
                Kaza Kılınan Gün
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    border: '2px solid var(--gold)'
                  }}
                />
                Bugün
              </span>
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <p className="stat-label">Şimdiye Kadar Kılınan Kazaların Sayısı</p>
            <p
              className="hero-total tabular-nums"
              style={{
                color: 'var(--gold)',
                fontSize: 'var(--fs-2xl)',
                margin: '6px 0 16px'
              }}
            >
              {state.totalCompleted.toLocaleString('tr-TR')}
            </p>

            <div className="goal-grid">
              <div className="stat-box">
                <p className="stat-label">
                  <Flame size={15} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                  Güncel Seri
                </p>
                <p className="stat-value tabular-nums" style={{ color: 'var(--emerald)' }}>
                  {currentStreak} Gün
                </p>
              </div>
              <div className="stat-box">
                <p className="stat-label">
                  <Trophy size={15} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                  En Yüksek Seri
                </p>
                <p className="stat-value tabular-nums" style={{ color: 'var(--gold)' }}>
                  {bestStreak} Gün
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
