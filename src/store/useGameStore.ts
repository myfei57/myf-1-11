import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Store,
  Part,
  PartType,
  Rarity,
  Robot,
  MissionRecord,
  RepairRecord,
  AssemblyPlan,
  GameConfig,
  Lesion,
  LesionType,
  SurgeryToolType,
  SurgeryMaterialType,
  SurgerySession,
  SurgeryStep,
  SurgeryRecord,
  SurgeryTool,
  SurgeryMaterial,
} from '../types';
import {
  DEFAULT_CONFIG,
  MISSIONS,
  INITIAL_CREDITS,
  INITIAL_MATERIALS,
  BLIND_BOX_PRICES,
  LESION_CONFIG,
  SURGERY_TOOLS,
  SURGERY_MATERIALS,
} from '../data/defaultConfig';
import {
  generateId,
  generateRandomPart,
  calculateRobotStats as calcStats,
  calculateAdaptability as calcAdapt,
  clamp,
} from '../utils/helpers';

const EMPTY_SELECTED_PARTS: Record<PartType, Part | null> = {
  head: null,
  body: null,
  arm: null,
  leg: null,
  core: null,
  tool: null,
};

export const useGameStore = create<Store>()(
  persist(
    (set, get) => ({
      parts: [],
      robots: [],
      credits: INITIAL_CREDITS,
      materials: INITIAL_MATERIALS,
      missionRecords: [],
      repairRecords: [],
      surgeryRecords: [],
      assemblyPlans: [],
      config: DEFAULT_CONFIG,
      selectedParts: { ...EMPTY_SELECTED_PARTS },
      activeSurgery: null,

      addPart: (part) => set((state) => ({ parts: [...state.parts, part] })),

      removePart: (partId) =>
        set((state) => ({
          parts: state.parts.filter((p) => p.id !== partId),
        })),

      updatePart: (partId, updates) =>
        set((state) => ({
          parts: state.parts.map((p) =>
            p.id === partId ? { ...p, ...updates } : p
          ),
        })),

      addRobot: (robot) => set((state) => ({ robots: [...state.robots, robot] })),

      removeRobot: (robotId) =>
        set((state) => ({
          robots: state.robots.filter((r) => r.id !== robotId),
        })),

      updateRobot: (robotId, updates) =>
        set((state) => ({
          robots: state.robots.map((r) =>
            r.id === robotId ? { ...r, ...updates } : r
          ),
        })),

      addCredits: (amount) =>
        set((state) => ({ credits: state.credits + amount })),

      spendCredits: (amount) => {
        const state = get();
        if (state.credits >= amount) {
          set({ credits: state.credits - amount });
          return true;
        }
        return false;
      },

      addMaterials: (amount) =>
        set((state) => ({ materials: state.materials + amount })),

      spendMaterials: (amount) => {
        const state = get();
        if (state.materials >= amount) {
          set({ materials: state.materials - amount });
          return true;
        }
        return false;
      },

      addMissionRecord: (record) =>
        set((state) => ({ missionRecords: [...state.missionRecords, record] })),

      addRepairRecord: (record) =>
        set((state) => ({ repairRecords: [...state.repairRecords, record] })),

      addAssemblyPlan: (plan) =>
        set((state) => ({ assemblyPlans: [...state.assemblyPlans, plan] })),

      removeAssemblyPlan: (planId) =>
        set((state) => ({
          assemblyPlans: state.assemblyPlans.filter((p) => p.id !== planId),
        })),

      updateConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),

      resetConfig: () => set({ config: DEFAULT_CONFIG }),

      setSelectedPart: (slot, part) =>
        set((state) => ({
          selectedParts: {
            ...state.selectedParts,
            [slot]: part,
          },
        })),

      clearSelectedParts: () => set({ selectedParts: { ...EMPTY_SELECTED_PARTS } }),

      recyclePart: (partId) => {
        const state = get();
        const part = state.parts.find((p) => p.id === partId);
        if (!part) return;

        const recycleRate = state.config.recyclingRates[part.rarity];
        const materialsGained = Math.floor(part.maxDurability * recycleRate);

        set((s) => ({
          parts: s.parts.filter((p) => p.id !== partId),
          materials: s.materials + materialsGained,
        }));
      },

      repairRobot: (robotId) => {
        const state = get();
        const robot = state.robots.find((r) => r.id === robotId);
        if (!robot) return { success: false, cost: 0, restored: 0 };

        const { repairRules } = state.config;
        
        if (robot.repairCount >= repairRules.maxRepairs) {
          return { success: false, cost: 0, restored: 0 };
        }

        const durabilityNeeded = robot.maxDurability - robot.durability;
        const cost = durabilityNeeded * repairRules.materialCostPerPoint;

        if (!state.spendMaterials(cost)) {
          return { success: false, cost, restored: 0 };
        }

        const successRate = clamp(
          repairRules.baseSuccessRate - robot.repairCount * repairRules.degradeRate,
          0.1,
          repairRules.baseSuccessRate
        );
        const success = Math.random() < successRate;

        let restored = 0;
        if (success) {
          restored = durabilityNeeded;
          state.updateRobot(robotId, {
            durability: robot.maxDurability,
            repairCount: robot.repairCount + 1,
          });
        } else {
          state.updateRobot(robotId, {
            repairCount: robot.repairCount + 1,
          });
        }

        const record: RepairRecord = {
          id: generateId(),
          robotId: robot.id,
          robotName: robot.name,
          materialCost: cost,
          success,
          durabilityRestored: restored,
          repairedAt: Date.now(),
        };
        state.addRepairRecord(record);

        return { success, cost, restored };
      },

      executeMission: (robotId, missionId) => {
        const state = get();
        const robot = state.robots.find((r) => r.id === robotId);
        const mission = MISSIONS.find((m) => m.id === missionId);

        if (!robot || !mission) {
          throw new Error('Robot or mission not found');
        }

        const adaptability = state.calculateAdaptability(robot, mission);
        const successChance = clamp(adaptability / 100, 0.1, 0.95);
        const success = Math.random() < successChance;

        let durabilityLoss = Math.floor(mission.difficulty * 5 * Math.random() + 5);
        if (robot.isOverloaded) {
          durabilityLoss += state.config.overloadRules.durabilityPenalty;
        }

        const newDurability = clamp(robot.durability - durabilityLoss, 0, robot.maxDurability);
        state.updateRobot(robotId, { durability: newDurability });

        let rewards = { credits: 0, materials: 0 };
        if (success) {
          rewards = {
            credits: mission.rewards.credits,
            materials: mission.rewards.materials,
          };
          state.addCredits(rewards.credits);
          state.addMaterials(rewards.materials);

          if (mission.rewards.blindBox) {
            const bonusParts = state.openBlindBox(mission.rewards.blindBox, true);
            bonusParts.forEach((p) => state.addPart(p));
          }
        }

        const record: MissionRecord = {
          id: generateId(),
          robotId: robot.id,
          robotName: robot.name,
          missionId: mission.id,
          missionName: mission.name,
          success,
          adaptability,
          rewards,
          durabilityLoss,
          completedAt: Date.now(),
        };
        state.addMissionRecord(record);

        return record;
      },

      calculateRobotStats: (parts) => {
        const state = get();
        return calcStats(parts, state.config);
      },

      calculateAdaptability: (robot, mission) => {
        const state = get();
        return calcAdapt(robot, mission, state.config);
      },

      generateRandomPart: (minRarity) => {
        const state = get();
        return generateRandomPart(state.config, minRarity);
      },

      openBlindBox: (type, free = false) => {
        const state = get();
        const price = BLIND_BOX_PRICES[type];

        if (!free && !state.spendCredits(price)) {
          return [];
        }

        const parts: Part[] = [];
        const count = type === 'legendary' ? 5 : type === 'epic' ? 4 : type === 'rare' ? 3 : 2;

        for (let i = 0; i < count; i++) {
          const part = generateRandomPart(state.config, type);
          parts.push(part);
        }

        return parts;
      },

      loadFromStorage: () => {},

      addSurgeryRecord: (record) =>
        set((state) => ({ surgeryRecords: [...state.surgeryRecords, record] })),

      setActiveSurgery: (session) => set({ activeSurgery: session }),

      isSeverelyDamaged: (part) => {
        const state = get();
        const threshold = state.config.repairRules.severeDamageThreshold;
        return part.durability / part.maxDurability <= threshold;
      },

      getDamagedParts: (robotId) => {
        const state = get();
        const robot = state.robots.find((r) => r.id === robotId);
        if (!robot) return [];
        return Object.values(robot.parts).filter(
          (p): p is Part => p !== null && p.durability < p.maxDurability
        );
      },

      getSurgeryTools: () => SURGERY_TOOLS,

      getSurgeryMaterials: () => SURGERY_MATERIALS,

      startSurgerySession: (robotId, partId) => {
        const state = get();
        const robot = state.robots.find((r) => r.id === robotId);
        if (!robot) return null;

        const part = Object.values(robot.parts).find((p) => p?.id === partId);
        if (!part) return null;

        if (!state.isSeverelyDamaged(part)) {
          return null;
        }

        const { microSurgery } = state.config;
        const lesionCount = Math.floor(
          Math.random() * (microSurgery.maxLesionsPerPart - microSurgery.minLesionsPerPart + 1)
        ) + microSurgery.minLesionsPerPart;

        const lesionTypes: LesionType[] = ['crack', 'short_circuit', 'loose', 'contamination'];
        const shuffledTypes = [...lesionTypes].sort(() => Math.random() - 0.5);

        const lesions: Lesion[] = [];
        const usedPositions: { x: number; y: number }[] = [];

        for (let i = 0; i < lesionCount; i++) {
          const typeIndex = i % shuffledTypes.length;
          const type = shuffledTypes[typeIndex];
          const lesionConfig = LESION_CONFIG[type];

          let position: { x: number; y: number };
          let attempts = 0;
          do {
            position = {
              x: 15 + Math.random() * 70,
              y: 15 + Math.random() * 70,
            };
            attempts++;
          } while (
            usedPositions.some(
              (p) => Math.abs(p.x - position.x) < 15 && Math.abs(p.y - position.y) < 15
            ) &&
            attempts < 20
          );
          usedPositions.push(position);

          const severity = Math.floor(Math.random() * 3) + 1;

          lesions.push({
            id: generateId(),
            type,
            name: lesionConfig.name,
            description: lesionConfig.description,
            severity,
            position,
            treated: false,
            correctTool: lesionConfig.defaultTool,
            correctMaterial: lesionConfig.defaultMaterial,
            stepOrder: i + 1,
          });
        }

        const sortedLesions = [...lesions].sort((a, b) => {
          const priority: Record<LesionType, number> = {
            contamination: 1,
            loose: 2,
            short_circuit: 3,
            crack: 4,
          };
          return priority[a.type] - priority[b.type];
        });

        sortedLesions.forEach((l, idx) => {
          l.stepOrder = idx + 1;
        });

        const steps: SurgeryStep[] = sortedLesions.map((lesion, idx) => ({
          step: idx + 1,
          lesionId: lesion.id,
          tool: null,
          material: null,
          completed: false,
          success: false,
          damageIncrease: 0,
          message: '',
        }));

        const session: SurgerySession = {
          id: generateId(),
          robotId,
          partId,
          part: { ...part },
          lesions: sortedLesions,
          steps,
          currentStep: 1,
          totalDamageIncrease: 0,
          completed: false,
          success: false,
          finalRecovery: 0,
          startedAt: Date.now(),
          finishedAt: null,
        };

        set({ activeSurgery: session });
        return session;
      },

      performSurgeryStep: (tool, material) => {
        const state = get();
        const session = state.activeSurgery;

        if (!session || session.completed) {
          return { success: false, stepCompleted: false, damageIncrease: 0, message: '手术未开始或已完成' };
        }

        const stepIndex = session.currentStep - 1;
        const step = session.steps[stepIndex];
        const lesion = session.lesions.find((l) => l.id === step.lesionId);

        if (!lesion || step.completed) {
          return { success: false, stepCompleted: false, damageIncrease: 0, message: '步骤无效或已完成' };
        }

        const toolInfo = SURGERY_TOOLS.find((t) => t.type === tool);
        const materialInfo = SURGERY_MATERIALS.find((m) => m.type === material);

        if (!toolInfo || !materialInfo) {
          return { success: false, stepCompleted: false, damageIncrease: 0, message: '无效的工具或材料' };
        }

        if (!state.spendMaterials(materialInfo.cost)) {
          return { success: false, stepCompleted: false, damageIncrease: 0, message: '材料不足' };
        }

        const isCorrectTool = tool === lesion.correctTool;
        const isCorrectMaterial = material === lesion.correctMaterial;
        const toolMatchesLesion = toolInfo.targetLesions.includes(lesion.type);
        const materialMatchesLesion = materialInfo.targetLesions.includes(lesion.type);

        const { microSurgery } = state.config;
        const lesionConfig = LESION_CONFIG[lesion.type];
        let damageIncrease = 0;
        let success = false;
        let message = '';

        if (isCorrectTool && isCorrectMaterial) {
          success = true;
          message = `成功修复${lesion.name}！使用${toolInfo.name}和${materialInfo.name}效果极佳。`;
        } else if (toolMatchesLesion && materialMatchesLesion) {
          const chance = 0.6 + Math.random() * 0.2;
          success = Math.random() < chance;
          if (success) {
            message = `${toolInfo.name}配合${materialInfo.name}勉强修复了${lesion.name}，但效果一般。`;
          } else {
            damageIncrease = Math.floor(lesionConfig.damageOnFail * 0.5);
            message = `修复过程中出现偏差，${lesion.name}扩大了损伤！`;
          }
        } else {
          damageIncrease = Math.floor(
            lesionConfig.damageOnFail * microSurgery.wrongOrderDamageMultiplier * lesion.severity
          );
          success = false;
          message = `错误的组合！${toolInfo.name}不适用于${lesion.name}，损伤严重扩大！`;
        }

        const updatedSteps = [...session.steps];
        updatedSteps[stepIndex] = {
          ...step,
          tool,
          material,
          completed: true,
          success,
          damageIncrease,
          message,
        };

        const updatedLesions = session.lesions.map((l) =>
          l.id === lesion.id ? { ...l, treated: success } : l
        );

        const newTotalDamage = session.totalDamageIncrease + damageIncrease;
        const nextStep = success ? session.currentStep + 1 : session.currentStep + 1;
        const allCompleted = nextStep > session.lesions.length;

        const updatedSession: SurgerySession = {
          ...session,
          steps: updatedSteps,
          lesions: updatedLesions,
          currentStep: Math.min(nextStep, session.lesions.length + 1),
          totalDamageIncrease: newTotalDamage,
          completed: allCompleted,
          finishedAt: allCompleted ? Date.now() : null,
        };

        set({ activeSurgery: updatedSession });

        return {
          success,
          stepCompleted: true,
          damageIncrease,
          message,
        };
      },

      completeSurgerySession: () => {
        const state = get();
        const session = state.activeSurgery;

        if (!session) {
          return { success: false, totalRecovery: 0, totalDamage: 0, materialCost: 0 };
        }

        const treatedLesions = session.lesions.filter((l) => l.treated).length;
        const totalLesions = session.lesions.length;
        const successRate = treatedLesions / totalLesions;

        const { microSurgery } = state.config;
        const damagePercent = session.totalDamageIncrease / 100;
        const recoveryBonus = successRate * microSurgery.correctStepRecoveryBonus;
        const baseRecovery = session.part.maxDurability - session.part.durability;

        let finalRecovery = 0;
        let success = false;

        if (successRate >= 0.75) {
          finalRecovery = Math.floor(baseRecovery * (0.8 + recoveryBonus - damagePercent));
          finalRecovery = clamp(finalRecovery, 0, baseRecovery);
          success = true;
        } else if (successRate >= 0.5) {
          finalRecovery = Math.floor(baseRecovery * (0.5 + recoveryBonus - damagePercent));
          finalRecovery = clamp(finalRecovery, 0, Math.floor(baseRecovery * 0.7));
          success = true;
        } else {
          finalRecovery = 0;
          success = false;
        }

        const robot = state.robots.find((r) => r.id === session.robotId);
        if (robot) {
          const partType = Object.entries(robot.parts).find(
            ([, p]) => p?.id === session.partId
          )?.[0] as PartType | undefined;

          if (partType) {
            const originalPart = robot.parts[partType];
            if (originalPart) {
              const newDurability = clamp(
                originalPart.durability + finalRecovery - session.totalDamageIncrease,
                0,
                originalPart.maxDurability
              );
              state.updatePart(originalPart.id, { durability: newDurability });
            }
          }
        }

        const materialCost =
          session.steps.reduce((sum, s) => {
            const mat = SURGERY_MATERIALS.find((m) => m.type === s.material);
            return sum + (mat?.cost || 0);
          }, 0) + microSurgery.baseMaterialCost;

        const record: SurgeryRecord = {
          id: generateId(),
          robotId: session.robotId,
          robotName: robot?.name || '未知机器人',
          partName: session.part.name,
          lesionsTreated: treatedLesions,
          totalLesions,
          damageIncrease: session.totalDamageIncrease,
          finalRecovery,
          materialCost,
          success,
          performedAt: Date.now(),
        };
        state.addSurgeryRecord(record);

        set({ activeSurgery: null });

        return {
          success,
          totalRecovery: finalRecovery,
          totalDamage: session.totalDamageIncrease,
          materialCost,
        };
      },

      cancelSurgerySession: () => {
        const state = get();
        const session = state.activeSurgery;

        if (!session) return;

        const treatedLesions = session.lesions.filter((l) => l.treated).length;
        if (treatedLesions > 0) {
          const robot = state.robots.find((r) => r.id === session.robotId);
          if (robot) {
            const partType = Object.entries(robot.parts).find(
              ([, p]) => p?.id === session.partId
            )?.[0] as PartType | undefined;

            if (partType) {
              const originalPart = robot.parts[partType];
              if (originalPart) {
                const newDurability = clamp(
                  originalPart.durability - Math.floor(session.totalDamageIncrease * 0.5),
                  0,
                  originalPart.maxDurability
                );
                state.updatePart(originalPart.id, { durability: newDurability });
              }
            }
          }
        }

        set({ activeSurgery: null });
      },

      resetGame: () =>
        set({
          parts: [],
          robots: [],
          credits: INITIAL_CREDITS,
          materials: INITIAL_MATERIALS,
          missionRecords: [],
          repairRecords: [],
          surgeryRecords: [],
          assemblyPlans: [],
          selectedParts: { ...EMPTY_SELECTED_PARTS },
          activeSurgery: null,
        }),
    }),
    {
      name: 'robot-workshop-storage',
      partialize: (state) => ({
        parts: state.parts,
        robots: state.robots,
        credits: state.credits,
        materials: state.materials,
        missionRecords: state.missionRecords,
        repairRecords: state.repairRecords,
        surgeryRecords: state.surgeryRecords,
        assemblyPlans: state.assemblyPlans,
        config: state.config,
      }),
    }
  )
);
