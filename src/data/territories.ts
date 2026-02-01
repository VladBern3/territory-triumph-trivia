import { Territory } from '@/types/game';

// Czech Republic regions (14 kraje) with realistic SVG paths
// viewBox is 0 0 800 500 for the map
// Paths are simplified but follow the actual Czech Republic borders

export const initialTerritories: Territory[] = [
  // Praha (Prague) - small enclave in the center
  {
    id: 'CZ010',
    name: 'Praha',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ020'],
    position: { x: 355, y: 195 },
    path: 'M345,185 Q350,180 360,182 Q368,185 370,192 Q372,200 368,208 Q362,214 355,215 Q345,214 342,207 Q338,198 345,185 Z'
  },
  // Středočeský kraj - surrounds Prague (donut shape)
  {
    id: 'CZ020',
    name: 'Středočeský kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ010', 'CZ031', 'CZ032', 'CZ041', 'CZ042', 'CZ051', 'CZ053', 'CZ063'],
    position: { x: 355, y: 240 },
    path: 'M280,140 Q300,125 330,120 Q360,118 390,125 Q420,135 440,155 Q455,175 460,200 Q462,225 455,250 Q445,280 420,300 Q390,318 355,320 Q315,318 285,295 Q260,270 250,240 Q245,205 255,175 Q265,150 280,140 Z M345,185 Q350,180 360,182 Q368,185 370,192 Q372,200 368,208 Q362,214 355,215 Q345,214 342,207 Q338,198 345,185 Z'
  },
  // Jihočeský kraj - South Bohemia
  {
    id: 'CZ031',
    name: 'Jihočeský kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ020', 'CZ032', 'CZ063'],
    position: { x: 295, y: 375 },
    path: 'M180,290 Q200,275 230,265 Q260,260 285,265 Q285,295 300,318 L355,320 Q375,335 390,360 Q400,390 395,420 Q385,450 360,470 Q330,485 290,480 Q250,472 220,450 Q190,425 170,390 Q155,355 160,320 Q165,300 180,290 Z'
  },
  // Plzeňský kraj - Pilsen region
  {
    id: 'CZ032',
    name: 'Plzeňský kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ020', 'CZ031', 'CZ041'],
    position: { x: 170, y: 250 },
    path: 'M80,180 Q100,160 130,150 Q165,145 200,155 Q235,165 255,185 Q265,205 250,240 Q245,260 230,265 Q200,275 180,290 Q155,295 130,285 Q100,270 80,245 Q65,220 70,195 Q75,185 80,180 Z'
  },
  // Karlovarský kraj - Karlovy Vary region (westernmost)
  {
    id: 'CZ041',
    name: 'Karlovarský kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ020', 'CZ032', 'CZ042'],
    position: { x: 90, y: 130 },
    path: 'M25,100 Q50,80 85,75 Q115,72 145,82 Q170,95 185,120 Q195,145 180,165 Q165,175 130,150 Q100,160 80,180 Q65,170 45,160 Q25,145 20,125 Q18,108 25,100 Z'
  },
  // Ústecký kraj - Ústí nad Labem region (north-west)
  {
    id: 'CZ042',
    name: 'Ústecký kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ020', 'CZ041', 'CZ051'],
    position: { x: 215, y: 85 },
    path: 'M145,82 Q175,65 210,55 Q250,48 290,52 Q325,58 350,75 Q365,90 360,110 Q355,125 330,120 Q300,125 280,140 Q265,145 235,155 Q205,155 185,145 Q170,130 175,110 Q178,92 145,82 Z'
  },
  // Liberecký kraj - Liberec region (north)
  {
    id: 'CZ051',
    name: 'Liberecký kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ020', 'CZ042', 'CZ052'],
    position: { x: 400, y: 75 },
    path: 'M350,75 Q380,55 420,48 Q455,45 485,55 Q510,68 520,90 Q525,110 510,130 Q495,145 470,150 Q440,152 415,145 Q390,138 370,125 Q355,112 358,95 Q360,82 350,75 Z'
  },
  // Královéhradecký kraj - Hradec Králové region (north-east)
  {
    id: 'CZ052',
    name: 'Královéhradecký kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ051', 'CZ053', 'CZ064', 'CZ071'],
    position: { x: 520, y: 125 },
    path: 'M485,55 Q520,45 555,50 Q590,58 615,80 Q635,100 640,130 Q642,155 625,175 Q605,192 575,195 Q545,195 515,185 Q490,175 475,155 Q465,135 475,110 Q480,90 485,55 Z'
  },
  // Pardubický kraj - Pardubice region (east-central)
  {
    id: 'CZ053',
    name: 'Pardubický kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ020', 'CZ052', 'CZ063', 'CZ064', 'CZ071'],
    position: { x: 520, y: 205 },
    path: 'M440,155 Q460,165 480,175 Q510,185 540,190 Q575,195 600,185 Q620,175 630,195 Q640,215 630,240 Q615,265 585,275 Q550,282 515,278 Q480,272 455,255 Q440,240 445,220 Q450,200 440,155 Z'
  },
  // Vysočina - Highlands region (central-south)
  {
    id: 'CZ063',
    name: 'Vysočina',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ020', 'CZ031', 'CZ053', 'CZ064'],
    position: { x: 440, y: 320 },
    path: 'M355,320 Q390,318 420,305 Q450,295 465,275 Q485,280 515,285 Q530,305 540,330 Q545,360 530,385 Q510,405 475,410 Q440,412 405,400 Q380,385 370,360 Q365,335 355,320 Z'
  },
  // Jihomoravský kraj - South Moravia
  {
    id: 'CZ064',
    name: 'Jihomoravský kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ053', 'CZ063', 'CZ071', 'CZ072'],
    position: { x: 600, y: 350 },
    path: 'M530,285 Q560,275 590,280 Q625,290 655,310 Q685,335 700,370 Q710,405 695,435 Q675,460 640,470 Q600,475 565,460 Q535,440 520,405 Q510,370 520,340 Q528,310 530,285 Z'
  },
  // Olomoucký kraj - Olomouc region
  {
    id: 'CZ071',
    name: 'Olomoucký kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ052', 'CZ053', 'CZ064', 'CZ072', 'CZ080'],
    position: { x: 640, y: 210 },
    path: 'M575,195 Q610,185 640,175 Q670,168 700,175 Q730,185 750,210 Q765,235 755,265 Q742,290 710,300 Q680,308 650,300 Q620,290 600,270 Q585,250 590,225 Q595,200 575,195 Z'
  },
  // Zlínský kraj - Zlín region (east)
  {
    id: 'CZ072',
    name: 'Zlínský kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ064', 'CZ071', 'CZ080'],
    position: { x: 715, y: 325 },
    path: 'M655,310 Q680,295 710,300 Q740,308 760,280 Q775,310 785,345 Q790,380 775,410 Q755,435 720,440 Q690,442 665,425 Q645,405 650,375 Q655,340 655,310 Z'
  },
  // Moravskoslezský kraj - Moravia-Silesia (easternmost)
  {
    id: 'CZ080',
    name: 'Moravskoslezský kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ071', 'CZ072'],
    position: { x: 745, y: 195 },
    path: 'M700,175 Q725,155 755,145 Q785,140 800,160 Q812,180 808,210 Q802,240 785,265 Q765,285 740,285 Q715,283 700,265 Q690,245 695,220 Q700,195 700,175 Z'
  }
];

