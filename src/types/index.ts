export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type PartType = 'head' | 'body' | 'arm' | 'leg' | 'core' | 'tool';

export type MissionType = 'transport' | 'cleaning' | 'rescue' | 'combat';

export type LesionType = 'crack' | 'short_circuit' | 'loose' | 'contamination';

export type SurgeryToolType =
  | 'laser_welder'
  | 'circuit_tester'
  | 'soldering_iron'
  | 'ultrasonic_cleaner'
  | 'microscope'
  | 'anti_static_cloth';

export type SurgeryMaterialType =
  | 'nano_adhesive'
  | 'conductive_gel'
  | 'reinforcement_plate'
  | 'cleaning_solution'
  | 'flux'
  | 'insulation_tape';

export interface Part {
  id: string;
  name: string;
  type: PartType;
  rarity: Rarity;
  weight: number;
  energy: number;
  skillSlots: number;
  compatibility: PartType[];
  setBonus: string | null;
  durability: number;
  maxDurability: number;
  description: string;
  icon: string;
}

export interface Robot {
  id: string;
  name: string;
  parts: Record<PartType, Part | null>;
  totalWeight: number;
  totalEnergy: number;
  totalSkillSlots: number;
  durability: number;
  maxDurability: number;
  repairCount: number;
  isOverloaded: boolean;
  compatibilityIssues: string[];
  activeSetBonuses: string[];
  createdAt: number;
}

export interface Mission {
  id: string;
  name: string;
  type: MissionType;
  difficulty: number;
  requirements: {
    weight?: number;
    energy?: number;
    skillSlots?: number;
    durability?: number;
    partTypes?: PartType[];
  };
  rewards: {
    credits: number;
    materials: number;
    blindBox?: Rarity;
  };
  description: string;
  icon: string;
}

export interface MissionRecord {
  id: string;
  robotId: string;
  robotName: string;
  missionId: string;
  missionName: string;
  success: boolean;
  adaptability: number;
  rewards: { credits: number; materials: number };
  durabilityLoss: number;
  completedAt: number;
}

export interface Lesion {
  id: string;
  type: LesionType;
  name: string;
  description: string;
  severity: number;
  position: { x: number; y: number };
  treated: boolean;
  correctTool: SurgeryToolType;
  correctMaterial: SurgeryMaterialType;
  stepOrder: number;
}

export interface SurgeryTool {
  type: SurgeryToolType;
  name: string;
  description: string;
  icon: string;
  targetLesions: LesionType[];
}

export interface SurgeryMaterial {
  type: SurgeryMaterialType;
  name: string;
  description: string;
  icon: string;
  cost: number;
  targetLesions: LesionType[];
}

export interface SurgeryStep {
  step: number;
  lesionId: string;
  tool: SurgeryToolType | null;
  material: SurgeryMaterialType | null;
  completed: boolean;
  success: boolean;
  damageIncrease: number;
  message: string;
}

export interface SurgerySession {
  id: string;
  robotId: string;
  partId: string;
  part: Part;
  lesions: Lesion[];
  steps: SurgeryStep[];
  currentStep: number;
  totalDamageIncrease: number;
  completed: boolean;
  success: boolean;
  finalRecovery: number;
  startedAt: number;
  finishedAt: number | null;
}

export interface SurgeryRecord {
  id: string;
  robotId: string;
  robotName: string;
  partName: string;
  lesionsTreated: number;
  totalLesions: number;
  damageIncrease: number;
  finalRecovery: number;
  materialCost: number;
  success: boolean;
  performedAt: number;
}

export interface RepairRecord {
  id: string;
  robotId: string;
  robotName: string;
  materialCost: number;
  success: boolean;
  durabilityRestored: number;
  repairedAt: number;
}

export interface AssemblyPlan {
  id: string;
  name: string;
  parts: Record<PartType, Part | null>;
  savedAt: number;
}

export interface RarityConfig {
  name: string;
  probability: number;
  color: string;
  bgColor: string;
  glowColor: string;
}

export interface SetBonusConfig {
  name: string;
  description: string;
  requiredParts: number;
  effects: {
    weightBonus?: number;
    energyBonus?: number;
    skillBonus?: number;
    durabilityBonus?: number;
  };
}

