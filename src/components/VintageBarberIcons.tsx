import React from 'react';

// 1. Classic Vintage Barber Pole with Brass Finials and Spiraled Stripes
export const VintageBarberPole: React.FC<{ className?: string; animated?: boolean }> = ({ 
  className = "w-6 h-6",
  animated = false
}) => (
  <svg 
    viewBox="0 0 64 64" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    role="img"
    aria-label="Poste de Barbero Clásico"
  >
    {/* Brass Top Finial / Acorn */}
    <path d="M32 4C34.2 4 36 5.8 36 8C36 9.8 34.8 11.3 33.2 11.8L35 14H29L30.8 11.8C29.2 11.3 28 9.8 28 8C28 5.8 29.8 4 32 4Z" fill="#C59B27" stroke="#8A661C" strokeWidth="1.2" />
    <path d="M24 14H40C41.1 14 42 14.9 42 16V18H22V16C22 14.9 22.9 14 24 14Z" fill="#D4A373" stroke="#8A661C" strokeWidth="1.2" />
    
    {/* Glass Cylinder Frame */}
    <rect x="23" y="18" width="18" height="32" rx="2" fill="#14100E" stroke="#8A661C" strokeWidth="1.2" />
    
    {/* Slanted Barber Pole Stripes (Clip path) */}
    <g clipPath="url(#pole-clip)">
      <rect x="24" y="18" width="16" height="32" fill="#FAF6EE" />
      {/* Crimson Stripes */}
      <path d="M20 22L36 14L44 18L28 26Z" fill="#9E2A2B" />
      <path d="M20 34L36 26L44 30L28 38Z" fill="#9E2A2B" />
      <path d="M20 46L36 38L44 42L28 50Z" fill="#9E2A2B" />
      {/* Navy Stripes */}
      <path d="M20 28L36 20L44 24L28 32Z" fill="#1D3557" />
      <path d="M20 40L36 32L44 36L28 44Z" fill="#1D3557" />
      <path d="M20 52L36 44L44 48L28 56Z" fill="#1D3557" />
      {/* Brass Accent Ringlet */}
      <line x1="24" y1="18" x2="40" y2="18" stroke="#C59B27" strokeWidth="1" />
      <line x1="24" y1="50" x2="40" y2="50" stroke="#C59B27" strokeWidth="1" />
    </g>

    {/* Glass Reflection Highlight */}
    <path d="M26 19V49" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />

    {/* Brass Bottom Finial */}
    <path d="M22 50H42V52C42 53.1 41.1 54 40 54H24C22.9 54 22 53.1 22 52V50Z" fill="#D4A373" stroke="#8A661C" strokeWidth="1.2" />
    <path d="M28 54H36L34 58C34 59.1 33.1 60 32 60C30.9 60 30 59.1 30 58L28 54Z" fill="#C59B27" stroke="#8A661C" strokeWidth="1.2" />

    {/* Wall Mount Bracket / Arm */}
    <path d="M14 22H22M14 46H22M14 18V50" stroke="#8A661C" strokeWidth="1.8" strokeLinecap="round" />
    
    <defs>
      <clipPath id="pole-clip">
        <rect x="24" y="18" width="16" height="32" rx="1" />
      </clipPath>
    </defs>
  </svg>
);

// 2. Vintage Straight Razor (Navaja Clásica de Barbero)
export const StraightRazorIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    role="img"
    aria-label="Navaja Clásica"
  >
    {/* Dark Walnut / Horn Handle */}
    <path 
      d="M6 34C10 38 24 44 42 38C43.5 37.5 44 35.8 43.2 34.5C42 32.5 38 28 26 27C14 26 8 30 6 34Z" 
      fill="#2E2019" 
      stroke="#C59B27" 
      strokeWidth="1.5" 
    />
    {/* Brass Pivot Rivet */}
    <circle cx="10" cy="33" r="2.2" fill="#D4A373" stroke="#8A661C" strokeWidth="1" />
    {/* Inlay Wood Pattern */}
    <path d="M16 33C24 35 32 34 38 32" stroke="#4A3427" strokeWidth="1.2" strokeLinecap="round" />

    {/* High-Grade Steel Blade angled upward */}
    <path 
      d="M10 31L22 13C23 11.5 25 11 27 12L42 19.5C43 20 43.5 21 43 22L39 30L26 23.5L12 33L10 31Z" 
      fill="#E2E8F0" 
      stroke="#718096" 
      strokeWidth="1.3" 
    />
    {/* Honed Cutting Edge line */}
    <path d="M22 13L42 19.5" stroke="#FAF6EE" strokeWidth="1.5" />
    {/* Hollow Ground Ridge */}
    <path d="M15 26L35 20" stroke="#94A3B8" strokeWidth="1" strokeDasharray="1 2" />
    {/* Barber Master Stamp on tang */}
    <circle cx="13" cy="28" r="1" fill="#C59B27" />
  </svg>
);

