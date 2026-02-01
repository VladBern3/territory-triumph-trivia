import { useEffect, useRef, useState } from 'react';
import { Territory, Player, TerritoryAnimation } from '@/types/game';
import { Crown } from 'lucide-react';

interface CzechoslovakiaMapProps {
  territories: Territory[];
  players: Player[];
  selectedTerritoryId: string | null;
  onTerritoryClick: (territoryId: string) => void;
  selectableTerritories?: string[];
  highlightedTerritories?: string[];
  currentAnimation?: TerritoryAnimation | null;
}

const playerColorValues: Record<string, string> = {
  red: 'hsl(0, 84%, 60%)',
  blue: 'hsl(217, 91%, 60%)',
  green: 'hsl(142, 76%, 36%)',
  yellow: 'hsl(45, 93%, 47%)',
};

const neutralColor = 'hsl(38, 25%, 85%)';
const gapColor = 'hsl(38, 30%, 92%)'; // Lighter color for gaps between regions
const selectedStrokeColor = 'hsl(38, 70%, 50%)';

export function CzechoslovakiaMap({
  territories,
  players,
  selectedTerritoryId,
  onTerritoryClick,
  selectableTerritories = [],
  highlightedTerritories = [],
  currentAnimation,
}: CzechoslovakiaMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [animationProgress, setAnimationProgress] = useState<Record<string, number>>({});

  // Load SVG content
  useEffect(() => {
    fetch('/map.svg')
      .then(res => res.text())
      .then(text => setSvgContent(text))
      .catch(err => console.error('Failed to load map:', err));
  }, []);

  // Handle capture animation
  useEffect(() => {
    if (!currentAnimation) return;

    const { territoryId, duration, startTime } = currentAnimation;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setAnimationProgress(prev => ({
        ...prev,
        [territoryId]: progress
      }));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [currentAnimation]);

  // Apply styles to SVG paths
  useEffect(() => {
    if (!svgRef.current || territories.length === 0) return;

    const paths = svgRef.current.querySelectorAll('path');
    
    paths.forEach((path, index) => {
      const territoryId = `region-${index + 1}`;
      const territory = territories.find(t => t.id === territoryId);
      
      if (!territory) return;

      const isSelected = territory.id === selectedTerritoryId;
      const isSelectable = selectableTerritories.length === 0 || selectableTerritories.includes(territory.id);
      const isHighlighted = highlightedTerritories.includes(territory.id);
      
      // Get owner color
      let fillColor = neutralColor;
      if (territory.ownerId) {
        const owner = players.find(p => p.id === territory.ownerId);
        if (owner) {
          fillColor = playerColorValues[owner.color];
        }
      }

      // Animation handling
      const animatingPlayer = currentAnimation?.territoryId === territory.id
        ? players.find(p => p.id === currentAnimation.playerId)
        : null;
      const progress = animationProgress[territory.id] || 0;

      if (animatingPlayer && progress > 0 && progress < 1) {
        fillColor = playerColorValues[animatingPlayer.color];
        path.style.opacity = String(0.5 + progress * 0.5);
      } else if (animatingPlayer && progress >= 1) {
        fillColor = playerColorValues[animatingPlayer.color];
        path.style.opacity = '1';
      }

      // Apply styles - use gap color for stroke to create visual separation
      path.style.fill = fillColor;
      path.style.stroke = isSelected ? selectedStrokeColor : gapColor;
      path.style.strokeWidth = isSelected ? '4' : '3'; // Thicker stroke creates gap effect
      path.style.cursor = isSelectable ? 'pointer' : 'not-allowed';
      path.style.transition = 'fill 0.3s ease, stroke 0.2s ease, stroke-width 0.2s ease';
      
      if (!isSelectable) {
        path.style.opacity = '0.6';
      }

      if (isHighlighted) {
        path.style.filter = 'drop-shadow(0 0 8px rgba(255, 200, 50, 0.8))';
      } else if (isSelected) {
        path.style.filter = 'drop-shadow(0 0 12px hsl(38, 70%, 50%))';
      } else {
        path.style.filter = 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.3))';
      }

      // Set up click handler
      path.onclick = () => {
        if (isSelectable) {
          onTerritoryClick(territoryId);
        }
      };

      // Hover effects
      path.onmouseenter = () => {
        if (isSelectable) {
          path.style.filter = 'drop-shadow(0 0 8px rgba(255, 200, 50, 0.6)) brightness(1.1)';
        }
      };
      path.onmouseleave = () => {
        if (isSelected) {
          path.style.filter = 'drop-shadow(0 0 12px hsl(38, 70%, 50%))';
        } else if (isHighlighted) {
          path.style.filter = 'drop-shadow(0 0 8px rgba(255, 200, 50, 0.8))';
        } else {
          path.style.filter = 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.3))';
        }
      };
    });
  }, [territories, players, selectedTerritoryId, selectableTerritories, highlightedTerritories, currentAnimation, animationProgress, onTerritoryClick, svgContent]);

  if (!svgContent) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка карты...</p>
      </div>
    );
  }

  // Get capitals with their owners for rendering crowns
  const capitals = territories.filter(t => t.isCapital && t.ownerId);

  return (
    <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: '1000px' }}>
      <div className="relative w-full h-full max-w-6xl" style={{ transform: 'rotateX(20deg)' }}>
        <svg
          ref={svgRef}
          viewBox="0 0 1499 717"
          className="w-full h-full"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
          style={{ 
            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
          }}
          dangerouslySetInnerHTML={{ __html: svgContent.replace(/<\/?svg[^>]*>/g, '') }}
        />
        
        {/* Capital crowns overlay */}
        {capitals.map(capital => {
          const owner = players.find(p => p.id === capital.ownerId);
          if (!owner) return null;
          
          // Calculate position as percentage of viewBox
          const xPercent = (capital.position.x / 1499) * 100;
          const yPercent = (capital.position.y / 717) * 100;
          
          return (
            <div
              key={capital.id}
              className="absolute flex flex-col items-center pointer-events-none animate-fade-in"
              style={{
                left: `${xPercent}%`,
                top: `${yPercent}%`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              {/* Player name */}
              <span 
                className="text-xs font-bold px-2 py-0.5 rounded-full mb-1 whitespace-nowrap shadow-md"
                style={{ 
                  backgroundColor: playerColorValues[owner.color],
                  color: owner.color === 'yellow' ? '#1a1a1a' : 'white',
                  textShadow: owner.color === 'yellow' ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                {owner.name}
              </span>
              {/* Crown icon */}
              <div 
                className="p-1 rounded-full shadow-lg"
                style={{ 
                  backgroundColor: playerColorValues[owner.color],
                }}
              >
                <Crown 
                  className="w-5 h-5" 
                  style={{ 
                    color: owner.color === 'yellow' ? '#1a1a1a' : 'white',
                    filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))',
                  }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