export interface OverloadRules {
  threshold: number;
  durabilityPenalty: number;
  performancePenalty: number;
}

export interface RepairRules {
  baseSuccessRate: number;
  degradeRate: number;
  maxRepairs: number;
  materialCostPerPoint: number;
  severeDamageThreshold: number;
}

export interface MicroSurgeryConfig {
  lesionSevereDamageChance: number;
  maxLesionsPerPart: number;
  minLesionsPerPart: number;
  wrongOrderDamageMultiplier: number;
  correctStepRecoveryBonus: number;
  baseMaterialCost: number;
}

export interface MissionWeights {
  weight: number;
  energy: number;
  skillSlots: number;
  durability: number;
}

export interface GameConfig {
  rarities: Record<Rarity, RarityConfig>;
  setBonuses: Record<string, SetBonusConfig>;
  overloadRules: OverloadRules;
  repairRules: RepairRules;
  microSurgery: MicroSurgeryConfig;
  missionWeights: Record<MissionType, MissionWeights>;
  recyclingRates: Record<Rarity, number>;
}

export interface GameState {
  parts: Part[];
  robots: Robot[];
  credits: number;
  materials: number;
  missionRecords: MissionRecord[];
  repairRecords: RepairRecord[];
  surgeryRecords: SurgeryRecord[];
  assemblyPlans: AssemblyPlan[];
  config: GameConfig;
  selectedParts: Record<PartType, Part | null>;
  activeSurgery: SurgerySession | null;
}

export interface GameActions {
  addPart: (part: Part) => void;
  removePart: (partId: string) => void;
  updatePart: (partId: string, updates: Partial<Part>) => void;
  addRobot: (robot: Robot) => void;
  removeRobot: (robotId: string) => void;
  updateRobot: (robotId: string, updates: Partial<Robot>) => void;
  addCredits: (amount: number) => void;
  spendCredits: (amount: number) => boolean;
  addMaterials: (amount: number) => void;
  spendMaterials: (amount: number) => boolean;
  addMissionRecord: (record: MissionRecord) => void;
  addRepairRecord: (record: RepairRecord) => void;
  addAssemblyPlan: (plan: AssemblyPlan) => void;
  removeAssemblyPlan: (planId: string) => void;
  updateConfig: (config: Partial<GameConfig>) => void;
  resetConfig: () => void;
  setSelectedPart: (slot: PartType, part: Part | null) => void;
  clearSelectedParts: () => void;
  recyclePart: (partId: string) => void;
  repairRobot: (robotId: string) => { success: boolean; cost: number; restored: number; message?: string };
  executeMission: (robotId: string, missionId: string) => MissionRecord;
  calculateRobotStats: (parts: Record<PartType, Part | null>) => {
    totalWeight: number;
    totalEnergy: number;
    totalSkillSlots: number;
    maxDurability: number;
    isOverloaded: boolean;
    compatibilityIssues: string[];
    activeSetBonuses: string[];
  };
  calculateAdaptability: (robot: Robot, mission: Mission) => number;
  generateRandomPart: (minRarity?: Rarity) => Part;
  openBlindBox: (type: Rarity, free?: boolean) => Part[];
  loadFromStorage: () => void;
  resetGame: () => void;
  addSurgeryRecord: (record: SurgeryRecord) => void;
  setActiveSurgery: (session: SurgerySession | null) => void;
  startSurgerySession: (robotId: string, partId: string) => SurgerySession | null;
  performSurgeryStep: (
    tool: SurgeryToolType,
    material: SurgeryMaterialType
  ) => {
    success: boolean;
    stepCompleted: boolean;
    damageIncrease: number;
    message: string;
  };
  completeSurgerySession: () => {
    success: boolean;
    totalRecovery: number;
    totalDamage: number;
    materialCost: number;
  };
  cancelSurgerySession: () => void;
  getDamagedParts: (robotId: string) => Part[];
  isSeverelyDamaged: (part: Part) => boolean;
  getSurgeryTools: () => SurgeryTool[];
  getSurgeryMaterials: () => SurgeryMaterial[];
}

export type Store = GameState & GameActions;
