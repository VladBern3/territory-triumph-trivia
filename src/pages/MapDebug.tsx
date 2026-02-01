import { useState, useEffect, useRef, useCallback } from 'react';
import { initialTerritories } from '@/data/territories';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Check, Move, Save, Flag, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CzechoslovakiaMap } from '@/components/game/CzechoslovakiaMap';
import { Player, Territory, TerritoryAnimation } from '@/types/game';

interface TerritoryCenter {
  x: number;
  y: number;
}

// Mock players for visual testing
const mockPlayers: Player[] = [
  { id: 'p1', name: 'Игрок 1', color: 'red', territories: [], capitalId: null, isEliminated: false, score: 0 },
  { id: 'p2', name: 'Игрок 2', color: 'blue', territories: [], capitalId: null, isEliminated: false, score: 0 },
  { id: 'p3', name: 'Игрок 3', color: 'green', territories: [], capitalId: null, isEliminated: false, score: 0 },
  { id: 'p4', name: 'Игрок 4', color: 'yellow', territories: [], capitalId: null, isEliminated: false, score: 0 },
];

const MapDebug = () => {
  const navigate = useNavigate();
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
  const [territories, setTerritories] = useState<Territory[]>(initialTerritories);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDragMode, setIsDragMode] = useState(false);
  const [customCenters, setCustomCenters] = useState<Record<string, TerritoryCenter>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<TerritoryAnimation | null>(null);
  const [isSimulatingFlags, setIsSimulatingFlags] = useState(false);
  const [isSimulatingCapitals, setIsSimulatingCapitals] = useState(false);
  const [simulatedCapitals, setSimulatedCapitals] = useState<Territory[]>([]);
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

  // Get displayed centers
  const displayedCenters = isDragMode 
    ? customCenters 
    : territories.reduce((acc, t) => {
        acc[t.id] = t.position;
        return acc;
      }, {} as Record<string, TerritoryCenter>);

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

  // Simulate flag animations on all territories
  const simulateFlags = useCallback(() => {
    if (isSimulatingFlags) return;
    
    setIsSimulatingFlags(true);
    const territoryIds = territories.map(t => t.id);
    let index = 0;
    
    const animateNext = () => {
      if (index >= territoryIds.length) {
        setIsSimulatingFlags(false);
        setCurrentAnimation(null);
        return;
      }
      
      const territoryId = territoryIds[index];
      const playerId = mockPlayers[index % mockPlayers.length].id;
      
      // Start animation for this territory
      setCurrentAnimation({
        territoryId,
        playerId,
        duration: 800,
        startTime: Date.now(),
        isCapital: false,
      });
      
      index++;
      // Stagger animations by 300ms
      setTimeout(animateNext, 300);
    };
    
    animateNext();
  }, [isSimulatingFlags, territories]);

  // Simulate capital animations on all territories
  const simulateCapitals = useCallback(() => {
    if (isSimulatingCapitals) return;
    
    setIsSimulatingCapitals(true);
    setSimulatedCapitals([]);
    
    const territoryIds = territories.map(t => t.id);
    let index = 0;
    
    const animateNext = () => {
      if (index >= territoryIds.length) {
        setIsSimulatingCapitals(false);
        setCurrentAnimation(null);
        // Clear simulated capitals after a delay
        setTimeout(() => setSimulatedCapitals([]), 3000);
        return;
      }
      
      const territoryId = territoryIds[index];
      const playerId = mockPlayers[index % mockPlayers.length].id;
      
      // Mark territory as capital for this simulation
      setSimulatedCapitals(prev => [
        ...prev, 
        { ...territories.find(t => t.id === territoryId)!, isCapital: true, ownerId: playerId }
      ]);
      
      // Start animation for this territory (as capital)
      setCurrentAnimation({
        territoryId,
        playerId,
        duration: 800,
        startTime: Date.now(),
        isCapital: true,
      });
      
      index++;
      // Stagger animations by 400ms (slightly longer for capitals)
      setTimeout(animateNext, 400);
    };
    
    animateNext();
  }, [isSimulatingCapitals, territories]);

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
            variant="default" 
            size="sm"
            onClick={simulateFlags}
            disabled={isSimulatingFlags || isSimulatingCapitals}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Flag className="w-4 h-4 mr-2" />
            {isSimulatingFlags ? "Симуляция..." : "Симуляция флажков"}
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={simulateCapitals}
            disabled={isSimulatingFlags || isSimulatingCapitals}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Crown className="w-4 h-4 mr-2" />
            {isSimulatingCapitals ? "Симуляция..." : "Симуляция столиц"}
          </Button>
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
              Позиция: x={displayedCenters[selectedTerritory.id]?.x}, y={displayedCenters[selectedTerritory.id]?.y}
            </span>
            <span className="text-sm text-muted-foreground">
              Соседи: {selectedTerritory.neighbors.map(n => n.replace('region-', '')).join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 p-4">
        <div className="relative w-full h-full">
          <CzechoslovakiaMap
            territories={simulatedCapitals.length > 0 
              ? territories.map(t => {
                  const simCap = simulatedCapitals.find(sc => sc.id === t.id);
                  return simCap || t;
                })
              : territories
            }
            players={mockPlayers}
            selectedTerritoryId={selectedTerritoryId}
            onTerritoryClick={setSelectedTerritoryId}
            selectableTerritories={territories.map(t => t.id)}
            isMyTurn={true}
            gamePhase="settlement"
            currentAnimation={currentAnimation}
          />
          
          {/* Overlay with markers showing center positions - flat 2D layer for editing */}
          {/* Note: This overlay is intentionally NOT 3D-transformed. 
              The actual crowns/flags are rendered by CzechoslovakiaMap in proper 3D space.
              This overlay is just for editing raw SVG coordinates. */}
          <div 
            ref={mapContainerRef}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Match the map's centering structure but without 3D transform */}
            <div className="w-full h-full flex items-center justify-center">
              <div className="relative w-full h-full max-w-6xl">
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
        </div>
      </div>
    </div>
  );
};

export default MapDebug;
