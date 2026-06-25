import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cpu, HardDrive, CpuIcon, Activity, Sparkles, AlertCircle } from "lucide-react";
import { PetStats } from "../types";

interface DynamicIslandProps {
  petStats: PetStats;
  currentEngine: string;
  isAiThinking: boolean;
}

export default function DynamicIsland({ petStats, currentEngine, isAiThinking }: DynamicIslandProps) {
  const [cpuLoad, setCpuLoad] = useState(12);
  const [memLoad, setMemLoad] = useState(48);
  const [expanded, setExpanded] = useState(false);

  // Simulate floating system loads
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuLoad((prev) => {
        const delta = Math.floor(Math.random() * 9) - 4;
        const target = petStats.status === "working" ? 45 : 12;
        const next = prev + delta;
        return Math.max(5, Math.min(85, Math.round(next * 0.8 + target * 0.2)));
      });

      setMemLoad((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1;
        const target = petStats.status === "working" ? 64 : 48;
        const next = prev + delta;
        return Math.max(30, Math.min(90, Math.round(next * 0.9 + target * 0.1)));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [petStats.status]);

  const getStatusText = () => {
    if (isAiThinking) return `${currentEngine} 正在思考中...`;
    switch (petStats.status) {
      case "working":
        return `正在协作: ${petStats.activeTaskId ? "核心模块运行中" : "撰写任务代码..."}`;
      case "sleeping":
        return "深度睡眠中 (Zzz...)";
      case "eating":
        return "美味补给咀嚼中 (*^▽^*)";
      case "thinking":
        return `${currentEngine} 核心连接就绪`;
      default:
        return `${petStats.name} 守护进程安全运行中`;
    }
  };

  const getStatusColor = () => {
    if (isAiThinking) return "text-cyan-300";
    if (petStats.status === "working") return "text-[#FFE66D]";
    if (petStats.status === "sleeping") return "text-indigo-300";
    return "text-emerald-300";
  };

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <motion.div
        layout
        onClick={() => setExpanded(!expanded)}
        className="bg-indigo-950/95 hover:bg-indigo-900 border-2 border-indigo-800 rounded-full py-1.5 px-4 flex items-center gap-3 cursor-pointer shadow-xl select-none min-w-[290px] max-w-[500px] text-white"
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
      >
        {/* Status Indicator Icon */}
        <motion.div layout className="relative flex items-center justify-center">
          {isAiThinking ? (
            <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
          ) : petStats.status === "working" ? (
            <Activity className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: "3s" }} />
          ) : (
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${petStats.status === "sleeping" ? "bg-indigo-300" : "bg-emerald-300"}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${petStats.status === "sleeping" ? "bg-indigo-400" : "bg-emerald-400"}`}></span>
            </span>
          )}
        </motion.div>

        {/* Status Text Block */}
        <motion.div layout className="flex-1 flex flex-col items-start overflow-hidden">
          <span className="text-[9px] text-indigo-300 uppercase tracking-widest font-mono">Dynamic Island</span>
          <span className={`text-xs font-mono truncate max-w-[210px] font-bold transition-colors ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </motion.div>

        {/* Quick System Stats */}
        <motion.div layout className="flex items-center gap-2 text-[10px] font-mono text-indigo-200">
          <div className="hidden sm:flex items-center gap-1 bg-indigo-900/50 px-2 py-0.5 rounded-full border border-indigo-800">
            <Cpu className="w-3 h-3 text-indigo-300" />
            <span className={cpuLoad > 60 ? "text-amber-300 font-bold" : "text-indigo-200"}>{cpuLoad}%</span>
          </div>
          <div className="flex items-center gap-1 font-bold">
            <span className="text-indigo-700">|</span>
            <span className="text-yellow-300">{petStats.name} Lvl.{petStats.level}</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Expanded System View */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-80 bg-indigo-950 border-2 border-indigo-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md text-indigo-200 font-mono text-xs z-50 pointer-events-auto"
          >
            <div className="flex justify-between items-center mb-4 border-b border-indigo-800 pb-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <CpuIcon className="w-4 h-4 text-yellow-300" />
                系统及宠物物理负载
              </span>
              <span className="text-[9px] bg-indigo-800 text-yellow-300 px-2 py-0.5 rounded-full font-bold uppercase border border-indigo-700">
                {currentEngine}
              </span>
            </div>

            <div className="space-y-4">
              {/* CPU Load bar */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-indigo-300">宠物核心运行频率</span>
                  <span className="font-bold text-white">{cpuLoad}%</span>
                </div>
                <div className="w-full bg-indigo-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-yellow-300 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${cpuLoad}%` }}
                  ></div>
                </div>
              </div>

              {/* Memory load bar */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-indigo-300">母星神经网络同步率</span>
                  <span className="font-bold text-white">{memLoad}%</span>
                </div>
                <div className="w-full bg-indigo-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-300 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${memLoad}%` }}
                  ></div>
                </div>
              </div>

              {/* Status details */}
              <div className="bg-indigo-900/40 p-3 rounded-2xl border-2 border-indigo-850 space-y-2 text-[11px] text-indigo-100">
                <div className="flex justify-between">
                  <span className="text-indigo-300">伴生宠当前状态:</span>
                  <span className="text-yellow-300 font-bold capitalize">{petStats.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-300">精力专注储备:</span>
                  <span className={`font-bold ${petStats.energy < 25 ? "text-rose-400 animate-pulse" : "text-white"}`}>
                    {petStats.energy} / 100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-300">肠胃饱腹程度:</span>
                  <span className={`font-bold ${petStats.hunger < 25 ? "text-amber-400" : "text-white"}`}>
                    {petStats.hunger} / 100
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-indigo-400 text-center pt-1.5 flex items-center justify-center gap-1.5 border-t border-indigo-900">
                <AlertCircle className="w-3.5 h-3.5" />
                点击任意位置可收起状态监视器
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
