import { Territory } from "@/types/game";

// Czech Republic regions (14 krajů) - to be populated with proper SVG paths
// viewBox will be set based on the new SVG file
export const initialTerritories: Territory[] = [];

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

  // For different player counts, we want to maximize minimum distance between starting positions
  const optimalStarts: Record<number, string[]> = {
    2: ["CZ041", "CZ080"], // Karlovarský (west) vs Moravskoslezský (east)
    3: ["CZ041", "CZ080", "CZ031"], // Add Jihočeský (south)
    4: ["CZ041", "CZ080", "CZ031", "CZ052"], // Add Královéhradecký (north-east)
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
