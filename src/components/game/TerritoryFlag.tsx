import { Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TerritoryFlagProps {
  color: string;
  colorValue: string;
  isFadingOut?: boolean;
}

export function TerritoryFlag({ color, colorValue, isFadingOut = false }: TerritoryFlagProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center pointer-events-none origin-bottom",
        isFadingOut ? "animate-flag-leave" : "animate-flag-plant"
      )}
    >
      {/* Flag container */}
      <div 
        className="relative"
        style={{
          filter: 'drop-shadow(2px 3px 4px rgba(0,0,0,0.4))',
        }}
      >
        {/* Flag pole */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 w-1 h-10 rounded-full"
          style={{
            background: 'linear-gradient(to right, hsl(35, 30%, 35%), hsl(35, 25%, 50%), hsl(35, 30%, 35%))',
            boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.3)',
          }}
        />
        
        {/* Flag cloth */}
        <div 
          className="relative ml-0.5 -mt-0.5"
          style={{
            width: '28px',
            height: '20px',
          }}
        >
          <svg 
            viewBox="0 0 28 20" 
            className="w-full h-full"
            style={{
              filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))',
            }}
          >
            {/* Waving flag shape */}
            <path
              d="M2 0 
                 C 8 2, 14 -1, 20 1 
                 C 24 2, 26 1, 28 0
                 L 28 18 
                 C 24 17, 20 19, 14 17 
                 C 8 15, 4 18, 2 18 
                 Z"
              fill={colorValue}
            />
            {/* Highlight */}
            <path
              d="M2 0 
                 C 8 2, 14 -1, 20 1 
                 C 24 2, 26 1, 28 0
                 L 28 6 
                 C 24 5, 20 7, 14 5 
                 C 8 3, 4 6, 2 6 
                 Z"
              fill="rgba(255,255,255,0.25)"
            />
            {/* Shadow at bottom */}
            <path
              d="M2 14 
                 C 8 12, 14 15, 20 13 
                 C 24 12, 26 13, 28 14
                 L 28 18 
                 C 24 17, 20 19, 14 17 
                 C 8 15, 4 18, 2 18 
                 Z"
              fill="rgba(0,0,0,0.15)"
            />
          </svg>
        </div>
        
        {/* Pole tip */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 rounded-full"
          style={{
            background: 'linear-gradient(135deg, hsl(45, 80%, 60%), hsl(40, 70%, 45%))',
            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    </div>
  );
}