export interface Floor3DTable {
  id: number;
  tableNumber: number;
  name: string;
  blenderNodeName: string;
  zone: string;
  capacity: number;
  ambience: string;
  position3D: [number, number, number];
  shape: 'rect' | 'round';
}

export const RESTAURANT_3D_TABLES: Floor3DTable[] = [
  // Core Dining & Hearth
  {
    id: 1,
    tableNumber: 1,
    name: 'Table #01 · Hearthside Grand',
    blenderNodeName: 'TABLE_T_01_6S',
    zone: "The Hearth Chef's Counter",
    capacity: 6,
    ambience: 'Live wood-fired oven view · Smoked oak & brass dining setting',
    position3D: [-4.6, 0.0, -0.6],
    shape: 'rect',
  },
  {
    id: 2,
    tableNumber: 2,
    name: 'Table #02 · Hearthside East',
    blenderNodeName: 'TABLE_T_02_6S',
    zone: "The Hearth Chef's Counter",
    capacity: 6,
    ambience: 'Aromatic ember warmth · Spacious leather banquette seating',
    position3D: [4.6, 0.0, -0.6],
    shape: 'rect',
  },
  {
    id: 3,
    tableNumber: 3,
    name: 'Table #03 · Rotunda North',
    blenderNodeName: 'TABLE_T_03_4S',
    zone: 'Grand Rotunda',
    capacity: 4,
    ambience: 'Directly beneath royal crystal chandelier · Prime central acoustic view',
    position3D: [0.0, 0.0, 3.8],
    shape: 'rect',
  },
  {
    id: 4,
    tableNumber: 4,
    name: 'Table #04 · Rotunda South',
    blenderNodeName: 'TABLE_T_04_4S',
    zone: 'Grand Rotunda',
    capacity: 4,
    ambience: 'Gilded rotunda reflection · Architectural fountain views',
    position3D: [0.0, 0.0, -5.0],
    shape: 'rect',
  },
  {
    id: 5,
    tableNumber: 5,
    name: 'Table #05 · Intimate Salon West',
    blenderNodeName: 'TABLE_T_05_2S',
    zone: 'Main Chandelier Hall',
    capacity: 2,
    ambience: 'Candlelit champagne brass table · Perfect intimate couple setting',
    position3D: [-3.6, 0.0, 3.8],
    shape: 'rect',
  },
  {
    id: 6,
    tableNumber: 6,
    name: 'Table #06 · Intimate Salon East',
    blenderNodeName: 'TABLE_T_06_2S',
    zone: 'Main Chandelier Hall',
    capacity: 2,
    ambience: 'Soft spotlight ambiance · Quiet conversation alcove',
    position3D: [3.6, 0.0, 3.8],
    shape: 'rect',
  },
  {
    id: 7,
    tableNumber: 7,
    name: 'Table #07 · Fireplace Nook West',
    blenderNodeName: 'TABLE_T_07_2S',
    zone: "The Hearth Chef's Counter",
    capacity: 2,
    ambience: 'Embers reflection on calacatta marble · Intimate dining',
    position3D: [-3.6, 0.0, -5.2],
    shape: 'rect',
  },
  {
    id: 8,
    tableNumber: 8,
    name: 'Table #08 · Fireplace Nook East',
    blenderNodeName: 'TABLE_T_08_2S',
    zone: "The Hearth Chef's Counter",
    capacity: 2,
    ambience: 'Warm acoustic hearth glow · Italian cognac leather armchairs',
    position3D: [3.6, 0.0, -5.2],
    shape: 'rect',
  },
  {
    id: 9,
    tableNumber: 9,
    name: 'Table #09 · West Promenade North',
    blenderNodeName: 'TABLE_T_09_4S',
    zone: 'Main Chandelier Hall',
    capacity: 4,
    ambience: 'Overlooking acoustic timber slats & fine curated art gallery',
    position3D: [-10.5, 0.0, 2.1],
    shape: 'rect',
  },
  {
    id: 10,
    tableNumber: 10,
    name: 'Table #10 · West Promenade South',
    blenderNodeName: 'TABLE_T_10_4S',
    zone: 'Main Chandelier Hall',
    capacity: 4,
    ambience: 'Bar transition corridor · Luxurious smoked walnut dining table',
    position3D: [-10.5, 0.0, -3.5],
    shape: 'rect',
  },
  {
    id: 11,
    tableNumber: 11,
    name: 'Table #11 · Southwest Hearth Suite',
    blenderNodeName: 'TABLE_T_11_4S',
    zone: 'Main Chandelier Hall',
    capacity: 4,
    ambience: 'South promenade elegance · Fluted crystal amber lighting',
    position3D: [-5.2, 0.0, -12.5],
    shape: 'rect',
  },
  {
    id: 12,
    tableNumber: 12,
    name: 'Table #12 · Southeast Hearth Suite',
    blenderNodeName: 'TABLE_T_12_4S',
    zone: 'Main Chandelier Hall',
    capacity: 4,
    ambience: 'South gallery perspective · Dedicated cocktail bar attendant',
    position3D: [5.2, 0.0, -12.5],
    shape: 'rect',
  },
  {
    id: 13,
    tableNumber: 13,
    name: 'Table #13 · Northeast Promenade',
    blenderNodeName: 'TABLE_T_14_4S',
    zone: 'Main Chandelier Hall',
    capacity: 4,
    ambience: 'North wall boiserie artwork backdrop · Warm ambient cove illumination',
    position3D: [5.2, 0.0, 11.2],
    shape: 'rect',
  },
  {
    id: 14,
    tableNumber: 14,
    name: 'Table #14 · Sommelier Showcase Alcove',
    blenderNodeName: 'TABLE_T_15_6S',
    zone: 'Main Chandelier Hall',
    capacity: 6,
    ambience: 'Directly facing illuminated Grand Cru wine wall · Master sommelier pairing',
    position3D: [10.2, 0.0, -11.5],
    shape: 'rect',
  },
  {
    id: 15,
    tableNumber: 15,
    name: 'Table #15 · South Chef Table A',
    blenderNodeName: 'TABLE_S_01_6S',
    zone: "The Hearth Chef's Counter",
    capacity: 6,
    ambience: 'Direct sightline to artisanal culinary pass and flame grilling',
    position3D: [4.8, 0.0, -8.8],
    shape: 'rect',
  },
  {
    id: 16,
    tableNumber: 16,
    name: 'Table #16 · South Chef Table B',
    blenderNodeName: 'TABLE_S_02_6S',
    zone: "The Hearth Chef's Counter",
    capacity: 6,
    ambience: 'Centerline hearth view · Curated tasting menu privileged table',
    position3D: [0.0, 0.0, -9.5],
    shape: 'rect',
  },
  {
    id: 17,
    tableNumber: 17,
    name: 'Table #17 · Northwest Salon Booth',
    blenderNodeName: 'TABLE_NW_02_4S',
    zone: 'The Velvet Private Booths',
    capacity: 4,
    ambience: 'Acoustically isolated alcove · Warm downlighting and velvet cushions',
    position3D: [-12.8, 0.0, 9.2],
    shape: 'rect',
  },
  {
    id: 18,
    tableNumber: 18,
    name: 'Table #18 · Emerald Terrace North',
    blenderNodeName: 'TABLE_P_01',
    zone: 'Emerald Botanical Terrace',
    capacity: 6,
    ambience: 'Veranda garden promenade · Exotic indoor palms & limestone planters',
    position3D: [14.5, 0.0, 2.5],
    shape: 'rect',
  },
  {
    id: 19,
    tableNumber: 19,
    name: 'Table #19 · Emerald Terrace Center',
    blenderNodeName: 'TABLE_P_02',
    zone: 'Emerald Botanical Terrace',
    capacity: 6,
    ambience: 'Lush greenery canopy · Natural timber deck flooring ambiance',
    position3D: [14.5, 0.0, -1.5],
    shape: 'rect',
  },
  {
    id: 20,
    tableNumber: 20,
    name: 'Table #20 · Emerald Terrace South',
    blenderNodeName: 'TABLE_P_03',
    zone: 'Emerald Botanical Terrace',
    capacity: 6,
    ambience: 'Lantern-lit garden setting · Tranquil evening dining breeze',
    position3D: [14.5, 0.0, -5.75],
    shape: 'rect',
  },
  // Private Velvet Cabanas
  {
    id: 21,
    tableNumber: 21,
    name: 'Cabana #21 · North Velvet Suite',
    blenderNodeName: 'CABANA_B_01',
    zone: 'The Velvet Private Booths',
    capacity: 8,
    ambience: 'Deep royal velvet booth with gold trim · Private dining acoustic enclosure',
    position3D: [-8.5, 0.0, 5.5],
    shape: 'rect',
  },
  {
    id: 22,
    tableNumber: 22,
    name: 'Cabana #22 · Royal Palm Suite',
    blenderNodeName: 'CABANA_B_02',
    zone: 'The Velvet Private Booths',
    capacity: 8,
    ambience: 'Plush oyster champagne velvet · Overlooking east architectural gardens',
    position3D: [8.5, 0.0, 6.8],
    shape: 'rect',
  },
  {
    id: 23,
    tableNumber: 23,
    name: 'Cabana #23 · Piano Lounge Suite',
    blenderNodeName: 'CABANA_B_03',
    zone: 'The Velvet Private Booths',
    capacity: 8,
    ambience: 'Secluded south wing · Acoustic velvet curtains and private sommelier bell',
    position3D: [-8.5, 0.0, -8.0],
    shape: 'rect',
  },
  {
    id: 24,
    tableNumber: 24,
    name: 'Cabana #24 · Sommelier Vault Suite',
    blenderNodeName: 'CABANA_B_04',
    zone: 'The Velvet Private Booths',
    capacity: 8,
    ambience: 'Vintage cognac leather tufting · Adjacent to Grand Wine Wall',
    position3D: [8.5, 0.0, -8.0],
    shape: 'rect',
  },
  // Grand VIP Royal Salons
  {
    id: 25,
    tableNumber: 25,
    name: 'Salon #25 · Northwest Royal Salon',
    blenderNodeName: 'TABLE_NW_01_8S',
    zone: 'Grand VIP Royal Salon',
    capacity: 8,
    ambience: 'Exclusive VIP room · Calacatta Borghini banquet table & private chandelier',
    position3D: [-12.8, 0.0, 13.5],
    shape: 'rect',
  },
  {
    id: 26,
    tableNumber: 26,
    name: 'Salon #26 · Northeast Imperial Salon',
    blenderNodeName: 'TABLE_NE_VIP_8S',
    zone: 'Grand VIP Royal Salon',
    capacity: 8,
    ambience: 'Emerald & gold silk rug · Dedicated champagne butler service',
    position3D: [13.8, 0.0, 13.5],
    shape: 'rect',
  },
  {
    id: 27,
    tableNumber: 27,
    name: 'Presidential Suite #27 · West Emperor',
    blenderNodeName: 'TABLE_VIP_01',
    zone: 'Grand VIP Royal Salon',
    capacity: 10,
    ambience: 'Master banquet salon · Nero Marquina inlays, 10-seater presidential setting',
    position3D: [-1.8, 0.0, 14.2],
    shape: 'rect',
  },
  {
    id: 28,
    tableNumber: 28,
    name: 'Presidential Suite #28 · East Empress',
    blenderNodeName: 'TABLE_VIP_02',
    zone: 'Grand VIP Royal Salon',
    capacity: 8,
    ambience: 'Gold-leaf back wall, suspended crystal chandeliers & private dining veranda',
    position3D: [6.5, 0.0, 14.2],
    shape: 'rect',
  },
];

