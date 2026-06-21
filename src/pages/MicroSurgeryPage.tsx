import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Zap,
  Droplets,
  Unlink,
  Flame,
  Activity,
  Waves,
  Search,
  Wind,
  Droplet,
  Shield,
  Beaker,
  Sparkles,
  Bandage,
  History,
  Bot,
  Cpu,
  Package,
  ArrowRight,
  Clock,
  Coins,
  ChevronRight,
  Eye,
  EyeOff,
  RotateCcw,
  Play,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { PageContainer } from '../components/PageContainer';
import { Modal } from '../components/Modal';
import { StatBar } from '../components/StatBar';
import type {
  LesionType,
  SurgeryToolType,
  SurgeryMaterialType,
  Lesion,
} from '../types';
import { LESION_CONFIG, PART_TYPE_NAMES } from '../data/defaultConfig';

const LESION_ICONS: Record<LesionType, typeof AlertTriangle> = {
  crack: AlertTriangle,
  short_circuit: Zap,
  loose: Unlink,
  contamination: Droplets,
};

const TOOL_ICONS: Record<SurgeryToolType, typeof Flame> = {
  laser_welder: Flame,
  circuit_tester: Activity,
  soldering_iron: Zap,
  ultrasonic_cleaner: Waves,
  microscope: Search,
  anti_static_cloth: Wind,
};

const MATERIAL_ICONS: Record<SurgeryMaterialType, typeof Droplet> = {
  nano_adhesive: Droplet,
  conductive_gel: Zap,
  reinforcement_plate: Shield,
  cleaning_solution: Beaker,
  flux: Sparkles,
  insulation_tape: Bandage,
};

