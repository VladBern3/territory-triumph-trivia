import { useEffect, useRef, useState } from 'react';
import { Territory, Player, TerritoryAnimation } from '@/types/game';

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
const strokeColor = 'hsl(38, 20%, 40%)';
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

      // Apply styles
      path.style.fill = fillColor;
      path.style.stroke = isSelected ? selectedStrokeColor : strokeColor;
      path.style.strokeWidth = isSelected ? '3' : '1.5';
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

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        ref={svgRef}
        viewBox="0 0 1499 717"
        className="w-full h-full max-w-6xl"
        preserveAspectRatio="xMidYMid meet"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))' }}
        dangerouslySetInnerHTML={{ __html: svgContent.replace(/<\/?svg[^>]*>/g, '') }}
      />
    </div>
  );
}
