import { Territory } from "@/types/game";

// Czechoslovakia map - 18 regions
// viewBox: 0 0 1499 717
// Paths are in order 1-18 from the SVG

// Approximate center positions calculated from path bounding boxes
const regionCenters: Record<string, { x: number; y: number }> = {
  "region-1": { x: 68, y: 194 },
  "region-2": { x: 161, y: 315 },
  "region-3": { x: 322, y: 426 },
  "region-4": { x: 363, y: 233 },
  "region-5": { x: 199, y: 129 },
  "region-6": { x: 415, y: 66 },
  "region-7": { x: 553, y: 157 },
  "region-8": { x: 591, y: 265 },
  "region-9": { x: 515, y: 355 },
  "region-10": { x: 657, y: 427 },
  "region-11": { x: 734, y: 314 },
  "region-12": { x: 840, y: 271 },
  "region-13": { x: 812, y: 397 },
  "region-14": { x: 825, y: 527 },
  "region-15": { x: 1016, y: 340 },
  "region-16": { x: 1320, y: 396 },
  "region-17": { x: 1082, y: 449 },
  "region-18": { x: 747, y: 513 },
};

// Neighbor relationships based on SVG adjacencies
const regionNeighbors: Record<string, string[]> = {
  "region-1": ["region-2", "region-5"],
  "region-2": ["region-1", "region-3", "region-4", "region-5"],
  "region-3": ["region-2", "region-4", "region-9", "region-10"],
  "region-4": ["region-2", "region-3", "region-5", "region-6", "region-7", "region-9", "region-8"],
  "region-5": ["region-1", "region-4", "region-6"],
  "region-6": ["region-4", "region-5", "region-7"],
  "region-7": ["region-4", "region-6", "region-8"],
  "region-8": ["region-7", "region-9", "region-11", "region-4"],
  "region-9": ["region-3", "region-4", "region-8", "region-10"],
  "region-10": ["region-3", "region-9", "region-11", "region-13", "region-14"],
  "region-11": ["region-8", "region-10", "region-12", "region-13"],
  "region-12": ["region-11", "region-13", "region-15"],
  "region-13": ["region-10", "region-11", "region-12", "region-14", "region-15", "region-18"],
  "region-14": ["region-13", "region-15", "region-17", "region-18", "region-10"],
  "region-15": ["region-12", "region-13", "region-14", "region-16", "region-17"],
  "region-16": ["region-15", "region-17"],
  "region-17": ["region-14", "region-15", "region-16"],
  "region-18": ["region-13", "region-14"],
};

// Generate 18 territories (SVG has 18 paths, lines 2-19)
export const initialTerritories: Territory[] = Array.from({ length: 18 }, (_, i) => {
  const id = `region-${i + 1}`;
  return {
    id,
    name: `Регион ${i + 1}`,
    ownerId: null,
    isCapital: false,
    neighbors: regionNeighbors[id] || [],
    position: regionCenters[id] || { x: 400, y: 300 },
    path: "", // Paths are in the SVG file
  };
});

// Optimal starting positions for different player counts
export const getMaximallyDistantTerritories = (playerCount: number): string[] => {
  const optimalStarts: Record<number, string[]> = {
    2: ["region-1", "region-16"], // West vs East
    3: ["region-1", "region-14", "region-16"], // Triangle
    4: ["region-1", "region-5", "region-14", "region-16"], // Corners
  };

  if (optimalStarts[playerCount]) {
    return optimalStarts[playerCount];
  }

  // Fallback for other counts
  return initialTerritories.slice(0, playerCount).map((t) => t.id);
};
