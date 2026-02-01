import { Territory } from "@/types/game";

// Czechoslovakia map - 18 regions
// viewBox: 0 0 1494 712
// Regions are numbered 1-18 based on path order in SVG

// Approximate center positions for each region based on SVG paths
const regionCenters: Record<string, { x: number; y: number }> = {
  'region-1': { x: 90, y: 190 },      // Top-left corner
  'region-2': { x: 180, y: 400 },     // Left side, lower
  'region-3': { x: 380, y: 420 },     // Center-left, lower
  'region-4': { x: 320, y: 250 },     // Center-left, upper
  'region-5': { x: 260, y: 100 },     // Top, left of center
  'region-6': { x: 400, y: 80 },      // Top, center
  'region-7': { x: 540, y: 100 },     // Top, right of center
  'region-8': { x: 580, y: 200 },     // Upper-center-right
  'region-9': { x: 520, y: 320 },     // Center
  'region-10': { x: 740, y: 430 },    // Center-right, lower
  'region-11': { x: 750, y: 280 },    // Center-right, upper
  'region-12': { x: 870, y: 200 },    // Upper-right
  'region-13': { x: 830, y: 400 },    // Right, lower
  'region-14': { x: 1020, y: 340 },   // Right side
  'region-15': { x: 860, y: 550 },    // Bottom-right
  'region-16': { x: 1000, y: 420 },   // Right, mid
  'region-17': { x: 1280, y: 380 },   // Far right
  'region-18': { x: 1100, y: 550 },   // Bottom, far right
};

// Neighbor relationships based on SVG adjacencies
const regionNeighbors: Record<string, string[]> = {
  'region-1': ['region-2', 'region-4', 'region-5'],
  'region-2': ['region-1', 'region-3', 'region-4'],
  'region-3': ['region-2', 'region-4', 'region-9', 'region-10'],
  'region-4': ['region-1', 'region-2', 'region-3', 'region-5', 'region-6', 'region-8', 'region-9'],
  'region-5': ['region-1', 'region-4', 'region-6'],
  'region-6': ['region-4', 'region-5', 'region-7', 'region-8'],
  'region-7': ['region-6', 'region-8', 'region-12'],
  'region-8': ['region-4', 'region-6', 'region-7', 'region-9', 'region-11', 'region-12'],
  'region-9': ['region-3', 'region-4', 'region-8', 'region-10', 'region-11'],
  'region-10': ['region-3', 'region-9', 'region-11', 'region-13', 'region-15'],
  'region-11': ['region-8', 'region-9', 'region-10', 'region-12', 'region-13', 'region-14'],
  'region-12': ['region-7', 'region-8', 'region-11', 'region-14', 'region-17'],
  'region-13': ['region-10', 'region-11', 'region-14', 'region-15', 'region-16'],
  'region-14': ['region-11', 'region-12', 'region-13', 'region-16', 'region-17', 'region-18'],
  'region-15': ['region-10', 'region-13', 'region-18'],
  'region-16': ['region-13', 'region-14', 'region-18'],
  'region-17': ['region-12', 'region-14', 'region-18'],
  'region-18': ['region-14', 'region-15', 'region-16', 'region-17'],
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
    path: '', // Paths are in the SVG file
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
  const optimalStarts: Record<number, string[]> = {
    2: ['region-1', 'region-17'], // West vs East
    3: ['region-1', 'region-17', 'region-15'], // + South
    4: ['region-1', 'region-5', 'region-15', 'region-17'], // Corners
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
