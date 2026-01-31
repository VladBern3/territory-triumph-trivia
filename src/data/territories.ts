import { Territory } from '@/types/game';

// Czech Republic regions (14 kraje) with simplified SVG paths
// viewBox is 0 0 800 500 for the map
export const initialTerritories: Territory[] = [
  // Praha (Prague) - center, small
  {
    id: 'CZ010',
    name: 'Praha',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ020'],
    position: { x: 380, y: 205 },
    path: 'M368,195 L392,195 L398,205 L392,220 L368,220 L362,205 Z'
  },
  // Středočeský kraj - surrounds Prague
  {
    id: 'CZ020',
    name: 'Středočeský kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ010', 'CZ031', 'CZ032', 'CZ041', 'CZ042', 'CZ051', 'CZ053'],
    position: { x: 380, y: 250 },
    path: 'M300,160 L340,145 L420,150 L460,175 L470,220 L450,270 L400,300 L340,290 L290,250 L280,200 L300,160 M368,195 L392,195 L398,205 L392,220 L368,220 L362,205 Z'
  },
  // Jihočeský kraj - South Bohemia
  {
    id: 'CZ031',
    name: 'Jihočeský kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ020', 'CZ032', 'CZ063'],
    position: { x: 340, y: 380 },
    path: 'M240,290 L290,250 L340,290 L400,300 L420,340 L400,400 L350,430 L280,420 L220,380 L200,330 L240,290'
  },
  // Plzeňský kraj - Pilsen region
  {
    id: 'CZ032',
    name: 'Plzeňský kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ020', 'CZ031', 'CZ041'],
    position: { x: 210, y: 280 },
    path: 'M100,200 L150,170 L200,160 L280,200 L290,250 L240,290 L200,330 L140,320 L80,280 L90,230 L100,200'
  },
  // Karlovarský kraj - Karlovy Vary region (westernmost)
  {
    id: 'CZ041',
    name: 'Karlovarský kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ020', 'CZ032', 'CZ042'],
    position: { x: 110, y: 160 },
    path: 'M40,120 L80,100 L140,110 L170,130 L150,170 L100,200 L90,230 L50,200 L30,160 L40,120'
  },
  // Ústecký kraj - Ústí nad Labem region (north-west)
  {
    id: 'CZ042',
    name: 'Ústecký kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ020', 'CZ041', 'CZ051'],
    position: { x: 230, y: 100 },
    path: 'M140,110 L180,80 L250,60 L320,70 L340,100 L340,145 L300,160 L200,160 L150,170 L140,110'
  },
  // Liberecký kraj - Liberec region (north)
  {
    id: 'CZ051',
    name: 'Liberecký kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ020', 'CZ042', 'CZ052'],
    position: { x: 400, y: 90 },
    path: 'M320,70 L380,50 L440,60 L480,90 L470,130 L420,150 L340,145 L340,100 L320,70'
  },
  // Královéhradecký kraj - Hradec Králové region (north-east)
  {
    id: 'CZ052',
    name: 'Královéhradecký kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ051', 'CZ053', 'CZ064'],
    position: { x: 520, y: 120 },
    path: 'M440,60 L500,50 L570,70 L600,110 L580,160 L530,180 L470,175 L470,130 L480,90 L440,60'
  },
  // Pardubický kraj - Pardubice region (east-central)
  {
    id: 'CZ053',
    name: 'Pardubický kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ020', 'CZ052', 'CZ063', 'CZ064'],
    position: { x: 530, y: 220 },
    path: 'M460,175 L470,175 L530,180 L580,160 L620,200 L600,250 L540,270 L470,260 L450,270 L470,220 L460,175'
  },
  // Vysočina - Highlands region (central-south)
  {
    id: 'CZ063',
    name: 'Vysočina',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ020', 'CZ031', 'CZ053', 'CZ064'],
    position: { x: 470, y: 320 },
    path: 'M400,300 L450,270 L470,260 L540,270 L560,310 L540,360 L480,380 L420,340 L400,300'
  },
  // Jihomoravský kraj - South Moravia
  {
    id: 'CZ064',
    name: 'Jihomoravský kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ053', 'CZ063', 'CZ071', 'CZ072'],
    position: { x: 610, y: 350 },
    path: 'M540,270 L600,250 L660,280 L700,330 L690,390 L630,420 L560,400 L540,360 L560,310 L540,270'
  },
  // Olomoucký kraj - Olomouc region
  {
    id: 'CZ071',
    name: 'Olomoucký kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ053', 'CZ064', 'CZ072', 'CZ080'],
    position: { x: 650, y: 220 },
    path: 'M580,160 L620,140 L680,150 L720,190 L710,240 L660,280 L600,250 L620,200 L580,160'
  },
  // Zlínský kraj - Zlín region (east)
  {
    id: 'CZ072',
    name: 'Zlínský kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ064', 'CZ071', 'CZ080'],
    position: { x: 720, y: 320 },
    path: 'M660,280 L710,240 L760,270 L780,330 L750,380 L690,390 L700,330 L660,280'
  },
  // Moravskoslezský kraj - Moravia-Silesia (easternmost)
  {
    id: 'CZ080',
    name: 'Moravskoslezský kraj',
    ownerId: null,
    isCapital: false,
    neighbors: ['CZ071', 'CZ072'],
    position: { x: 750, y: 180 },
    path: 'M680,150 L720,120 L780,130 L800,180 L780,240 L760,270 L710,240 L720,190 L680,150'
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