// Helper maps for O(1) lookups
const BY_NODE_NAME = new Map<string, Floor3DTable>();
const BY_TABLE_NUM = new Map<number, Floor3DTable>();

for (const t of RESTAURANT_3D_TABLES) {
  BY_NODE_NAME.set(t.blenderNodeName.toLowerCase(), t);
  BY_TABLE_NUM.set(t.tableNumber, t);
}

// Special alias mappings for child nodes and cabana wrappers
const NODE_ALIASES: Record<string, string> = {
  table_b_01: 'cabana_b_01',
  table_b_02: 'cabana_b_02',
  table_b_03: 'cabana_b_03',
  table_b_04: 'cabana_b_04',
};

/**
 * Resolves any Three.js mesh / parent name back to its Floor3DTable
 */
export function resolveTableFromMeshName(name: string): Floor3DTable | undefined {
  const clean = name.toLowerCase();
  
  // Direct check
  if (BY_NODE_NAME.has(clean)) {
    return BY_NODE_NAME.get(clean);
  }

  // Alias check
  if (NODE_ALIASES[clean] && BY_NODE_NAME.has(NODE_ALIASES[clean])) {
    return BY_NODE_NAME.get(NODE_ALIASES[clean]);
  }

  // Prefix check (e.g. TABLE_T_01_6S_Top -> TABLE_T_01_6S)
  for (const [key, table] of BY_NODE_NAME.entries()) {
    if (clean.startsWith(key) || clean.includes(key)) {
      return table;
    }
  }

  return undefined;
}

export function getTableByNumber(tableNumber: number): Floor3DTable | undefined {
  return BY_TABLE_NUM.get(tableNumber);
}
