import { Territory } from "@/types/game";

// Czechoslovakia map - 18 regions
// viewBox: 0 0 1479 708
// Regions are numbered 1-18 based on path order in SVG

// Approximate center positions for each region (will be refined based on actual SVG paths)
const regionCenters: Record<string, { x: number; y: number }> = {
  'region-1': { x: 150, y: 200 },
  'region-2': { x: 280, y: 150 },
  'region-3': { x: 400, y: 120 },
  'region-4': { x: 550, y: 100 },
  'region-5': { x: 700, y: 130 },
  'region-6': { x: 850, y: 150 },
  'region-7': { x: 200, y: 350 },
  'region-8': { x: 350, y: 300 },
  'region-9': { x: 500, y: 250 },
  'region-10': { x: 650, y: 280 },
  'region-11': { x: 800, y: 300 },
  'region-12': { x: 300, y: 480 },
  'region-13': { x: 450, y: 420 },
  'region-14': { x: 600, y: 400 },
  'region-15': { x: 750, y: 450 },
  'region-16': { x: 950, y: 350 },
  'region-17': { x: 1100, y: 400 },
  'region-18': { x: 1250, y: 450 },
};

// Neighbor relationships (approximate based on map layout)
const regionNeighbors: Record<string, string[]> = {
  'region-1': ['region-2', 'region-7', 'region-8'],
  'region-2': ['region-1', 'region-3', 'region-8', 'region-9'],
  'region-3': ['region-2', 'region-4', 'region-9'],
  'region-4': ['region-3', 'region-5', 'region-9', 'region-10'],
  'region-5': ['region-4', 'region-6', 'region-10', 'region-11'],
  'region-6': ['region-5', 'region-11', 'region-16'],
  'region-7': ['region-1', 'region-8', 'region-12'],
  'region-8': ['region-1', 'region-2', 'region-7', 'region-9', 'region-12', 'region-13'],
  'region-9': ['region-2', 'region-3', 'region-4', 'region-8', 'region-10', 'region-13', 'region-14'],
  'region-10': ['region-4', 'region-5', 'region-9', 'region-11', 'region-14', 'region-15'],
  'region-11': ['region-5', 'region-6', 'region-10', 'region-15', 'region-16'],
  'region-12': ['region-7', 'region-8', 'region-13'],
  'region-13': ['region-8', 'region-9', 'region-12', 'region-14'],
  'region-14': ['region-9', 'region-10', 'region-13', 'region-15'],
  'region-15': ['region-10', 'region-11', 'region-14', 'region-16', 'region-17'],
  'region-16': ['region-6', 'region-11', 'region-15', 'region-17'],
  'region-17': ['region-15', 'region-16', 'region-18'],
  'region-18': ['region-17'],
};

// Generate 18 territories
export const initialTerritories: Territory[] = Array.from({ length: 18 }, (_, i) => {
  const id = `region-${i + 1}`;
  return {
    id,
    name: `Регион ${i + 1}`,
    ownerId: null,
    isCapital: false,
    neighbors: regionNeighbors[id] || [],
    position: regionCenters[id] || { x: 400, y: 300 },
    path: '', // Paths are in the SVG file, not needed here
  };
});

// Pre-calculated distances between regions for player distribution
export const getMaximallyDistantTerritories = (playerCount: number): string[] => {
  const territories = initialTerritories;
  
  if (territories.length === 0) {
    return [];
  }

  // Calculate distance between two territories
  const distance = (t1: Territory, t2: Territory): number => {
    const dx = t1.position.x - t2.position.x;
    const dy = t1.position.y - t2.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Optimal starting positions for different player counts
  // Using corners of the map for maximum distance
  const optimalStarts: Record<number, string[]> = {
    2: ['region-1', 'region-18'], // West vs East
    3: ['region-1', 'region-18', 'region-12'], // + South-West
    4: ['region-1', 'region-6', 'region-12', 'region-18'], // Corners
  };

  if (optimalStarts[playerCount]) {
    return optimalStarts[playerCount].filter(id => territories.some(t => t.id === id));
  }

  // Fallback: greedy algorithm for other counts
  const selected: Territory[] = [];
  const available = [...territories];

  // Start with the westernmost territory
  const first = available.reduce((a, b) => (a.position.x < b.position.x ? a : b));
  selected.push(first);
  available.splice(available.indexOf(first), 1);

  // Greedily select territories that maximize minimum distance
  while (selected.length < playerCount && available.length > 0) {
    let bestTerritory: Territory | null = null;
    let bestMinDistance = -1;

    for (const candidate of available) {
      const minDist = Math.min(...selected.map((s) => distance(s, candidate)));
      if (minDist > bestMinDistance) {
        bestMinDistance = minDist;
        bestTerritory = candidate;
      }
    }

    if (bestTerritory) {
      selected.push(bestTerritory);
      available.splice(available.indexOf(bestTerritory), 1);
    }
  }

  return selected.map((t) => t.id);
};
