import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Terminal as TermIcon, Briefcase, ShoppingBag, Settings, 
  Coins, Sparkles, Trophy, Heart, Coffee, Moon, Battery, Calendar, 
  Clock, Monitor, RefreshCw, Star, ArrowUpRight, Smile, Gamepad2, Info,
  Volume2, VolumeX
} from "lucide-react";

import { PetStats, Task, ChatMessage, FoodItem, AiModelSettings } from "./types";
import { SHOP_ITEMS, PET_PROFILES } from "./data";
import { playFeedSound, playAlertWarningSound, playLevelUpSound, toggleMute, getMutedStatus } from "./lib/sound";
import DynamicIsland from "./components/DynamicIsland";
import PetTerminal from "./components/PetTerminal";
import TaskPlanner from "./components/TaskPlanner";
import PetShop from "./components/PetShop";
import FloatingPet from "./components/FloatingPet";
import DesktopStage from "./components/DesktopStage";

// Helper to resolve API URLs for both Web deployment and Desktop Packaged environments (Electron/Tauri)
const getApiUrl = (path: string): string => {
  if (typeof window !== "undefined") {
    // Detect if we are running under local filesystem protocols, Tauri/Electron containers, or extension contexts
    const isPackagedDesktop = 
      window.location.protocol === "file:" || 
      window.location.protocol.startsWith("tauri") || 
      window.location.protocol.startsWith("chrome") ||
      window.location.hostname === "";
    
    if (isPackagedDesktop) {
      // In Tauri or Electron, the local Express server typically runs locally on port 3000.
      // Use local storage to dynamically configure a custom server endpoint if desired (e.g. cloud backends).
      const customEndpoint = localStorage.getItem("DESKTOP_API_ENDPOINT");
      return `${customEndpoint || "http://localhost:3000"}${path}`;
    }
  }
  return path;
};

const INITIAL_STATS: PetStats = {
  type: "Hermes",
  name: "Hermes",
  level: 1,
  xp: 15,
  hunger: 65,
  mood: 75,
  energy: 80,
  coins: 45,
  activeTaskId: null,
  status: "idle"
};

