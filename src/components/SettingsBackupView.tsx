import React, { useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  History,
  Lock,
  Moon,
  RotateCcw,
  Share2,
  ShieldAlert,
  Smartphone,
  Sun,
  Upload
} from 'lucide-react';
import { AppState, FontScale, Madhhab, Snapshot, ThemeMode } from '../types/kaza';
import {
  buildBackupLink,
  decodeBackupInput,
  formatWhatsAppBackup,
  sanitizeState
} from '../lib/storage';
import { getTotalPrayerCount } from '../lib/calculator';
import { downloadStandaloneHtml } from '../lib/standaloneExport';

interface SettingsBackupViewProps {
  state: AppState;
  installPromptEvent: BeforeInstallPromptEvent | null;
  isStandalone: boolean;
  onTriggerInstall: () => void;
  onUpdateSettings: (patch: Partial<AppState>) => void;
  onRestoreSnapshot: (snap: Snapshot) => void;
  onImportState: (partial: Partial<AppState>, sourceLabel: string) => void;
  onProtectedReset: () => void;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const SettingsBackupView: React.FC<SettingsBackupViewProps> = ({
  state,
  installPromptEvent,
  isStandalone,
  onTriggerInstall,
  onUpdateSettings,
  onRestoreSnapshot,
  onImportState,
  onProtectedReset
}) => {
  const [copied, setCopied] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showInstallHelpModal, setShowInstallHelpModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAllSnapshots, setShowAllSnapshots] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isExportingHtml, setIsExportingHtml] = useState(false);
  const [htmlExportMsg, setHtmlExportMsg] = useState<{ ok: boolean; text: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDirectInstallClick = () => {
    if (installPromptEvent) {
      onTriggerInstall();
    } else {
      setShowInstallHelpModal(true);
    }
  };

  const handleDownloadStandaloneHtml = async () => {
    setIsExportingHtml(true);
    setHtmlExportMsg(null);
    const res = await downloadStandaloneHtml(state);
    setIsExportingHtml(false);
    if (res.ok) {
      setHtmlExportMsg({
        ok: true,
        text: 'kaza-namazi-takip.html güncel bilgilerinizle indirildi! Bu dosyayı WhatsApp veya kablo ile babanızın telefonuna atıp açabilirsiniz.'
      });
    } else {
      setHtmlExportMsg({
        ok: false,
        text: res.error || 'HTML indirilemedi.'
      });
    }
  };

  const handleCopyBackup = async () => {
    const text = buildBackupLink(state);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setImportMsg({ ok: false, text: 'Panoya kopyalanamadı; paylaş butonunu deneyin.' });
    }
  };

  const handleShareWhatsApp = async () => {
    const text = formatWhatsAppBackup(state);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kaza Namazı Takip Yedeği',
          text
        });
        return;
      } catch {
        // Fallback to WhatsApp URL
      }
    }
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleRestoreCode = () => {
    const parsed = decodeBackupInput(recoveryInput);
    if (!parsed) {
      setImportMsg({
        ok: false,
        text: 'Geçerli bir yedek linki veya kodu bulunamadı.'
      });
      return;
    }
    onImportState(parsed, 'Yedek Linki ile Geri Yükleme');
    setRecoveryInput('');
    setImportMsg({ ok: true, text: 'Bilgileriniz başarıyla geri yüklendi!' });
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaza-takip-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result)) as Partial<AppState>;
        const clean = sanitizeState(raw);
        onImportState(clean, 'JSON Dosyasından Geri Yükleme');
        setImportMsg({ ok: true, text: 'JSON yedeği başarıyla geri yüklendi!' });
      } catch {
        setImportMsg({ ok: false, text: 'JSON dosyası okunamadı veya geçersiz.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmReset = () => {
    if (resetConfirmText.trim().toUpperCase() !== 'SIFIRLA') return;
    onProtectedReset();
    setShowResetModal(false);
    setResetConfirmText('');
  };

  return (
    <div className="stack-gap">
      {/* Görünüm ve Erişilebilirlik */}
      <div className="card">
        <h2 className="section-title">Görünüm ve Okunabilirlik</h2>
        <p className="section-subtitle">
          Gözleri yormayan büyük punto ve yüksek kontrastlı tema seçimi.
        </p>

        <div className="field-group">
          <span className="field-label">Yazı Boyutu (Punto)</span>
          <div className="pill-row">
            {(
              [
                { id: 'normal', label: 'Normal' },
                { id: 'large', label: 'Büyük' },
                { id: 'xlarge', label: 'Çok Büyük' }
              ] as { id: FontScale; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`pill-btn ${state.fontScale === opt.id ? 'active' : ''}`}
                onClick={() => onUpdateSettings({ fontScale: opt.id })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field-group" style={{ marginBottom: 0 }}>
          <span className="field-label">Ekran Teması</span>
          <div className="pill-row">
            {(
              [
                { id: 'dark', label: 'Koyu Gece', icon: <Moon size={18} /> },
                { id: 'light', label: 'Açık Gündüz', icon: <Sun size={18} /> }
              ] as { id: ThemeMode; label: string; icon: React.ReactNode }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`pill-btn ${state.theme === opt.id ? 'active' : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
                onClick={() => onUpdateSettings({ theme: opt.id })}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* İbadet Ayarları */}
      <div className="card">
        <h2 className="section-title">İbadet ve Hedef Ayarları</h2>

        <div className="field-group">
          <span className="field-label">Mezhep (Vitir Namazı)</span>
          <div className="pill-row">
            {(
              [
                { id: 'hanefi', label: 'Hanefî (Vitir Dahil)' },
                { id: 'safii', label: 'Şâfiî / Diğer (Vitir Hariç)' }
              ] as { id: Madhhab; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`pill-btn ${state.madhhab === opt.id ? 'active' : ''}`}
                onClick={() => onUpdateSettings({ madhhab: opt.id })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field-group">
          <span className="field-label">Oruç Kazası Takibi</span>
          <div className="pill-row">
            <button
              type="button"
              className={`pill-btn ${state.includeOruc ? 'active' : ''}`}
              onClick={() => onUpdateSettings({ includeOruc: true })}
            >
              Göster
            </button>
            <button
              type="button"
              className={`pill-btn ${!state.includeOruc ? 'active' : ''}`}
              onClick={() => onUpdateSettings({ includeOruc: false })}
            >
              Gizle
            </button>
          </div>
        </div>

        <div className="field-group" style={{ marginBottom: 0 }}>
          <label className="field-label" htmlFor="daily-goal-input">
            Günlük Kaza Hedefi (Günde Kaç Vakit?)
          </label>
          <input
            id="daily-goal-input"
            type="number"
            min={1}
            max={60}
            className="input-control tabular-nums"
            value={state.dailyGoal}
            onChange={(e) =>
              onUpdateSettings({
                dailyGoal: Math.max(1, Math.min(60, Math.floor(Number(e.target.value) || 6)))
              })
            }
          />
          <p className="field-hint">
            Örneğin günde 1 günlük kaza (6 vakit) hedeflerseniz tahmini bitiş tarihi buna göre
            hesaplanır.
          </p>
        </div>
      </div>

      {/* Yanlışlıkla Sıfırlamaya Karşı 4 Katmanlı Koruma */}
      <div className="card" style={{ borderColor: 'var(--gold)' }}>
        <h2 className="section-title">
          <Lock size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />
          Veri Koruma ve Yedekleme
        </h2>
        <p className="section-subtitle">
          Yanlışlıkla silme veya telefon değiştirme durumunda sayılarınız kaybolmasın diye
          kendinize veya yakınınıza bir yedek linki gönderin. İleride o linke dokununca
          tüm bilgileriniz tek tıkla geri gelir.
        </p>

        {/* Lock toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: 14,
            borderRadius: 14,
            backgroundColor: 'var(--bg-input)',
            marginBottom: 14
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 'var(--fs-base)' }}>
              Yanlış Dokunma Kilidi
            </div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
              Açıkken kırmızı (+) ve elle değiştirme gizlenir, sadece yeşil (−) düşme tuşu
              çalışır.
            </div>
          </div>
          <button
            type="button"
            className={`pill-btn ${state.lockAccidentalEdits ? 'active' : ''}`}
            style={{ flex: '0 0 auto', minWidth: 96 }}
            onClick={() =>
              onUpdateSettings({ lockAccidentalEdits: !state.lockAccidentalEdits })
            }
          >
            {state.lockAccidentalEdits ? 'AÇIK' : 'KAPALI'}
          </button>
        </div>

        {/* WhatsApp / Copy Backup */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <button
            type="button"
            className="primary-btn"
            style={{ flex: 1, minWidth: 200 }}
            onClick={handleShareWhatsApp}
          >
            <Share2 size={20} />
            <span>WhatsApp’tan Yedek Linki Gönder</span>
          </button>
          <button
            type="button"
            className="secondary-btn"
            style={{ flex: 1, minWidth: 160 }}
            onClick={handleCopyBackup}
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
            <span>{copied ? 'Kopyalandı!' : 'Yedek Linkini Kopyala'}</span>
          </button>
        </div>

        <button
          type="button"
          className="secondary-btn"
          style={{ width: '100%', marginBottom: showAdvanced ? 14 : 0 }}
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
        >
          <span>{showAdvanced ? 'Gelişmiş Seçenekleri Gizle' : 'Gelişmiş Yedekleme Seçenekleri'}</span>
        </button>

        {showAdvanced && (
          <>
        {/* Recovery Link Paste */}
        <div className="field-group">
          <label className="field-label" htmlFor="recovery-paste">
            Yedek Linkini veya Kodunu Yapıştırıp Geri Yükle
          </label>
          <textarea
            id="recovery-paste"
            className="textarea-control"
            placeholder="Aldığınız yedek mesajını veya linkini buraya yapıştırın"
            value={recoveryInput}
            onChange={(e) => setRecoveryInput(e.target.value)}
          />
          <button
            type="button"
            className="secondary-btn"
            disabled={!recoveryInput.trim()}
            onClick={handleRestoreCode}
          >
            <RotateCcw size={18} />
            <span>Geri Yükle</span>
          </button>
        </div>

        {/* JSON Export / Import */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button
            type="button"
            className="secondary-btn"
            style={{ flex: 1 }}
            onClick={handleDownloadJson}
          >
            <Download size={18} />
            <span>Dosya İndir (JSON)</span>
          </button>
          <button
            type="button"
            className="secondary-btn"
            style={{ flex: 1 }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={18} />
            <span>Dosyadan Yükle</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={handleFileImport}
          />
        </div>

        <button
          type="button"
          className="secondary-btn"
          style={{ width: '100%', marginTop: 10 }}
          disabled={isExportingHtml}
          onClick={handleDownloadStandaloneHtml}
        >
          <Download size={18} />
          <span>
            {isExportingHtml ? 'Hazırlanıyor...' : 'Bilgilerimle HTML Dosyası İndir'}
          </span>
        </button>
        {htmlExportMsg && (
          <p
            style={{
              marginTop: 10,
              marginBottom: 0,
              fontWeight: 800,
              fontSize: 'var(--fs-sm)',
              color: htmlExportMsg.ok ? 'var(--emerald)' : 'var(--coral)'
            }}
          >
            {htmlExportMsg.text}
          </p>
        )}
          </>
        )}

        {importMsg && (
          <p
            style={{
              marginTop: 12,
              marginBottom: 0,
              fontWeight: 800,
              fontSize: 'var(--fs-sm)',
              color: importMsg.ok ? 'var(--emerald)' : 'var(--coral)'
            }}
          >
            {importMsg.text}
          </p>
        )}
      </div>

      {/* Zaman Makinesi (Otomatik Yedekler) */}
      <div className="card">
        <h2 className="section-title">
          <History size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />
          Zaman Makinesi (Otomatik Yedekler)
        </h2>
        <p className="section-subtitle">
          Her önemli değişiklikten ve sıfırlamadan önce sistem otomatik yedek alır. Yanlış
          bir şey yaparsanız tek dokunuşla eski haline dönebilirsiniz.
        </p>

        {state.snapshots.length === 0 ? (
          <p className="field-hint">Henüz otomatik yedek oluşmadı.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {state.snapshots.slice(0, showAllSnapshots ? 30 : 5).map((snap) => {
              const snapTotal = getTotalPrayerCount(snap.counts, state.madhhab);
              return (
                <div
                  key={snap.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 14,
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 'var(--fs-sm)' }}>
                      {snap.reason}
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                      {new Date(snap.timestamp).toLocaleString('tr-TR')} • Kalan:{' '}
                      {snapTotal.toLocaleString('tr-TR')}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="secondary-btn"
                    style={{ minHeight: 42, padding: '6px 12px', flexShrink: 0 }}
                    onClick={() => onRestoreSnapshot(snap)}
                  >
                    Geri Dön
                  </button>
                </div>
              );
            })}
            {state.snapshots.length > 5 && (
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowAllSnapshots((v) => !v)}
              >
                {showAllSnapshots ? 'Daha Az Göster' : 'Tümünü Göster'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Telefona ve Bilgisayara Kurulum */}
      <div className="card" style={{ borderColor: 'var(--emerald)' }}>
        <h2 className="section-title">
          <Smartphone size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />
          Telefona ve Bilgisayara Kurulum (7/24 Çevrimdışı)
        </h2>
        <p className="section-subtitle">
          Tek dokunuşla telefonunuzun ana ekranına uygulama olarak kurabilirsiniz; internet
          olmasa bile 7/24 tam ekran çalışır.
        </p>

        {isStandalone ? (
          <button
            type="button"
            className="primary-btn"
            style={{ marginBottom: 12, opacity: 0.85 }}
            disabled
          >
            <Check size={20} />
            <span>Uygulama Bu Cihaza Kurulu</span>
          </button>
        ) : (
          <button
            type="button"
            className="primary-btn"
            style={{ marginBottom: 12 }}
            onClick={handleDirectInstallClick}
          >
            <Download size={20} />
            <span>Uygulamayı Telefona / Cihaza Kur</span>
          </button>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 'var(--fs-sm)' }}>
          <div>
            <strong>Android (Chrome):</strong> Yukarıdaki yeşil <em>“Uygulamayı Kur”</em>{' '}
            butonuna dokunun (veya sağ üst 3 nokta → <em>“Uygulamayı yükle”</em>). Ana
            ekrana ikonu eklenir.
          </div>
          <div>
            <strong>iPhone / iPad (Safari):</strong> Alt ortadaki Paylaş simgesine dokunun
            → <em>“Ana Ekrana Ekle”</em> seçin.
          </div>
        </div>
      </div>

      {/* Tehlikeli Alan: Korumalı Sıfırlama */}
      <div className="card" style={{ borderColor: 'var(--coral)' }}>
        <h2 className="section-title" style={{ color: 'var(--coral)' }}>
          <ShieldAlert size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />
          Korumalı Sıfırlama
        </h2>
        <p className="section-subtitle">
          Tüm sayıları sıfırlamak için onay kelimesi girmeniz gerekir. Sıfırlasanız bile
          sistem bir önceki halinizi “Zaman Makinesi”ne yedekler.
        </p>
        <button
          type="button"
          className="danger-btn"
          onClick={() => {
            setResetConfirmText('');
            setShowResetModal(true);
          }}
        >
          Tüm Sayıları Sıfırla
        </button>
      </div>

      {/* Telif Hakkı ve Yasal Bilgilendirme */}
      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, margin: '0 0 6px' }}>
          © 2026 Kaza Namazı Takip — Kişisel İbadet Takip Uygulaması
        </p>
        <p
          style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: 1.55
          }}
        >
          Bu uygulama herhangi bir resmi kurum, devlet dairesi veya vakıfla bağlantılı
          değildir. İçerik genel ilmihal bilgilerine dayanır; özel fıkhi durumlar için ehil
          din görevlilerine danışılması tavsiye edilir. Kişisel veri toplamaz, çerez veya
          takip aracı kullanmaz ve hiçbir sunucuya bilgi göndermez; tüm veriler yalnızca
          kendi cihazınızda saklanır.
        </p>
      </div>

      {showInstallHelpModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3 className="section-title">Telefona Nasıl Kurulur?</h3>
            <p className="section-subtitle">
              Tarayıcınız doğrudan kurulum penceresi açmadıysa şu 2 adımı izleyin:
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                fontSize: 'var(--fs-sm)',
                marginBottom: 18
              }}
            >
              <div>
                <strong>Android (Chrome):</strong> Sağ üstteki <strong>⋮</strong> (3 nokta)
                menüsüne dokunun → <strong>“Uygulamayı yükle”</strong> veya{' '}
                <strong>“Ana ekrana ekle”</strong> seçin.
              </div>
              <div>
                <strong>iPhone (Safari):</strong> Alt ortadaki <strong>Paylaş</strong>{' '}
                simgesine dokunun → <strong>“Ana Ekrana Ekle”</strong> seçin.
              </div>
            </div>
            <button
              type="button"
              className="primary-btn"
              onClick={() => setShowInstallHelpModal(false)}
            >
              Anladım
            </button>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3 className="section-title" style={{ color: 'var(--coral)' }}>
              Emin misiniz?
            </h3>
            <p className="section-subtitle">
              Devam etmek için aşağıdaki kutuya büyük harflerle <strong>SIFIRLA</strong>{' '}
              yazın. Önceki sayılarınız yine de Zaman Makinesi’nde saklanacaktır.
            </p>
            <div className="field-group">
              <input
                type="text"
                className="input-control"
                placeholder="SIFIRLA yazın"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="secondary-btn"
                style={{ flex: 1 }}
                onClick={() => setShowResetModal(false)}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className="danger-btn"
                style={{ flex: 1 }}
                disabled={resetConfirmText.trim().toUpperCase() !== 'SIFIRLA'}
                onClick={confirmReset}
              >
                Onayla ve Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
