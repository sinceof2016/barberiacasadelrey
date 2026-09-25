import { handleTabNavigationWithScroll } from './navigationScroll';
import { TabType } from '../components/Navbar';

/**
 * Suite de Pruebas Unitarias para Navegación y Scroll Suave
 * Barbería La Casa del Rey - Control de Calidad (QA)
 */

export function runNavigationScrollTests() {
  const testResults: Array<{ name: string; success: boolean; details: string }> = [];

  // PRUEBA 1: Comportamiento Esperado (Clic en Servicios con elemento existente)
  try {
    let activeTabCalledWith = '';
    let preventDefaultCalled = false;
    let scrollIntoViewCalled = false;

    const mockDocument = {
      getElementById: (id: string) => {
        if (id === 'seccion-servicios') {
          return {
            scrollIntoView: (opts: any) => {
              if (opts.behavior === 'smooth' && opts.block === 'start') {
                scrollIntoViewCalled = true;
              }
            }
          } as unknown as HTMLElement;
        }
        return null;
      }
    } as unknown as Document;

    const mockWindow = {
      scrollTo: () => {},
      setTimeout: (fn: Function) => fn()
    } as unknown as Window;

    const res = handleTabNavigationWithScroll({
      activeTab: 'reservar',
      targetTab: 'servicios',
      setActiveTab: (tab) => { activeTabCalledWith = tab; },
      event: { preventDefault: () => { preventDefaultCalled = true; } },
      delayMs: 0,
      documentRef: mockDocument,
      windowRef: mockWindow
    });

    const passed = res === true && activeTabCalledWith === 'servicios' && preventDefaultCalled && scrollIntoViewCalled;
    testResults.push({
      name: 'Prueba 1: Comportamiento Esperado (#seccion-servicios existe)',
      success: passed,
      details: passed ? 'Éxito: Cambió pestaña a "servicios" y llamó scrollIntoView smooth.' : 'Fallo en aserciones de Comportamiento Esperado.'
    });
  } catch (err: any) {
    testResults.push({ name: 'Prueba 1', success: false, details: err.message });
  }

  // PRUEBA 2: Entradas Inválidas (targetTab numérico o erróneo)
  try {
    let scrollToCalled = false;
    const mockWindow = {
      scrollTo: () => { scrollToCalled = true; },
      setTimeout: (fn: Function) => fn()
    } as unknown as Window;

    const res = handleTabNavigationWithScroll({
      activeTab: 'servicios',
      targetTab: 12345 as unknown as TabType,
      setActiveTab: () => {},
      delayMs: 0,
      windowRef: mockWindow
    });

    const passed = res === false && scrollToCalled;
    testResults.push({
      name: 'Prueba 2: Entradas Inválidas (tipo no cadena)',
      success: passed,
      details: passed ? 'Éxito: Retornó false y realizó fallback a top 0.' : 'Fallo en validación de tipos.'
    });
  } catch (err: any) {
    testResults.push({ name: 'Prueba 2', success: false, details: err.message });
  }

  // PRUEBA 3: Valores Vacíos
  try {
    let scrollToCalled = false;
    const mockWindow = {
      scrollTo: () => { scrollToCalled = true; },
      setTimeout: (fn: Function) => fn()
    } as unknown as Window;

    const res = handleTabNavigationWithScroll({
      activeTab: 'servicios',
      targetTab: '   ' as TabType,
      setActiveTab: () => {},
      delayMs: 0,
      windowRef: mockWindow
    });

    const passed = res === false && scrollToCalled;
    testResults.push({
      name: 'Prueba 3: Valores Vacíos (cadena con espacios)',
      success: passed,
      details: passed ? 'Éxito: Rechazó cadena vacía sin cambiar estado.' : 'Fallo con cadena vacía.'
    });
  } catch (err: any) {
    testResults.push({ name: 'Prueba 3', success: false, details: err.message });
  }

  // PRUEBA 4: Errores Esperados / Fallback (Elemento no encontrado en DOM)
  try {
    let scrollToCalled = false;
    const mockDocument = {
      getElementById: () => null
    } as unknown as Document;

    const mockWindow = {
      scrollTo: (opts: any) => {
        if (opts.top === 0 && opts.behavior === 'smooth') scrollToCalled = true;
      },
      setTimeout: (fn: Function) => fn()
    } as unknown as Window;

    const res = handleTabNavigationWithScroll({
      activeTab: 'servicios',
      targetTab: 'api' as TabType,
      setActiveTab: () => {},
      delayMs: 0,
      documentRef: mockDocument,
      windowRef: mockWindow
    });

    const passed = res === true && scrollToCalled;
    testResults.push({
      name: 'Prueba 4: Errores Esperados (Elemento inexistente -> Fallback a scrollTo)',
      success: passed,
      details: passed ? 'Éxito: Ejecutó fallback suave a la cima de la pantalla.' : 'Fallo en fallback de elemento inexistente.'
    });
  } catch (err: any) {
    testResults.push({ name: 'Prueba 4', success: false, details: err.message });
  }

  // PRUEBA 5: Casos Poco Comunes (Llamada en la misma pestaña activa)
  try {
    let setActiveTabCalled = false;
    let scrollIntoViewCalled = false;

    const mockDocument = {
      getElementById: (id: string) => {
        if (id === 'seccion-servicios') {
          return { scrollIntoView: () => { scrollIntoViewCalled = true; } } as unknown as HTMLElement;
        }
        return null;
      }
    } as unknown as Document;

    const mockWindow = {
      scrollTo: () => {},
      setTimeout: (fn: Function) => fn()
    } as unknown as Window;

    const res = handleTabNavigationWithScroll({
      activeTab: 'servicios',
      targetTab: 'servicios',
      setActiveTab: () => { setActiveTabCalled = true; },
      delayMs: 0,
      documentRef: mockDocument,
      windowRef: mockWindow
    });

    const passed = res === true && !setActiveTabCalled && scrollIntoViewCalled;
    testResults.push({
      name: 'Prueba 5: Casos Poco Comunes (Clic repetido en la misma pestaña activa)',
      success: passed,
      details: passed ? 'Éxito: Omitió re-render redundante de estado pero ejecutó el scroll suave.' : 'Fallo en manejo de pestaña idéntica.'
    });
  } catch (err: any) {
    testResults.push({ name: 'Prueba 5', success: false, details: err.message });
  }

  return testResults;
}
