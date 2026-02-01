import React from 'react';

interface TiltCardProps {
  imageSrc: string | null;
  label: string;
  isActive: boolean;
  stepNumber: number;
}

export const TiltCard: React.FC<TiltCardProps> = ({ imageSrc, label, isActive, stepNumber }) => {
  // Visual logic: 
  // Step 1: Tilted left
  // Step 2: Straight / Slight tilt
  // Step 3: Tilted right
  // Active card pops up slightly
  
  let transformClass = '';
  if (stepNumber === 1) transformClass = '-rotate-6 translate-y-2';
  if (stepNumber === 2) transformClass = 'rotate-0 -translate-y-2 z-10';
  if (stepNumber === 3) transformClass = 'rotate-6 translate-y-2';

  const activeClass = isActive 
    ? 'ring-4 ring-indigo-500 shadow-2xl scale-105' 
    : 'opacity-80 grayscale-[0.3] hover:opacity-100 hover:grayscale-0';

  return (
    <div 
      className={`relative w-28 h-40 sm:w-40 sm:h-56 md:w-48 md:h-72 rounded-2xl overflow-hidden transition-all duration-500 ease-out transform ${transformClass} ${activeClass} bg-white shadow-lg border border-slate-200`}
    >
      {imageSrc ? (
        <img src={imageSrc} alt={label} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
          <span className="text-4xl mb-2 font-thin text-slate-300">{stepNumber}</span>
          <span className="text-xs sm:text-sm font-medium">{label}</span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <p className="text-white text-xs sm:text-sm font-bold text-center">{label}</p>
      </div>
    </div>
  );
};