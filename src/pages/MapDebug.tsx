import { useState, useEffect, useRef, useCallback } from 'react';
import { initialTerritories } from '@/data/territories';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Check, Move, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CzechoslovakiaMap } from '@/components/game/CzechoslovakiaMap';
import { Player, Territory } from '@/types/game';

interface TerritoryCenter {
  x: number;
  y: number;
}

// Mock players for visual testing
const mockPlayers: Player[] = [
  { id: 'p1', name: 'Игрок 1', color: 'red', territories: [], capitalId: null, isEliminated: false, score: 0 },
  { id: 'p2', name: 'Игрок 2', color: 'blue', territories: [], capitalId: null, isEliminated: false, score: 0 },
];

const MapDebug = () => {
  const navigate = useNavigate();
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
  const [territories, setTerritories] = useState<Territory[]>(initialTerritories);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [calculatedCenters, setCalculatedCenters] = useState<Record<string, TerritoryCenter>>({});
  const [showCalculated, setShowCalculated] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [useGameMap, setUseGameMap] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);
  const [customCenters, setCustomCenters] = useState<Record<string, TerritoryCenter>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const selectedTerritory = territories.find(t => t.id === selectedTerritoryId);

  // Initialize custom centers from territories
  useEffect(() => {
    const centers: Record<string, TerritoryCenter> = {};
    territories.forEach(t => {
      centers[t.id] = { ...t.position };
    });
    setCustomCenters(centers);
  }, []);

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
          x: Math.round(bbox.x + bbox.width / 2),
          y: Math.round(bbox.y + bbox.height / 2),
        };
      } catch (e) {
        centers[territoryId] = { x: 400, y: 300 };
      }
    });
    
    setCalculatedCenters(centers);
  }, []);

  // Calculate centers after SVG is loaded
  useEffect(() => {
    if (svgContent && svgRef.current) {
      const timer = setTimeout(calculateTerritoryCenters, 100);
      return () => clearTimeout(timer);
    }
  }, [svgContent, calculateTerritoryCenters]);

  // Apply styles to SVG paths (only for simple debug view)
  useEffect(() => {
    if (!svgRef.current || useGameMap) return;

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
  }, [svgContent, selectedTerritoryId, useGameMap]);

  // Get displayed centers - use custom centers in drag mode, otherwise normal logic
  const displayedCenters = isDragMode 
    ? customCenters 
    : (showCalculated 
      ? calculatedCenters 
      : territories.reduce((acc, t) => {
          acc[t.id] = t.position;
          return acc;
        }, {} as Record<string, TerritoryCenter>));

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent, territoryId: string) => {
    if (!isDragMode) return;
    e.preventDefault();
    setDraggingId(territoryId);
    setSelectedTerritoryId(territoryId);
  }, [isDragMode]);

  // Handle drag move
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!draggingId || !mapContainerRef.current) return;
    
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1499);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 717);
    
    // Clamp to valid range
    const clampedX = Math.max(0, Math.min(1499, x));
    const clampedY = Math.max(0, Math.min(717, y));
    
    setCustomCenters(prev => ({
      ...prev,
      [draggingId]: { x: clampedX, y: clampedY }
    }));
    setHasChanges(true);
  }, [draggingId]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  // Add/remove global mouse listeners for dragging
  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [draggingId, handleDragMove, handleDragEnd]);

  // Copy all coordinates to clipboard
  const copyAllCoordinates = () => {
    const coordsCode = territories.map(t => {
      const center = displayedCenters[t.id] || { x: 400, y: 300 };
      return `  "${t.id}": { x: ${center.x}, y: ${center.y} },`;
    }).join('\n');
    
    navigator.clipboard.writeText(`const regionCenters: Record<string, { x: number; y: number }> = {\n${coordsCode}\n};`);
    toast.success('Координаты скопированы!');
  };

  // Copy single coordinate
  const copySingleCoordinate = (territoryId: string) => {
    const center = displayedCenters[territoryId];
    if (center) {
      navigator.clipboard.writeText(`"${territoryId}": { x: ${center.x}, y: ${center.y} },`);
      setCopiedId(territoryId);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  return (
    <div className="min-h-screen parchment-texture flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
        <h1 className="font-display text-xl">Дебаг карты (18 регионов)</h1>
        
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <Button 
            variant={isDragMode ? "default" : "outline"} 
            size="sm"
            onClick={() => {
              setIsDragMode(!isDragMode);
              if (!isDragMode) {
                // Entering drag mode - initialize from current positions
                const centers: Record<string, TerritoryCenter> = {};
                territories.forEach(t => {
                  centers[t.id] = { ...t.position };
                });
                setCustomCenters(centers);
              }
            }}
            className={isDragMode ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <Move className="w-4 h-4 mr-2" />
            {isDragMode ? "Режим перетаскивания ВКЛ" : "Перетаскивать центры"}
          </Button>
          {hasChanges && (
            <Button 
              variant="default" 
              size="sm"
              onClick={copyAllCoordinates}
              className="bg-amber-600 hover:bg-amber-700 animate-pulse"
            >
              <Save className="w-4 h-4 mr-2" />
              Сохранить изменения
            </Button>
          )}
          <Button 
            variant={useGameMap ? "default" : "outline"} 
            size="sm"
            onClick={() => setUseGameMap(!useGameMap)}
          >
            {useGameMap ? "Простая карта" : "Как в игре"}
          </Button>
          {!useGameMap && !isDragMode && (
            <Button 
              variant={showCalculated ? "default" : "outline"} 
              size="sm"
              onClick={() => setShowCalculated(!showCalculated)}
            >
              {showCalculated ? "Показать hardcoded" : "Показать getBBox"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={copyAllCoordinates}>
            <Copy className="w-4 h-4 mr-2" />
            Копировать все
          </Button>
        </div>
      </div>

      {/* Drag mode instructions */}
      {isDragMode && (
        <div className="px-4 pb-2">
          <div className="bg-green-100 border border-green-300 rounded-lg px-4 py-2 text-green-800 text-sm">
            <strong>Режим перетаскивания:</strong> Зажмите и перетащите красные точки чтобы переместить центры регионов. 
            После настройки нажмите "Сохранить изменения" чтобы скопировать координаты в буфер обмена и вставить в territories.ts
          </div>
        </div>
      )}

      {/* Selected territory info */}
      {selectedTerritory && (
        <div className="px-4 pb-2">
          <div className="bg-card/90 backdrop-blur-sm rounded-lg px-4 py-2 inline-flex items-center gap-4 flex-wrap">
            <span className="font-semibold">{selectedTerritory.name} ({selectedTerritory.id})</span>
            <span className="text-sm text-muted-foreground">
              Hardcoded: x={selectedTerritory.position.x}, y={selectedTerritory.position.y}
            </span>
            {calculatedCenters[selectedTerritory.id] && (
              <span className="text-sm text-blue-600">
                getBBox: x={calculatedCenters[selectedTerritory.id].x}, y={calculatedCenters[selectedTerritory.id].y}
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              Соседи: {selectedTerritory.neighbors.map(n => n.replace('region-', '')).join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 p-4">
        {useGameMap ? (
          /* Game-like map using CzechoslovakiaMap component */
          <div className="relative w-full h-full">
            <CzechoslovakiaMap
              territories={territories}
              players={mockPlayers}
              selectedTerritoryId={selectedTerritoryId}
              onTerritoryClick={setSelectedTerritoryId}
              selectableTerritories={territories.map(t => t.id)}
              isMyTurn={true}
              gamePhase="settlement"
            />
            
            {/* Overlay with markers showing center positions */}
            <div 
              ref={mapContainerRef}
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              style={{ perspective: '1000px' }}
            >
              <div className="relative w-full h-full max-w-6xl" style={{ transform: 'rotateX(20deg)' }}>
                {Object.entries(displayedCenters).map(([territoryId, center]) => {
                  const isSelected = selectedTerritoryId === territoryId;
                  const isDragging = draggingId === territoryId;
                  
                  return (
                    <div
                      key={territoryId}
                      className={`absolute pointer-events-auto group ${
                        isDragMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                      } ${isDragging ? 'z-50' : ''}`}
                      style={{
                        left: `${(center.x / 1499) * 100}%`,
                        top: `${(center.y / 717) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onClick={() => !isDragMode && setSelectedTerritoryId(territoryId)}
                      onMouseDown={(e) => handleDragStart(e, territoryId)}
                    >
                      {/* Center dot */}
                      <div 
                        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white transition-all ${
                          isDragMode ? 'w-5 h-5' : 'w-3 h-3'
                        } ${isDragging ? 'scale-125' : ''}`}
                        style={{
                          backgroundColor: isDragging 
                            ? 'hsl(142, 76%, 36%)' 
                            : isSelected 
                              ? 'hsl(45, 93%, 47%)' 
                              : 'hsl(0, 84%, 60%)',
                          boxShadow: '0 0 6px rgba(0,0,0,0.7)',
                        }}
                      />
                      
                      {/* Label */}
                      <div 
                        className="absolute left-1/2 -translate-x-1/2 -top-6 text-xs font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow-lg flex items-center gap-1"
                        style={{
                          backgroundColor: isDragging
                            ? 'hsl(142, 76%, 36%)'
                            : isSelected 
                              ? 'hsl(45, 93%, 47%)' 
                              : 'rgba(0, 0, 0, 0.85)',
                          color: (isSelected || isDragging) ? '#1a1a1a' : 'white',
                          textShadow: (isSelected || isDragging) ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
                        }}
                      >
                        <span>{territoryId.replace('region-', '')}</span>
                        {isDragMode && (
                          <span className="text-[10px] opacity-75">
                            ({center.x}, {center.y})
                          </span>
                        )}
                        {!isDragMode && (
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              copySingleCoordinate(territoryId);
                            }}
                          >
                            {copiedId === territoryId ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-400 hover:text-white" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Simple debug map */
          <div 
            ref={!useGameMap ? mapContainerRef : undefined}
            className="relative w-full h-full flex items-center justify-center rounded-xl overflow-hidden" 
            style={{ 
              perspective: '1000px',
              backgroundColor: 'hsl(220, 60%, 20%)' 
            }}
          >
            <div className="relative w-full h-full max-w-6xl" style={{ transform: 'rotateX(20deg)' }}>
              {svgContent ? (
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
                  <g dangerouslySetInnerHTML={{ __html: svgContent.replace(/<\/?svg[^>]*>/g, '') }} />
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  Загрузка карты...
                </div>
              )}
              
              {/* Region markers at displayed center positions */}
              {Object.entries(displayedCenters).map(([territoryId, center]) => {
                const isSelected = selectedTerritoryId === territoryId;
                const isDragging = draggingId === territoryId;
                
                return (
                  <div
                    key={territoryId}
                    className={`absolute pointer-events-auto group ${
                      isDragMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                    } ${isDragging ? 'z-50' : ''}`}
                    style={{
                      left: `${(center.x / 1499) * 100}%`,
                      top: `${(center.y / 717) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    onClick={() => !isDragMode && setSelectedTerritoryId(territoryId)}
                    onMouseDown={(e) => handleDragStart(e, territoryId)}
                  >
                    {/* Center dot */}
                    <div 
                      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all ${
                        isDragMode ? 'w-4 h-4' : 'w-2 h-2'
                      } ${isDragging ? 'scale-125' : ''}`}
                      style={{
                        backgroundColor: isDragging 
                          ? 'hsl(142, 76%, 36%)' 
                          : showCalculated 
                            ? 'hsl(217, 91%, 60%)' 
                            : 'hsl(0, 84%, 60%)',
                        boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                      }}
                    />
                    
                    {/* Label */}
                    <div 
                      className="text-xs font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow-lg flex items-center gap-1"
                      style={{
                        backgroundColor: isDragging
                          ? 'hsl(142, 76%, 36%)'
                          : isSelected 
                            ? 'hsl(45, 93%, 47%)' 
                            : 'rgba(0, 0, 0, 0.85)',
                        color: (isSelected || isDragging) ? '#1a1a1a' : 'white',
                        textShadow: (isSelected || isDragging) ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
                      }}
                    >
                      <span>{territoryId.replace('region-', '')}</span>
                      {isDragMode && (
                        <span className="text-[10px] opacity-75">
                          ({center.x}, {center.y})
                        </span>
                      )}
                      {!isDragMode && (
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            copySingleCoordinate(territoryId);
                          }}
                        >
                          {copiedId === territoryId ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-400 hover:text-white" />
                          )}
                        </button>
                      )}
                    </div>
                    
                    {/* Coordinates tooltip on hover */}
                    {!isDragMode && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          x: {center.x}, y: {center.y}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Coordinates table */}
      <div className="p-4 bg-card/80 backdrop-blur border-t max-h-48 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <h3 className="font-semibold mb-2 text-sm">
            Координаты центров ({showCalculated ? 'getBBox' : 'hardcoded'}):
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono">
            {territories.map(t => {
              const hardcoded = t.position;
              const calculated = calculatedCenters[t.id];
              const displayed = displayedCenters[t.id] || { x: 0, y: 0 };
              const hasDiff = calculated && (hardcoded.x !== calculated.x || hardcoded.y !== calculated.y);
              
              return (
                <button
                  key={t.id}
                  className={`p-2 rounded border text-left transition-colors ${
                    selectedTerritoryId === t.id 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : hasDiff 
                        ? 'bg-amber-100 border-amber-300 hover:bg-amber-200'
                        : 'bg-muted/50 border-border hover:bg-muted'
                  }`}
                  onClick={() => setSelectedTerritoryId(t.id)}
                >
                  <div className="font-bold">{t.id.replace('region-', '')}</div>
                  <div>x: {displayed.x}</div>
                  <div>y: {displayed.y}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapDebug;