import { Territory } from "@/types/game";

// Czech Republic regions (14 kraje) with simplified SVG paths
// viewBox is 0 0 800 500 for the map
export const initialTerritories: Territory[] = [
  // Praha (Prague) - center, small
  {
    id: "CZ010",
    name: "Praha",
    ownerId: null,
    isCapital: false,
    neighbors: ["CZ020"],
    position: { x: 380, y: 205 },
    path: "M 1188.99,999.918 C 1183.187,1001.5787 1174.5588,995.18752 1170.8748,999.97115 C 1165.8148,1006.536 1175.2202,1018.5423 1169.8118,1024.8331 C 1165.2467,1030.1411 1155.3806,1028.0245 1148.7921,1025.6256 C 1144.0734,1023.9082 1144.3829,1012.7984 1139.4658,1013.7917 C 1125.1279,1016.6902 1112.4743,1025.9823 1101.1648,1035.2566 C 1097.6638,1038.128 1110.8773,1031.6895 1114.6984,1034.1038 C 1122.6805,1039.1473 1133.7857,1046.0983 1133.2459,1055.5239 C 1132.7746,1063.7695 1116.3508,1061.96 1112.6609,1069.3586 C 1110.8135,1073.0627 1121.8998,1069.7342 1124.5893,1072.8796 C 1129.9209,1079.1148 1129.3823,1089.1617 1134.8557,1095.2741 C 1137.6232,1098.364 1146.4675,1093.8331 1147.0262,1097.9423 C 1147.9003,1104.3724 1134.5569,1109.188 1137.531,1114.9567 C 1141.1111,1121.9042 1155.3875,1116.0776 1159.7271,1122.5786 C 1162.7851,1127.1638 1151.8713,1132.0455 1152.5741,1137.5189 C 1152.9698,1140.5982 1161.9961,1135.7649 1161.7965,1138.8583 C 1161.4929,1143.5392 1148.2535,1145.7763 1151.8324,1148.8248 C 1161.1303,1156.7421 1175.0561,1163.7037 1186.7222,1160.074 C 1194.0157,1157.8051 1182.6319,1141.5725 1188.9262,1137.2696 C 1197.5107,1131.4029 1210.5364,1141.2229 1220.1309,1137.2212 C 1227.5414,1134.1302 1228.1319,1122.5467 1234.8113,1118.0996 C 1240.0284,1114.6259 1248.0826,1118.4138 1253.386,1115.0806 C 1255.5179,1113.74 1248.6956,1108.693 1251.078,1107.8615 C 1258.7401,1105.185 1267.4687,1108.9209 1275.4379,1107.3618 C 1277.8711,1106.8858 1278.3164,1101.3085 1280.6574,1102.0797 C 1291.2546,1105.5771 1298.9297,1115.9144 1309.7348,1118.6736 C 1312.7018,1119.4296 1307.304,1111.5147 1309.5883,1109.4761 C 1311.7534,1107.5437 1317.776,1114.0459 1318.1457,1111.1698 C 1319.7816,1098.4182 1309.6651,1084.7759 1314.3212,1072.7979 C 1317.7819,1063.8956 1332.5722,1065.163 1338.8418,1057.9674 C 1342.2482,1054.0567 1343.9431,1046.5623 1340.7115,1042.5204 C 1335.3255,1035.7891 1323.4266,1037.4002 1317.437,1031.1991 C 1314.5432,1028.2038 1321.2356,1020.8889 1317.704,1018.6813 C 1309.2659,1013.4052 1296.1339,1019.24 1288.3549,1013.0248 C 1283.6043,1009.2286 1292.7275,998.32664 1287.7974,994.78084 C 1278.7439,988.27273 1264.8241,993.89852 1254.8505,988.91646 C 1251.1228,987.05379 1255.8686,976.11526 1251.7641,976.80026 C 1229.77,980.46653 1210.4252,993.77686 1188.9898,999.91766 L 1188.99,999.918 z",
  },
  // Středočeský kraj - surrounds Prague
  {
    id: "CZ020",
    name: "Středočeský kraj",
    ownerId: null,
    isCapital: false,
    neighbors: ["CZ010", "CZ031", "CZ032", "CZ041", "CZ042", "CZ051", "CZ053"],
    position: { x: 380, y: 250 },
    path: "M300,160 L340,145 L420,150 L460,175 L470,220 L450,270 L400,300 L340,290 L290,250 L280,200 L300,160 M368,195 L392,195 L398,205 L392,220 L368,220 L362,205 Z",
  },
  // Jihočeský kraj - South Bohemia
  {
    id: "CZ031",
    name: "Jihočeský kraj",
    ownerId: null,
    isCapital: false,
    neighbors: ["CZ020", "CZ032", "CZ063"],
    position: { x: 340, y: 380 },
    path: "M240,290 L290,250 L340,290 L400,300 L420,340 L400,400 L350,430 L280,420 L220,380 L200,330 L240,290",
  },
  // Plzeňský kraj - Pilsen region
  {
    id: "CZ032",
    name: "Plzeňský kraj",
    ownerId: null,
    isCapital: false,
    neighbors: ["CZ020", "CZ031", "CZ041"],
    position: { x: 210, y: 280 },
    path: "M100,200 L150,170 L200,160 L280,200 L290,250 L240,290 L200,330 L140,320 L80,280 L90,230 L100,200",
  },
  // Karlovarský kraj - Karlovy Vary region (westernmost)
  {
    id: "CZ041",
    name: "Karlovarský kraj",
    ownerId: null,
    isCapital: false,
    neighbors: ["CZ020", "CZ032", "CZ042"],
    position: { x: 110, y: 160 },
    path: "M40,120 L80,100 L140,110 L170,130 L150,170 L100,200 L90,230 L50,200 L30,160 L40,120",
  },
  // Ústecký kraj - Ústí nad Labem region (north-west)
  {
    id: "CZ042",
    name: "Ústecký kraj",
    ownerId: null,
    isCapital: false,
    neighbors: ["CZ020", "CZ041", "CZ051"],
    position: { x: 230, y: 100 },
    path: "M140,110 L180,80 L250,60 L320,70 L340,100 L340,145 L300,160 L200,160 L150,170 L140,110",
  },
  // Liberecký kraj - Liberec region (north)
  {
    id: "CZ051",
    name: "Liberecký kraj",
    ownerId: null,
    isCapital: false,
    neighbors: ["CZ020", "CZ042", "CZ052"],
    position: { x: 400, y: 90 },
    path: "M320,70 L380,50 L440,60 L480,90 L470,130 L420,150 L340,145 L340,100 L320,70",
  },
  // Královéhradecký kraj - Hradec Králové region (north-east)
  {
    id: "CZ052",
    name: "Královéhradecký kraj",
    ownerId: null,
    isCapital: false,
    neighbors: ["CZ051", "CZ053", "CZ064"],
    position: { x: 520, y: 120 },
    path: "M440,60 L500,50 L570,70 L600,110 L580,160 L530,180 L470,175 L470,130 L480,90 L440,60",
  },
  // Pardubický kraj - Pardubice region (east-central)
  {
    id: "CZ053",
    name: "Pardubický kraj",
    ownerId: null,
    isCapital: false,
    neighbors: ["CZ020", "CZ052", "CZ063", "CZ064"],
    position: { x: 530, y: 220 },
    path: "M460,175 L470,175 L530,180 L580,160 L620,200 L600,250 L540,270 L470,260 L450,270 L470,220 L460,175",
  },
  // Vysočina - Highlands region (central-south)
  {
    id: "CZ063",
    name: "Vysočina",
    ownerId: null,
    isCapital: false,
    neighbors: ["CZ020", "CZ031", "CZ053", "CZ064"],
    position: { x: 470, y: 320 },
    path: "M400,300 L450,270 L470,260 L540,270 L560,310 L540,360 L480,380 L420,340 L400,300",
  },
  // Jihomoravský kraj - South Moravia
  {
    id: "CZ064",
    name: "Jihomoravský kraj",
    ownerId: null,
    isCapital: false,
    neighbors: ["CZ053", "CZ063", "CZ071", "CZ072"],
    position: { x: 610, y: 350 },
    path: "M540,270 L600,250 L660,280 L700,330 L690,390 L630,420 L560,400 L540,360 L560,310 L540,270",
  },
  // Olomoucký kraj - Olomouc region
  {
    id: "CZ071",
    name: "Olomoucký kraj",
    ownerId: null,
    isCapital: false,
    neighbors: ["CZ053", "CZ064", "CZ072", "CZ080"],
    position: { x: 650, y: 220 },
    path: "M580,160 L620,140 L680,150 L720,190 L710,240 L660,280 L600,250 L620,200 L580,160",
  },
  // Zlínský kraj - Zlín region (east)
  {
    id: "CZ072",
    name: "Zlínský kraj",
    ownerId: null,
    isCapital: false,
    neighbors: ["CZ064", "CZ071", "CZ080"],
    position: { x: 720, y: 320 },
    path: "M660,280 L710,240 L760,270 L780,330 L750,380 L690,390 L700,330 L660,280",
  },
  // Moravskoslezský kraj - Moravia-Silesia (easternmost)
  {
    id: "CZ080",
    name: "Moravskoslezský kraj",
    ownerId: null,
    isCapital: false,
    neighbors: ["CZ071", "CZ072"],
    position: { x: 750, y: 180 },
    path: "M680,150 L720,120 L780,130 L800,180 L780,240 L760,270 L710,240 L720,190 L680,150",
  },
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
    2: ["CZ041", "CZ080"], // Karlovarský (west) vs Moravskoslezský (east)
    3: ["CZ041", "CZ080", "CZ031"], // Add Jihočeský (south)
    4: ["CZ041", "CZ080", "CZ031", "CZ052"], // Add Královéhradecký (north-east)
  };

  if (optimalStarts[playerCount]) {
    return optimalStarts[playerCount];
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
