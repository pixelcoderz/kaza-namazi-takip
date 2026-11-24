import React, { useMemo, useState } from 'react';
import { Calculator, CheckCircle2, Info } from 'lucide-react';
import { AppState, KazaCounts, Madhhab, PRAYER_META, createEmptyCounts } from '../types/kaza';
import {
  calculateFromDates,
  calculateFromYears,
  formatDaysAsYMD,
  getActivePrayerKeys,
  getTotalPrayerCount
} from '../lib/calculator';

interface CalculatorViewProps {
  state: AppState;
  onApplyCounts: (newCounts: KazaCounts, madhhab: Madhhab, reasonLabel: string) => void;
}

type CalcMode = 'dates' | 'years' | 'manual';

export const CalculatorView: React.FC<CalculatorViewProps> = ({ state, onApplyCounts }) => {
  const [mode, setMode] = useState<CalcMode>('dates');
  const [madhhab, setMadhhab] = useState<Madhhab>(state.madhhab);

  // Mode 1: Dates & Puberty (general fiqh rules)
  const [gender, setGender] = useState<'erkek' | 'kadin'>('erkek');
  const [birthDate, setBirthDate] = useState('1965-01-01');
  const [pubertyAge, setPubertyAge] = useState(15);
  const [prayerStartDate, setPrayerStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [monthlyExcusedDays, setMonthlyExcusedDays] = useState(7);
  const [calendarType, setCalendarType] = useState<'miladi' | 'hicri'>('miladi');
  const [orucDays, setOrucDays] = useState(0);

  // Mode 2: Quick Years
  const [quickYears, setQuickYears] = useState(1);
  const [quickMonths, setQuickMonths] = useState(0);

  // Mode 3: Manual transfer from another app
  const [manualCounts, setManualCounts] = useState<KazaCounts>({ ...state.counts });

  const [savedNotice, setSavedNotice] = useState(false);

  const preview = useMemo(() => {
    if (mode === 'dates') {
      return calculateFromDates({
        birthDate,
        pubertyAge,
        prayerStartDate,
        gender,
        monthlyExcusedDays,
        nifasDays: 0,
        calendarType,
        madhhab,
        orucDays
      });
    }
    if (mode === 'years') {
      const res = calculateFromYears({
        years: quickYears,
        months: quickMonths,
        calendarType,
        madhhab,
        orucDays
      });
      return { ...res, pubertyDateStr: '' };
    }
    return {
      counts: {
        ...manualCounts,
        vitir: madhhab === 'hanefi' ? manualCounts.vitir : 0
      },
      effectiveDays: manualCounts.sabah,
      pubertyDateStr: ''
    };
  }, [
    mode,
    birthDate,
    pubertyAge,
    prayerStartDate,
    gender,
    monthlyExcusedDays,
    calendarType,
    madhhab,
    orucDays,
    quickYears,
    quickMonths,
    manualCounts
  ]);

  const previewTotal = getTotalPrayerCount(preview.counts, madhhab);
  const activeKeys = getActivePrayerKeys(madhhab);

  const handleApply = () => {
    const label =
      mode === 'dates'
        ? 'Tarih ve Ergenlik Hesabı'
        : mode === 'years'
          ? 'Yıla Göre Hızlı Hesap'
          : 'Mevcut Sayıları Aktarma';
    onApplyCounts(preview.counts, madhhab, label);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="stack-gap">
      <div className="card">
        <h2 className="section-title">Kaza Namazlarını Hesapla / Aktar</h2>
        <p className="section-subtitle">
          Genel İslam fıkhı ölçülerine göre borcunuzu hesaplayın veya başka
          uygulamadaki mevcut sayılarınızı doğrudan aktarın. Kaydettiğinizde önceki
          bilgileriniz otomatik yedeklenir.
        </p>

        {/* Mode Selector matching Screenshot 2 */}
        <button
          type="button"
          className={`mode-option ${mode === 'dates' ? 'active' : ''}`}
          onClick={() => setMode('dates')}
        >
          <Calculator size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 'var(--fs-base)' }}>
              Kaza namazlarımı hesapla (Doğum ve Ergenlik Tarihi)
            </div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
              Doğum tarihi, ergenlik yaşı ve düzenli namaza başlama tarihine göre hesaplar.
            </div>
          </div>
        </button>

        <button
          type="button"
          className={`mode-option ${mode === 'years' ? 'active' : ''}`}
          onClick={() => setMode('years')}
        >
          <Calculator size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 'var(--fs-base)' }}>
              Kaza namazlarımı yıla göre hesapla (Hızlı)
            </div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
              Kaç yıl / ay kaza borcunuz olduğunu biliyorsanız hızlıca gün sayısına çevirir.
            </div>
          </div>
        </button>

        <button
          type="button"
          className={`mode-option ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => {
            setManualCounts({ ...state.counts });
            setMode('manual');
          }}
        >
          <CheckCircle2 size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 'var(--fs-base)' }}>
              Kaza namazlarımı biliyorum (Başka uygulamadan aktar)
            </div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
              Sabah, öğle, ikindi, akşam, yatsı, vitir ve oruç sayılarını tek tek yazın.
            </div>
          </div>
        </button>
      </div>

      {/* Madhhab Selection */}
      <div className="card">
        <div className="field-group" style={{ marginBottom: 0 }}>
          <span className="field-label">Mezhep Seçimi (Vitir Namazı İçin)</span>
          <div className="pill-row">
            <button
              type="button"
              className={`pill-btn ${madhhab === 'hanefi' ? 'active' : ''}`}
              onClick={() => setMadhhab('hanefi')}
            >
              Hanefî (Vitir Vacip — Dahil)
            </button>
            <button
              type="button"
              className={`pill-btn ${madhhab === 'safii' ? 'active' : ''}`}
              onClick={() => setMadhhab('safii')}
            >
              Şâfiî / Diğer (Vitir Hariç)
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1 Inputs */}
      {mode === 'dates' && (
        <div className="card">
          <div className="field-group">
            <span className="field-label">Cinsiyetiniz</span>
            <div className="pill-row">
              <button
                type="button"
                className={`pill-btn ${gender === 'erkek' ? 'active' : ''}`}
                onClick={() => setGender('erkek')}
              >
                Erkek
              </button>
              <button
                type="button"
                className={`pill-btn ${gender === 'kadin' ? 'active' : ''}`}
                onClick={() => setGender('kadin')}
              >
                Kadın
              </button>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="birth-date">
              Doğum Tarihi
            </label>
            <input
              id="birth-date"
              type="date"
              className="input-control"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="puberty-age">
              Ergenlik Yaşı (Büluğ Çağı)
            </label>
            <select
              id="puberty-age"
              className="select-control"
              value={pubertyAge}
              onChange={(e) => setPubertyAge(Number(e.target.value))}
            >
              {[9, 10, 11, 12, 13, 14, 15].map((age) => (
                <option key={age} value={age}>
                  {age} Yaş {age === 15 ? '(Hanefî Varsayılan Sınır)' : ''}
                </option>
              ))}
            </select>
            <p className="field-hint">
              <Info size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Fıkıh kaynaklarına göre biyolojik alametler daha önce görülmediyse 15 yaşın başlangıcı
              esas alınır.
            </p>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="start-date">
              Düzenli Olarak Kesintisiz Namaz Kılmaya Başladığınız Tarih
            </label>
            <input
              id="start-date"
              type="date"
              className="input-control"
              value={prayerStartDate}
              onChange={(e) => setPrayerStartDate(e.target.value)}
            />
          </div>

          {gender === 'kadin' && (
            <div className="field-group">
              <label className="field-label" htmlFor="excused-days">
                Aylık Ortalama Özel Hal (Muaf) Gün Sayısı
              </label>
              <input
                id="excused-days"
                type="number"
                min={0}
                max={15}
                className="input-control"
                value={monthlyExcusedDays}
                onChange={(e) => setMonthlyExcusedDays(Number(e.target.value))}
              />
              <p className="field-hint">
                Özel hallerde kılınmayan namazlar kaza edilmez; hesaplamadan otomatik düşülür.
              </p>
            </div>
          )}

          <div className="field-group">
            <span className="field-label">Takvim Esası</span>
            <div className="pill-row">
              <button
                type="button"
                className={`pill-btn ${calendarType === 'miladi' ? 'active' : ''}`}
                onClick={() => setCalendarType('miladi')}
              >
                Miladi (365 gün/yıl)
              </button>
              <button
                type="button"
                className={`pill-btn ${calendarType === 'hicri' ? 'active' : ''}`}
                onClick={() => setCalendarType('hicri')}
              >
                Kamerî / Hicrî (354 gün/yıl)
              </button>
            </div>
          </div>

          <div className="field-group" style={{ marginBottom: 0 }}>
            <label className="field-label" htmlFor="oruc-days-1">
              Varsa Kaza Orucu Borcu (Gün)
            </label>
            <input
              id="oruc-days-1"
              type="number"
              min={0}
              className="input-control tabular-nums"
              value={orucDays}
              onChange={(e) => setOrucDays(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
        </div>
      )}

      {/* Mode 2 Inputs */}
      {mode === 'years' && (
        <div className="card">
          <div className="goal-grid">
            <div className="field-group">
              <label className="field-label" htmlFor="quick-years">
                Yıl Sayısı
              </label>
              <input
                id="quick-years"
                type="number"
                min={0}
                max={90}
                className="input-control tabular-nums"
                value={quickYears}
                onChange={(e) => setQuickYears(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="quick-months">
                Ay Sayısı
              </label>
              <input
                id="quick-months"
                type="number"
                min={0}
                max={11}
                className="input-control tabular-nums"
                value={quickMonths}
                onChange={(e) => setQuickMonths(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
          </div>

          <div className="field-group" style={{ marginBottom: 0 }}>
            <label className="field-label" htmlFor="oruc-days-2">
              Varsa Kaza Orucu Borcu (Gün)
            </label>
            <input
              id="oruc-days-2"
              type="number"
              min={0}
              className="input-control tabular-nums"
              value={orucDays}
              onChange={(e) => setOrucDays(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
        </div>
      )}

      {/* Mode 3 Inputs */}
      {mode === 'manual' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="field-label">Vakitlere Göre Mevcut Kaza Sayıları</span>
            <button
              type="button"
              className="secondary-btn"
              style={{ minHeight: 38, padding: '4px 12px' }}
              onClick={() => setManualCounts(createEmptyCounts())}
            >
              Temizle
            </button>
          </div>
          <div className="goal-grid">
            {PRAYER_META.filter((p) => activeKeys.includes(p.key)).map((p) => (
              <div key={p.key} className="field-group">
                <label className="field-label" htmlFor={`manual-${p.key}`}>
                  {p.label}
                </label>
                <input
                  id={`manual-${p.key}`}
                  type="number"
                  min={0}
                  className="input-control tabular-nums"
                  value={manualCounts[p.key]}
                  onChange={(e) =>
                    setManualCounts((prev) => ({
                      ...prev,
                      [p.key]: Math.max(0, Math.floor(Number(e.target.value) || 0))
                    }))
                  }
                />
              </div>
            ))}
            <div className="field-group">
              <label className="field-label" htmlFor="manual-oruc">
                Oruç (Gün)
              </label>
              <input
                id="manual-oruc"
                type="number"
                min={0}
                className="input-control tabular-nums"
                value={manualCounts.oruc}
                onChange={(e) =>
                  setManualCounts((prev) => ({
                    ...prev,
                    oruc: Math.max(0, Math.floor(Number(e.target.value) || 0))
                  }))
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Live Preview & Apply */}
      <div className="card" style={{ borderColor: 'var(--emerald)' }}>
        <p className="stat-label">Hesaplanan Özet</p>
        <p className="section-title tabular-nums" style={{ color: 'var(--emerald)' }}>
          Toplam {previewTotal.toLocaleString('tr-TR')} Vakit Kaza
        </p>
        <p className="section-subtitle" style={{ marginBottom: 14 }}>
          {mode === 'dates'
            ? `${preview.pubertyDateStr ? `${preview.pubertyDateStr} (Ergenlik) → ${prayerStartDate} = ` : ''}Her vakitten ${preview.effectiveDays.toLocaleString('tr-TR')} gün (${formatDaysAsYMD(preview.effectiveDays)})`
            : mode === 'years'
              ? `Her vakitten ${preview.effectiveDays.toLocaleString('tr-TR')} gün (${formatDaysAsYMD(preview.effectiveDays)})`
              : 'Girdiğiniz sayılar doğrudan takip ekranına aktarılacak.'}
        </p>

        <button type="button" className="primary-btn" onClick={handleApply}>
          {savedNotice ? 'Kaydedildi ve Takip Ekranına Aktarıldı!' : 'Bu Sayıları Kaydet ve Başla'}
        </button>
      </div>
    </div>
  );
};