export default function App() {
  // Load initial states from localStorage if available
  const [petStats, setPetStats] = useState<PetStats>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hermes_pet_stats_v2");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { return INITIAL_STATS; }
      }
    }
    return INITIAL_STATS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hermes_pet_tasks_v2");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { return []; }
      }
    }
    return [];
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hermes_pet_chat_v2");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { return []; }
      }
    }
    return [];
  });

  const [currentEngine, setCurrentEngine] = useState("Gemini 3.5");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [activeApp, setActiveApp] = useState<"terminal" | "planner" | "shop" | "settings" | null>("terminal");
  const [latestSpeech, setLatestSpeech] = useState<string | null>("*摇了摇毛茸茸的尾巴* 嗨！欢迎回到我的桌面世界！点击左侧的 [待办规划] 按钮，我们可以一起完成今天的工作哦！");
  const [localTime, setLocalTime] = useState("");
  const [localDate, setLocalDate] = useState("");
  const [showLevelUpAlert, setShowLevelUpAlert] = useState(false);
  const [editingName, setEditingName] = useState(petStats.name);
  const [audioMuted, setAudioMuted] = useState(() => getMutedStatus());
  const [aiModelSettings, setAiModelSettings] = useState<AiModelSettings>(() => {
    try {
      const stored = localStorage.getItem("hermes_pet_model_settings");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to parse stored ai model settings:", e);
    }
    return {
      provider: "default",
      baseUrl: "",
      modelName: "",
      apiKey: ""
    };
  });

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem("hermes_pet_model_settings", JSON.stringify(aiModelSettings));
  }, [aiModelSettings]);

  useEffect(() => {
    localStorage.setItem("hermes_pet_stats_v2", JSON.stringify(petStats));
  }, [petStats]);

  useEffect(() => {
    localStorage.setItem("hermes_pet_tasks_v2", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("hermes_pet_chat_v2", JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Simulate Clock in taskbar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLocalTime(now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
      setLocalDate(now.toLocaleDateString("zh-CN", { month: "short", day: "numeric", weekday: "short" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Stats decay and focus ticking interval
  useEffect(() => {
    const interval = setInterval(() => {
      setPetStats((prev) => {
        let newStatus = prev.status;
        let newXp = prev.xp;
        let newLevel = prev.level;
        let newEnergy = prev.energy;
        let newHunger = Math.max(0, prev.hunger - 1); // Slowly gets hungry
        let newMood = prev.mood;

        // Decaying stats triggers emotional notifications
        if (newHunger < 20 && Math.random() < 0.1) {
          setLatestSpeech(`*肚子咕噜叫* 好饿啊，可以去商店给我买点 Cyber 能量补给吗？`);
          newStatus = "idle";
          // Trigger cyber warning audio cue
          playAlertWarningSound();
        }

        // Handle Active Task Focused Sprint
        if (prev.activeTaskId) {
          newStatus = "working";
          newEnergy = Math.max(0, prev.energy - 1);
          newXp += 2; // Gains steady XP while working

          // Energy runs dry
          if (newEnergy <= 0) {
            newStatus = "sleeping";
            setLatestSpeech(`*趴倒* 能量耗尽啦，呼呼... 自动进入省电待机状态... Zzz`);
            return {
              ...prev,
              activeTaskId: null,
              status: "sleeping",
              energy: 0,
              hunger: newHunger
            };
          }

          // Random positive workspace feedback
          if (Math.random() < 0.15) {
            const lines = [
              "键盘声啪嗒啪嗒，就像一首美妙的乐曲！",
              "我正在帮您监测后台运行！加油，我们一定能干完！",
              "今天的专注度已经拉满啦！给你送上一朵小红花 🌸",
              "在 Windows 客户端，我可以挂在你的任务栏上方贴贴哦！"
            ];
            setLatestSpeech(`*认真敲打代码* ${lines[Math.floor(Math.random() * lines.length)]}`);
          }
        } else if (prev.status === "working") {
          newStatus = "idle";
        }

        // Sleeping state regenerates energy
        if (prev.status === "sleeping") {
          newEnergy = Math.min(100, prev.energy + 5);
          if (newEnergy >= 100) {
            newStatus = "idle";
            setLatestSpeech(`*抖抖耳朵* 叮！电量充满 100%！满血复活啦！`);
          }
        }

        // Check level up
        if (newXp >= newLevel * 120) {
          newXp = newXp - (newLevel * 120);
          newLevel += 1;
          setShowLevelUpAlert(true);
          setLatestSpeech(`*全身冒金光* 哇！我升级成 Lvl.${newLevel} 啦！工作潜能得到了极大的开发！`);
          playLevelUpSound();
        }

        return {
          ...prev,
          status: newStatus,
          energy: newEnergy,
          hunger: newHunger,
          xp: newXp,
          level: newLevel
        };
      });
    }, 10000); // Trigger check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // API Call: Sending Chat Message
  const handleSendMessage = async (text: string) => {
    if (isAiThinking) return;

    // Append user message immediately
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      engine: currentEngine
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setIsAiThinking(true);
    setPetStats((prev) => ({ ...prev, status: "thinking" }));

    try {
      const contextHistory = chatHistory.slice(-10).map(c => ({
        role: c.role,
        text: c.text
      }));

      const res = await fetch(getApiUrl("/api/pet/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: contextHistory,
          petType: petStats.type,
          petName: petStats.name,
          engine: currentEngine,
          activeTask: tasks.find(t => t.id === petStats.activeTaskId)?.title || null,
          mood: petStats.mood > 70 ? "Happy" : petStats.mood < 30 ? "Sad/Tired" : "Normal",
          aiModelSettings: aiModelSettings
        })
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        const petMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
          engine: currentEngine
        };
        setChatHistory((prev) => [...prev, petMsg]);
        setLatestSpeech(data.reply);

        setPetStats((prev) => ({
          ...prev,
          coins: prev.coins + 5, // Chat earns cute cyber coins
          mood: Math.min(100, prev.mood + 10), // Joyful interaction
          status: "idle"
        }));
      } else {
        throw new Error(data.error || "Response failed");
      }
    } catch (err: any) {
      console.error(err);
      setLatestSpeech("(*有点晕乎乎* 网络脑电波不顺畅... 你可以在 Secrets 面板中设置您的 GEMINI_API_KEY 后，我会变得更加聪明哦！)");
      setPetStats((prev) => ({ ...prev, status: "idle" }));
    } finally {
      setIsAiThinking(false);
    }
  };

  // API Call: Plan Tasks with AI
  const handleGenerateTasksAI = async (goal: string) => {
    if (isGeneratingTasks) return;
    setIsGeneratingTasks(true);
    setLatestSpeech(`*翻出大本子* 收到核心指令！我这就用 ${currentEngine} 大脑将目标「${goal}」拆解为专属的工作任务链...`);

    try {
      const res = await fetch(getApiUrl("/api/pet/plan-tasks"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, petType: petStats.type, aiModelSettings: aiModelSettings })
      });

      const data = await res.json();
      if (res.ok && data.tasks && Array.isArray(data.tasks)) {
        const newTasks: Task[] = data.tasks.map((t: any) => ({
          id: Math.random().toString(),
          title: t.title,
          estimatedMinutes: t.estimatedMinutes || 15,
          type: t.type || "code",
          completed: false
        }));

        setTasks((prev) => [...prev, ...newTasks]);
        setLatestSpeech(`*一键分派* 报告主人！工作流计划制订完毕，已分派了 ${newTasks.length} 个协同任务到规划本，让我们开始突击吧！`);
      } else {
        throw new Error("Task list mapping failed");
      }
    } catch (err) {
      console.error(err);
      setLatestSpeech("(*叹气* 拆解思路被防火墙打断了，没关系，您可以点击下方手动添加任务哦)");
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  // Manual Custom Task Add
  const handleAddCustomTask = (title: string, minutes: number, type: Task["type"]) => {
    const newTask: Task = {
      id: Math.random().toString(),
      title,
      estimatedMinutes: minutes,
      type,
      completed: false
    };
    setTasks((prev) => [...prev, newTask]);
    setLatestSpeech(`*记到黑板上* 新增任务「${title}」！开干！`);
  };

  // Toggle Task Completed
  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const targetState = !t.completed;
          if (targetState) {
            setPetStats((prevStats) => ({
              ...prevStats,
              coins: prevStats.coins + 20, 
              xp: prevStats.xp + 45,       
              mood: Math.min(100, prevStats.mood + 15),
              activeTaskId: prevStats.activeTaskId === id ? null : prevStats.activeTaskId
            }));
            setLatestSpeech(`*蹦蹦跳跳* 太帅了！我们成功达成了专注任务：「${t.title}」！+20 金币 & +45 XP！`);
          }
          return { ...t, completed: targetState };
        }
        return t;
      })
    );
  };

  // Delete task
  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (petStats.activeTaskId === id) {
      setPetStats((prev) => ({ ...prev, activeTaskId: null, status: "idle" }));
    }
  };

  // Focus Task Selector
  const handleSetWorkingTask = (id: string | null) => {
    if (id) {
      const task = tasks.find(t => t.id === id);
      if (task) {
        setPetStats((prev) => ({ ...prev, activeTaskId: id, status: "working" }));
        setLatestSpeech(`*推了推眼镜* 专注专注！我要开始陪你攻克「${task.title}」啦！手速飞起！`);
      }
    } else {
      setPetStats((prev) => ({ ...prev, activeTaskId: null, status: "idle" }));
      setLatestSpeech("*擦汗* 协同任务圆满结束，先起来活动活动关节吧！");
    }
  };

  // Purchase food and feed
  const handlePurchaseAndFeed = (food: FoodItem) => {
    if (petStats.coins < food.cost) return;

    // Play bite/feed sound
    playFeedSound();

    setPetStats((prev) => ({
      ...prev,
      coins: prev.coins - food.cost,
      hunger: Math.min(100, prev.hunger + food.hungerRestore),
      mood: Math.min(100, prev.mood + food.moodRestore),
      energy: Math.min(100, prev.energy + food.energyRestore),
      status: "eating"
    }));

    setLatestSpeech(`*嗷呜嗷呜* 超好吃！多谢主人的投喂 ${food.emoji} ${food.name}！体力与心情双重拉满！`);

    setTimeout(() => {
      setPetStats((prev) => ({
        ...prev,
        status: prev.status === "eating" ? "idle" : prev.status
      }));
    }, 4000);
  };

  // Pet click action
  const handlePetClicked = () => {
    const responses = [
      "*舒服地伸了个懒腰* 嘻嘻，跟主人贴贴，好感度蹭蹭暴涨！",
      "*揉了揉小脸* 忙累了吗？喝杯水休息一会，我在这里守着你！",
      "听说安装 Windows 客户端可以解锁完美的桌面穿透和置顶浮空哦！快去左边看看！",
      "*摇尾巴* 我的 level 越高，我就能在你专注时帮你产出更多的 Cyber 币哦！",
      "*眨眨眼* 今天也要努力让工作不枯燥！"
    ];
    setLatestSpeech(responses[Math.floor(Math.random() * responses.length)]);
    setPetStats((prev) => ({ ...prev, mood: Math.min(100, prev.mood + 5) }));
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setPetStats((prev) => ({ ...prev, name: editingName }));
    setLatestSpeech(`*兴奋地宣布* 从现在起，我的专属名字就是「${editingName}」啦！好听！`);
    setActiveApp(null);
  };

  // Switch species
  const handleSwitchPetSpecies = (species: typeof petStats.type) => {
    setPetStats((prev) => ({ ...prev, type: species }));
    const profile = PET_PROFILES[species];
    setLatestSpeech(`*一阵数码烟雾* 哇哦！成功变身为新形态「${profile.name}」(${profile.species})！${profile.phrase}`);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#FAFAFF] flex flex-col font-sans select-none text-slate-800">
      
      {/* Dynamic Island Notch styled under the Vibrant Palette theme */}
      <DynamicIsland 
        petStats={petStats} 
        currentEngine={currentEngine} 
        isAiThinking={isAiThinking} 
      />

      {/* VIBRANT PALETTE - APP HEADER */}
      <header className="h-16 px-8 flex items-center justify-between bg-white border-b-2 border-indigo-100 shadow-sm z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <svg className="w-6 h-6 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black text-indigo-900 tracking-tight flex items-center gap-1.5">
              HermesPet AI <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">Companion</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono -mt-1">Swift 6 & TS Powered Multi-Engine Simulator</span>
          </div>
        </div>

        {/* Vital stats quick overview */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50/80 rounded-full border border-indigo-100/60 shadow-sm">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-indigo-800">
              {petStats.name} (Lvl.{petStats.level})形态: {PET_PROFILES[petStats.type].species}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-400/10 text-yellow-800 rounded-full border border-yellow-200 text-xs font-bold">
            <Coins className="w-3.5 h-3.5 text-yellow-600 fill-yellow-500" />
            <span>{petStats.coins} Cyber币</span>
          </div>

          {/* Sound Mute/Unmute Toggle */}
          <button
            onClick={() => {
              const muted = toggleMute();
              setAudioMuted(muted);
            }}
            className={`flex items-center justify-center p-2 rounded-full border-2 transition-all hover:scale-105 active:scale-95 ${
              audioMuted 
                ? "bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100" 
                : "bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100"
            }`}
            title={audioMuted ? "点击取消静音" : "点击静音"}
          >
            {audioMuted ? (
              <VolumeX className="w-4 h-4 stroke-[2.2]" />
            ) : (
              <Volume2 className="w-4 h-4 stroke-[2.2]" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Sandbox (Desktop Simulator Grid) */}
      <div className="flex-1 relative w-full h-full flex p-6 overflow-hidden min-h-0">
        
        {/* DESKTOP APP SHORTCUTS (Styled with Vibrant Palette Buttons) */}
        <div className="flex flex-col gap-4 z-20 pointer-events-auto shrink-0 justify-center">
          
          <button
            onClick={() => setActiveApp("terminal")}
            className="flex flex-col items-center gap-1 w-24 group text-center cursor-pointer select-none"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95 ${
              activeApp === "terminal" 
                ? "bg-indigo-600 text-white shadow-indigo-300 shadow-xl scale-105 border-2 border-white" 
                : "bg-white border-2 border-slate-100 text-indigo-500 hover:border-indigo-200"
            }`}>
              <TermIcon className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-extrabold tracking-wide text-slate-600 group-hover:text-indigo-900">
              AI 聊天
            </span>
          </button>

          <button
            onClick={() => setActiveApp("planner")}
            className="flex flex-col items-center gap-1 w-24 group text-center cursor-pointer select-none"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95 ${
              activeApp === "planner" 
                ? "bg-indigo-600 text-white shadow-indigo-300 shadow-xl scale-105 border-2 border-white" 
                : "bg-white border-2 border-slate-100 text-indigo-500 hover:border-indigo-200"
            }`}>
              <Briefcase className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-extrabold tracking-wide text-slate-600 group-hover:text-indigo-900">
              待办规划
            </span>
          </button>

          <button
            onClick={() => setActiveApp("shop")}
            className="flex flex-col items-center gap-1 w-24 group text-center cursor-pointer select-none"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95 ${
              activeApp === "shop" 
                ? "bg-indigo-600 text-white shadow-indigo-300 shadow-xl scale-105 border-2 border-white" 
                : "bg-white border-2 border-slate-100 text-indigo-500 hover:border-indigo-200"
            }`}>
              <ShoppingBag className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-extrabold tracking-wide text-slate-600 group-hover:text-indigo-900">
              数码商店
            </span>
          </button>

          <button
            onClick={() => setActiveApp("settings")}
            className="flex flex-col items-center gap-1 w-24 group text-center cursor-pointer select-none"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95 ${
              activeApp === "settings" 
                ? "bg-indigo-600 text-white shadow-indigo-300 shadow-xl scale-105 border-2 border-white" 
                : "bg-white border-2 border-slate-100 text-indigo-500 hover:border-indigo-200"
            }`}>
              <Settings className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-extrabold tracking-wide text-slate-600 group-hover:text-indigo-900">
              属性变身
            </span>
          </button>
        </div>

        {/* FLOATING DIALOGS & PANELS (Nested in a gorgeous white border-4 container) */}
        <div className="flex-1 ml-6 relative flex items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            {activeApp ? (
              <motion.div
                key="active-app-window"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-4xl lg:max-w-5xl h-[calc(100vh-160px)] max-h-[720px] md:max-h-[780px] lg:max-h-[850px] min-h-[480px] pointer-events-auto shadow-2xl"
              >
                {activeApp === "terminal" && (
                  <PetTerminal
                    petStats={petStats}
                    currentEngine={currentEngine}
                    onChangeEngine={setCurrentEngine}
                    chatHistory={chatHistory}
                    onSendMessage={handleSendMessage}
                    onClearHistory={() => setChatHistory([])}
                    isThinking={isAiThinking}
                    onClose={() => setActiveApp(null)}
                  />
                )}

                {activeApp === "planner" && (
                  <TaskPlanner
                    petStats={petStats}
                    tasks={tasks}
                    onAddTask={handleAddCustomTask}
                    onToggleTask={handleToggleTask}
                    onDeleteTask={handleDeleteTask}
                    onSetWorkingTask={handleSetWorkingTask}
                    onGenerateTasksAI={handleGenerateTasksAI}
                    isGeneratingAI={isGeneratingTasks}
                    onClose={() => setActiveApp(null)}
                  />
                )}

                {activeApp === "shop" && (
                  <PetShop
                    petStats={petStats}
                    onPurchaseAndFeed={handlePurchaseAndFeed}
                    onClose={() => setActiveApp(null)}
                  />
                )}

                {activeApp === "settings" && (
                  <div className="flex flex-col h-full bg-white border-2 border-indigo-100 rounded-3xl overflow-hidden shadow-xl p-6 font-mono text-xs text-slate-700">
                    <div className="flex justify-between items-center border-b-2 border-indigo-50 pb-3 mb-4 select-none">
                      <span className="text-sm font-black text-indigo-950 flex items-center gap-1.5">
                        <Settings className="w-4 h-4 text-indigo-500 animate-spin" style={{ animationDuration: "10s" }} />
                        <span>属性与形态换形空间</span>
                      </span>
                      <button 
                        onClick={() => setActiveApp(null)} 
                        className="text-indigo-500 hover:text-indigo-700 font-bold bg-indigo-50 hover:bg-indigo-100 py-1 px-2.5 rounded-lg transition-colors"
                      >
                        [ 收起 ]
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-1">
                      {/* Left Block: Rename Form */}
                      <form onSubmit={handleSaveSettings} className="space-y-4 bg-indigo-50/30 p-4 rounded-2xl border-2 border-indigo-100/40">
                        <span className="font-bold text-indigo-950 block border-b border-indigo-100 pb-1.5">📝 自定义宠物爱称</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            placeholder="写下你喜欢的名字..."
                            className="flex-1 bg-white border-2 border-indigo-100 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-400"
                          />
                          <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition-colors shadow-sm shadow-indigo-100">
                            保存
                          </button>
                        </div>
                        
                        <div className="space-y-2 pt-2 border-t border-indigo-100/50">
                          <span className="font-bold text-indigo-900 block">📊 宠物核心状态指标</span>
                          
                          <div className="space-y-2.5 text-slate-600 text-[11px] pt-1">
                            <div className="space-y-1">
                              <div className="flex justify-between font-semibold">
                                <span>成长等级 Lvl.{petStats.level}</span>
                                <span>{petStats.xp} / {petStats.level * 120} XP</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${(petStats.xp / (petStats.level * 120)) * 100}%` }}></div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between font-semibold">
                                <span>饱食度 (Satiety)</span>
                                <span>{petStats.hunger}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-300 ${petStats.hunger < 30 ? "bg-orange-400" : "bg-emerald-400"}`} style={{ width: `${petStats.hunger}%` }}></div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between font-semibold">
                                <span>能量水平 (Energy)</span>
                                <span>{petStats.energy}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-cyan-400 h-full rounded-full transition-all duration-300" style={{ width: `${petStats.energy}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </form>

                      {/* Right Block: Switch Species */}
                      <div className="space-y-4 bg-indigo-50/30 p-4 rounded-2xl border-2 border-indigo-100/40 flex flex-col justify-between">
                        <div>
                          <span className="font-bold text-indigo-950 block border-b border-indigo-100 pb-1.5">🦊 六大宠物家族形态</span>
                          <p className="text-[10px] text-slate-500 mt-1 mb-3">切换物种会即时重组其像素结构、核心词库、以及陪伴时的小情绪哦！</p>
                          
                          <div className="grid grid-cols-2 gap-2">
                            {(["Hermes", "Mochi", "Kuro", "Pippin", "Lulu", "Cookie"] as const).map((species) => {
                              const isCurrent = petStats.type === species;
                              const colors = {
                                Hermes: "hover:border-orange-300",
                                Mochi: "hover:border-pink-300",
                                Kuro: "hover:border-purple-300",
                                Pippin: "hover:border-yellow-300",
                                Lulu: "hover:border-rose-300",
                                Cookie: "hover:border-cyan-300"
                              }[species];

                              return (
                                <button
                                  key={species}
                                  type="button"
                                  onClick={() => handleSwitchPetSpecies(species)}
                                  className={`p-2 rounded-xl border-2 transition-all text-left ${
                                    isCurrent 
                                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100" 
                                      : `bg-white border-slate-100 text-slate-700 ${colors}`
                                  }`}
                                >
                                  <span className="block text-xs font-bold">{species}</span>
                                  <span className={`text-[9px] block leading-tight mt-0.5 ${isCurrent ? "text-indigo-100" : "text-slate-400"}`}>
                                    {species === "Hermes" && "Cyber 机械狐"}
                                    {species === "Mochi" && "粉糯粉史莱姆"}
                                    {species === "Kuro" && "极夜深渊猫咪"}
                                    {species === "Pippin" && "发条机械鸟"}
                                    {species === "Lulu" && "时空长耳兔"}
                                    {species === "Cookie" && "霓虹守护柴犬"}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="p-3 bg-white border border-indigo-100/80 rounded-xl text-[10px] text-slate-500 leading-normal flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <span>宠物处于【专注】状态时无法变身，需要先在待办规划本中结束协同专注。</span>
                        </div>
                      </div>

                      {/* Right-most Block: AI Model Connection settings */}
                      <div className="space-y-4 bg-indigo-50/30 p-4 rounded-2xl border-2 border-indigo-100/40 flex flex-col justify-between">
                        <div>
                          <span className="font-bold text-indigo-950 block border-b border-indigo-100 pb-1.5">🧠 AI 脑电波接口设置</span>
                          <p className="text-[10px] text-slate-500 mt-1 mb-3">您可以自主对接第三方 AI 接口，支持 OpenAI/DeepSeek 等各类大模型通道！</p>
                          
                          <div className="space-y-2.5 text-slate-700 text-[11px]">
                            <div className="space-y-1">
                              <span className="font-bold text-indigo-900 block">服务商选择</span>
                              <select
                                value={aiModelSettings.provider}
                                onChange={(e) => setAiModelSettings(prev => ({ ...prev, provider: e.target.value as any }))}
                                className="w-full bg-white border-2 border-indigo-100 rounded-xl px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-400"
                              >
                                <option value="default">内置高级大脑 (Gemini 3.5)</option>
                                <option value="openai">OpenAI / DeepSeek (兼容接口)</option>
                                <option value="anthropic">Anthropic (Claude 官方)</option>
                                <option value="gemini">Gemini (自定义密钥)</option>
                              </select>
                            </div>

                            {aiModelSettings.provider !== "default" && (
                              <>
                                {aiModelSettings.provider !== "gemini" && (
                                  <div className="space-y-1 animate-fade-in">
                                    <span className="font-bold text-indigo-900 block">Base URL (接口地址)</span>
                                    <input
                                      type="text"
                                      value={aiModelSettings.baseUrl}
                                      onChange={(e) => setAiModelSettings(prev => ({ ...prev, baseUrl: e.target.value }))}
                                      placeholder={aiModelSettings.provider === "openai" ? "https://api.openai.com/v1" : "https://api.anthropic.com/v1"}
                                      className="w-full bg-white border-2 border-indigo-100 rounded-xl px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-400"
                                    />
                                  </div>
                                )}

                                <div className="space-y-1">
                                  <span className="font-bold text-indigo-900 block">模型名称 (Model Name)</span>
                                  <input
                                    type="text"
                                    value={aiModelSettings.modelName}
                                    onChange={(e) => setAiModelSettings(prev => ({ ...prev, modelName: e.target.value }))}
                                    placeholder={
                                      aiModelSettings.provider === "openai" 
                                        ? "gpt-4o-mini 或 deepseek-chat" 
                                        : aiModelSettings.provider === "anthropic"
                                        ? "claude-3-5-sonnet-latest"
                                        : "gemini-3.5-flash"
                                    }
                                    className="w-full bg-white border-2 border-indigo-100 rounded-xl px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-400"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <span className="font-bold text-indigo-900 block">API Key (密钥)</span>
                                  <input
                                    type="password"
                                    value={aiModelSettings.apiKey}
                                    onChange={(e) => setAiModelSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                                    placeholder="sk-..."
                                    className="w-full bg-white border-2 border-indigo-100 rounded-xl px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-400"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-indigo-100/50 flex justify-between items-center text-[10px]">
                          <span className={aiModelSettings.provider === "default" ? "text-emerald-600 font-bold" : "text-indigo-600 font-bold"}>
                            {aiModelSettings.provider === "default" ? "🟢 内置大脑在线" : "⚡ 自定义大脑就绪"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              localStorage.setItem("hermes_pet_model_settings", JSON.stringify(aiModelSettings));
                              setLatestSpeech("*高兴得跳起来* 嘀—— 新的 AI 大脑脑电波接入成功！我感觉浑身充满了智慧！");
                            }}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-3 py-1 rounded-lg transition-colors"
                          >
                            保存大脑配置
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="desktop-stage"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3 }}
                className="w-full h-[calc(100vh-160px)] max-h-[720px] md:max-h-[780px] lg:max-h-[850px] min-h-[480px] pointer-events-auto"
              >
                <DesktopStage
                  petStats={petStats}
                  setPetStats={setPetStats}
                  tasks={tasks}
                  onToggleTask={handleToggleTask}
                  onAddTask={handleAddCustomTask}
                  latestSpeech={latestSpeech}
                  setLatestSpeech={setLatestSpeech}
                  onSwitchSpecies={handleSwitchPetSpecies}
                  onOpenApp={(app) => setActiveApp(app)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* THE FLOATING VIRTUAL CHARACTER CONTAINER */}
        <FloatingPet
          petStats={petStats}
          onPetClicked={handlePetClicked}
          latestSpeech={latestSpeech}
          setLatestSpeech={setLatestSpeech}
          setPetStats={setPetStats}
          onSendMessage={handleSendMessage}
          isAiThinking={isAiThinking}
          activeApp={activeApp}
        />

      </div>

      {/* LEVEL UP POPUP GLOW ALERT */}
      <AnimatePresence>
        {showLevelUpAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center z-50 bg-indigo-950/40 backdrop-blur-sm pointer-events-auto animate-fade-in"
          >
            <div className="bg-white border-4 border-indigo-100 p-8 rounded-3xl w-80 text-center space-y-4 shadow-2xl font-mono">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center text-3xl shadow-lg shadow-yellow-200 animate-bounce">
                  ✨
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Level Up!</span>
                <p className="text-base font-black text-slate-800 pt-1">形态进阶成功！</p>
                <p className="text-xs text-slate-500">我的智能核心已升级为 <span className="font-bold text-indigo-600">Lvl.{petStats.level}</span>！</p>
              </div>
              <button
                onClick={() => setShowLevelUpAlert(false)}
                className="w-full bg-[#FF6B6B] hover:bg-rose-500 text-white font-extrabold py-2.5 rounded-2xl text-xs transition-colors shadow-lg shadow-rose-200"
              >
                好的，继续冲鸭！
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WINDOWS TASKBAR - FLUENT FOOTER (Vibrant palette style: White with slate and RAM logs) */}
      <footer className="h-12 bg-white px-8 flex items-center justify-between text-slate-400 text-xs border-t border-slate-100 z-30 select-none">
        
        {/* Left side: Windows active icon, telemetry limits */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span>
            <span className="text-indigo-900 font-extrabold text-xs">HermesPet Windows Shell</span>
          </div>
          
          <span className="text-slate-200">|</span>

          <div className="flex items-center gap-1 font-semibold text-indigo-500">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"></span>
            <span>1.2MB Idle RAM Usage</span>
          </div>
        </div>

        {/* Center shortcuts */}
        <div className="flex gap-4">
          <button
            onClick={() => setActiveApp(activeApp === "terminal" ? null : "terminal")}
            className="text-slate-400 hover:text-indigo-600 font-bold transition-colors"
            title="AI Chat terminal"
          >
            Terminal
          </button>
          <button
            onClick={() => setActiveApp(activeApp === "planner" ? null : "planner")}
            className="text-slate-400 hover:text-indigo-600 font-bold transition-colors"
            title="Focus Planner"
          >
            Planner ({tasks.filter(t => !t.completed).length})
          </button>
          <button
            onClick={() => setActiveApp(activeApp === "shop" ? null : "shop")}
            className="text-slate-400 hover:text-indigo-600 font-bold transition-colors"
            title="Pet store"
          >
            Shop
          </button>
        </div>

        {/* Right taskbar: current date/time */}
        <div className="flex items-center gap-4 font-mono text-slate-500">
          <span>{currentEngine} active</span>
          <span className="text-slate-200">|</span>
          <div className="text-[11px] font-bold text-slate-700">
            {localTime}
          </div>
        </div>

      </footer>

    </div>
  );
}