// Pre-calculated distances between regions for player distribution
// Using center positions for distance calculation
export const getMaximallyDistantTerritories = (playerCount: number): string[] => {
  const territories = initialTerritories;
  
  // Calculate distance between two territories
  const distance = (t1: Territory, t2: Territory): number => {
    const dx = t1.position.x - t2.position.x;
    const dy = t1.position.y - t2.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  // For different player counts, we want to maximize minimum distance between starting positions
  // Pre-selected optimal starting positions for each player count
  const optimalStarts: Record<number, string[]> = {
    2: ['CZ041', 'CZ080'], // Karlovarský (west) vs Moravskoslezský (east)
    3: ['CZ041', 'CZ080', 'CZ031'], // Add Jihočeský (south)
    4: ['CZ041', 'CZ080', 'CZ031', 'CZ052'], // Add Královéhradecký (north-east)
  };
  
  if (optimalStarts[playerCount]) {
    return optimalStarts[playerCount];
  }
  
  // Fallback: greedy algorithm for other counts
  const selected: Territory[] = [];
  const available = [...territories];
  
  // Start with the westernmost territory
  const first = available.reduce((a, b) => a.position.x < b.position.x ? a : b);
  selected.push(first);
  available.splice(available.indexOf(first), 1);
  
  // Greedily select territories that maximize minimum distance
  while (selected.length < playerCount && available.length > 0) {
    let bestTerritory: Territory | null = null;
    let bestMinDistance = -1;
    
    for (const candidate of available) {
      const minDist = Math.min(...selected.map(s => distance(s, candidate)));
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
  
  return selected.map(t => t.id);
};
