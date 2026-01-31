import { Territory, Player } from '@/types/game';
import { Castle, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HexMapProps {
  territories: Territory[];
  players: Player[];
  selectedTerritoryId: string | null;
  onTerritoryClick: (territoryId: string) => void;
  selectableTerritories?: string[];
  highlightedTerritories?: string[];
}

const playerColorClasses = {
  red: 'fill-player-red',
  blue: 'fill-player-blue',
  green: 'fill-player-green',
  yellow: 'fill-player-yellow',
};

const playerStrokeClasses = {
  red: 'stroke-player-red',
  blue: 'stroke-player-blue',
  green: 'stroke-player-green',
  yellow: 'stroke-player-yellow',
};

export function HexMap({
  territories,
  players,
  selectedTerritoryId,
  onTerritoryClick,
  selectableTerritories = [],
  highlightedTerritories = [],
}: HexMapProps) {
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
        viewBox="0 0 750 420"
        className="w-full h-auto"
        style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
      >
        {/* Background */}
        <rect x="0" y="0" width="750" height="420" className="fill-card" rx="8" />
        
        {/* Territories */}
        {territories.map((territory) => {
          const isSelected = territory.id === selectedTerritoryId;
          const selectable = isSelectable(territory.id);
          const highlighted = isHighlighted(territory.id);
          
          return (
            <g key={territory.id} className="group">
              {/* Territory hexagon */}
              <path
                d={territory.path}
                className={cn(
                  'transition-all duration-200 stroke-2',
                  getPlayerColor(territory.ownerId),
                  getPlayerStrokeColor(territory.ownerId),
                  selectable && 'cursor-pointer hover:brightness-110',
                  !selectable && 'opacity-60 cursor-not-allowed',
                  isSelected && 'brightness-125 stroke-[3]',
                  highlighted && 'territory-contested'
                )}
                onClick={() => selectable && onTerritoryClick(territory.id)}
              />
              
              {/* Capital marker */}
              {territory.isCapital && (
                <g
                  transform={`translate(${territory.position.x - 12}, ${territory.position.y - 12})`}
                  className="capital-marker pointer-events-none"
                >
                  <Castle className="w-6 h-6 text-primary-foreground" />
                </g>
              )}
              
              {/* Territory name tooltip */}
              <title>{territory.name}</title>
            </g>
          );
        })}
        
        {/* Player capitals legend markers */}
        {territories.filter(t => t.isCapital).map((territory) => {
          const player = players.find(p => p.id === territory.ownerId);
          if (!player) return null;
          
          return (
            <g
              key={`crown-${territory.id}`}
              transform={`translate(${territory.position.x - 8}, ${territory.position.y - 25})`}
              className="pointer-events-none"
            >
              <Crown className="w-4 h-4 text-gold-shine" fill="currentColor" />
            </g>
          );
        })}
      </svg>
      
      {/* Territory info tooltip */}
      {selectedTerritoryId && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card text-card-foreground px-4 py-2 rounded-md medieval-border animate-fade-in">
          <p className="font-display text-sm">
            {territories.find(t => t.id === selectedTerritoryId)?.name}
          </p>
        </div>
      )}
    </div>
  );
}
