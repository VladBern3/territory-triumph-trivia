import { useState, useEffect, useRef, useCallback } from 'react';
import { initialTerritories } from '@/data/territories';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TerritoryCenter {
  x: number;
  y: number;
}

const MapDebug = () => {
  const navigate = useNavigate();
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
  const [territories] = useState(initialTerritories);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [territoryCenters, setTerritoryCenters] = useState<Record<string, TerritoryCenter>>({});
  const svgRef = useRef<SVGSVGElement>(null);

  const selectedTerritory = territories.find(t => t.id === selectedTerritoryId);

  // Load SVG content
  useEffect(() => {
    fetch(`/map.svg?v=${Date.now()}`)
      .then(res => res.text())
      .then(text => setSvgContent(text))
      .catch(err => console.error('Failed to load map:', err));
  }, []);

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
        centers[territoryId] = { x: 400, y: 300 };
      }
    });
    
    setTerritoryCenters(centers);
  }, []);

  // Calculate centers after SVG is loaded
  useEffect(() => {
    if (svgContent && svgRef.current) {
      const timer = setTimeout(calculateTerritoryCenters, 100);
      return () => clearTimeout(timer);
    }
  }, [svgContent, calculateTerritoryCenters]);

  // Apply styles to SVG paths
  useEffect(() => {
    if (!svgRef.current) return;

    const paths = svgRef.current.querySelectorAll('path');
    
    paths.forEach((path, index) => {
      const territoryId = `region-${index + 1}`;
      const isSelected = territoryId === selectedTerritoryId;
      
      path.style.fill = isSelected ? 'hsl(45, 93%, 47%)' : 'hsl(38, 25%, 85%)';
      path.style.stroke = 'transparent';
      path.style.strokeWidth = '3';
      path.style.cursor = 'pointer';
      path.style.transition = 'fill 0.2s ease';
      
      path.onclick = () => setSelectedTerritoryId(territoryId);
      path.onmouseenter = () => {
        if (!isSelected) path.style.fill = 'hsl(38, 35%, 75%)';
      };
      path.onmouseleave = () => {
        if (!isSelected) path.style.fill = 'hsl(38, 25%, 85%)';
      };
    });
  }, [svgContent, selectedTerritoryId]);

  return (
    <div className="min-h-screen parchment-texture flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
        <h1 className="font-display text-xl">Дебаг карты (18 регионов)</h1>
        {selectedTerritory && (
          <span className="text-sm text-muted-foreground">
            Выбрано: {selectedTerritory.name} ({selectedTerritory.id}) | 
            Соседи: {selectedTerritory.neighbors.join(', ')}
          </span>
        )}
      </div>

      {/* Map with ID labels */}
      <div className="flex-1 p-4">
        <div 
          className="relative w-full h-full flex items-center justify-center rounded-xl overflow-hidden" 
          style={{ backgroundColor: 'hsl(220, 60%, 20%)' }}
        >
          <div className="relative w-full h-full max-w-6xl">
            {svgContent ? (
              <svg
                ref={svgRef}
                viewBox="0 0 1499 717"
                className="w-full h-full"
                fill="none"
                preserveAspectRatio="xMidYMid meet"
              >
                <g dangerouslySetInnerHTML={{ __html: svgContent.replace(/<\/?svg[^>]*>/g, '') }} />
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                Загрузка карты...
              </div>
            )}
            
            {/* Region ID labels */}
            {Object.entries(territoryCenters).map(([territoryId, center]) => (
              <div
                key={territoryId}
                className="absolute pointer-events-none"
                style={{
                  left: `${(center.x / 1499) * 100}%`,
                  top: `${(center.y / 717) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <span 
                  className="text-xs font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
                  style={{
                    backgroundColor: selectedTerritoryId === territoryId 
                      ? 'hsl(0, 84%, 50%)' 
                      : 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    fontSize: '10px',
                  }}
                >
                  {territoryId.replace('region-', '')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Territory list */}
      <div className="p-4 bg-card/80 backdrop-blur border-t">
        <div className="flex flex-wrap gap-2 max-w-6xl mx-auto">
          {territories.map(t => (
            <Button
              key={t.id}
              variant={selectedTerritoryId === t.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTerritoryId(t.id)}
              className="text-xs"
            >
              {t.id.replace('region-', '')} - {t.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapDebug;
