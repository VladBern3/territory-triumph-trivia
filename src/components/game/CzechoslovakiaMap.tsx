import { useEffect, useRef, useState, useCallback } from 'react';
import { Territory, Player, TerritoryAnimation } from '@/types/game';
import { Crown } from 'lucide-react';
import { TerritoryFlag } from './TerritoryFlag';

interface CzechoslovakiaMapProps {
  territories: Territory[];
  players: Player[];
  selectedTerritoryId: string | null;
  onTerritoryClick: (territoryId: string) => void;
  selectableTerritories?: string[];
  highlightedTerritories?: string[];
  currentAnimation?: TerritoryAnimation | null;
  isMyTurn?: boolean; // Whether it's the local player's turn
  showUnavailableMask?: boolean; // Whether to show diagonal stripes on unavailable territories
  gamePhase?: 'settlement' | 'war' | 'capital_battle' | string; // Current game phase
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
const mapBackgroundColor = 'transparent';

export function CzechoslovakiaMap({
  territories,
  players,
  selectedTerritoryId,
  onTerritoryClick,
  selectableTerritories = [],
  highlightedTerritories = [],
  currentAnimation,
  isMyTurn = true,
  showUnavailableMask = false,
  gamePhase = 'settlement',
}: CzechoslovakiaMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [animationProgress, setAnimationProgress] = useState<Record<string, number>>({});
  const [territoryCenters, setTerritoryCenters] = useState<Record<string, TerritoryCenter>>({});
  // Track territories that should show flags with fade state
  const [visibleFlags, setVisibleFlags] = useState<Map<string, { playerId: string; isFadingOut: boolean }>>(new Map());

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

  // Load SVG content with cache-busting
  useEffect(() => {
    const cacheBuster = `?v=${Date.now()}`;
    fetch(`/map.svg${cacheBuster}`)
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

  // Handle capture animation and flag display
  // Refs to store timer IDs so we can clean them up
  const flagTimersRef = useRef<Map<string, { fadeOut?: NodeJS.Timeout; remove?: NodeJS.Timeout }>>(new Map());
  
  // Handle capture animation and flag display
  useEffect(() => {
    if (!currentAnimation) return;

    const { territoryId, duration, startTime, playerId } = currentAnimation;
    
    // Check if we should show flags (not for capitals, not during initializing phase)
    const territory = territories.find(t => t.id === territoryId);
    const shouldShowFlag = !territory?.isCapital && 
      (gamePhase === 'settlement' || gamePhase === 'war' || gamePhase === 'capital_battle');
    
    // Clear any existing timers for this territory
    const existingTimers = flagTimersRef.current.get(territoryId);
    if (existingTimers) {
      if (existingTimers.fadeOut) clearTimeout(existingTimers.fadeOut);
      if (existingTimers.remove) clearTimeout(existingTimers.remove);
      flagTimersRef.current.delete(territoryId);
    }
    
    // Show flag for this territory (only if appropriate)
    if (shouldShowFlag) {
      setVisibleFlags(prev => {
        const next = new Map(prev);
        next.set(territoryId, { playerId, isFadingOut: false });
        return next;
      });
    }
    
    // Always run the animation progress (for territory coloring)
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setAnimationProgress(prev => ({
        ...prev,
        [territoryId]: progress
      }));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete - handle flag fade out if flag was shown
        if (shouldShowFlag) {
          // Wait for flag-plant animation (0.5s) then start fade out
          const fadeOutTimer = setTimeout(() => {
            setVisibleFlags(current => {
              const updated = new Map(current);
              const existing = updated.get(territoryId);
              if (existing) {
                updated.set(territoryId, { ...existing, isFadingOut: true });
              }
              return updated;
            });
            
            // Remove flag completely after fade animation (400ms)
            const removeTimer = setTimeout(() => {
              setVisibleFlags(current => {
                const updated = new Map(current);
                updated.delete(territoryId);
                return updated;
              });
              flagTimersRef.current.delete(territoryId);
            }, 400);
            
            flagTimersRef.current.set(territoryId, { remove: removeTimer });
          }, 500); // Wait for 0.5s plant animation before fade starts
          
          flagTimersRef.current.set(territoryId, { fadeOut: fadeOutTimer });
        }
      }
    };

    requestAnimationFrame(animate);
  }, [currentAnimation, territories, gamePhase]);

  // Apply styles to SVG paths
  useEffect(() => {
    if (!svgRef.current || territories.length === 0) return;

    const paths = svgRef.current.querySelectorAll('path');
    
    paths.forEach((path, index) => {
      const territoryId = `region-${index + 1}`;
      const territory = territories.find(t => t.id === territoryId);
      
      if (!territory) return;

      const isSelected = territory.id === selectedTerritoryId;
      // Territory is selectable only if it's my turn AND it's in the selectable list (or list is empty)
      const isInSelectableList = selectableTerritories.length === 0 || selectableTerritories.includes(territory.id);
      const isSelectable = isMyTurn && isInSelectableList;
      const isHighlighted = highlightedTerritories.includes(territory.id);
      // Show mask on territories that are not selectable when we're in selection mode
      const showMask = showUnavailableMask && selectableTerritories.length > 0 && !selectableTerritories.includes(territory.id);
      
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
      path.style.fill = showMask ? `url(#unavailablePattern-${territoryId})` : fillColor;
      path.style.stroke = isSelected ? selectedStrokeColor : gapColor;
      path.style.strokeWidth = isSelected ? '4' : '3'; // Thicker stroke creates gap effect
      path.style.cursor = isSelectable ? 'pointer' : 'default';
      path.style.transition = 'fill 0.3s ease, stroke 0.2s ease, stroke-width 0.2s ease';
      
      // Unavailable territories for attack are darker
      if (selectableTerritories.length > 0 && !selectableTerritories.includes(territory.id)) {
        path.style.opacity = '0.6';
      } else {
        path.style.opacity = '1';
      }

      if (isHighlighted) {
        path.style.filter = 'drop-shadow(0 0 8px rgba(255, 200, 50, 0.8))';
      } else if (isSelected) {
        path.style.filter = 'drop-shadow(0 0 12px hsl(38, 70%, 50%))';
      } else if (showMask) {
        path.style.filter = 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.5))';
      } else {
        path.style.filter = 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.3))';
      }

      // Set up click handler
      path.onclick = () => {
        if (isSelectable) {
          onTerritoryClick(territoryId);
        }
      };

      // Hover effects - only if it's my turn
      path.onmouseenter = () => {
        if (isSelectable && selectableTerritories.length > 0 && isMyTurn) {
          path.style.filter = 'drop-shadow(0 0 8px rgba(255, 200, 50, 0.6)) brightness(1.1)';
        }
      };
      path.onmouseleave = () => {
        if (isSelected) {
          path.style.filter = 'drop-shadow(0 0 12px hsl(38, 70%, 50%))';
        } else if (isHighlighted) {
          path.style.filter = 'drop-shadow(0 0 8px rgba(255, 200, 50, 0.8))';
        } else if (showMask) {
          path.style.filter = 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.5))';
        } else {
          path.style.filter = 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.3))';
        }
      };
    });
  }, [territories, players, selectedTerritoryId, selectableTerritories, highlightedTerritories, currentAnimation, animationProgress, onTerritoryClick, svgContent, isMyTurn, showUnavailableMask, gamePhase]);

  if (!svgContent) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка карты...</p>
      </div>
    );
  }

  // Get territories with visible flags (captured within last 2 seconds)
  const territoriesWithFlags = Array.from(visibleFlags.entries()).map(([territoryId, data]) => {
    const territory = territories.find(t => t.id === territoryId);
    const owner = players.find(p => p.id === data.playerId);
    return { territory, owner, territoryId, isFadingOut: data.isFadingOut };
  }).filter(item => item.territory && item.owner);

  // Get capitals with their owners for rendering crowns (including ones being animated)
  const capitals = territories.filter(t => t.isCapital && t.ownerId);
  
  // Also include capitals that are currently being animated (not yet owned but animation in progress)
  const animatingCapital = currentAnimation?.isCapital ? {
    territoryId: currentAnimation.territoryId,
    playerId: currentAnimation.playerId,
    progress: animationProgress[currentAnimation.territoryId] || 0,
  } : null;

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
        >
          {/* Pattern definitions for unavailable territories */}
          <defs>
            {territories.map(territory => {
              const owner = territory.ownerId ? players.find(p => p.id === territory.ownerId) : null;
              const baseColor = owner ? playerColorValues[owner.color] : neutralColor;
              
              return (
                <pattern
                  key={territory.id}
                  id={`unavailablePattern-${territory.id}`}
                  patternUnits="userSpaceOnUse"
                  width="12"
                  height="12"
                  patternTransform="rotate(45)"
                >
                  <rect width="12" height="12" fill={baseColor} />
                  <line
                    x1="0"
                    y1="6"
                    x2="12"
                    y2="6"
                    stroke="rgba(0, 0, 0, 0.4)"
                    strokeWidth="4"
                  />
                </pattern>
              );
            })}
          </defs>
          {/* Inject SVG content */}
          <g dangerouslySetInnerHTML={{ __html: svgContent.replace(/<\/?svg[^>]*>/g, '') }} />
        </svg>
        
        {/* Territory flags - visible briefly after capture */}
        {territoriesWithFlags.map(({ territory, owner, territoryId, isFadingOut }) => {
          if (!territory || !owner) return null;
          
          const center = territoryCenters[territoryId];
          if (!center) return null;
          
          const xPercent = (center.x / 1499) * 100;
          const yPercent = (center.y / 717) * 100;
          
          return (
            <div
              key={`flag-${territoryId}`}
              className="absolute pointer-events-none"
              style={{
                left: `${xPercent}%`,
                top: `${yPercent}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <TerritoryFlag 
                color={owner.color}
                colorValue={playerColorValues[owner.color]}
                isFadingOut={isFadingOut}
              />
            </div>
          );
        })}
        
        {/* Capital crowns overlay - existing capitals */}
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
              className="absolute flex flex-col items-center pointer-events-none"
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
        
        {/* Animating capital crown - appears during coloring animation */}
        {animatingCapital && animatingCapital.progress >= 0.4 && (() => {
          const owner = players.find(p => p.id === animatingCapital.playerId);
          if (!owner) return null;
          
          const center = territoryCenters[animatingCapital.territoryId];
          if (!center) return null;
          
          // Don't show if already owned (will be rendered by capitals array)
          const territory = territories.find(t => t.id === animatingCapital.territoryId);
          if (territory?.ownerId) return null;
          
          const xPercent = (center.x / 1499) * 100;
          const yPercent = (center.y / 717) * 100;
          
          return (
            <div
              key={`animating-crown-${animatingCapital.territoryId}`}
              className="absolute flex flex-col items-center pointer-events-none animate-crown-appear"
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
        })()}
      </div>
    </div>
  );
}
