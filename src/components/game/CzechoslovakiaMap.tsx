import { useEffect, useRef, useState, useCallback } from 'react';
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

// Dynamic territory centers calculated from SVG path bounding boxes
interface TerritoryCenter {
  x: number;
  y: number;
}

const playerColorValues: Record<string, string> = {
  red: 'hsl(0, 84%, 60%)',
  blue: 'hsl(217, 91%, 60%)',
  green: 'hsl(142, 76%, 36%)',
  yellow: 'hsl(45, 93%, 47%)',
};

const neutralColor = 'hsl(38, 25%, 85%)';
const gapColor = 'transparent';
const selectedStrokeColor = 'hsl(38, 70%, 50%)';
const mapBackgroundColor = 'hsl(220, 60%, 20%)';

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
  const [hoveredTerritory, setHoveredTerritory] = useState<string | null>(null);
  const [territoryCenters, setTerritoryCenters] = useState<Record<string, TerritoryCenter>>({});

  // Calculate territory centers from actual SVG path bounding boxes
  const calculateTerritoryCenters = useCallback(() => {
    if (!svgRef.current) return;
    
    const paths = svgRef.current.querySelectorAll('path');
    const centers: Record<string, TerritoryCenter> = {};
    
    paths.forEach((path, index) => {
      const territoryId = `region-${index + 1}`;
      try {
        const bbox = path.getBBox();
        centers[territoryId] = {
          x: bbox.x + bbox.width / 2,
          y: bbox.y + bbox.height / 2,
        };
      } catch (e) {
        // Fallback if getBBox fails
        centers[territoryId] = { x: 400, y: 300 };
      }
    });
    
    setTerritoryCenters(centers);
  }, []);

  // Load SVG content
  useEffect(() => {
    fetch('/map.svg')
      .then(res => res.text())
      .then(text => setSvgContent(text))
      .catch(err => console.error('Failed to load map:', err));
  }, []);

  // Calculate centers after SVG is loaded and rendered
  useEffect(() => {
    if (svgContent && svgRef.current) {
      // Small delay to ensure SVG is fully rendered
      const timer = setTimeout(calculateTerritoryCenters, 100);
      return () => clearTimeout(timer);
    }
  }, [svgContent, calculateTerritoryCenters]);

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

      // Hover effects with attack indicator
      path.onmouseenter = () => {
        if (isSelectable && selectableTerritories.length > 0) {
          path.style.filter = 'drop-shadow(0 0 8px rgba(255, 200, 50, 0.6)) brightness(1.1)';
          setHoveredTerritory(territoryId);
        }
      };
      path.onmouseleave = () => {
        setHoveredTerritory(null);
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

  // Get hovered territory position for attack indicator
  const hoveredTerritoryData = hoveredTerritory ? territories.find(t => t.id === hoveredTerritory) : null;
  const hoveredCenter = hoveredTerritory ? territoryCenters[hoveredTerritory] : null;

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center rounded-xl overflow-hidden" 
      style={{ 
        perspective: '1000px',
        backgroundColor: mapBackgroundColor,
      }}
    >
      <div className="relative w-full h-full max-w-6xl" style={{ transform: 'rotateX(20deg)' }}>
        <svg
          ref={svgRef}
          viewBox="0 0 1499 717"
          className="w-full h-full"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
          style={{ 
            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
          }}
          dangerouslySetInnerHTML={{ __html: svgContent.replace(/<\/?svg[^>]*>/g, '') }}
        />
        
        {/* Selection indicator arrow - 3D style for settlement phase */}
        {hoveredCenter && selectableTerritories.length > 0 && selectableTerritories.includes(hoveredTerritory!) && (
          <div
            className="absolute pointer-events-none animate-bounce"
            style={{
              left: `${(hoveredCenter.x / 1499) * 100}%`,
              top: `${(hoveredCenter.y / 717) * 100}%`,
              transform: 'translate(-50%, -100%)',
              marginTop: '-20px',
            }}
          >
            {/* 3D Arrow indicator */}
            <div className="relative flex flex-col items-center">
              {/* "ВЫБРАТЬ" label */}
              <span 
                className="text-xs font-bold px-2 py-0.5 rounded mb-1 whitespace-nowrap"
                style={{
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                ВЫБРАТЬ
              </span>
              
              {/* 3D Arrow */}
              <svg 
                width="40" 
                height="50" 
                viewBox="0 0 40 50" 
                className="drop-shadow-lg"
                style={{
                  filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.5))',
                }}
              >
                {/* Arrow back face (3D effect) */}
                <polygon 
                  points="20,50 5,20 15,20 15,0 25,0 25,20 35,20" 
                  fill="hsl(142, 60%, 25%)"
                />
                {/* Arrow front face */}
                <polygon 
                  points="20,46 8,18 16,18 16,2 24,2 24,18 32,18" 
                  fill="hsl(142, 70%, 40%)"
                />
                {/* Arrow highlight */}
                <polygon 
                  points="16,2 24,2 24,18 32,18 20,46" 
                  fill="url(#arrowGradient)"
                  opacity="0.4"
                />
                <defs>
                  <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        )}
        
        {/* Capital crowns overlay */}
        {capitals.map(capital => {
          const owner = players.find(p => p.id === capital.ownerId);
          if (!owner) return null;
          
          // Use dynamically calculated center from SVG bounding box
          const center = territoryCenters[capital.id];
          if (!center) return null;
          
          const xPercent = (center.x / 1499) * 100;
          const yPercent = (center.y / 717) * 100;
          
          return (
            <div
              key={capital.id}
              className="absolute flex flex-col items-center pointer-events-none animate-fade-in"
              style={{
                left: `${xPercent}%`,
                top: `${yPercent}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Player name above crown */}
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
                className="p-1.5 rounded-full shadow-lg"
                style={{ 
                  backgroundColor: playerColorValues[owner.color],
                }}
              >
                <Crown 
                  className="w-6 h-6" 
                  style={{ 
                    color: owner.color === 'yellow' ? '#1a1a1a' : 'white',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
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
