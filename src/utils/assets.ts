import logoJpg from '../assets/logo-casa-del-rey.jpg';
import logoWebp from '../assets/logo-casa-del-rey.webp';
import bgJpg from '../assets/barber-chair-bg.jpg';
import bgWebp from '../assets/barber-chair-bg.webp';

/**
 * URLs de activos gestionadas directamente por el empaquetador Vite.
 * Esto garantiza compatibilidad total con GitHub Pages (incluyendo subdirectorios /nombre-del-repo/)
 * evitando errores 404 causados por rutas absolutas con barra inicial "/".
 */
export const LOGO_CASA_DEL_REY = logoJpg;
export const LOGO_CASA_DEL_REY_WEBP = logoWebp;
export const BG_BARBERIA = bgJpg;
export const BG_BARBERIA_WEBP = bgWebp;

/**
 * Enlaces directos a imágenes de alta definición estilo Heritage Barber / Barbería La Casa del Rey
 */
export const HERITAGE_EMBLEM_LOGO = logoJpg;
export const HERITAGE_AVATAR_PROFILE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyx-nxBvXasQYDmQSHVyWavrGRGB63W66FsrYg-z3f65_srEmwIxUEjj-Szo_qFunf73kSOJLGCSAH9vQitbQQ6KT5bfJYbxs8uDBt7oZ-ekLeKph6LxEdaOMazLSO_589Y85G7F3hOrCecleeqW-J3ykfbXBo6fWSZfe3WOIuBhZEWzxxeOp8u2_2mvt-eregFXjDzU4u3PWrThglFdIZDeV7FFrYbSEYi9xh1W27WEj9PPg_wY1e_A';
export const HERITAGE_BANNER_MASTER = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrvFvmIhvCOtxoFPRK9Wcu2IESmM8m0eh2h-SgaPbDsN_zVoWr70ZoG9eyQUK9pjpYCseuO4Fz8ZN-e7KKat7MC-wjwyIVt5goOSp5L3ddscGdRgXx79DbgbzZYmVPr4bY80CNgt9I1gFLvRgiVSTrzqnxlmxgUnAhCbl47Gp-QRQ35SNLTu5YU1KZ7nLk-jj_HiDvUPXTkKUmzIUWROu3E4aoXNR1MjmgqxpaG58b1sbuChIa5fPEAw';

/**
 * Resuelve una ruta pública de forma relativa o prefijada con BASE_URL para entornos GitHub Pages
 */
export function resolvePublicAsset(fileName: string): string {
  const clean = fileName.replace(/^\/+/, '');
  const base = import.meta.env.BASE_URL || './';
  return `${base.endsWith('/') ? base : base + '/'}${clean}`;
}
