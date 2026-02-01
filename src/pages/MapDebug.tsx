import { useState } from 'react';
import { CzechoslovakiaMap } from '@/components/game/CzechoslovakiaMap';
import { initialTerritories } from '@/data/territories';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MapDebug = () => {
  const navigate = useNavigate();
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
  const [territories] = useState(initialTerritories);

  const selectedTerritory = territories.find(t => t.id === selectedTerritoryId);

  return (
    <div className="min-h-screen parchment-texture flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
        <h1 className="font-display text-xl">Дебаг карты (Чехословакия - 18 регионов)</h1>
        {selectedTerritory && (
          <span className="text-sm text-muted-foreground">
            Выбрано: {selectedTerritory.name} ({selectedTerritory.id})
          </span>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 p-4">
        <CzechoslovakiaMap
          territories={territories}
          players={[]}
          selectedTerritoryId={selectedTerritoryId}
          onTerritoryClick={setSelectedTerritoryId}
          selectableTerritories={territories.map(t => t.id)}
        />
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
              {t.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapDebug;
