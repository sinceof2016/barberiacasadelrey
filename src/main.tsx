import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { GoogleTagManagerProvider, GTM_CONTAINER_ID } from './components/GoogleTagManagerProvider.tsx';
import './index.css';

/**
 * Carga diferida de Google Tag Manager (GTM)
 * Se ejecuta de manera asíncrona y no bloqueante tras completar la hidratación / render inicial del DOM.
 */
function loadGTMDeferred(gtmId: string = GTM_CONTAINER_ID): void {
  if (typeof window === 'undefined') return;

  // Evitar inyección duplicada si ya está cargado
  if (document.querySelector(`script[src*="gtm.js?id=${gtmId}"]`)) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;

  const firstScript = document.getElementsByTagName('script')[0];
  if (firstScript && firstScript.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <GoogleTagManagerProvider>
        <App />
      </GoogleTagManagerProvider>
    </StrictMode>
  );

  // Programar la carga diferida de GTM para ejecutarse estrictamente DESPUÉS del renderizado inicial del DOM
  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => loadGTMDeferred());
    } else {
      setTimeout(() => loadGTMDeferred(), 500);
    }
  }
}
