import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Send, Sparkles, AlertCircle, RefreshCw, Volume2, VolumeX, Brain, 
  Terminal as TermIcon, ChevronRight, Minimize2, Trash2 
} from "lucide-react";
import { ChatMessage, PetStats } from "../types";

interface PetTerminalProps {
  petStats: PetStats;
  currentEngine: string;
  onChangeEngine: (engine: string) => void;
  chatHistory: ChatMessage[];
  onSendMessage: (msg: string) => Promise<void>;
  onClearHistory: () => void;
  isThinking: boolean;
  onClose: () => void;
}

const ENGINES = [
  { id: "Gemini 3.5", name: "Gemini 3.5 Flash", desc: "高效且高智能的默认核心", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { id: "DeepSeek-R1", name: "DeepSeek-R1 (推理)", desc: "深度思考强化，含推理逻辑链", color: "text-[#FF6B6B] bg-red-50 border-red-200" },
  { id: "Claude 3.5", name: "Claude 3.5 Sonnet", desc: "温和极具同理心，擅长细节撰写", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { id: "GPT-4o", name: "GPT-4o (结构化)", desc: "逻辑框架紧凑，极富分析性", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "Llama 3 Local", name: "Llama 3 (本地端)", desc: "极客风范，硬核设备驱动口吻", color: "text-rose-600 bg-rose-50 border-rose-200" }
];

export default function PetTerminal({
  petStats,
  currentEngine,
  onChangeEngine,
  chatHistory,
  onSendMessage,
  onClearHistory,
  isThinking,
  onClose
}: PetTerminalProps) {
  const [inputText, setInputText] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const [speakProgress, setSpeakProgress] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat history
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isThinking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isThinking) return;
    const text = inputText;
    setInputText("");
    await onSendMessage(text);
  };

  // Web speech synthesis for TTS
  const handleSpeak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("您的浏览器不支持语音播报");
      return;
    }

    // Stop ongoing speech
    window.speechSynthesis.cancel();

    // Clean text: strip <think>...</think> tags and asterisks *actions*
    let cleanedText = text.replace(/<think>[\s\S]*?<\/think>/g, ""); // strip think blocks
    cleanedText = cleanedText.replace(/\*[\s\S]*?\*/g, ""); // strip actions

    if (!cleanedText.trim()) return;

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = "zh-CN"; // Default to Chinese
    utterance.rate = 1.1;

    utterance.onstart = () => setSpeakProgress(true);
    utterance.onend = () => setSpeakProgress(false);
    utterance.onerror = () => setSpeakProgress(false);

    window.speechSynthesis.speak(utterance);
  };

  // Extract <think>...</think> blocks for rendering
  const parseMessageText = (msg: ChatMessage) => {
    const text = msg.text;
    const thinkRegex = /<think>([\s\S]*?)<\/think>/;
    const match = text.match(thinkRegex);

    if (match) {
      const thinking = match[1].trim();
      const actualReply = text.replace(thinkRegex, "").trim();
      return { thinking, reply: actualReply };
    }

    return { thinking: null, reply: text };
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 rounded-3xl overflow-hidden border-2 border-indigo-100 shadow-xl">
      {/* Top Bar (Styled in Indigo-50) */}
      <div className="flex justify-between items-center bg-indigo-50/80 border-b-2 border-indigo-100/60 px-5 py-3 select-none">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#FF6B6B] rounded-full animate-pulse"></div>
          <span className="font-sans text-xs font-black tracking-wide text-indigo-950">
            {petStats.name} AI 交互控制终端
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* TTS Mute Toggle */}
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              if (!isMuted) window.speechSynthesis.cancel();
            }}
            className={`p-1.5 rounded-lg hover:bg-indigo-100/50 transition-colors ${!isMuted ? "text-[#FF6B6B] bg-[#FF6B6B]/10 font-bold" : "text-slate-400"}`}
            title={isMuted ? "开启语音回复" : "静音回复"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Clear history */}
          <button
            onClick={onClearHistory}
            className="p-1.5 rounded-lg hover:bg-indigo-100/50 text-slate-400 hover:text-rose-500 transition-colors"
            title="清空聊天记录"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <span className="text-indigo-200">|</span>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="text-xs font-bold text-indigo-500 hover:text-indigo-700 bg-indigo-100/50 hover:bg-indigo-100 py-1 px-2.5 rounded-lg transition-colors"
          >
            收起
          </button>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Side: Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Chat Bubble Container */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-indigo-100 scrollbar-track-transparent">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3 select-none">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shadow-md border border-indigo-100/30">
                  <Brain className="w-7 h-7 text-indigo-500 stroke-[1.8]" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-indigo-950">唤醒桌面宠物专属 AI 脑电波</p>
                  <p className="text-[11px] text-slate-400 max-w-[280px] leading-relaxed">
                    在下方输入框和 {petStats.name} 开启对话！支持设定不同 AI 逻辑大脑，观察它的小情绪吧。
                  </p>
                </div>
              </div>
            ) : (
              chatHistory.map((msg) => {
                const isUser = msg.role === "user";
                const { thinking, reply } = parseMessageText(msg);

                // Auto-speak response if not muted and it's model output
                if (!isUser && !isMuted && msg.id === chatHistory[chatHistory.length - 1].id && !speakProgress) {
                  setTimeout(() => handleSpeak(reply), 300);
                }

                return (
                  <div key={msg.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}>
                    {/* Message metadata */}
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 px-1 font-mono">
                      <span className="font-bold text-indigo-900">{isUser ? "YOU" : msg.engine}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Chat Bubble card */}
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                      isUser 
                        ? "bg-[#FF6B6B] text-white font-semibold shadow-rose-100/60" 
                        : "bg-indigo-50/70 border-2 border-indigo-100/50 text-slate-800"
                    }`}>
                      {/* DeepSeek Style Thinking Chain */}
                      {thinking && (
                        <div className="mb-2 bg-white border-2 border-indigo-100 rounded-xl p-2.5 text-[10px] text-indigo-800 font-mono">
                          <summary className="font-bold cursor-pointer select-none mb-1 text-[10px] text-indigo-600 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#FF6B6B] animate-spin" style={{ animationDuration: "5s" }} />
                            推理思维深度链:
                          </summary>
                          <div className="whitespace-pre-wrap leading-relaxed opacity-90 border-t border-indigo-50 pt-1 mt-1">{thinking}</div>
                        </div>
                      )}

                      {/* Actual Response Text */}
                      <p className="whitespace-pre-wrap select-text">{reply}</p>

                      {/* Speech play triggers for models */}
                      {!isUser && (
                        <button
                          onClick={() => handleSpeak(reply)}
                          className="mt-2 text-[9px] flex items-center gap-1 text-indigo-500 hover:text-indigo-700 transition-colors font-mono font-bold"
                        >
                          <Volume2 className="w-3 h-3" />
                          语音朗读
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Thinking Status Loading Bubble */}
            {isThinking && (
              <div className="flex flex-col items-start space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 px-1 font-mono">
                  <span>{currentEngine}</span>
                  <span>•</span>
                  <span>正在调配突触节点中...</span>
                </div>
                <div className="bg-indigo-50/70 border-2 border-indigo-100/50 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <div className="flex space-x-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-[#FF6B6B] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-[#4ECDC4] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-[#FFE66D] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Input Area */}
          <form onSubmit={handleSubmit} className="p-3 border-t-2 border-indigo-100/60 bg-indigo-50/20 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`向 ${petStats.name} 发送消息或调皮提问...`}
              disabled={isThinking}
              className="flex-1 bg-white border-2 border-indigo-100 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-indigo-300 focus:outline-none focus:border-indigo-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isThinking}
              className="bg-[#FF6B6B] hover:bg-rose-500 disabled:bg-slate-100 text-white disabled:text-slate-400 px-4 py-2 rounded-xl transition-all flex items-center justify-center shadow-md shadow-rose-100/60 font-bold"
            >
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </form>
        </div>

        {/* Right Side: Multi-Engine Dashboard list */}
        <div className="w-56 bg-indigo-50/30 border-l-2 border-indigo-100 p-3 overflow-y-auto hidden md:flex flex-col space-y-3 font-sans">
          <div className="text-[9px] text-indigo-950 font-black tracking-widest uppercase pb-1 border-b border-indigo-100/60">
            6 种 AI 引擎大脑
          </div>
          
          <div className="space-y-2 flex-1">
            {ENGINES.map((eng) => {
              const isSelected = currentEngine === eng.id;
              return (
                <button
                  key={eng.id}
                  onClick={() => onChangeEngine(eng.id)}
                  className={`w-full text-left p-2.5 rounded-2xl border-2 transition-all flex flex-col gap-1 ${
                    isSelected 
                      ? `${eng.color} scale-[1.02] shadow-md shadow-indigo-100 font-bold border-indigo-400`
                      : "bg-white border-slate-100 hover:border-indigo-100 text-slate-500"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[11px] font-bold tracking-wide">{eng.id}</span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-[#FF6B6B] animate-ping"></span>}
                  </div>
                  <span className="text-[9px] text-slate-400 leading-tight block font-normal">
                    {eng.desc}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-[9px] text-slate-400 leading-relaxed border-t border-indigo-100/60 pt-2 bg-transparent">
            * 切换大脑会改变其回复性格（如 DeepSeek-R1 开启思考链标记）。
          </div>
        </div>
      </div>
    </div>
  );
}
