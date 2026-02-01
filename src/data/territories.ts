import { Territory } from "@/types/game";

// Czechoslovakia map - 18 regions
// viewBox: 0 0 1499 717
// Paths are in order 1-18 from the SVG

// Approximate center positions calculated from path bounding boxes
const regionCenters: Record<string, { x: number; y: number }> = {
  "region-1": { x: 90, y: 190 }, // Top-left (path 1)
  "region-2": { x: 180, y: 400 }, // Left-center (path 2)
  "region-3": { x: 380, y: 420 }, // Center-left lower (path 3)
  "region-4": { x: 320, y: 250 }, // Center-left upper (path 4)
  "region-5": { x: 280, y: 120 }, // Top center-left (path 5)
  "region-6": { x: 420, y: 80 }, // Top center (path 6)
  "region-7": { x: 560, y: 140 }, // Top right of center (path 7)
  "region-8": { x: 620, y: 240 }, // Upper center-right (path 8)
  "region-9": { x: 520, y: 350 }, // Center (path 9)
  "region-10": { x: 700, y: 460 }, // Right lower (path 10)
  "region-11": { x: 700, y: 320 }, // Right center (path 11)
  "region-12": { x: 780, y: 220 }, // Right upper (path 12)
  "region-13": { x: 820, y: 430 }, // Far right lower (path 13)
  "region-14": { x: 880, y: 620 }, // Bottom right (path 14)
  "region-15": { x: 1020, y: 400 }, // Far right (path 15)
  "region-16": { x: 1250, y: 360 }, // Far east upper (path 16)
  "region-17": { x: 1050, y: 550 }, // Far east lower (path 17)
  "region-18": { x: 680, y: 540 }, // Bottom center (path 18)
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
