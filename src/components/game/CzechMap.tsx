import { Territory, Player } from '@/types/game';
import { Crown, Castle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CzechMapProps {
  territories: Territory[];
  players: Player[];
  selectedTerritoryId: string | null;
  onTerritoryClick: (territoryId: string) => void;
  selectableTerritories?: string[];
  highlightedTerritories?: string[];
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

export function CzechMap({
  territories,
  players,
  selectedTerritoryId,
  onTerritoryClick,
  selectableTerritories = [],
  highlightedTerritories = [],
}: CzechMapProps) {
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

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <svg
        viewBox="0 0 820 480"
        className="w-full h-auto"
        style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
      >
        {/* Background with parchment texture */}
        <defs>
          <filter id="paper-texture">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
            <feDiffuseLighting in="noise" lightingColor="hsl(38, 30%, 90%)" surfaceScale="2" result="lit">
              <feDistantLight azimuth="45" elevation="60" />
            </feDiffuseLighting>
            <feBlend in="SourceGraphic" in2="lit" mode="multiply" />
          </filter>
          <linearGradient id="map-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(38, 25%, 92%)" />
            <stop offset="100%" stopColor="hsl(38, 30%, 85%)" />
          </linearGradient>
        </defs>
        
        <rect x="0" y="0" width="820" height="480" fill="url(#map-gradient)" rx="12" />
        
        {/* Border connections (showing neighboring territories) */}
        <g className="border-lines" opacity="0.3">
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
                  stroke="hsl(38, 20%, 50%)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
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

          return (
            <g key={territory.id} className="group">
              {/* Territory shape */}
              <path
                d={territory.path}
                className={cn(
                  'transition-all duration-200 stroke-2',
                  getPlayerColor(territory.ownerId),
                  getPlayerStrokeColor(territory.ownerId),
                  selectable && 'cursor-pointer hover:brightness-110 hover:stroke-[3]',
                  !selectable && 'opacity-60 cursor-not-allowed',
                  isSelected && 'brightness-125 stroke-[4] stroke-gold-accent',
                  highlighted && 'animate-pulse'
                )}
                style={{
                  filter: isSelected ? 'drop-shadow(0 0 8px hsl(38, 70%, 50%))' : undefined,
                }}
                onClick={() => selectable && onTerritoryClick(territory.id)}
                fillRule="evenodd"
              />

              {/* Territory name label */}
              <text
                x={territory.position.x}
                y={territory.position.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className={cn(
                  'text-[9px] font-display fill-foreground pointer-events-none select-none',
                  territory.ownerId ? 'fill-primary-foreground' : 'fill-muted-foreground'
                )}
                style={{
                  textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                  fontWeight: 600
                }}
              >
                {territory.name.split(' ')[0]}
              </text>

              {/* Capital marker */}
              {territory.isCapital && (
                <g transform={`translate(${territory.position.x - 8}, ${territory.position.y - 25})`}>
                  <Castle className="w-4 h-4 text-gold-accent drop-shadow-md" fill="currentColor" />
                </g>
              )}

              {/* Crown for capitals */}
              {territory.isCapital && (
                <g transform={`translate(${territory.position.x + 4}, ${territory.position.y - 25})`}>
                  <Crown className="w-4 h-4 text-gold-shine drop-shadow-md" fill="currentColor" />
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
          y="35"
          textAnchor="middle"
          className="font-display text-xl fill-primary"
          style={{ fontWeight: 700 }}
        >
          Čechy a Morava
        </text>
      </svg>

      {/* Selected territory info */}
      {selectedTerritoryId && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card text-card-foreground px-4 py-2 rounded-md medieval-border animate-fade-in shadow-lg">
          <p className="font-display text-sm">
            {territories.find(t => t.id === selectedTerritoryId)?.name}
          </p>
        </div>
      )}
    </div>
  );
}
