import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, Coffee, Moon, Coins, Plus, Check, CheckCircle2, ChevronRight, 
  Sparkles, Smile, RefreshCw, Layers, Dumbbell, AlertTriangle, Play,
  BookOpen, Calendar, Clock, Volume2, User, Zap, MessageSquare, Terminal
} from "lucide-react";
import { PetStats, Task, FoodItem } from "../types";
import { PET_PROFILES, SHOP_ITEMS } from "../data";
import { playPetSound, playFeedSound, playLevelUpSound } from "../lib/sound";

interface DesktopStageProps {
  petStats: PetStats;
  setPetStats: React.Dispatch<React.SetStateAction<PetStats>>;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onAddTask: (title: string, estimatedMinutes: number, type: "code" | "design" | "break" | "review" | "admin") => void;
  latestSpeech: string | null;
  setLatestSpeech: (speech: string | null) => void;
  onSwitchSpecies: (species: any) => void;
  onOpenApp: (app: "terminal" | "planner" | "shop" | "settings") => void;
}

interface HeartParticle {
  id: number;
  x: number;
  y: number;
}

interface LogEntry {
  time: string;
  text: string;
  type: "system" | "feed" | "play" | "level" | "morph";
}

export default function DesktopStage({
  petStats,
  setPetStats,
  tasks,
  onToggleTask,
  onAddTask,
  latestSpeech,
  setLatestSpeech,
  onSwitchSpecies,
  onOpenApp
}: DesktopStageProps) {
  const [hearts, setHearts] = useState<HeartParticle[]>([]);
  const [showFeedTray, setShowFeedTray] = useState(false);
  const [isDancing, setIsDancing] = useState(false);
  const [isPetted, setIsPetted] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([
    { time: new Date().toLocaleTimeString().slice(0, 5), text: "💻 HermesPet 桌面虚拟环境初始化成功", type: "system" },
    { time: new Date().toLocaleTimeString().slice(0, 5), text: `👋 ${petStats.name} 守护进程运行中，形态：${PET_PROFILES[petStats.type].species}`, type: "system" }
  ]);

  const profile = PET_PROFILES[petStats.type];
  const pendingTasks = tasks.filter((t) => !t.completed);

  // Add a log helper
  const addLog = (text: string, type: LogEntry["type"] = "system") => {
    const time = new Date().toLocaleTimeString().slice(0, 5);
    setLogs((prev) => [{ time, text, type }, ...prev.slice(0, 15)]);
  };

  // Pet click action -> spawn hearts!
  const handlePetStageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPetSound(petStats.type, "click");
    
    // Spawn heart particle
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 12;
    const y = e.clientY - rect.top - 24;
    setHearts((prev) => [...prev, { id: Date.now() + Math.random(), x, y }]);

    // Trigger petting states
    setIsPetted(true);
    setTimeout(() => setIsPetted(false), 1000);

    // Boost experience & mood
    setPetStats((prev) => {
      let newXp = prev.xp + 5;
      let newLevel = prev.level;
      if (newXp >= newLevel * 120) {
        newXp = newXp - (newLevel * 120);
        newLevel += 1;
        setLatestSpeech(`*属性跃迁* 哇塞！摸摸头居然让我的智慧等级突破到了 Lvl.${newLevel}！💖`);
        playLevelUpSound();
        addLog(`✨ 伴生宠属性突破！升级至 Lvl.${newLevel}！`, "level");
      }
      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        mood: Math.min(100, prev.mood + 6)
      };
    });

    // Random speech response
    const greetings = [
      `*发出舒服的呼噜声* 主人抚摸的手法太棒了，逻辑电路都融化了~`,
      `嘿嘿，摸一摸，bug 全都消散！`,
      `*摇摇尾巴* 逻辑核心正在超频，好感度 +999！`,
      `*软绵绵地蹭蹭* 今天主人也超级勤奋，莫奇给你捏捏肩！`
    ];
    setLatestSpeech(greetings[Math.floor(Math.random() * greetings.length)]);
    addLog(`👋 抚摸并关怀了 [${petStats.name}]`, "play");
  };

  // Remove hearts
  useEffect(() => {
    if (hearts.length === 0) return;
    const timeout = setTimeout(() => {
      setHearts((prev) => prev.slice(1));
    }, 1500);
    return () => clearTimeout(timeout);
  }, [hearts]);

  // Feed action
  const handleFeedItem = (food: FoodItem) => {
    if (petStats.coins < food.cost) {
      setLatestSpeech(`*空空如也的钱夹* 哎呀，主人的 Cyber币 似乎不够购买 [${food.name}] 呢... 我们可以去待办本完成任务赚取！`);
      addLog(`❌ 购买 [${food.name}] 失败：Cyber币余额不足`, "system");
      return;
    }

    playFeedSound();
    
    // Update stats
    setPetStats((prev) => {
      let newXp = prev.xp + 15; // Feeding gives juicy XP boost
      let newLevel = prev.level;
      if (newXp >= newLevel * 120) {
        newXp = newXp - (newLevel * 120);
        newLevel += 1;
        setLatestSpeech(`*闪亮进阶* 好吃！这一口美味直接把我的智能核心顶上了 Lvl.${newLevel}！🔥`);
        playLevelUpSound();
        addLog(`✨ 伴生宠属性突破！升级至 Lvl.${newLevel}！`, "level");
      }

      return {
        ...prev,
        coins: prev.coins - food.cost,
        hunger: Math.min(100, prev.hunger + food.hungerRestore),
        energy: Math.min(100, prev.energy + food.energyRestore),
        mood: Math.min(100, prev.mood + food.moodRestore),
        xp: newXp,
        level: newLevel,
        status: "eating"
      };
    });

    setLatestSpeech(`*嚼嚼嚼* 太好吃了！投喂的 [${food.emoji} ${food.name}] 充满能量，胃口大满足！`);
    addLog(`🍖 购买并投喂了 [${food.name}] (Cyber币 -${food.cost})`, "feed");
    setShowFeedTray(false);

    // Reset eating status after 2.5 seconds
    setTimeout(() => {
      setPetStats((prev) => ({
        ...prev,
        status: prev.status === "eating" ? "idle" : prev.status
      }));
    }, 2500);
  };

  // Play game
  const handlePlayGame = () => {
    if (petStats.status === "sleeping") {
      setLatestSpeech(`*小声嘟囔* 唔... 我正在香甜的睡眠充电模式中，等我醒来再陪你玩好吗？`);
      return;
    }

    setIsDancing(true);
    playPetSound(petStats.type, "happy_dance");
    
    setPetStats((prev) => {
      let newXp = prev.xp + 25;
      let newLevel = prev.level;
      if (newXp >= newLevel * 120) {
        newXp = newXp - (newLevel * 120);
        newLevel += 1;
        playLevelUpSound();
        addLog(`✨ 伴生宠属性突破！升级至 Lvl.${newLevel}！`, "level");
      }
      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        mood: Math.min(100, prev.mood + 15),
        coins: prev.coins + 10, // Earn coins from playing!
        energy: Math.max(0, prev.energy - 10) // Playing costs energy
      };
    });

    setLatestSpeech(`*欢乐蹦迪* 耶！和主人一起玩赛博抛球游戏太开心了！我的代码都飘起来了！获得 +10 Cyber币！`);
    addLog(`🎮 陪伴宠物进行桌面娱乐，获得 +10 Cyber币`, "play");

    setTimeout(() => {
      setIsDancing(false);
    }, 2500);
  };

  // Toggle sleep
  const handleToggleSleep = () => {
    const isSleeping = petStats.status === "sleeping";
    
    if (isSleeping) {
      setPetStats((prev) => ({ ...prev, status: "idle" }));
      playPetSound(petStats.type, "click");
      setLatestSpeech(`*伸大懒腰* 呼啊~ 电量已经充得饱饱的！随时可以开始和主人并肩作战！💻`);
      addLog(`⏰ 唤醒了睡梦中的 [${petStats.name}]`, "system");
    } else {
      setPetStats((prev) => ({ ...prev, status: "sleeping" }));
      playPetSound(petStats.type, "sad_sigh");
      setLatestSpeech(`*抱着尾巴蜷缩* Zzz... 我的核心电路需要休息充电啦，主人先专心做事哦...`);
      addLog(`💤 [${petStats.name}] 进入了深度睡眠充电状态`, "system");
    }
  };

  // Morph shortcut
  const handleMorph = (speciesKey: any) => {
    if (speciesKey === petStats.type) return;
    onSwitchSpecies(speciesKey);
    addLog(`🌀 宠物触发数码重组，变身为：${PET_PROFILES[speciesKey].species}`, "morph");
  };

  // Add quick task from sticky note
  const handleQuickAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle.trim(), 25, "code");
    addLog(`📝 在桌面记事贴上新增待办："${newTaskTitle.trim()}"`, "system");
    setNewTaskTitle("");
  };

  // Render pixel art mirroring FloatingPet styles but enhanced for desktop home
  const renderDesktopPixelArt = () => {
    const isSleeping = petStats.status === "sleeping";
    const isEating = petStats.status === "eating";
    const isWorking = petStats.status === "working";

    // Common animation state classes
    let animClass = "animate-bounce";
    if (isSleeping) animClass = "opacity-85";
    else if (isDancing) animClass = "animate-ping";
    else if (isPetted) animClass = "animate-pulse";

    const animStyle = { animationDuration: isWorking ? "0.8s" : isDancing ? "1s" : "3s" };

    const renderEyes = (eyesColor: string) => {
      if (isSleeping) {
        return (
          <div className="flex justify-around items-center w-full px-3">
            <div className="w-4 h-1 bg-zinc-950 rounded-sm"></div>
            <div className="w-4 h-1 bg-zinc-950 rounded-sm"></div>
          </div>
        );
      }
      if (isDancing) {
        return (
          <div className="flex justify-around items-center w-full px-3 text-lg font-bold text-rose-500 font-mono leading-none">
            <span>^</span>
            <span>^</span>
          </div>
        );
      }
      if (isPetted) {
        return (
          <div className="flex justify-around items-center w-full px-3 text-sm font-bold text-indigo-500 font-mono leading-none">
            <span>♥</span>
            <span>♥</span>
          </div>
        );
      }
      return (
        <div className="flex justify-around items-center w-full px-3">
          <div className={`w-3.5 h-4.5 rounded-sm ${eyesColor} relative flex items-center justify-center`}>
            <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
          <div className={`w-3.5 h-4.5 rounded-sm ${eyesColor} relative flex items-center justify-center`}>
            <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      );
    };

    const renderMouth = () => {
      if (isDancing || isEating) {
        return <div className="w-4 h-2.5 border-b-2 border-zinc-950 rounded-full -mt-0.5 bg-red-400"></div>;
      }
      return <div className="w-2.5 h-1 bg-zinc-950 rounded-sm"></div>;
    };

    switch (petStats.type) {
      case "Hermes":
        return (
          <div 
            className={`relative w-24 h-22 bg-amber-500 border-3 border-amber-600 rounded-t-3xl rounded-b-xl flex flex-col justify-between p-1.5 shadow-lg ${animClass}`}
            style={animStyle}
          >
            {/* Fox ears */}
            <div className="absolute -top-4 left-1 right-1 flex justify-between z-10">
              <div className="w-6 h-7 bg-amber-600 rounded-tr-3xl rotate-[-12deg] flex items-end justify-center border-l-2 border-t border-amber-700">
                <div className="w-3 h-5 bg-rose-200 rounded-tr-2xl"></div>
              </div>
              <div className="w-6 h-7 bg-amber-600 rounded-tl-3xl rotate-[12deg] flex items-end justify-center border-r-2 border-t border-amber-700">
                <div className="w-3 h-5 bg-rose-200 rounded-tl-2xl"></div>
              </div>
            </div>
            <div className="mt-2.5 flex justify-around items-center w-full z-10">
              {renderEyes("bg-zinc-950")}
            </div>
            <div className="flex justify-center items-center gap-1.5 mb-1.5 z-10">
              <div className="w-3 h-2 bg-rose-300/40 rounded-full"></div>
              <div className="relative w-12 h-6 bg-white border-2 border-amber-200 rounded-lg flex flex-col items-center justify-center shadow-sm">
                <div className="w-3 h-2 bg-zinc-950 rounded-b-md"></div>
                {renderMouth()}
              </div>
              <div className="w-3 h-2 bg-rose-300/40 rounded-full"></div>
            </div>
            {/* Fox tail */}
            <div className="absolute -right-4 bottom-1 w-6 h-12 bg-amber-600 border-2 border-amber-700 rounded-t-full rounded-b-xl rotate-[35deg] origin-bottom animate-pulse">
              <div className="w-full h-5 bg-slate-100 rounded-t-full"></div>
            </div>
          </div>
        );

      case "Mochi":
        return (
          <div 
            className={`relative w-24 h-18 bg-pink-400 border-3 border-pink-500 rounded-t-[48px] rounded-b-lg flex flex-col justify-end p-2 shadow-lg ${animClass}`}
            style={animStyle}
          >
            <div className="absolute top-2 left-5 w-6 h-2 bg-white/60 rounded-full rotate-[-15deg]"></div>
            <div className="mb-3 flex justify-around items-center w-full">
              {renderEyes("bg-zinc-950")}
            </div>
            <div className="flex justify-center items-center gap-3 mb-2">
              <div className="w-3.5 h-1.5 bg-pink-600/40 rounded-full"></div>
              {renderMouth()}
              <div className="w-3.5 h-1.5 bg-pink-600/40 rounded-full"></div>
            </div>
            <div className="absolute -left-1.5 bottom-0 w-4 h-2.5 bg-pink-400 rounded-full"></div>
            <div className="absolute -right-1.5 bottom-0 w-4 h-2.5 bg-pink-400 rounded-full"></div>
          </div>
        );

      case "Kuro":
        return (
          <div 
            className={`relative w-22 h-20 bg-zinc-900 border-3 border-zinc-950 rounded-t-2xl rounded-b-3xl flex flex-col justify-between p-1.5 shadow-lg ${animClass}`}
            style={animStyle}
          >
            <div className="absolute -top-4 left-1 right-1 flex justify-between z-10">
              <div className="w-6 h-6 bg-zinc-900 border-l border-t border-zinc-950 rotate-[-15deg] rounded-tl-xl flex items-center justify-center">
                <div className="w-3.5 h-3.5 bg-purple-950 rotate-[5deg] rounded-tl"></div>
              </div>
              <div className="w-6 h-6 bg-zinc-900 border-r border-t border-zinc-950 rotate-[15deg] rounded-tr-xl flex items-center justify-center">
                <div className="w-3.5 h-3.5 bg-purple-950 rotate-[-5deg] rounded-tr"></div>
              </div>
            </div>
            <div className="mt-3 flex justify-around items-center w-full z-10">
              {renderEyes("bg-purple-500")}
            </div>
            <div className="flex justify-center items-center gap-2 mb-2 relative z-10">
              <div className="absolute -left-3 top-1 w-4 h-[2px] bg-zinc-600/50 rotate-[-6deg]"></div>
              <div className="absolute -left-3 top-3 w-4 h-[2px] bg-zinc-600/50 rotate-[6deg]"></div>
              <div className="w-2 h-1.5 bg-rose-400/30 rounded-full"></div>
              <div className="flex flex-col items-center">
                <div className="w-2 h-1 bg-zinc-950 rounded-full"></div>
                {renderMouth()}
              </div>
              <div className="w-2 h-1.5 bg-rose-400/30 rounded-full"></div>
              <div className="absolute -right-3 top-1 w-4 h-[2px] bg-zinc-600/50 rotate-[6deg]"></div>
              <div className="absolute -right-3 top-3 w-4 h-[2px] bg-zinc-600/50 rotate-[-6deg]"></div>
            </div>
            <div className="absolute -right-3 top-3 w-3 h-10 bg-zinc-900 border-r-2 border-zinc-950 rounded-full origin-bottom rotate-[35deg] animate-pulse"></div>
          </div>
        );

      case "Pippin":
        return (
          <div 
            className={`relative w-20 h-20 bg-amber-300 border-3 border-amber-400 rounded-full flex flex-col justify-between p-1.5 shadow-lg ${animClass}`}
            style={animStyle}
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-5 bg-amber-400 rounded-full rotate-[15deg]"></div>
            <div className="mt-4 flex justify-around items-center w-full z-10">
              {renderEyes("bg-zinc-950")}
            </div>
            <div className="flex justify-center items-center gap-2 mb-2 relative z-10">
              <div className="w-2 h-1.5 bg-rose-350/30 rounded-full"></div>
              <div className="w-5 h-4 bg-orange-500 rounded-l-full rounded-r-3xl border-b border-orange-600 animate-pulse"></div>
              <div className="absolute left-[-6px] top-[-10px] w-7 h-4 bg-zinc-300 border border-zinc-400 rounded-full origin-right animate-bounce"></div>
              <div className="w-2 h-1.5 bg-rose-350/30 rounded-full"></div>
            </div>
            <div className="absolute -left-5 top-6 flex items-center z-[-1]">
              <div className="w-4 h-1.5 bg-zinc-400"></div>
              <div className="w-6 h-6 border-2 border-zinc-400 bg-zinc-300 rounded-full flex items-center justify-center animate-spin">
                <div className="w-2 h-2 bg-zinc-500 rounded-full"></div>
              </div>
            </div>
          </div>
        );

      case "Lulu":
        return (
          <div 
            className={`relative w-20 h-20 bg-rose-50 border-3 border-rose-100 rounded-3xl flex flex-col justify-between p-1.5 shadow-lg ${animClass}`}
            style={animStyle}
          >
            {/* Rabbit ears */}
            <div className="absolute -top-10 left-1.5 right-1.5 flex justify-between z-10">
              <div className="w-5 h-11 bg-rose-50 border-2 border-rose-100 rounded-t-full rotate-[-8deg] origin-bottom flex items-center justify-center">
                <div className="w-2 h-8 bg-rose-200/80 rounded-t-full"></div>
              </div>
              <div className="w-5 h-11 bg-rose-50 border-2 border-rose-100 rounded-t-full rotate-[8deg] origin-bottom flex items-center justify-center">
                <div className="w-2 h-8 bg-rose-200/80 rounded-t-full"></div>
              </div>
            </div>
            <div className="mt-4 flex justify-around items-center w-full z-10">
              {renderEyes("bg-rose-500")}
            </div>
            <div className="flex justify-center items-center gap-2 mb-1.5 z-10">
              <div className="w-3 h-2 bg-rose-300/40 rounded-full"></div>
              <div className="flex flex-col items-center">
                <div className="w-2 h-1.5 bg-rose-400 rounded-full"></div>
                {renderMouth()}
              </div>
              <div className="w-3 h-2 bg-rose-300/40 rounded-full"></div>
            </div>
            <div className="absolute -right-3 bottom-2 w-5 h-5 rounded-full bg-rose-50 border-2 border-rose-100"></div>
          </div>
        );

      case "Cookie":
        return (
          <div 
            className={`relative w-22 h-20 bg-amber-500 border-3 border-amber-600 rounded-t-3xl rounded-b-2xl flex flex-col justify-between p-1.5 shadow-lg ${animClass}`}
            style={animStyle}
          >
            <div className="absolute -top-4 left-1 right-1 flex justify-between z-10">
              <div className="w-6 h-7 bg-amber-600 border-l border-t border-amber-700 rotate-[-10deg] rounded-tl-lg flex items-center justify-center">
                <div className="w-3.5 h-5 bg-amber-50 rounded-tl"></div>
              </div>
              <div className="w-6 h-7 bg-amber-600 border-r border-t border-amber-700 rotate-[10deg] rounded-tr-lg flex items-center justify-center">
                <div className="w-3.5 h-5 bg-amber-50 rounded-tr"></div>
              </div>
            </div>
            <div className="mt-3.5 flex justify-around items-center w-full z-10">
              {renderEyes("bg-zinc-950")}
            </div>
            <div className="flex justify-center items-center gap-2 mb-1.5 relative z-10">
              <div className="w-2.5 h-2 bg-rose-300/40 rounded-full"></div>
              <div className="w-11 h-6 bg-white border-2 border-amber-200 rounded-lg flex flex-col items-center justify-center shadow-inner">
                <div className="w-3 h-1.5 bg-zinc-950 rounded-b-full"></div>
                {renderMouth()}
              </div>
              <div className="w-2.5 h-2 bg-rose-300/40 rounded-full"></div>
            </div>
            {/* Collar */}
            <div className="absolute bottom-1 left-2 right-2 h-1.5 bg-cyan-400 rounded-full flex justify-center items-center">
              <div className="w-2.5 h-2.5 bg-yellow-400 border border-yellow-500 rounded-full shadow animate-pulse"></div>
            </div>
            <div className="absolute -right-3 bottom-2 w-5 h-5 bg-amber-600 border-2 border-amber-700 rounded-full origin-bottom"></div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-1 text-slate-800">
      
      {/* LEFT: Cozy Pet Room / Virtual Playground (Grid col 7) */}
      <div className="lg:col-span-7 flex flex-col justify-between h-full bg-white border-2 border-indigo-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        
        {/* Soft grid graphic decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none"></div>

        {/* Header panel */}
        <div className="flex justify-between items-center select-none z-10">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="font-extrabold text-indigo-950 text-xs tracking-wider uppercase">Cozy Desktop Stage</span>
          </div>
          <div className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full border border-indigo-100">
            {profile.species} · {petStats.status === "sleeping" ? "💤 深度睡眠充电" : petStats.status === "eating" ? "🍖 补充能量中" : "🟢 桌面活跃状态"}
          </div>
        </div>

        {/* Main playground rug area */}
        <div 
          onClick={handlePetStageClick}
          className="flex-1 my-5 border-4 border-dashed border-indigo-50/80 bg-indigo-50/20 rounded-[36px] flex flex-col items-center justify-center relative cursor-pointer group shadow-inner transition-all hover:bg-indigo-50/30"
          title="点击抚摸、慰劳你的宠物"
        >
          {/* Room decorations (Cozy corner furniture mockups) */}
          <div className="absolute bottom-6 left-6 flex flex-col items-center select-none opacity-40 group-hover:opacity-75 transition-opacity">
            {/* Cozy cushion sleeping bed */}
            <div className="w-16 h-4 bg-indigo-200 border-b border-indigo-300 rounded-full shadow-inner"></div>
            <span className="text-[9px] font-bold text-indigo-400 mt-1">充电软垫</span>
          </div>

          <div className="absolute bottom-6 right-8 flex flex-col items-center select-none opacity-40 group-hover:opacity-75 transition-opacity">
            {/* Small food bowl */}
            <div className="w-8 h-4 bg-amber-100 border border-amber-200 rounded-full shadow-md flex items-center justify-center text-xs">
              🍪
            </div>
            <span className="text-[9px] font-bold text-indigo-400 mt-1">饲料碗</span>
          </div>

          {/* Interactive Speech Bubble */}
          <AnimatePresence>
            {latestSpeech && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-6 max-w-[260px] bg-zinc-950 text-white rounded-2xl px-4 py-3 text-xs font-mono shadow-2xl leading-relaxed text-center z-20"
                onClick={(e) => e.stopPropagation()}
              >
                <p>{latestSpeech}</p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] w-2.5 h-2.5 rotate-45 bg-zinc-950"></div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Render the core beautiful Pet Nest Base */}
          <div className="relative flex flex-col items-center justify-center py-4 select-none z-10">
            <div className="relative w-28 h-16 flex items-center justify-center text-4xl select-none">
              <span className="animate-bounce" style={{ animationDuration: "3.5s" }}>🏡</span>
              {/* Glowing shadow beneath */}
              <div className="absolute bottom-1 w-20 h-3 bg-indigo-950/10 rounded-full filter blur-sm -z-10 animate-pulse"></div>
            </div>
            <div className="text-[10px] text-indigo-500 font-extrabold mt-2.5 bg-indigo-50/50 px-3.5 py-1.5 rounded-full border border-indigo-100/50 text-center tracking-wide flex items-center gap-1">
              <span>{petStats.name}已在桌面自由活动中...</span>
              <span className="animate-pulse">🐾</span>
            </div>
          </div>

          {/* Instruction helper */}
          <div className="absolute bottom-3 text-[10px] text-slate-400 font-bold select-none group-hover:text-indigo-600 transition-colors">
            ✨ 点击屏幕任意处即可「抚摸」并增加好感经验
          </div>

          {/* Flying hearts container */}
          {hearts.map((h) => (
            <motion.span
              key={h.id}
              initial={{ opacity: 1, y: h.y, x: h.x, scale: 0.8 }}
              animate={{ opacity: 0, y: h.y - 70, scale: 1.4 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute text-rose-500 font-bold text-2xl select-none pointer-events-none z-30"
            >
              ❤️
            </motion.span>
          ))}
        </div>

        {/* BOTTOM DOCK: Direct Command Bar */}
        <div className="flex items-center gap-3 w-full border-t border-indigo-50 pt-4 z-10 relative">
          
          {/* Quick Feed button */}
          <div className="relative flex-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFeedTray(!showFeedTray);
              }}
              className={`w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                showFeedTray 
                  ? "bg-indigo-600 text-white shadow-lg" 
                  : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
              }`}
            >
              🍖 喂食补给
            </button>

            {/* Quick Food selection Tray */}
            <AnimatePresence>
              {showFeedTray && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: -10, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-white border-2 border-indigo-100 shadow-2xl rounded-2xl p-3 z-30 space-y-2 text-slate-700"
                >
                  <span className="text-[10px] font-extrabold text-indigo-950 block border-b border-indigo-50 pb-1">选择美食补充体能 (Cyber币)</span>
                  <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto">
                    {SHOP_ITEMS.map((food) => (
                      <button
                        key={food.id}
                        onClick={() => handleFeedItem(food)}
                        className="flex justify-between items-center p-2 rounded-xl border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all text-left text-xs cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{food.emoji}</span>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{food.name}</span>
                            <span className="text-[9px] text-slate-400">{food.description}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-indigo-600 font-bold">
                            {food.hungerRestore > 0 && `+${food.hungerRestore}饱腹 `}
                            {food.energyRestore > 0 && `+${food.energyRestore}精力`}
                          </span>
                          <span className="bg-yellow-400/20 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-0.5">
                            {food.cost} 🪙
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Interactive Play Button */}
          <button
            onClick={handlePlayGame}
            disabled={petStats.status === "sleeping" || isDancing}
            className="flex-1 bg-amber-400 hover:bg-amber-500 disabled:bg-slate-100 disabled:text-slate-400 text-amber-950 font-black py-3 rounded-2xl text-xs transition-colors shadow-md shadow-amber-100 cursor-pointer flex items-center justify-center gap-1.5"
          >
            🎮 桌面娱乐 (+10币)
          </button>

          {/* Recharge Sleep button */}
          <button
            onClick={handleToggleSleep}
            className={`px-4 py-3 rounded-2xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 ${
              petStats.status === "sleeping"
                ? "bg-rose-500 text-white"
                : "bg-indigo-500 hover:bg-indigo-600 text-white"
            }`}
            title={petStats.status === "sleeping" ? "唤醒宠物" : "让宠物小憩充电"}
          >
            {petStats.status === "sleeping" ? (
              <>☀️ 唤醒</>
            ) : (
              <>⚡ 充电</>
            )}
          </button>

        </div>
      </div>

      {/* RIGHT: Status Dashboard & Sticky Notes (Grid col 5) */}
      <div className="lg:col-span-5 flex flex-col gap-6 h-full">
        
        {/* UPPER RIGHT: Core Vitals Dashboard */}
        <div className="bg-white border-2 border-indigo-100 rounded-3xl p-5 shadow-xl font-mono text-xs text-slate-700 select-none">
          <div className="flex justify-between items-center border-b-2 border-indigo-50 pb-2 mb-3.5">
            <span className="font-extrabold text-indigo-950 tracking-wider uppercase">📊 Vitals Dashboard</span>
            {/* Miniature Live Portrait */}
            <div className="w-8 h-8 rounded-xl overflow-hidden border-2 border-indigo-100 flex items-center justify-center bg-indigo-50/50 scale-90 relative shadow-sm">
              <div className="scale-[0.38] shrink-0 origin-center flex items-center justify-center absolute">
                {renderDesktopPixelArt()}
              </div>
            </div>
          </div>
          
          <div className="space-y-3.5">
            {/* Growth core (Lvl & XP) */}
            <div>
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-800 mb-1">
                <span className="flex items-center gap-1 text-indigo-700">⚙️ 智能进化核心</span>
                <span>Lvl.{petStats.level} ({petStats.xp} / {petStats.level * 120} XP)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500 shadow-inner"
                  style={{ width: `${(petStats.xp / (petStats.level * 120)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Satiety / Hunger */}
            <div>
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-800 mb-1">
                <span className="flex items-center gap-1 text-orange-600">🍖 胃口饱腹程度</span>
                <span className={petStats.hunger < 30 ? "text-rose-500 font-extrabold animate-pulse" : "text-slate-600"}>{petStats.hunger} / 100</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    petStats.hunger < 30 ? "bg-rose-500 animate-pulse" : "bg-orange-500"
                  }`}
                  style={{ width: `${petStats.hunger}%` }}
                ></div>
              </div>
            </div>

            {/* Energy */}
            <div>
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-800 mb-1">
                <span className="flex items-center gap-1 text-cyan-600">⚡ 芯片能量储备</span>
                <span className={petStats.energy < 25 ? "text-rose-500 font-extrabold animate-pulse" : "text-slate-600"}>{petStats.energy} / 100</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    petStats.energy < 25 ? "bg-rose-500 animate-pulse" : "bg-cyan-500"
                  }`}
                  style={{ width: `${petStats.energy}%` }}
                ></div>
              </div>
            </div>

            {/* Mood */}
            <div>
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-800 mb-1">
                <span className="flex items-center gap-1 text-rose-600">❤️ 逻辑情感指数</span>
                <span>{petStats.mood} / 100</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-[#FF6B6B] h-full rounded-full transition-all duration-500"
                  style={{ width: `${petStats.mood}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-indigo-50/50 flex justify-between items-center text-[10px] text-slate-400">
            <span>Cyber币余额: <span className="text-yellow-600 font-bold font-sans text-xs">{petStats.coins}</span> 🪙</span>
            <button 
              onClick={() => onOpenApp("shop")}
              className="text-indigo-600 hover:underline font-bold"
            >
              数码道具商城 →
            </button>
          </div>
        </div>

        {/* MIDDLE RIGHT: Daily Goals Sticky Note (Yellow paper) */}
        <div className="bg-yellow-50/90 border-2 border-yellow-200/60 rounded-3xl p-5 shadow-lg relative transform rotate-[-0.5deg] font-mono text-xs flex flex-col justify-between min-h-[220px]">
          {/* Tape decoration */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-20 h-6 bg-yellow-200/50 border border-yellow-300/30 shadow-sm rounded-sm"></div>
          
          <div>
            <span className="font-extrabold text-amber-950 block border-b border-amber-200/50 pb-1.5 mb-2 select-none tracking-wider uppercase">📝 Desktop Sticky Task</span>
            
            {/* Quick Add Form */}
            <form onSubmit={handleQuickAddTask} className="flex gap-1.5 mb-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="极速添加一个今日任务..."
                className="flex-1 bg-white border border-amber-300 rounded-xl px-2.5 py-1 text-xs text-amber-950 placeholder-amber-700/40 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-2.5 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
              {pendingTasks.length === 0 ? (
                <div className="text-center py-4 text-[11px] text-amber-800/60 font-bold italic select-none">
                  🎉 今日目标全部达标啦！
                </div>
              ) : (
                pendingTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onToggleTask(task.id)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-amber-100/40 cursor-pointer text-amber-950 select-none text-[11px] transition-colors"
                  >
                    <div className="w-4 h-4 rounded border border-amber-500 flex items-center justify-center bg-white">
                      <Check className="w-3 h-3 text-amber-600 stroke-[3] scale-0 hover:scale-100 transition-transform" />
                    </div>
                    <span className="truncate flex-1 font-bold">{task.title}</span>
                    <span className="text-[9px] bg-amber-200/50 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">
                      {task.estimatedMinutes}m
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-amber-200/40 pt-2.5 mt-2 text-[10px] flex justify-between text-amber-800/70 font-semibold select-none">
            <span>待处理规划: <span className="font-bold text-amber-900">{pendingTasks.length}</span> 个</span>
            <button 
              onClick={() => onOpenApp("planner")}
              className="hover:underline font-bold text-amber-950"
            >
              高级规划本 →
            </button>
          </div>
        </div>

        {/* LOWER RIGHT: Quick Morph & System Brainwave Monitor */}
        <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-4.5 shadow-xl flex flex-col justify-between flex-1 min-h-[190px]">
          {/* Brainwave logs */}
          <div>
            <span className="font-extrabold text-cyan-400 block border-b border-slate-800 pb-1.5 mb-2.5 text-[11px] tracking-wider uppercase font-mono select-none">📟 Brainwave Output Logs</span>
            
            <div className="space-y-1 font-mono text-[10px] text-slate-400 max-h-[110px] overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-2 leading-tight">
                  <span className="text-slate-600 shrink-0 select-none">[{log.time}]</span>
                  <span className={
                    log.type === "level" ? "text-yellow-400 font-bold" :
                    log.type === "morph" ? "text-cyan-400 font-bold" :
                    log.type === "feed" ? "text-emerald-400" :
                    log.type === "play" ? "text-indigo-300" : "text-slate-300"
                  }>
                    {log.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick morphing species shortcuts */}
          <div className="border-t border-slate-800 pt-3 mt-3">
            <span className="text-[10px] font-extrabold text-slate-500 block mb-2 select-none">🌀 桌面快捷变身形态</span>
            <div className="flex gap-2 justify-between">
              {Object.keys(PET_PROFILES).map((speciesKey) => {
                const isActive = speciesKey === petStats.type;
                const petProf = PET_PROFILES[speciesKey as keyof typeof PET_PROFILES];
                return (
                  <button
                    key={speciesKey}
                    onClick={() => handleMorph(speciesKey)}
                    className={`w-8.5 h-8.5 rounded-full flex items-center justify-center text-sm transition-all transform hover:scale-115 active:scale-95 cursor-pointer relative ${
                      isActive
                        ? "bg-indigo-600 ring-2 ring-indigo-400 scale-110"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                    title={`变身：${petProf.species}`}
                  >
                    {/* Unique simple icon or first letter for shortcuts */}
                    <span>
                      {speciesKey === "Hermes" ? "🦊" :
                       speciesKey === "Mochi" ? "🌸" :
                       speciesKey === "Kuro" ? "🐈" :
                       speciesKey === "Pippin" ? "🐦" :
                       speciesKey === "Lulu" ? "🐰" : "🐶"}
                    </span>
                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 border border-slate-900 rounded-full animate-ping"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
