import { Territory, Player, TerritoryAnimation } from '@/types/game';
import { Crown, Castle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface CzechMapProps {
  territories: Territory[];
  players: Player[];
  selectedTerritoryId: string | null;
  onTerritoryClick: (territoryId: string) => void;
  selectableTerritories?: string[];
  highlightedTerritories?: string[];
  currentAnimation?: TerritoryAnimation | null;
}

const playerColorClasses: Record<string, string> = {
  red: 'fill-player-red',
  blue: 'fill-player-blue',
  green: 'fill-player-green',
  yellow: 'fill-player-yellow',
};

const playerStrokeClasses: Record<string, string> = {
  red: 'stroke-player-red',
  blue: 'stroke-player-blue',
  green: 'stroke-player-green',
  yellow: 'stroke-player-yellow',
};

const playerColorValues: Record<string, string> = {
  red: 'hsl(0, 84%, 60%)',
  blue: 'hsl(217, 91%, 60%)',
  green: 'hsl(142, 76%, 36%)',
  yellow: 'hsl(45, 93%, 47%)',
};

export function CzechMap({
  territories,
  players,
  selectedTerritoryId,
  onTerritoryClick,
  selectableTerritories = [],
  highlightedTerritories = [],
  currentAnimation,
}: CzechMapProps) {
  const [animationProgress, setAnimationProgress] = useState<Record<string, number>>({});

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

  const getPlayerColor = (ownerId: string | null): string => {
    if (!ownerId) return 'fill-territory-neutral';
    const player = players.find(p => p.id === ownerId);
    return player ? playerColorClasses[player.color] : 'fill-territory-neutral';
  };

  const getPlayerStrokeColor = (ownerId: string | null): string => {
    if (!ownerId) return 'stroke-border';
    const player = players.find(p => p.id === ownerId);
    return player ? playerStrokeClasses[player.color] : 'stroke-border';
  };

  const isSelectable = (territoryId: string) =>
    selectableTerritories.length === 0 || selectableTerritories.includes(territoryId);

  const isHighlighted = (territoryId: string) =>
    highlightedTerritories.includes(territoryId);

  const getAnimatingPlayer = (territoryId: string): Player | null => {
    if (!currentAnimation || currentAnimation.territoryId !== territoryId) return null;
    return players.find(p => p.id === currentAnimation.playerId) || null;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 820 480"
        className="w-full h-full max-w-6xl"
        preserveAspectRatio="xMidYMid meet"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))' }}
      >
        {/* Background with parchment texture */}
        <defs>
          <linearGradient id="map-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(38, 25%, 92%)" />
            <stop offset="100%" stopColor="hsl(38, 30%, 85%)" />
          </linearGradient>
          <filter id="territory-shadow">
            <feDropShadow dx="1" dy="1" stdDeviation="2" floodOpacity="0.3" />
          </filter>
          {/* Clip paths for each territory for capture animation */}
          {territories.map(territory => (
            <clipPath key={`clip-${territory.id}`} id={`clip-${territory.id}`}>
              <path d={territory.path} />
            </clipPath>
          ))}
        </defs>
        
        <rect x="0" y="0" width="820" height="480" fill="url(#map-gradient)" rx="12" />
        
        {/* Border connections (showing neighboring territories) */}
        <g className="border-lines" opacity="0.2">
          {territories.map(territory => 
            territory.neighbors.map(neighborId => {
              const neighbor = territories.find(t => t.id === neighborId);
              if (!neighbor || territory.id > neighborId) return null;
              return (
                <line
                  key={`${territory.id}-${neighborId}`}
                  x1={territory.position.x}
                  y1={territory.position.y}
                  x2={neighbor.position.x}
                  y2={neighbor.position.y}
                  stroke="hsl(38, 20%, 40%)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
              );
            })
          )}
        </g>
        
        {/* Territories */}
        {territories.map((territory) => {
          const isSelected = territory.id === selectedTerritoryId;
          const selectable = isSelectable(territory.id);
          const highlighted = isHighlighted(territory.id);
          const animatingPlayer = getAnimatingPlayer(territory.id);
          const progress = animationProgress[territory.id] || 0;
          const isAnimating = animatingPlayer && progress < 1;

          // Calculate max radius needed to cover the territory
          const maxRadius = 150; // Large enough to cover any territory
          const currentRadius = isAnimating ? progress * maxRadius : 0;

          return (
            <g key={territory.id} className="group">
              {/* Base territory shape (neutral or current owner) */}
              <path
                d={territory.path}
                className={cn(
                  'transition-all duration-200 stroke-[1.5]',
                  !isAnimating && getPlayerColor(territory.ownerId),
                  !isAnimating && getPlayerStrokeColor(territory.ownerId),
                  isAnimating && 'fill-territory-neutral stroke-border',
                  selectable && 'cursor-pointer hover:brightness-110 hover:stroke-[2.5]',
                  !selectable && 'opacity-70 cursor-not-allowed',
                  isSelected && 'brightness-125 stroke-[3] stroke-gold-accent',
                  highlighted && 'animate-pulse'
                )}
                style={{
                  filter: isSelected ? 'drop-shadow(0 0 12px hsl(38, 70%, 50%))' : 'url(#territory-shadow)',
                }}
                onClick={() => selectable && onTerritoryClick(territory.id)}
                fillRule="evenodd"
              />

              {/* Capture animation - expanding circle */}
              {isAnimating && animatingPlayer && (
                <g clipPath={`url(#clip-${territory.id})`}>
                  <circle
                    cx={territory.position.x}
                    cy={territory.position.y}
                    r={currentRadius}
                    fill={playerColorValues[animatingPlayer.color]}
                    className="transition-none"
                  />
                </g>
              )}

              {/* Final state after animation - full color */}
              {animatingPlayer && progress >= 1 && (
                <path
                  d={territory.path}
                  className={cn(
                    playerColorClasses[animatingPlayer.color],
                    playerStrokeClasses[animatingPlayer.color],
                    'stroke-[1.5]'
                  )}
                  style={{ filter: 'url(#territory-shadow)' }}
                  onClick={() => selectable && onTerritoryClick(territory.id)}
                  fillRule="evenodd"
                />
              )}

              {/* Territory name label */}
              <text
                x={territory.position.x}
                y={territory.position.y + (territory.isCapital ? 8 : 0)}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] font-display pointer-events-none select-none"
                fill={territory.ownerId || (animatingPlayer && progress >= 1) ? 'white' : 'hsl(38, 20%, 30%)'}
                style={{
                  textShadow: territory.ownerId || (animatingPlayer && progress >= 1)
                    ? '0 1px 2px rgba(0,0,0,0.5)' 
                    : '0 1px 1px rgba(255,255,255,0.8)',
                  fontWeight: 600
                }}
              >
                {territory.name.length > 12 ? territory.name.split(' ')[0] : territory.name}
              </text>

              {/* Capital marker */}
              {territory.isCapital && (
                <g transform={`translate(${territory.position.x - 12}, ${territory.position.y - 22})`}>
                  <Castle className="w-6 h-6 text-gold-accent drop-shadow-lg" fill="currentColor" />
                  <Crown 
                    className="w-4 h-4 text-gold-shine absolute drop-shadow-md" 
                    fill="currentColor" 
                    style={{ transform: 'translate(16px, -4px)' }}
                  />
                </g>
              )}

              {/* Tooltip */}
              <title>{territory.name}</title>
            </g>
          );
        })}

        {/* Map title */}
        <text
          x="410"
          y="30"
          textAnchor="middle"
          className="font-display text-lg"
          fill="hsl(38, 30%, 35%)"
          style={{ fontWeight: 700 }}
        >
          Čechy a Morava
        </text>
      </svg>
    </div>
  );
}
