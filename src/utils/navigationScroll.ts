import { TabType } from '../components/Navbar';

export interface ScrollNavigationOptions {
  activeTab: TabType;
  targetTab: TabType;
  setActiveTab: (tab: TabType) => void;
  event?: { preventDefault: () => void };
  delayMs?: number;
  documentRef?: Document;
  windowRef?: Window;
}

/**
 * Gestiona la navegación fluida hacia una sección específica por ID (ej. #seccion-servicios)
 * sin recargar la página ni alterar la navegación.
 */
export function handleTabNavigationWithScroll({
  activeTab,
  targetTab,
  setActiveTab,
  event,
  delayMs = 40,
  documentRef = typeof document !== 'undefined' ? document : undefined,
  windowRef = typeof window !== 'undefined' ? window : undefined,
}: ScrollNavigationOptions): boolean {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }

  // 1. Manejo de entradas inválidas o vacías
  if (!targetTab || typeof targetTab !== 'string' || (targetTab as string).trim() === '') {
    if (windowRef && typeof windowRef.scrollTo === 'function') {
      windowRef.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return false;
  }

  // 2. Cambiar pestaña si es diferente
  if (activeTab !== targetTab) {
    if (typeof setActiveTab === 'function') {
      setActiveTab(targetTab);
    }
  }

  // 3. Posicionar la vista en la sección correspondiente
  const executeScroll = () => {
    if (!documentRef) {
      if (windowRef && typeof windowRef.scrollTo === 'function') {
        windowRef.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const sectionId = `seccion-${targetTab.toLowerCase().trim()}`;
    const targetElement = documentRef.getElementById(sectionId);

    if (targetElement && typeof targetElement.scrollIntoView === 'function') {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (windowRef && typeof windowRef.scrollTo === 'function') {
      windowRef.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (delayMs > 0 && windowRef && typeof windowRef.setTimeout === 'function') {
    windowRef.setTimeout(executeScroll, delayMs);
  } else {
    executeScroll();
  }

  return true;
}
