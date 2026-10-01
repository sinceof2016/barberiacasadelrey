import logoJpg from '../assets/logo-casa-del-rey.jpg';
import logoWebp from '../assets/logo-casa-del-rey.webp';
import logoWebp400 from '../assets/logo-casa-del-rey-400w.webp';
import logoWebp800 from '../assets/logo-casa-del-rey-800w.webp';
import logoJpg400 from '../assets/logo-casa-del-rey-400w.jpg';
import bgJpg from '../assets/barber-chair-bg.jpg';
import bgWebp from '../assets/barber-chair-bg.webp';

// Servicios optimizados
import comboCabelloWebp from '../assets/images/combo_cabello_barba_cejas.webp';
import comboCabelloWebp400 from '../assets/images/combo_cabello_barba_cejas-400w.webp';
import comboCabelloWebp800 from '../assets/images/combo_cabello_barba_cejas-800w.webp';
import comboCabelloJpg400 from '../assets/images/combo_cabello_barba_cejas-400w.jpg';

import corteCabelloWebp from '../assets/images/corte_cabello_cejas.webp';
import corteCabelloWebp400 from '../assets/images/corte_cabello_cejas-400w.webp';
import corteCabelloWebp800 from '../assets/images/corte_cabello_cejas-800w.webp';
import corteCabelloJpg400 from '../assets/images/corte_cabello_cejas-400w.jpg';

/**
 * URLs de activos gestionadas directamente por el empaquetador Vite.
 * Esto garantiza compatibilidad total con GitHub Pages (incluyendo subdirectorios /nombre-del-repo/)
 * evitando errores 404 causados por rutas absolutas con barra inicial "/".
 */
export const LOGO_CASA_DEL_REY = logoWebp;
export const LOGO_CASA_DEL_REY_FALLBACK = logoJpg;
export const LOGO_CASA_DEL_REY_WEBP = logoWebp;
export const LOGO_SRCSET_WEBP = `${logoWebp400} 400w, ${logoWebp800} 800w`;

export const BG_BARBERIA = bgWebp;
export const BG_BARBERIA_FALLBACK = bgJpg;
export const BG_BARBERIA_WEBP = bgWebp;

// Servicios exportados con alta compresión WebP y versiones responsive
export const COMBO_CABELLO_BARBA_CEJAS_IMG = comboCabelloWebp;
export const COMBO_CABELLO_SRCSET = `${comboCabelloWebp400} 400w, ${comboCabelloWebp800} 800w`;
export const COMBO_CABELLO_FALLBACK = comboCabelloJpg400;

export const CORTE_CABELLO_CEJAS_IMG = corteCabelloWebp;
export const CORTE_CABELLO_SRCSET = `${corteCabelloWebp400} 400w, ${corteCabelloWebp800} 800w`;
export const CORTE_CABELLO_FALLBACK = corteCabelloJpg400;

/**
 * Enlaces directos a imágenes de alta definición estilo Heritage Barber / Barbería La Casa del Rey
 */
export const HERITAGE_EMBLEM_LOGO = logoWebp400;
export const HERITAGE_EMBLEM_FALLBACK = logoJpg400;
export const HERITAGE_AVATAR_PROFILE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyx-nxBvXasQYDmQSHVyWavrGRGB63W66FsrYg-z3f65_srEmwIxUEjj-Szo_qFunf73kSOJLGCSAH9vQitbQQ6KT5bfJYbxs8uDBt7oZ-ekLeKph6LxEdaOMazLSO_589Y85G7F3hOrCecleeqW-J3ykfbXBo6fWSZfe3WOIuBhZEWzxxeOp8u2_2mvt-eregFXjDzU4u3PWrThglFdIZDeV7FFrYbSEYi9xh1W27WEj9PPg_wY1e_A';
export const HERITAGE_BANNER_MASTER = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrvFvmIhvCOtxoFPRK9Wcu2IESmM8m0eh2h-SgaPbDsN_zVoWr70ZoG9eyQUK9pjpYCseuO4Fz8ZN-e7KKat7MC-wjwyIVt5goOSp5L3ddscGdRgXx79DbgbzZYmVPr4bY80CNgt9I1gFLvRgiVSTrzqnxlmxgUnAhCbl47Gp-QRQ35SNLTu5YU1KZ7nLk-jj_HiDvUPXTkKUmzIUWROu3E4aoXNR1MjmgqxpaG58b1sbuChIa5fPEAw';

/**
 * Catálogo curado de avatares fotográficos de maestros barberos estilo vintage
 */
export const PRESET_BARBER_AVATARS = [
  {
    id: 'avatar-heritage',
    nombre: 'Maestro Clásico Tradicional',
    url: HERITAGE_AVATAR_PROFILE,
  },
  {
    id: 'avatar-fade',
    nombre: 'Lord Fade & Pompadour',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'avatar-barba',
    nombre: 'Maestro Barbero Imperial',
    url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'avatar-oldschool',
    nombre: 'Old School Británico',
    url: 'https://images.unsplash.com/photo-1517832606589-7629c3397143?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'avatar-navaja',
    nombre: 'Cirujano de Navaja Libre',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'avatar-estilista',
    nombre: 'Estilismo & Tijera Clásica',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  }
];

/**
 * Resuelve una ruta pública de forma relativa o prefijada con BASE_URL para entornos GitHub Pages
 */
export function resolvePublicAsset(fileName: string): string {
  const clean = fileName.replace(/^\/+/, '');
  const base = import.meta.env.BASE_URL || './';
  return `${base.endsWith('/') ? base : base + '/'}${clean}`;
}