export function MicroSurgeryPage() {
  const navigate = useNavigate();
  const { robotId } = useParams<{ robotId: string }>();
  const {
    robots,
    activeSurgery,
    materials,
    surgeryRecords,
    startSurgerySession,
    performSurgeryStep,
    completeSurgerySession,
    cancelSurgerySession,
    getDamagedParts,
    isSeverelyDamaged,
    getSurgeryTools,
    getSurgeryMaterials,
  } = useGameStore();

  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<SurgeryToolType | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<SurgeryMaterialType | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [stepResult, setStepResult] = useState<{
    success: boolean;
    message: string;
    damageIncrease: number;
  } | null>(null);
  const [showHints, setShowHints] = useState(true);
  const [isPerforming, setIsPerforming] = useState(false);
  const [finalResult, setFinalResult] = useState<{
    success: boolean;
    totalRecovery: number;
    totalDamage: number;
    materialCost: number;
  } | null>(null);

  const robot = robots.find((r) => r.id === robotId);
  const damagedParts = robotId ? getDamagedParts(robotId) : [];
  const severelyDamagedParts = damagedParts.filter((p) => isSeverelyDamaged(p));
  const tools = getSurgeryTools();
  const surgeryMaterials = getSurgeryMaterials();

  const selectedPart = selectedPartId
    ? damagedParts.find((p) => p.id === selectedPartId)
    : null;

  useEffect(() => {
    if (activeSurgery && activeSurgery.completed && !finalResult) {
      const result = completeSurgerySession();
      setFinalResult(result);
    }
  }, [activeSurgery?.completed]);

  const handleStartSurgery = () => {
    if (!robotId || !selectedPartId) return;
    const session = startSurgerySession(robotId, selectedPartId);
    if (session) {
      setSelectedTool(null);
      setSelectedMaterial(null);
      setStepResult(null);
      setFinalResult(null);
    }
  };

  const handlePerformStep = async () => {
    if (!selectedTool || !selectedMaterial || isPerforming) return;

    setIsPerforming(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = performSurgeryStep(selectedTool, selectedMaterial);
    setStepResult({
      success: result.success,
      message: result.message,
      damageIncrease: result.damageIncrease,
    });
    setSelectedTool(null);
    setSelectedMaterial(null);
    setIsPerforming(false);

    setTimeout(() => setStepResult(null), 3000);
  };

  const handleComplete = () => {
    if (activeSurgery) {
      const result = completeSurgerySession();
      setFinalResult(result);
    }
  };

  const handleCancel = () => {
    if (confirm('确定要取消手术吗？已完成的步骤可能造成额外损伤。')) {
      cancelSurgerySession();
      setFinalResult(null);
    }
  };

  const handleReset = () => {
    setFinalResult(null);
    setStepResult(null);
    setSelectedTool(null);
    setSelectedMaterial(null);
  };

  const getCurrentLesion = (): Lesion | null => {
    if (!activeSurgery) return null;
    const step = activeSurgery.steps[activeSurgery.currentStep - 1];
    if (!step) return null;
    return activeSurgery.lesions.find((l) => l.id === step.lesionId) || null;
  };

  const currentLesion = getCurrentLesion();

  const renderPartCrossSection = () => {
    if (!activeSurgery && !selectedPart) return null;
    const part = activeSurgery ? activeSurgery.part : selectedPart!;
    const lesions = activeSurgery ? activeSurgery.lesions : [];
    const partType = part.type;

    const renderLesions = () =>
      lesions.map((lesion) => {
        const isCurrent = activeSurgery?.currentStep === lesion.stepOrder;
        const isTreated = lesion.treated;
        const config = LESION_CONFIG[lesion.type];
        const LesionIcon = LESION_ICONS[lesion.type];

        return (
          <motion.div
            key={lesion.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 ${
              isCurrent ? 'z-20' : ''
            }`}
            style={{ left: `${lesion.position.x}%`, top: `${lesion.position.y}%` }}
            initial={{ scale: 0 }}
            animate={{ scale: isCurrent ? [1, 1.2, 1] : 1 }}
            transition={{
              duration: isCurrent ? 1 : 0.3,
              repeat: isCurrent ? Infinity : 0,
              repeatType: 'reverse',
            }}
          >
            <div
              className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                isTreated
                  ? 'bg-neon-green/20 border-neon-green/50'
                  : isCurrent
                  ? 'bg-neon-orange/30 border-neon-orange animate-pulse'
                  : 'bg-neon-red/20 border-neon-red/50'
              }`}
              style={{
                boxShadow: isTreated
                  ? `0 0 20px rgba(16, 185, 129, 0.4)`
                  : isCurrent
                  ? `0 0 20px ${config.color}80`
                  : `0 0 10px ${config.color}40`,
              }}
            >
              <LesionIcon
                className={`w-6 h-6 ${
                  isTreated
                    ? 'text-neon-green'
                    : isCurrent
                    ? 'text-neon-orange'
                    : 'text-white/80'
                }`}
                style={{ color: isTreated ? undefined : config.color }}
              />
              <div
                className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  isTreated
                    ? 'bg-neon-green text-black'
                    : 'bg-neon-red text-white'
                }`}
              >
                {isTreated ? '✓' : lesion.stepOrder}
              </div>
              {lesion.severity > 1 && (
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {Array.from({ length: lesion.severity }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );
      });

    const partBgColor = {
      head: 'from-blue-900/40 to-cyan-900/40',
      body: 'from-purple-900/40 to-pink-900/40',
      arm: 'from-orange-900/40 to-yellow-900/40',
      leg: 'from-green-900/40 to-emerald-900/40',
      core: 'from-red-900/40 to-rose-900/40',
      tool: 'from-indigo-900/40 to-violet-900/40',
    }[partType];

    return (
      <div className="relative w-full aspect-square max-w-md mx-auto">
        <div className="absolute inset-0 bg-background-tertiary rounded-3xl overflow-hidden border border-white/10">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-br"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
              }}
            />
          </div>
          <div
            className={`absolute inset-8 rounded-2xl bg-gradient-to-br ${partBgColor} flex items-center justify-center`}
            style={{
              clipPath:
                partType === 'head' || partType === 'core'
                  ? 'circle(45% at 50% 50%)'
                  : partType === 'arm' || partType === 'leg'
                  ? 'polygon(30% 0%, 70% 0%, 80% 30%, 90% 100%, 10% 100%, 20% 30%)'
                  : 'polygon(10% 5%, 90% 5%, 95% 50%, 90% 95%, 10% 95%, 5% 50%)',
            }}
          >
            <div className="relative w-full h-full">
              <div className="absolute inset-0 flex items-center justify-center">
                <Cpu className="w-16 h-16 text-white/20" />
              </div>
              <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-neon-green/50 animate-pulse" />
              <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-neon-blue/50 animate-pulse" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-2 rounded-full bg-white/10" />
            </div>
          </div>
          {renderLesions()}
        </div>
        <div className="absolute top-2 left-2 px-3 py-1 bg-black/50 rounded-lg text-xs text-white/60 font-mono">
          剖面图
        </div>
        <div className="absolute bottom-2 right-2 px-3 py-1 bg-black/50 rounded-lg text-xs text-white/60 font-mono">
          {PART_TYPE_NAMES[partType]}
        </div>
      </div>
    );
  };

  return (
    <PageContainer
      title="微型手术台"
      subtitle="处理严重损坏的零件，精确修复四类病灶"
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => setShowHints(!showHints)}
            className="btn-secondary flex items-center gap-2"
          >
            {showHints ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {showHints ? '隐藏提示' : '显示提示'}
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            手术记录
          </button>
          <button
            onClick={() => navigate('/repair')}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回维修
          </button>
        </div>
      }
    >
      {!robot ? (
        <div className="card p-12 text-center">
          <Bot className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <p className="text-white/50">未找到指定机器人</p>
          <button
            onClick={() => navigate('/repair')}
            className="btn-primary mt-4 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回维修中心
          </button>
        </div>
      ) : !activeSurgery && !finalResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card p-6 mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-2xl bg-neon-blue/20 flex items-center justify-center">
                  <Bot className="w-10 h-10 text-neon-blue" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-display font-bold text-white">
                    {robot.name}
                  </h3>
                  <StatBar
                    label="机器人耐久度"
                    value={robot.durability}
                    max={robot.maxDurability}
                    color={
                      robot.durability / robot.maxDurability > 0.6
                        ? 'green'
                        : robot.durability / robot.maxDurability > 0.3
                        ? 'orange'
                        : 'red'
                    }
                  />
                </div>
              </div>

              <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-neon-orange" />
                严重损坏零件 ({severelyDamagedParts.length})
              </h2>

              {severelyDamagedParts.length === 0 ? (
                <div className="p-8 text-center bg-background-tertiary rounded-xl">
                  <CheckCircle className="w-12 h-12 text-neon-green/30 mx-auto mb-3" />
                  <p className="text-white/50">没有严重损坏的零件</p>
                  <p className="text-xs text-white/30 mt-1">
                    耐久度低于30%的零件才需要微型手术
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {severelyDamagedParts.map((part) => (
                    <motion.div
                      key={part.id}
                      onClick={() => setSelectedPartId(part.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                        selectedPartId === part.id
                          ? 'bg-neon-orange/10 border-neon-orange/50'
                          : 'bg-background-tertiary border-transparent hover:border-white/20'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{
                            backgroundColor: `var(--rarity-${part.rarity}-bg, rgba(107,114,128,0.2))`,
                          }}
                        >
                          <Cpu
                            className="w-6 h-6"
                            style={{
                              color: `var(--rarity-${part.rarity}-color, #6b7280)`,
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-white truncate">
                              {part.name}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-red/20 text-neon-red">
                              严重损坏
                            </span>
                          </div>
                          <StatBar
                            label={`${PART_TYPE_NAMES[part.type]} · 耐久度`}
                            value={part.durability}
                            max={part.maxDurability}
                            color="red"
                            size="sm"
                          />
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/30" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {selectedPart && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6"
              >
                <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-neon-blue" />
                  零件预览
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderPartCrossSection()}
                  <div className="space-y-4">
                    <div className="bg-background-tertiary rounded-xl p-4">
                      <h4 className="font-bold text-white mb-2">{selectedPart.name}</h4>
                      <p className="text-sm text-white/50 mb-3">
                        {selectedPart.description}
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-white/40">重量</p>
                          <p className="font-mono text-white">{selectedPart.weight}</p>
                        </div>
                        <div>
                          <p className="text-white/40">能量</p>
                          <p className="font-mono text-white">{selectedPart.energy}</p>
                        </div>
                        <div>
                          <p className="text-white/40">技能槽</p>
                          <p className="font-mono text-white">{selectedPart.skillSlots}</p>
                        </div>
                        <div>
                          <p className="text-white/40">类型</p>
                          <p className="font-mono text-white">
                            {PART_TYPE_NAMES[selectedPart.type]}
                          </p>
                        </div>
                      </div>
                    </div>

                    {showHints && (
                      <div className="bg-neon-blue/10 border border-neon-blue/30 rounded-xl p-4">
                        <h4 className="font-bold text-neon-blue mb-2 flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          病灶诊断提示
                        </h4>
                        <ul className="space-y-2 text-sm text-white/70">
                          <li className="flex items-start gap-2">
                            <span className="text-neon-red">●</span>
                            耐久度极低的零件可能存在多种病灶
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-neon-orange">●</span>
                            需要按正确顺序处理：污染→松动→短路→裂纹
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-neon-yellow">●</span>
                            错误的工具/材料组合会扩大损伤
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-neon-green">●</span>
                            修复率≥75%效果最佳
                          </li>
                        </ul>
                      </div>
                    )}

                    <button
                      onClick={handleStartSurgery}
                      className="w-full py-4 rounded-xl font-display font-bold text-lg bg-gradient-to-r from-neon-orange to-neon-red text-white hover:shadow-lg hover:shadow-neon-orange/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Wrench className="w-5 h-5" />
                      开始显微手术
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div>
            <div className="card p-6 sticky top-4">
              <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-neon-green" />
                材料库存
              </h2>
              <div className="bg-background-tertiary rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">可用材料</span>
                  <span className="text-2xl font-display font-bold font-mono text-neon-green flex items-center gap-1">
                    <Coins className="w-5 h-5" />
                    {materials}
                  </span>
                </div>
              </div>

              <h3 className="font-bold text-white/80 mb-3 text-sm">手术工具一览</h3>
              <div className="space-y-2 mb-6">
                {tools.map((tool) => {
                  const Icon = TOOL_ICONS[tool.type];
                  return (
                    <div
                      key={tool.type}
                      className="p-2 rounded-lg bg-background-tertiary flex items-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-lg bg-neon-blue/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-neon-blue" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">
                          {tool.name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <h3 className="font-bold text-white/80 mb-3 text-sm">修复材料一览</h3>
              <div className="space-y-2">
                {surgeryMaterials.map((mat) => {
                  const Icon = MATERIAL_ICONS[mat.type];
                  return (
                    <div
                      key={mat.type}
                      className="p-2 rounded-lg bg-background-tertiary flex items-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-lg bg-neon-green/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-neon-green" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">
                          {mat.name}
                        </p>
                      </div>
                      <span className="text-xs font-mono text-neon-green whitespace-nowrap">
                        {mat.cost}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-neon-orange" />
                  零件剖面图
                </h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-white/50">步骤</span>
                  <span className="font-mono font-bold text-neon-blue">
                    {activeSurgery
                      ? `${Math.min(activeSurgery.currentStep, activeSurgery.lesions.length)}/${activeSurgery.lesions.length}`
                      : '-'}
                  </span>
                </div>
              </div>
              {renderPartCrossSection()}

              {activeSurgery && (
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="bg-background-tertiary rounded-xl p-3">
                    <p className="text-xs text-white/50 mb-1 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-neon-red" />
                      累计额外损伤
                    </p>
                    <p
                      className={`text-xl font-display font-bold font-mono ${
                        activeSurgery.totalDamageIncrease > 0
                          ? 'text-neon-red'
                          : 'text-neon-green'
                      }`}
                    >
                      {activeSurgery.totalDamageIncrease}
                    </p>
                  </div>
                  <div className="bg-background-tertiary rounded-xl p-3">
                    <p className="text-xs text-white/50 mb-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-neon-green" />
                      已修复病灶
                    </p>
                    <p className="text-xl font-display font-bold font-mono text-neon-green">
                      {activeSurgery.lesions.filter((l) => l.treated).length}/
                      {activeSurgery.lesions.length}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                <List className="w-5 h-5 text-neon-blue" />
                手术步骤
              </h2>
              {activeSurgery && (
                <div className="space-y-2">
                  {activeSurgery.steps.map((step, idx) => {
                    const lesion = activeSurgery.lesions.find(
                      (l) => l.id === step.lesionId
                    );
                    if (!lesion) return null;
                    const isCurrent = activeSurgery.currentStep === step.step;
                    const isCompleted = step.completed;
                    const config = LESION_CONFIG[lesion.type];
                    const LesionIcon = LESION_ICONS[lesion.type];

                    return (
                      <motion.div
                        key={step.step}
                        className={`p-3 rounded-xl border-l-4 transition-all ${
                          isCurrent
                            ? 'bg-neon-orange/10 border-neon-orange'
                            : isCompleted
                            ? step.success
                              ? 'bg-neon-green/5 border-neon-green'
                              : 'bg-neon-red/5 border-neon-red'
                            : 'bg-background-tertiary border-white/10'
                        }`}
                        animate={isCurrent ? { x: [0, 5, 0] } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isCompleted
                                ? step.success
                                  ? 'bg-neon-green/20'
                                  : 'bg-neon-red/20'
                                : isCurrent
                                ? 'bg-neon-orange/20'
                                : 'bg-white/5'
                            }`}
                          >
                            {isCompleted ? (
                              step.success ? (
                                <CheckCircle className="w-4 h-4 text-neon-green" />
                              ) : (
                                <XCircle className="w-4 h-4 text-neon-red" />
                              )
                            ) : (
                              <span
                                className={`text-sm font-bold ${
                                  isCurrent ? 'text-neon-orange' : 'text-white/30'
                                }`}
                              >
                                {step.step}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <LesionIcon
                                className="w-4 h-4 flex-shrink-0"
                                style={{ color: config.color }}
                              />
                              <p
                                className={`font-medium text-sm truncate ${
                                  isCompleted
                                    ? step.success
                                      ? 'text-neon-green'
                                      : 'text-neon-red'
                                    : isCurrent
                                    ? 'text-white'
                                    : 'text-white/50'
                                }`}
                              >
                                {lesion.name}
                              </p>
                            </div>
                            {isCompleted && step.message && (
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`text-xs mt-1 ${
                                  step.success ? 'text-white/50' : 'text-neon-red/70'
                                }`}
                              >
                                {step.message}
                              </motion.p>
                            )}
                            {step.damageIncrease > 0 && (
                              <p className="text-xs text-neon-red mt-0.5">
                                -{step.damageIncrease} 耐久损伤
                              </p>
                            )}
                          </div>
                          {isCurrent && !finalResult && (
                            <Play className="w-4 h-4 text-neon-orange animate-pulse" />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="card p-6 mb-6 sticky top-4">
              {!finalResult ? (
                <>
                  {currentLesion && activeSurgery && activeSurgery.currentStep <= activeSurgery.lesions.length && (
                    <>
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-neon-orange/20 text-neon-orange">
                            当前步骤 #{activeSurgery.currentStep}
                          </span>
                        </div>
                        <div
                          className="p-4 rounded-xl border-2"
                          style={{
                            borderColor: `${LESION_CONFIG[currentLesion.type].color}50`,
                            backgroundColor: `${LESION_CONFIG[currentLesion.type].color}10`,
                          }}
                        >
                          <div className="flex items-start gap-3">
                            {(() => {
                              const Icon = LESION_ICONS[currentLesion.type];
                              return (
                                <div
                                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                  style={{
                                    backgroundColor: `${LESION_CONFIG[currentLesion.type].color}30`,
                                  }}
                                >
                                  <Icon
                                    className="w-6 h-6"
                                    style={{
                                      color: LESION_CONFIG[currentLesion.type].color,
                                    }}
                                  />
                                </div>
                              );
                            })()}
                            <div className="flex-1">
                              <h4 className="font-bold text-white mb-1">
                                {currentLesion.name}
                              </h4>
                              <p className="text-sm text-white/60 mb-2">
                                {currentLesion.description}
                              </p>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-white/40">
                                  严重程度:{' '}
                                  <span className="text-neon-orange">
                                    {'★'.repeat(currentLesion.severity)}
                                    {'☆'.repeat(3 - currentLesion.severity)}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {showHints && (
                        <div className="bg-neon-yellow/10 border border-neon-yellow/30 rounded-xl p-3 mb-6">
                          <p className="text-xs text-neon-yellow/80">
                            💡 提示：仔细查看工具和材料的适用范围，为该病灶选择最佳组合！
                          </p>
                        </div>
                      )}

                      <div className="mb-4">
                        <h3 className="font-bold text-white/80 mb-3 text-sm flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-neon-blue" />
                          选择工具
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {tools.map((tool) => {
                            const Icon = TOOL_ICONS[tool.type];
                            const isMatch =
                              showHints &&
                              tool.targetLesions.includes(currentLesion.type);
                            const isSelected = selectedTool === tool.type;
                            return (
                              <motion.button
                                key={tool.type}
                                onClick={() => setSelectedTool(tool.type)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`p-3 rounded-xl text-left transition-all border-2 ${
                                  isSelected
                                    ? 'bg-neon-blue/20 border-neon-blue'
                                    : isMatch
                                    ? 'bg-neon-green/5 border-neon-green/30 hover:bg-neon-green/10'
                                    : 'bg-background-tertiary border-transparent hover:border-white/20'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <Icon
                                    className={`w-5 h-5 ${
                                      isSelected ? 'text-neon-blue' : 'text-white/60'
                                    }`}
                                  />
                                  <span
                                    className={`text-sm font-medium ${
                                      isSelected ? 'text-neon-blue' : 'text-white'
                                    }`}
                                  >
                                    {tool.name}
                                  </span>
                                </div>
                                {isMatch && showHints && (
                                  <span className="text-[10px] text-neon-green">
                                    ✓ 适用
                                  </span>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="font-bold text-white/80 mb-3 text-sm flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-neon-green" />
                          选择材料
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {surgeryMaterials.map((mat) => {
                            const Icon = MATERIAL_ICONS[mat.type];
                            const isMatch =
                              showHints &&
                              mat.targetLesions.includes(currentLesion.type);
                            const isSelected = selectedMaterial === mat.type;
                            const canAfford = materials >= mat.cost;
                            return (
                              <motion.button
                                key={mat.type}
                                onClick={() =>
                                  canAfford && setSelectedMaterial(mat.type)
                                }
                                whileHover={canAfford ? { scale: 1.02 } : {}}
                                whileTap={canAfford ? { scale: 0.98 } : {}}
                                disabled={!canAfford}
                                className={`p-3 rounded-xl text-left transition-all border-2 ${
                                  !canAfford
                                    ? 'bg-background-tertiary/50 border-transparent opacity-50 cursor-not-allowed'
                                    : isSelected
                                    ? 'bg-neon-green/20 border-neon-green'
                                    : isMatch
                                    ? 'bg-neon-green/5 border-neon-green/30 hover:bg-neon-green/10'
                                    : 'bg-background-tertiary border-transparent hover:border-white/20'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <Icon
                                    className={`w-5 h-5 ${
                                      isSelected
                                        ? 'text-neon-green'
                                        : canAfford
                                        ? 'text-white/60'
                                        : 'text-white/30'
                                    }`}
                                  />
                                  <span
                                    className={`text-sm font-medium ${
                                      isSelected
                                        ? 'text-neon-green'
                                        : canAfford
                                        ? 'text-white'
                                        : 'text-white/40'
                                    }`}
                                  >
                                    {mat.name}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`text-xs font-mono ${
                                      canAfford ? 'text-neon-green' : 'text-neon-red'
                                    }`}
                                  >
                                    {mat.cost} 材料
                                  </span>
                                  {isMatch && showHints && (
                                    <span className="text-[10px] text-neon-green">
                                      ✓ 适用
                                    </span>
                                  )}
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        {stepResult && (
                          <motion.div
                            key="step-result"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className={`p-4 rounded-xl mb-4 border ${
                              stepResult.success
                                ? 'bg-neon-green/10 border-neon-green/30'
                                : 'bg-neon-red/10 border-neon-red/30'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {stepResult.success ? (
                                <CheckCircle className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="w-5 h-5 text-neon-red flex-shrink-0 mt-0.5" />
                              )}
                              <div>
                                <p
                                  className={`font-medium text-sm ${
                                    stepResult.success
                                      ? 'text-neon-green'
                                      : 'text-neon-red'
                                  }`}
                                >
                                  {stepResult.success ? '步骤成功！' : '步骤失败'}
                                </p>
                                <p className="text-xs text-white/60 mt-1">
                                  {stepResult.message}
                                </p>
                                {stepResult.damageIncrease > 0 && (
                                  <p className="text-xs text-neon-red mt-1 font-mono">
                                    额外损伤: -{stepResult.damageIncrease}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex gap-2">
                        <button
                          onClick={handlePerformStep}
                          disabled={!selectedTool || !selectedMaterial || isPerforming}
                          className={`flex-1 py-3 rounded-xl font-display font-bold transition-all flex items-center justify-center gap-2 ${
                            selectedTool && selectedMaterial && !isPerforming
                              ? 'bg-gradient-to-r from-neon-blue to-neon-green text-white hover:shadow-lg hover:shadow-neon-blue/20'
                              : 'bg-background-tertiary text-white/30 cursor-not-allowed'
                          }`}
                        >
                          {isPerforming ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  ease: 'linear',
                                }}
                              >
                                <Wrench className="w-5 h-5" />
                              </motion.div>
                              执行中...
                            </>
                          ) : (
                            <>
                              <Play className="w-5 h-5" />
                              执行步骤
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-3 rounded-xl bg-background-tertiary text-white/60 hover:text-neon-red hover:bg-neon-red/10 transition-all"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  )}

                  {activeSurgery?.completed && !finalResult && (
                    <div className="text-center py-8">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <CheckCircle className="w-16 h-16 text-neon-green mx-auto mb-4" />
                      </motion.div>
                      <p className="text-white font-bold mb-2">所有步骤完成</p>
                      <p className="text-white/50 text-sm mb-4">正在计算最终结果...</p>
                    </div>
                  )}
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <div
                    className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                      finalResult.success
                        ? 'bg-neon-green/20'
                        : 'bg-neon-red/20'
                    }`}
                  >
                    {finalResult.success ? (
                      <CheckCircle className="w-10 h-10 text-neon-green" />
                    ) : (
                      <XCircle className="w-10 h-10 text-neon-red" />
                    )}
                  </div>
                  <h3
                    className={`text-xl font-display font-bold mb-2 ${
                      finalResult.success ? 'text-neon-green' : 'text-neon-red'
                    }`}
                  >
                    {finalResult.success ? '手术成功！' : '手术失败'}
                  </h3>
                  <p className="text-white/50 text-sm mb-6">
                    {finalResult.success
                      ? '零件病灶已清除，可进行常规维修'
                      : '修复率不足，零件状态未改善'}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-background-tertiary">
                      <span className="text-white/60 text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-neon-green" />
                        恢复耐久度
                      </span>
                      <span className="font-mono font-bold text-neon-green">
                        +{finalResult.totalRecovery}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-background-tertiary">
                      <span className="text-white/60 text-sm flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-neon-red" />
                        累计额外损伤
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          finalResult.totalDamage > 0
                            ? 'text-neon-red'
                            : 'text-neon-green'
                        }`}
                      >
                        -{finalResult.totalDamage}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-background-tertiary">
                      <span className="text-white/60 text-sm flex items-center gap-2">
                        <Coins className="w-4 h-4 text-neon-orange" />
                        材料消耗
                      </span>
                      <span className="font-mono font-bold text-neon-orange">
                        {finalResult.materialCost}
                      </span>
                    </div>
                  </div>

                  {finalResult.totalDamage > 0 && (
                    <div className="bg-neon-red/10 border border-neon-red/30 rounded-xl p-3 mb-6 text-left">
                      <p className="text-xs text-neon-red flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          失败副作用：操作错误造成的额外损伤已扣除，建议后续操作更加谨慎。
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate('/repair')}
                      className="flex-1 py-3 rounded-xl font-display font-bold bg-gradient-to-r from-neon-blue to-neon-green text-white hover:shadow-lg hover:shadow-neon-blue/20 transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="w-5 h-5" />
                      常规维修
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-4 py-3 rounded-xl bg-background-tertiary text-white/60 hover:text-neon-blue hover:bg-neon-blue/10 transition-all flex items-center gap-2"
                    >
                      <RotateCcw className="w-5 h-5" />
                      新手术
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="card p-6">
              <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-neon-orange" />
                病灶图例
              </h2>
              <div className="space-y-3">
                {(Object.entries(LESION_CONFIG) as [LesionType, typeof LESION_CONFIG[LesionType]][]).map(
                  ([type, config]) => {
                    const Icon = LESION_ICONS[type];
                    return (
                      <div
                        key={type}
                        className="p-3 rounded-xl bg-background-tertiary"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${config.color}20` }}
                          >
                            <Icon
                              className="w-5 h-5"
                              style={{ color: config.color }}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-white">{config.name}</p>
                            <p className="text-[10px] text-white/40 font-mono">
                              失败损伤: {config.damageOnFail}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-white/50">{config.description}</p>
                      </div>
                    );
                  }
                )}
              </div>

              {showHints && (
                <div className="mt-6 bg-neon-blue/10 border border-neon-blue/30 rounded-xl p-4">
                  <h4 className="font-bold text-neon-blue mb-3 text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    处理优先级
                  </h4>
                  <div className="space-y-2">
                    {[
                      { type: 'contamination' as LesionType, step: 1 },
                      { type: 'loose' as LesionType, step: 2 },
                      { type: 'short_circuit' as LesionType, step: 3 },
                      { type: 'crack' as LesionType, step: 4 },
                    ].map(({ type, step }) => {
                      const cfg = LESION_CONFIG[type];
                      const Icon = LESION_ICONS[type];
                      return (
                        <div
                          key={type}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-bold">
                            {step}
                          </span>
                          <Icon
                            className="w-3 h-3"
                            style={{ color: cfg.color }}
                          />
                          <span className="text-white/70">{cfg.name}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-white/40 mt-3">
                    零件会按此顺序生成病灶步骤
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="手术记录"
      >
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {surgeryRecords.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50">暂无手术记录</p>
            </div>
          ) : (
            [...surgeryRecords]
              .sort((a, b) => b.performedAt - a.performedAt)
              .map((record) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 rounded-xl border ${
                    record.success
                      ? 'bg-neon-green/5 border-neon-green/20'
                      : 'bg-neon-red/5 border-neon-red/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        record.success ? 'bg-neon-green/20' : 'bg-neon-red/20'
                      }`}
                    >
                      <Wrench
                        className={`w-5 h-5 ${
                          record.success ? 'text-neon-green' : 'text-neon-red'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-white truncate">
                          {record.robotName}
                        </p>
                        {record.success ? (
                          <CheckCircle className="w-4 h-4 text-neon-green flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-neon-red flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-white/50 mb-2">
                        {record.partName} · 病灶 {record.lesionsTreated}/
                        {record.totalLesions}
                      </p>
                      <div className="flex flex-wrap gap-3 text-xs">
                        <span className="text-neon-green font-mono">
                          +{record.finalRecovery} 恢复
                        </span>
                        <span className="text-neon-red font-mono">
                          -{record.damageIncrease} 损伤
                        </span>
                        <span className="text-neon-orange font-mono">
                          {record.materialCost} 材料
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-white/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(record.performedAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
          )}
        </div>
      </Modal>
    </PageContainer>
  );
}

function List(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  );
}
