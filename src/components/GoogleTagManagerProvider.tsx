import React, { useEffect, createContext, useContext } from 'react';

export const GTM_CONTAINER_ID = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GTM_ID) || 
  'GTM-K5PJWKTD';

interface GTMContextType {
  gtmId: string;
  pushGtmEvent: (eventName: string, eventData?: Record<string, any>) => void;
}

const GTMContext = createContext<GTMContextType>({
  gtmId: GTM_CONTAINER_ID,
  pushGtmEvent: () => {},
});

export const useGTM = () => useContext(GTMContext);

/**
 * Proveedor dinámico de Google Tag Manager (GTM)
 * Inyecta el componente noscript de forma dinámica en la jerarquía React
 * evitando bloqueos de renderizado HTML estático en despliegues como GitHub Pages.
 */
export const GoogleTagManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
    }
  }, []);

  const pushGtmEvent = (eventName: string, eventData: Record<string, any> = {}) => {
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: eventName,
        ...eventData,
      });
    }
  };

  return (
    <GTMContext.Provider value={{ gtmId: GTM_CONTAINER_ID, pushGtmEvent }}>
      {/* Inyección dinámica del iframe noscript para navegadores con JavaScript deshabilitado */}
      <noscript id="gtm-noscript-dynamic">
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
          title="Google-Tag-Manager-NoScript"
        />
      </noscript>
      {children}
    </GTMContext.Provider>
  );
};