// 3. Ornate Vintage Barber Shears / Scissors (Tijeras Clásicas de Filigrana)
export const VintageScissorsIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    role="img"
    aria-label="Tijeras de Barbero"
  >
    {/* Left Finger Loop (Ornate Brass) */}
    <circle cx="12" cy="38" r="7" stroke="#C59B27" strokeWidth="2.2" fill="#1C1613" />
    <path d="M12 45V47" stroke="#C59B27" strokeWidth="2" strokeLinecap="round" />
    
    {/* Right Finger Loop (With finger rest / tang) */}
    <circle cx="36" cy="38" r="7" stroke="#C59B27" strokeWidth="2.2" fill="#1C1613" />
    <path d="M43 38C44.5 40 45.5 43 45 45" stroke="#C59B27" strokeWidth="1.8" strokeLinecap="round" />

    {/* Blade 1 (Left loop to right tip) */}
    <path 
      d="M16 33L24 24L38 6C38 6 36 10 32 16L24 24L17 33" 
      fill="#CBD5E1" 
      stroke="#475569" 
      strokeWidth="1.2" 
    />

    {/* Blade 2 (Right loop to left tip) */}
    <path 
      d="M32 33L24 24L10 6C10 6 12 10 16 16L24 24L31 33" 
      fill="#E2E8F0" 
      stroke="#475569" 
      strokeWidth="1.2" 
    />

    {/* Central Brass Pivot Screw with Ruby/Amber Jewel */}
    <circle cx="24" cy="24" r="3.2" fill="#D4A373" stroke="#8A661C" strokeWidth="1.2" />
    <circle cx="24" cy="24" r="1.2" fill="#8B263E" />
  </svg>
);

// 4. Gentleman's Handlebar Mustache (Bigote Clásico Dandy)
export const VintageMustacheIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg 
    viewBox="0 0 48 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    role="img"
    aria-label="Bigote Clásico"
  >
    <path 
      d="M24 8C20 3 13 2 7 6C2 9.5 1 15 4 17C6.5 18.5 10 17 12 14C15 10 19 10 24 13C29 10 33 10 36 14C38 17 41.5 18.5 44 17C47 15 46 9.5 41 6C35 2 28 3 24 8Z" 
      fill="#C59B27" 
      stroke="#8A661C" 
      strokeWidth="1.5" 
      strokeLinejoin="round" 
    />
  </svg>
);

// 5. Classic Badger Shaving Brush (Brocha de Afeitar Tradicional)
export const VintageShavingBrushIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    role="img"
    aria-label="Brocha de Afeitar"
  >
    {/* Badger Bristles (Dark tip, creamy center, dark base) */}
    <path 
      d="M17 18C15 14 16 7 24 4C32 7 33 14 31 18H17Z" 
      fill="#FAF6EE" 
      stroke="#C59B27" 
      strokeWidth="1.2" 
    />
    <path d="M19 14C21 11 27 11 29 14" stroke="#716253" strokeWidth="2" strokeLinecap="round" />
    <path d="M22 6C23 5 25 5 26 6" stroke="#2E2019" strokeWidth="2" strokeLinecap="round" />

    {/* Brass Collar Ring */}
    <rect x="17" y="18" width="14" height="4" rx="1" fill="#D4A373" stroke="#8A661C" strokeWidth="1" />

    {/* Turned Ivory / Mahogany Handle */}
    <path 
      d="M19 22C17 25 15 28 17 34C18 37 18 41 24 42C30 41 30 37 31 34C33 28 31 25 29 22H19Z" 
      fill="#2E2019" 
      stroke="#C59B27" 
      strokeWidth="1.5" 
    />
    <circle cx="24" cy="33" r="2" fill="#D4A373" />
  </svg>
);

// 6. Royal Crest / Vintage Heraldic Crown
export const VintageCrownCrest: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    role="img"
    aria-label="Corona de la Casa del Rey"
  >
    {/* Velvet Cap Interior */}
    <path d="M10 32C10 24 16 18 24 18C32 18 38 24 38 32H10Z" fill="#8B263E" opacity="0.6" />
    
    {/* Crown Base Band with Jewels */}
    <rect x="8" y="32" width="32" height="6" rx="1.5" fill="#C59B27" stroke="#8A661C" strokeWidth="1.2" />
    <circle cx="14" cy="35" r="1.2" fill="#8B263E" />
    <circle cx="24" cy="35" r="1.5" fill="#1D3557" />
    <circle cx="34" cy="35" r="1.2" fill="#8B263E" />

    {/* Gilded Crown Spires */}
    <path 
      d="M8 32L11 19L18 27L24 14L30 27L37 19L40 32H8Z" 
      fill="#D4A373" 
      stroke="#C59B27" 
      strokeWidth="1.5" 
      strokeLinejoin="round" 
    />
    
    {/* Pearl / Jewels on tips */}
    <circle cx="11" cy="18" r="1.8" fill="#FAF6EE" stroke="#C59B27" strokeWidth="1" />
    <circle cx="24" cy="13" r="2.2" fill="#FAF6EE" stroke="#C59B27" strokeWidth="1" />
    <circle cx="37" cy="18" r="1.8" fill="#FAF6EE" stroke="#C59B27" strokeWidth="1" />
  </svg>
);

export const VintageCrownIcon = VintageCrownCrest;

// 7. Decorative Barber Pole Ribbon / Divider (Horizontal banner)
export const BarberPoleRibbon: React.FC<{ className?: string }> = ({ className = "h-1.5 w-full" }) => (
  <div 
    className={`w-full overflow-hidden ${className}`}
    style={{
      background: 'repeating-linear-gradient(45deg, #9E2A2B 0px, #9E2A2B 12px, #FAF6EE 12px, #FAF6EE 24px, #1D3557 24px, #1D3557 36px, #FAF6EE 36px, #FAF6EE 48px)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
    }}
  />
);

// 8. Vintage Seal / Stamp
export const VintageWaxSeal: React.FC<{ text?: string; className?: string }> = ({ 
  text = "EST. 2016", 
  className = "" 
}) => (
  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-[#C59B27]/40 bg-[#261B16] text-[#D4A373] text-[10px] font-mono tracking-widest uppercase shadow-sm ${className}`}>
    <VintageBarberPole className="w-3.5 h-3.5 shrink-0" />
    <span className="font-bold">{text}</span>
  </div>
);
