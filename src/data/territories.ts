import { Territory } from '@/types/game';

// Hexagonal grid layout - 19 territories
export const initialTerritories: Territory[] = [
  // Top row
  { id: 't1', name: 'Северные Горы', ownerId: null, isCapital: false, neighbors: ['t2', 't5', 't6'], position: { x: 200, y: 60 }, path: 'M200,30 L250,55 L250,105 L200,130 L150,105 L150,55 Z' },
  { id: 't2', name: 'Ледяной Край', ownerId: null, isCapital: false, neighbors: ['t1', 't3', 't6', 't7'], position: { x: 310, y: 60 }, path: 'M310,30 L360,55 L360,105 L310,130 L260,105 L260,55 Z' },
  { id: 't3', name: 'Восточный Пик', ownerId: null, isCapital: false, neighbors: ['t2', 't4', 't7', 't8'], position: { x: 420, y: 60 }, path: 'M420,30 L470,55 L470,105 L420,130 L370,105 L370,55 Z' },
  { id: 't4', name: 'Туманная Долина', ownerId: null, isCapital: false, neighbors: ['t3', 't8', 't9'], position: { x: 530, y: 60 }, path: 'M530,30 L580,55 L580,105 L530,130 L480,105 L480,55 Z' },
  
  // Upper middle row
  { id: 't5', name: 'Западный Лес', ownerId: null, isCapital: false, neighbors: ['t1', 't6', 't10', 't11'], position: { x: 145, y: 145 }, path: 'M145,115 L195,140 L195,190 L145,215 L95,190 L95,140 Z' },
  { id: 't6', name: 'Серебряная Река', ownerId: null, isCapital: false, neighbors: ['t1', 't2', 't5', 't7', 't11', 't12'], position: { x: 255, y: 145 }, path: 'M255,115 L305,140 L305,190 L255,215 L205,190 L205,140 Z' },
  { id: 't7', name: 'Центральные Равнины', ownerId: null, isCapital: false, neighbors: ['t2', 't3', 't6', 't8', 't12', 't13'], position: { x: 365, y: 145 }, path: 'M365,115 L415,140 L415,190 L365,215 L315,190 L315,140 Z' },
  { id: 't8', name: 'Янтарный Холм', ownerId: null, isCapital: false, neighbors: ['t3', 't4', 't7', 't9', 't13', 't14'], position: { x: 475, y: 145 }, path: 'M475,115 L525,140 L525,190 L475,215 L425,190 L425,140 Z' },
  { id: 't9', name: 'Восточная Крепость', ownerId: null, isCapital: false, neighbors: ['t4', 't8', 't14', 't15'], position: { x: 585, y: 145 }, path: 'M585,115 L635,140 L635,190 L585,215 L535,190 L535,140 Z' },
  
  // Middle row
  { id: 't10', name: 'Дремучая Чаща', ownerId: null, isCapital: false, neighbors: ['t5', 't11', 't16'], position: { x: 200, y: 230 }, path: 'M200,200 L250,225 L250,275 L200,300 L150,275 L150,225 Z' },
  { id: 't11', name: 'Старый Мост', ownerId: null, isCapital: false, neighbors: ['t5', 't6', 't10', 't12', 't16', 't17'], position: { x: 310, y: 230 }, path: 'M310,200 L360,225 L360,275 L310,300 L260,275 L260,225 Z' },
  { id: 't12', name: 'Королевский Трон', ownerId: null, isCapital: false, neighbors: ['t6', 't7', 't11', 't13', 't17', 't18'], position: { x: 420, y: 230 }, path: 'M420,200 L470,225 L470,275 L420,300 L370,275 L370,225 Z' },
  { id: 't13', name: 'Торговый Путь', ownerId: null, isCapital: false, neighbors: ['t7', 't8', 't12', 't14', 't18', 't19'], position: { x: 530, y: 230 }, path: 'M530,200 L580,225 L580,275 L530,300 L480,275 L480,225 Z' },
  { id: 't14', name: 'Восточные Врата', ownerId: null, isCapital: false, neighbors: ['t8', 't9', 't13', 't15', 't19'], position: { x: 640, y: 230 }, path: 'M640,200 L690,225 L690,275 L640,300 L590,275 L590,225 Z' },
  
  // Bottom row
  { id: 't15', name: 'Южный Порт', ownerId: null, isCapital: false, neighbors: ['t9', 't14', 't19'], position: { x: 585, y: 315 }, path: 'M585,285 L635,310 L635,360 L585,385 L535,360 L535,310 Z' },
  { id: 't16', name: 'Заброшенные Шахты', ownerId: null, isCapital: false, neighbors: ['t10', 't11', 't17'], position: { x: 255, y: 315 }, path: 'M255,285 L305,310 L305,360 L255,385 L205,360 L205,310 Z' },
  { id: 't17', name: 'Золотые Поля', ownerId: null, isCapital: false, neighbors: ['t11', 't12', 't16', 't18'], position: { x: 365, y: 315 }, path: 'M365,285 L415,310 L415,360 L365,385 L315,360 L315,310 Z' },
  { id: 't18', name: 'Южные Виноградники', ownerId: null, isCapital: false, neighbors: ['t12', 't13', 't17', 't19'], position: { x: 475, y: 315 }, path: 'M475,285 L525,310 L525,360 L475,385 L425,360 L425,310 Z' },
  { id: 't19', name: 'Древние Руины', ownerId: null, isCapital: false, neighbors: ['t13', 't14', 't15', 't18'], position: { x: 585, y: 315 }, path: 'M585,285 L635,310 L635,360 L585,385 L535,360 L535,310 Z' },
];
