import React, { useState } from "react";
import { 
  Play, CheckSquare, Square, Trophy, Plus, Sparkles, Loader2, 
  Trash2, Timer, CheckCircle2, ChevronRight, Briefcase 
} from "lucide-react";
import { Task, PetStats } from "../types";
import { DEMO_GOALS } from "../data";

interface TaskPlannerProps {
  petStats: PetStats;
  tasks: Task[];
  onAddTask: (title: string, minutes: number, type: Task["type"]) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onSetWorkingTask: (id: string | null) => void;
  onGenerateTasksAI: (goal: string) => Promise<void>;
  isGeneratingAI: boolean;
  onClose: () => void;
}

export default function TaskPlanner({
  petStats,
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onSetWorkingTask,
  onGenerateTasksAI,
  isGeneratingAI,
  onClose
}: TaskPlannerProps) {
  const [goalInput, setGoalInput] = useState("");
  const [customTaskTitle, setCustomTaskTitle] = useState("");
  const [customMinutes, setCustomMinutes] = useState(15);
  const [customType, setCustomType] = useState<Task["type"]>("code");

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim() || isGeneratingAI) return;
    await onGenerateTasksAI(goalInput);
    setGoalInput("");
  };

  const handleCustomAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTaskTitle.trim()) return;
    onAddTask(customTaskTitle, customMinutes, customType);
    setCustomTaskTitle("");
    setCustomMinutes(15);
  };

  const getTaskColorClass = (type: Task["type"]) => {
    switch (type) {
      case "code": return "bg-indigo-500 text-white border-transparent";
      case "design": return "bg-[#FF6B6B] text-white border-transparent";
      case "break": return "bg-[#4ECDC4] text-white border-transparent";
      case "review": return "bg-[#FFE66D] text-indigo-950 border-transparent";
      default: return "bg-slate-200 text-slate-700 border-transparent";
    }
  };

  const activeWorkingTask = tasks.find(t => t.id === petStats.activeTaskId);

  return (
    <div className="flex flex-col h-full bg-white border-2 border-indigo-100 rounded-3xl overflow-hidden shadow-xl text-slate-800">
      {/* Title Bar */}
      <div className="flex justify-between items-center bg-indigo-50/80 border-b-2 border-indigo-100/60 px-5 py-3 select-none">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span className="font-sans text-xs font-black tracking-wide text-indigo-950">
            协作待办与 AI 目标切分器
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-bold text-indigo-500 hover:text-indigo-700 bg-indigo-100/50 hover:bg-indigo-100 py-1 px-2.5 rounded-lg transition-colors"
        >
          收起
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-indigo-100">
        
        {/* Active Sprint Section */}
        {activeWorkingTask && (
          <div className="bg-[#FF6B6B]/10 border-2 border-[#FF6B6B]/20 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fade-in shadow-sm shadow-red-50">
            <div className="flex items-start gap-2.5">
              <Timer className="w-5 h-5 text-[#FF6B6B] shrink-0 mt-0.5 animate-spin" style={{ animationDuration: "12s" }} />
              <div>
                <div className="text-[10px] uppercase font-bold text-[#FF6B6B] tracking-wider">
                  正在与宠物进行协同专注专注 Sprint 中...
                </div>
                <div className="text-xs font-black text-slate-800 mt-0.5">
                  {activeWorkingTask.title} ({activeWorkingTask.estimatedMinutes} Mins)
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                  * 协同专注期间，宠物在桌面展现辛勤工作动画，每隔10秒将自动为宠物补充大量 XP 经验！
                </div>
              </div>
            </div>
            <button
              onClick={() => onSetWorkingTask(null)}
              className="bg-[#FF6B6B] hover:bg-rose-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap shadow-md shadow-rose-100"
            >
              结束专注
            </button>
          </div>
        )}

        {/* AI Auto-Planner Form (Beautiful Teal or Light Indigo Panel) */}
        <div className="bg-indigo-50/30 border-2 border-indigo-100/50 p-4 rounded-2xl space-y-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-black text-indigo-950">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>AI 自动目标智能切分链</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
            输入你的大方向目标（如：“做一个React组件的测试”、“复习高考历史”），宠物的大脑一键切分生成一系列支持可执行的任务。
          </p>
          <form onSubmit={handleAISubmit} className="flex gap-2 pt-1">
            <input
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="例如：准备下周的项目汇报演示文稿..."
              disabled={isGeneratingAI}
              className="flex-1 bg-white border-2 border-indigo-150 text-xs text-slate-800 px-3.5 py-2 rounded-xl focus:outline-none focus:border-indigo-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!goalInput.trim() || isGeneratingAI}
              className="bg-[#4ECDC4] hover:bg-teal-500 disabled:bg-slate-100 text-white disabled:text-slate-400 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-teal-100/60"
            >
              {isGeneratingAI ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>智能切分</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[9px] text-slate-400 py-0.5 font-bold">推荐预设目标:</span>
            {DEMO_GOALS.slice(0, 3).map((g) => (
              <button
                key={g}
                onClick={() => setGoalInput(g)}
                className="text-[9px] bg-white hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 text-slate-500 hover:text-indigo-600 rounded-lg px-2 py-0.5 transition-colors font-medium"
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Task List Header */}
        <div className="flex justify-between items-center text-xs text-slate-500 font-bold border-b-2 border-slate-50 pb-1.5">
          <span>待办清单库 ({tasks.length})</span>
          <span className="text-[9px] text-[#FF6B6B] bg-rose-50 px-2 py-0.5 rounded-full font-black border border-rose-100">
            完成任务获取 +20 Cyber币 & +45 XP
          </span>
        </div>

        {/* Task Items list */}
        <div className="space-y-2.5">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-slate-400 font-medium text-xs bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
              这里目前空空如也，可以直接在下方添加，或者试一下上面的 AI 规划哦！
            </div>
          ) : (
            tasks.map((task) => {
              const isWorking = petStats.activeTaskId === task.id;
              return (
                <div 
                  key={task.id} 
                  className={`flex items-center justify-between gap-3 p-3 rounded-2xl border-2 transition-all ${
                    task.completed 
                      ? "bg-emerald-50/20 border-emerald-100/50 opacity-70" 
                      : isWorking 
                        ? "bg-amber-50/60 border-amber-200 shadow-sm" 
                        : "bg-white border-slate-100 hover:border-indigo-100/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="text-slate-400 hover:text-indigo-500 transition-colors shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 stroke-[2.5]" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <span className={`text-xs block font-bold truncate ${task.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 mt-1 text-[9px] font-bold">
                        <span className={`px-1.5 py-0.5 rounded-lg text-[9px] font-bold capitalize ${getTaskColorClass(task.type)}`}>
                          {task.type}
                        </span>
                        <span className="text-slate-400 font-mono">{task.estimatedMinutes} Mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Start Working Sprint */}
                    {!task.completed && (
                      <button
                        onClick={() => onSetWorkingTask(isWorking ? null : task.id)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm ${
                          isWorking 
                            ? "bg-yellow-400 text-slate-900 hover:bg-yellow-500"
                            : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200"
                        }`}
                        title={isWorking ? "点击停止协助" : "让宠物协同专注"}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{isWorking ? "专注中" : "协同专注"}</span>
                      </button>
                    )}

                    {/* Delete Task */}
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Manual Custom Task Form */}
        <form onSubmit={handleCustomAdd} className="bg-indigo-50/20 border-2 border-indigo-100/30 p-4 rounded-2xl space-y-3.5">
          <div className="text-[11px] font-bold text-indigo-950">✍️ 快速手动录入单项工作</div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={customTaskTitle}
              onChange={(e) => setCustomTaskTitle(e.target.value)}
              placeholder="手动写入具体事务标题..."
              className="col-span-1 sm:col-span-2 bg-white border-2 border-indigo-100 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-400"
            />
            
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold">设定时长 ({customMinutes} 分钟)</label>
              <input
                type="number"
                min="5"
                max="180"
                step="5"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Number(e.target.value))}
                className="bg-white border-2 border-indigo-100 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-bold">任务门类分类</label>
              <select
                value={customType}
                onChange={(e) => setCustomType(e.target.value as Task["type"])}
                className="bg-white border-2 border-indigo-100 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="code">Code (编程协作)</option>
                <option value="design">Design (设计创作)</option>
                <option value="review">Review (复盘复习)</option>
                <option value="break">Break (喝水休息)</option>
                <option value="admin">Admin (日常事务)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={!customTaskTitle.trim()}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white font-extrabold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            <span>加入待办清单列表</span>
          </button>
        </form>
      </div>
    </div>
  );
}
