import React, { useState } from 'react';
import { AlertTriangle, BookOpen, ChevronDown, ChevronUp, Compass } from 'lucide-react';
import {
  AYET_AND_HADIS_LIST,
  DIYANET_FAQ,
  KERAHET_TIMES,
  PRAYER_INTENTIONS
} from '../data/religiousContent';
import { PrayerIcon } from './PrayerIcons';

export const GuideView: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<string | null>(DIYANET_FAQ[0].id);
  const [intentionMode, setIntentionMode] = useState<'first' | 'last'>('first');

  return (
    <div className="stack-gap">
      {/* Niyet Rehberi */}
      <div className="card">
        <h2 className="section-title">
          <Compass size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />
          Kaza Namazı Niyet Rehberi
        </h2>
        <p className="section-subtitle">
          Genel ilmihal kaynaklarına göre çok sayıda kaza borcu olanlar “ilk” veya “son”
          diyerek kolayca niyet edebilir.
        </p>

        <div className="pill-row" style={{ marginBottom: 14 }}>
          <button
            type="button"
            className={`pill-btn ${intentionMode === 'first' ? 'active' : ''}`}
            onClick={() => setIntentionMode('first')}
          >
            “İlk” Diye Niyet
          </button>
          <button
            type="button"
            className={`pill-btn ${intentionMode === 'last' ? 'active' : ''}`}
            onClick={() => setIntentionMode('last')}
          >
            “Son” Diye Niyet
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PRAYER_INTENTIONS.map((item) => (
            <div
              key={item.key}
              style={{
                padding: 14,
                borderRadius: 16,
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 'var(--fs-base)',
                    fontWeight: 800
                  }}
                >
                  <PrayerIcon type={item.key} size={22} />
                  {item.title}
                </span>
                <span
                  style={{
                    fontSize: 'var(--fs-xs)',
                    fontWeight: 800,
                    color: 'var(--gold)',
                    backgroundColor: 'var(--gold-bg)',
                    padding: '4px 10px',
                    borderRadius: 999
                  }}
                >
                  {item.rekatInfo}
                </span>
              </div>

              <p
                style={{
                  fontSize: 'var(--fs-base)',
                  fontWeight: 800,
                  color: 'var(--emerald)',
                  margin: '0 0 8px'
                }}
              >
                {intentionMode === 'first' ? item.intentionFirst : item.intentionLast}
              </p>
              <p
                style={{
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--text-secondary)',
                  margin: 0
                }}
              >
                {item.note}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Kerahet Vakitleri */}
      <div className="card" style={{ borderColor: 'var(--coral)' }}>
        <h2 className="section-title" style={{ color: 'var(--coral)' }}>
          <AlertTriangle
            size={22}
            style={{ verticalAlign: 'text-bottom', marginRight: 8 }}
          />
          Kerahet Vakitleri (Namaz Kılınmayan 3 Vakit)
        </h2>
        <p className="section-subtitle">
          Kaza namazları günün her saatinde kılınabilir; ancak şu 3 vakitte kaza dahil hiçbir
          namaz kılınmaz:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {KERAHET_TIMES.map((k) => (
            <div
              key={k.title}
              style={{
                padding: 14,
                borderRadius: 14,
                backgroundColor: 'var(--coral-bg)',
                border: '1px solid rgba(239, 68, 68, 0.25)'
              }}
            >
              <p style={{ fontSize: 'var(--fs-base)', fontWeight: 800, margin: '0 0 2px' }}>
                {k.title}
              </p>
              <p
                style={{
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 800,
                  color: 'var(--gold)',
                  margin: '0 0 6px'
                }}
              >
                {k.window}
              </p>
              <p style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>{k.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sık Sorulan Fıkhi Sorular */}
      <div className="card">
        <h2 className="section-title">
          <BookOpen size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />
          Sık Sorulan Fıkhi Sorular
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {DIYANET_FAQ.map((faq) => {
            const isOpen = openFaq === faq.id;
            return (
              <div
                key={faq.id}
                style={{
                  borderRadius: 14,
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden'
                }}
              >
                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    textAlign: 'left',
                    fontSize: 'var(--fs-base)',
                    fontWeight: 800
                  }}
                  onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                >
                  <span>{faq.question}</span>
                  {isOpen ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                </button>
                {isOpen && (
                  <div
                    style={{
                      padding: '0 16px 16px',
                      fontSize: 'var(--fs-sm)',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55
                    }}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ayet ve Hadisler */}
      <div className="card">
        <h2 className="section-title">Kur’an Ayetleri ve Sahih Hadisler</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {AYET_AND_HADIS_LIST.map((item) => (
            <div
              key={item.id}
              style={{
                padding: 14,
                borderRadius: 14,
                backgroundColor: 'var(--bg-input)',
                border: '1px solid rgba(212, 175, 55, 0.35)'
              }}
            >
              <span className="wisdom-badge">
                {item.kind === 'ayet' ? 'Kur’an-ı Kerim' : 'Sahih Hadis'}
              </span>
              <p className="wisdom-text">“{item.text}”</p>
              <p className="wisdom-source">{item.source}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
