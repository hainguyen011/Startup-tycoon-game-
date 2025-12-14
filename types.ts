export enum Industry {
  TECH = 'Technology (SaaS)',
  HEALTH = 'Health & BioTech',
  AI = 'Artificial Intelligence',
  EDTECH = 'Education Tech',
  FMCG = 'Consumer Goods (FMCG)'
}

export enum GameStage {
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum IntelType {
  MARKET = 'MARKET',
  COMPETITOR = 'COMPETITOR',
  INTERNAL = 'INTERNAL'
}

export interface IntelItem {
  id: string;
  type: IntelType;
  title: string;
  content: string;
  cost: number;
}

// --- NEW TYPES FOR ADVANCED MANAGEMENT ---

export interface Employee {
  id: string;
  name: string;
  role: 'Developer' | 'Designer' | 'Marketer' | 'Sales' | 'Manager' | 'Secretary' | 'Tester';
  level: 'Junior' | 'Senior' | 'Lead' | 'Expert';
  skill: number; // 0-100
  specificSkills: string[]; 
  salary: number; 
  morale: number; 
  quirk?: string; 
  education?: string;
  backgroundStory?: string;
  
  // Stats
  stress: number; 
  loyalty: number; 
  traits: string[]; 
  assignedProductId?: string | null; // New: Link to a product
}

export interface Candidate {
  id: string;
  name: string;
  role: 'Developer' | 'Designer' | 'Marketer' | 'Sales' | 'Manager' | 'Secretary' | 'Tester';
  level: 'Junior' | 'Senior' | 'Lead' | 'Expert';
  skill: number;
  specificSkills: string[]; 
  salary: number;
  bio: string; 
  matchAnalysis: string; 
  quirk: string; 
  hireCost: number; 
  education: string;
  experienceYears: number;
  interviewNotes: string; 
}

export enum ProductStage {
  CONCEPT = 'Concept', // Needs Design
  MVP = 'MVP Development', // Needs Dev
  ALPHA = 'Alpha Testing', // Needs Tester
  RELEASE = 'Market Release', // Needs Marketing
  GROWTH = 'Scaling', // Needs All
  MATURE = 'Mature' // Needs Maintenance
}

export interface Product {
  id: string;
  name: string;
  description: string;
  stage: ProductStage;
  
  // Progress Bars (0-100)
  developmentProgress: number; 
  
  // Metrics
  quality: number; // 0-100
  marketFit: number; // 0-100 (Hidden potential)
  bugs: number; // Count
  users: number;
  revenue: number; // Monthly
  
  // Feedback
  activeFeedback: string[]; // List of user complaints/praises
}

export interface Facility {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  description: string;
  costToUpgrade: number;
  maintenanceCost: number;
  benefit: string; 
  statEffect: 'max_employees' | 'max_users' | 'efficiency';
  value: number; 
}

export interface PlayerSkills {
  management: number; 
  tech: number; 
  charisma: number; 
}

// --- EVENT SYSTEM ---

export interface EventOption {
  label: string;
  risk: string; 
}

export interface InteractiveEvent {
  title: string;
  description: string;
  type: 'opportunity' | 'crisis' | 'dilemma';
  options: EventOption[];
}

// ----------------------------------------

export interface PlayerDecisions {
  rdFocus: string; 
  marketingFocus: string; 
  strategyNote: string; 
  eventChoice: string | null; 
}

export interface SimulationResult {
  narrative: string; 
  cashChange: number;
  userChange: number;
  moraleChange: number;
  equityChange: number;
  competitorUpdate: string;
  advice: string;
  randomEvent: InteractiveEvent | null;
  skillXpEarned?: {
    management?: number;
    tech?: number;
    charisma?: number;
  }
  decisions?: PlayerDecisions;
  secretaryReport?: string;
  
  // Updates for specific products
  productUpdates: {
      productId: string;
      devProgressChange: number;
      qualityChange: number;
      bugChange: number;
      userChange: number;
      revenueChange: number;
      newFeedback?: string;
  }[];
}

export interface GameState {
  companyName: string;
  industry: Industry;
  cash: number;
  users: number; // Total across all products
  morale: number; 
  productQuality: number; // Avg across products (Brand Image)
  marketShare: number; 
  equity: number;
  turn: number;
  
  employees: Employee[];
  candidates: Candidate[]; 
  products: Product[]; // List of products
  facilities: Facility[];
  playerSkills: PlayerSkills;
  
  history: SimulationResult[];
  stage: GameStage;
  marketContext: string; 
  competitorName: string;
  gameOverReason?: string;
}

export const INITIAL_CASH = 10000;

export const INITIAL_FACILITIES: Facility[] = [
  {
    id: 'office',
    name: 'Home Office / Garage',
    level: 1,
    maxLevel: 5,
    description: 'Không gian làm việc chật hẹp, chi phí thấp.',
    costToUpgrade: 5000,
    maintenanceCost: 100, 
    benefit: 'Max 3 Employees',
    statEffect: 'max_employees',
    value: 3
  },
  {
    id: 'server',
    name: 'Shared Hosting',
    level: 1,
    maxLevel: 5,
    description: 'Server giá rẻ, dễ sập khi đông khách.',
    costToUpgrade: 2000,
    maintenanceCost: 50,
    benefit: 'Max 1,000 Users',
    statEffect: 'max_users',
    value: 1000
  }
];

export const INITIAL_SKILLS: PlayerSkills = {
  management: 1,
  tech: 1,
  charisma: 1
};