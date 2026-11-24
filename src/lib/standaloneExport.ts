import { AppState } from '../types/kaza';

export async function downloadStandaloneHtml(
  state: AppState
): Promise<{ ok: boolean; error?: string }> {
  try {
    let templateHtml = '';

    if (window.location.protocol === 'file:') {
      const clone = document.documentElement.cloneNode(true) as HTMLElement;
      const rootEl = clone.querySelector('#root');
      if (rootEl) rootEl.innerHTML = '';
      const oldEmbedded = clone.querySelector('#kaza-embedded-state');
      if (oldEmbedded) oldEmbedded.remove();
      templateHtml = `<!doctype html>\n${clone.outerHTML}`;
    } else {
      const res = await fetch('./kaza-namazi-takip.html', { cache: 'no-store' });
      if (!res.ok) {
        return {
          ok: false,
          error: 'Tek dosyalık şablon bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.'
        };
      }
      templateHtml = await res.text();
    }

    const safeJson = JSON.stringify(state).replace(/<\//g, '<\\/');
    const injectScript = `<script id="kaza-embedded-state">window.__KAZA_EMBEDDED_STATE__=${safeJson};</script>`;

    // Strip any previous embedded state script and inject fresh state before </head>
    const cleaned = templateHtml.replace(
      /<script\s+id=["']kaza-embedded-state["'][\s\S]*?<\/script>/gi,
      ''
    );

    const finalHtml = cleaned.includes('</head>')
      ? cleaned.replace('</head>', `${injectScript}</head>`)
      : `${injectScript}${cleaned}`;

    const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kaza-namazi-takip.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: 'HTML dosyası oluşturulurken bir hata oluştu.'
    };
  }
}
