import React, { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Registrar el plugin de ScrollTrigger en GSAP
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface GSAPParallaxControllerProps {
  activeTab: string;
}

/**
 * GSAP + ScrollTrigger Parallax Controller
 * Aplica efectos de expansión suave, desplazamiento con paralaje de imágenes y
 * animación de profundidad de contenido a medida que el usuario hace scroll.
 */
export const GSAPParallaxController: React.FC<GSAPParallaxControllerProps> = ({ activeTab }) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Timer corto para permitir que el DOM de React termine de renderizar los elementos
    const ctx = gsap.context(() => {
      // 1. Tarjetas y secciones que se expanden suavemente al hacer scroll
      const expandCards = document.querySelectorAll('.gsap-expand-card, [id^="service-card-"], [id^="barber-card-"]');
      expandCards.forEach((card) => {
        gsap.fromTo(
          card,
          {
            scale: 0.94,
            opacity: 0.75,
            y: 25,
            transformOrigin: 'center center',
          },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 90%',
              end: 'top 50%',
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          }
        );
      });

      // 2. Imágenes con efecto Parallax y zoom progresivo (sin recortar emblemas de contenedores pequeños)
      const parallaxImgs = document.querySelectorAll('.gsap-parallax-img, img[data-parallax="true"]');
      parallaxImgs.forEach((img) => {
        // Si la imagen está dentro de un contenedor pequeño (ej. avatar, logo), no desplazar Y para evitar recorte superior
        const isAvatarOrLogo = img.closest('.w-11, .w-12, .w-14, .w-16, .rounded-full, .rounded-xl, .rounded-2xl');
        
        gsap.fromTo(
          img,
          {
            y: isAvatarOrLogo ? 0 : -10,
            scale: 1.0,
          },
          {
            y: isAvatarOrLogo ? 0 : 15,
            scale: 1.05,
            ease: 'none',
            scrollTrigger: {
              trigger: img,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.0,
            },
          }
        );
      });

      // 3. Encabezados y textos con flotación sutil de profundización
      const parallaxTexts = document.querySelectorAll('.gsap-parallax-text, h1, h2');
      parallaxTexts.forEach((text) => {
        gsap.fromTo(
          text,
          {
            y: 15,
            opacity: 0.8,
          },
          {
            y: 0,
            opacity: 1,
            ease: 'power1.out',
            scrollTrigger: {
              trigger: text,
              start: 'top 92%',
              end: 'top 65%',
              scrub: 0.6,
            },
          }
        );
      });

      // 4. Banner héroe expansión de fondo
      const heroBanners = document.querySelectorAll('#seccion-reservar, #seccion-servicios, .gsap-hero-container');
      heroBanners.forEach((hero) => {
        gsap.fromTo(
          hero,
          {
            scale: 0.98,
            borderRadius: '24px',
          },
          {
            scale: 1,
            borderRadius: '16px',
            ease: 'power2.out',
            scrollTrigger: {
              trigger: hero,
              start: 'top 95%',
              end: 'top 30%',
              scrub: 0.8,
            },
          }
        );
      });

      // Refrescar disparadores tras la construcción inicial
      ScrollTrigger.refresh();
    });

    return () => {
      ctx.revert(); // Limpieza limpia de animaciones GSAP al cambiar de pestaña
    };
  }, [activeTab]);

  return null;
};
