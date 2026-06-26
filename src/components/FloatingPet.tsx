import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Heart, Coffee, Moon, Smile, Mic, MicOff, Send } from "lucide-react";
import { PetStats, PetType } from "../types";
import { PET_PROFILES } from "../data";
import { playPetSound, playLevelUpSound } from "../lib/sound";

interface FloatingPetProps {
  petStats: PetStats;
  onPetClicked: () => void;
  latestSpeech: string | null;
  setLatestSpeech: (speech: string | null) => void;
  setPetStats: React.Dispatch<React.SetStateAction<PetStats>>;
  onSendMessage?: (text: string) => Promise<void>;
  isAiThinking?: boolean;
  activeApp?: string | null;
}

interface HeartParticle {
  id: number;
  x: number;
  y: number;
}

interface EmoteParticle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  scale?: number;
}

const EMOTE_SPEECHES: Record<PetType, Record<string, { high: string; low: string }>> = {
  Hermes: {
    happy_dance: {
      high: "*量子摇摆* 逻辑通路全线飘绿！我的算法正在欢呼，主人今天的效率太棒啦！✨",
      low: "*勉强扭扭* 额... 芯片温度过高，我的电容可能有点漏电，但这舞步不能停！⚡"
    },
    curious_look: {
      high: "*狐耳微动* 发现高价值目标！正在扫描主人的屏幕……天呐，这组代码结构太优雅了！🔎",
      low: "*警觉打量* 奇怪，中央处理器温度异常……主人，你是不是在偷偷摸鱼写 bug？🤨"
    },
    sad_sigh: {
      high: "*叹气* 呼... 终于跑通了！刚才那个高并发测试差点把我的逻辑单元烧坏，好悬！",
      low: "*失落垂耳* 唉... 我的优化管线卡住了，脑细胞急需一杯双份浓缩的热卡布奇诺... ☕"
    }
  },
  Mochi: {
    happy_dance: {
      high: "*超级史莱姆弹跳* Puuu！开心到起飞！我要变成一颗粉色的小炮弹撞进你怀里！🌸",
      low: "*糯叽叽晃动* 呜呜，肚子没有油水，黏性不足，只能在地上像面团一样软软地滚一滚啦..."
    },
    curious_look: {
      high: "*好奇地拉长* 咦？屏幕上有好多五颜六色亮晶晶的东西，能吃吗？咬一口看看... 🧁",
      low: "*探出小脑袋* 怎么感觉主人有点不开心？让莫奇蹭蹭你的脸颊，坏心情全弹走！"
    },
    sad_sigh: {
      high: "*舒爽叹气* 呼呖呖~ 伸展运动完成！主人，累了就要像莫奇一样软塌塌躺平哦~ 💤",
      low: "*伤心流鼻涕* 呜哇... 肚子太扁了，身体正在缩水变小，莫奇要变成粉色甜品汽水啦..."
    }
  },
  Kuro: {
    happy_dance: {
      high: "*极速原地后空翻* 喵噢！抓到了！我的暗影能量正在溢出，这就是效率的奥义！",
      low: "*高傲地动了动爪子* 哼，看在主人这么努力的份上，勉为其难给你跳个暗影猫步吧。"
    },
    curious_look: {
      high: "*瞳孔放大成黑洞* 喵？刚才划过去的是不是一架赛博小飞虫？等我用爪子把它拍掉！🐾",
      low: "*冷酷审视* 盯……这个分号好像写错了。别以为猫咪看不懂你的 syntax error。"
    },
    sad_sigh: {
      high: "*慵懒深呼吸* 喵呜... 深渊的呼唤结束了，现在是长达五秒的打盹时间。",
      low: "*无助成一团* 唉... 阴影里好冷，没有金币买小鱼干，猫咪要委屈成一张黑毛毯了..."
    }
  },
  Pippin: {
    happy_dance: {
      high: "*发条全速运转* 哔、哔、哔！齿轮同步率100%！高频喜悦电波正在向全屏幕广播！🎉",
      low: "*卡壳舞步* 咔、咔……齿轮有些生锈，但这不能阻止我用金属翅膀给你打个欢快的拍子！"
    },
    curious_look: {
      high: "*戴上铜护目镜* 哔剥！检测到极高的脑电波活动！主人的专注指标已经突破天际啦！📊",
      low: "*滴滴闪红灯* 警报！检测到视线偏移！主人你已经在社交网站上停留超过 45 秒了！"
    },
    sad_sigh: {
      high: "*减压阀排气* 哧—— 核心气压释放成功。保持匀速专注有利于发条的寿命哦，主人！",
      low: "*失速坠落* 滴……电量告急，计时器发条彻底松了。鸟儿要掉下去啦，需要Bobo茶续命……"
    }
  },
  Lulu: {
    happy_dance: {
      high: "*超级兔耳螺旋摇晃* 耶！主人的效率比兔子跳得还高！我的长耳朵都要翘到天上去了！🐰",
      low: "*小幅跳跃* 呼... 累得耳朵都耷拉了，但我还是要用我蓬蓬的棉花爪给主人跳个兔兔舞！🐾"
    },
    curious_look: {
      high: "*耳朵旋转360度* 咦？刚才那个任务清单里是不是有一行写着“奖励松露胡萝卜”？🥕",
      low: "*眨巴大眼睛* 主人，你都盯着屏幕很久啦，眼睛有点酸吧？我们一起眨眨眼休息下！"
    },
    sad_sigh: {
      high: "*轻拍肚皮* 呼~ 专注任务全部完成，兔子感觉全身充满了松软的蓬蓬能量！",
      low: "*耳朵垂下裹住自己* 呜呜... 电量见底了，胡萝卜不甜了。兔子需要主人的摸摸和波波茶... 🥺"
    }
  },
  Cookie: {
    happy_dance: {
      high: "*尾巴像直升机一样直打转* 汪汪！全线飘绿，太强了！主人是世界上最厉害的开发者！🐾",
      low: "*欢快摇尾巴* 汪~ 摸鱼能激发灵感，适当的休息也是写代码的一部分嘛！快来摸摸狗头！🐶"
    },
    curious_look: {
      high: "*歪头杀* 汪？这个函数写得真漂亮，让本柴用高超的动态视力检查一下有没有语法拼写错误！",
      low: "*警惕地嗅一嗅* 汪汪！警报！我闻到了严重的内存泄漏或者摸鱼打瞌睡的味道！🧐"
    },
    sad_sigh: {
      high: "*深呼吸趴下* 呼~ 核心端口和服务器漏洞监控完毕，系统安全，本神犬先趴下眯一分钟。",
      low: "*忧郁叹气* 呜~ 守护主人的代码库也是很累的。没有香喷喷的芝士饼干，柴柴要委屈成一张小毛毯了..."
    }
  }
};

let globalHeartCounter = 0;
let globalEmoteCounter = 0;

export default function FloatingPet({ 
  petStats, 
  onPetClicked, 
  latestSpeech, 
  setLatestSpeech, 
  setPetStats,
  onSendMessage,
  isAiThinking = false,
  activeApp = null
}: FloatingPetProps) {
  const [hearts, setHearts] = useState<HeartParticle[]>([]);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [walkOffset, setWalkOffset] = useState({ x: 0, y: 0 });

  const [showEmoteMenu, setShowEmoteMenu] = useState(false);
  const [activeEmote, setActiveEmote] = useState<"happy_dance" | "curious_look" | "sad_sigh" | null>(null);
  const [emoteAnimation, setEmoteAnimation] = useState<any>({});
  const [emoteParticles, setEmoteParticles] = useState<EmoteParticle[]>([]);

  // Direct chat box and Speech recognition states
  const [showDirectChat, setShowDirectChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [autoSendVoice, setAutoSendVoice] = useState(true);
  const recognitionRef = useRef<any>(null);
  const isDraggingRef = useRef(false);

  // Automatically close direct chat if an app window is opened
  useEffect(() => {
    if (activeApp !== null) {
      setShowDirectChat(false);
    }
  }, [activeApp]);

  // Check Web Speech API support
  const SpeechRecognitionAPI = typeof window !== "undefined"
    ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    : null;

  const toggleListening = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!SpeechRecognitionAPI) {
      alert("当前浏览器暂不支持 Web Speech API 语音识别接口，推荐使用 Chrome/Edge/Safari 浏览器体验完整的语音互动服务。");
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (isAiThinking) return;
    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const rec = new SpeechRecognitionAPI();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "zh-CN";

      rec.onstart = () => {
        setIsListening(true);
        setInterimTranscript("");
      };

      rec.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (final) {
          setChatInput((prev) => {
            const updated = (prev + final).trim();
            if (autoSendVoice && updated && onSendMessage) {
              onSendMessage(updated);
              return "";
            }
            return updated;
          });
          setInterimTranscript("");
        } else {
          setInterimTranscript(interim);
        }
      };

      rec.onerror = (err: any) => {
        console.error("Speech recognition error:", err);
        setIsListening(false);
        setInterimTranscript("");
        if (err.error === "not-allowed") {
          alert("麦克风权限已被拒绝！请在浏览器地址栏的锁形/麦克风图标中允许此网站访问麦克风。");
        }
      };

      rec.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error("Failed starting speech recognition:", e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimTranscript("");
  };

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const profile = PET_PROFILES[petStats.type];

  // Random pacing walk animation for idle pets
  useEffect(() => {
    if (petStats.status !== "idle" && petStats.status !== "walking") return;

    const interval = setInterval(() => {
      // 30% chance to pace left/right
      if (Math.random() < 0.35) {
        const step = Math.floor(Math.random() * 80) - 40;
        setDirection(step < 0 ? "left" : "right");
        
        setWalkOffset((prev) => {
          const newX = Math.max(-120, Math.min(120, prev.x + step));
          return { x: newX, y: prev.y };
        });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [petStats.status]);

  // Pet click action -> spawn hearts!
  const handleClick = (e: any) => {
    // If the pet is currently being dragged, ignore click to avoid conflict
    if (isDraggingRef.current) return;

    // Ignore clicks/taps originating from input fields, buttons, chat panels or emote menus
    if (e && e.target) {
      const target = e.target as HTMLElement;
      if (
        target.closest('.chat-panel-container') || 
        target.closest('.emote-menu-container') || 
        target.closest('.smile-toggle-button') ||
        target.closest('button') || 
        target.closest('input') ||
        target.closest('form')
      ) {
        return;
      }
    }

    onPetClicked();
    playPetSound(petStats.type, "click");
    const newHeart = {
      id: Date.now() + Math.random() + (++globalHeartCounter),
      x: (Math.random() * 40) - 20,
      y: -30
    };
    setHearts((prev) => [...prev, newHeart]);

    // If we are on the desktop with no active windows, toggle direct chat!
    if (activeApp === null) {
      setShowDirectChat((prev) => !prev);
    }
  };

  // Remove heart particles after completion
  useEffect(() => {
    if (hearts.length === 0) return;
    const timeout = setTimeout(() => {
      setHearts((prev) => prev.slice(1));
    }, 1500);
    return () => clearTimeout(timeout);
  }, [hearts]);

  const spawnEmoteParticles = (emoji: string, count: number) => {
    const newParticles: EmoteParticle[] = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + Math.random() + i + (++globalEmoteCounter),
      emoji,
      x: (Math.random() * 80) - 40,
      y: -20,
      scale: 0.8 + Math.random() * 0.7
    }));
    setEmoteParticles((prev) => [...prev, ...newParticles]);
  };

  useEffect(() => {
    if (emoteParticles.length === 0) return;
    const timeout = setTimeout(() => {
      setEmoteParticles((prev) => prev.slice(3)); // Incrementally clear
    }, 1800);
    return () => clearTimeout(timeout);
  }, [emoteParticles]);

  const triggerEmote = (emote: "happy_dance" | "curious_look" | "sad_sigh") => {
    setActiveEmote(emote);
    const isHighMood = petStats.mood >= 50;
    const moodKey = isHighMood ? "high" : "low";

    // Play procedural thematic audio cue
    playPetSound(petStats.type, emote);

    // 1. Spawn themed interactive particles
    if (emote === "happy_dance") {
      spawnEmoteParticles(isHighMood ? "✨" : "⚡", 8);
      if (isHighMood) spawnEmoteParticles("⭐", 4);
    } else if (emote === "curious_look") {
      spawnEmoteParticles("🧐", 4);
      spawnEmoteParticles(isHighMood ? "💡" : "❓", 4);
    } else if (emote === "sad_sigh") {
      spawnEmoteParticles("💨", 6);
      if (!isHighMood) spawnEmoteParticles("💧", 5);
    }

    // 2. Play beautiful Framer Motion physics animation
    if (emote === "happy_dance") {
      if (isHighMood) {
        setEmoteAnimation({
          y: [-15, 0, -25, 0, -15, 0],
          rotate: [0, 90, 180, 270, 360],
          scale: [1, 1.15, 0.9, 1.15, 1],
        });
      } else {
        setEmoteAnimation({
          y: [-10, 0, -10, 0],
          scale: [1, 1.05, 0.95, 1.05, 1],
        });
      }
    } else if (emote === "curious_look") {
      if (isHighMood) {
        setEmoteAnimation({
          scale: [1, 1.15, 1.15, 1],
          x: [0, -12, 12, 0],
          y: [0, -4, -4, 0],
          rotate: [0, -12, 12, 0],
        });
      } else {
        setEmoteAnimation({
          rotate: [0, -15, -15, 0],
          scale: [1, 0.95, 0.95, 1],
        });
      }
    } else if (emote === "sad_sigh") {
      if (isHighMood) {
        setEmoteAnimation({
          scale: [1, 1.05, 1.05, 1],
          y: [0, -6, 0],
        });
      } else {
        setEmoteAnimation({
          y: [0, 10, 10, 0],
          scale: [1, 0.85, 0.85, 1],
          rotate: [0, -6, 6, 0],
        });
      }
    }

    // 3. Customize speech block
    const speech = EMOTE_SPEECHES[petStats.type]?.[emote]?.[moodKey] || "......";
    setLatestSpeech(speech);

    // 4. Update stats (Gain mood, gain 10 XP & 5 Coins as rewards!)
    setPetStats((prev) => {
      let newXp = prev.xp + 10;
      let newLevel = prev.level;
      let newCoins = prev.coins + 5;
      
      // Level Up check
      if (newXp >= newLevel * 120) {
        newXp = newXp - (newLevel * 120);
        newLevel += 1;
        // Speeches are updated in next render cycle, let's trigger speech
        setLatestSpeech(`*升级啦！* ✨ 太棒了！在我们的默契互动中，我的智能芯片升级到了 Lvl.${newLevel}！`);
        // Play triumphant level-up chime!
        playLevelUpSound();
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        coins: newCoins,
        mood: Math.min(100, prev.mood + (isHighMood ? 8 : 15)) // Sad pets get higher boost
      };
    });

    // 5. Automatic cleanup after animation completes
    setTimeout(() => {
      setActiveEmote(null);
      setEmoteAnimation({});
    }, 2500);
  };

  // Get visual state elements
  const renderPixelArt = () => {
    const isSleeping = petStats.status === "sleeping";
    const isEating = petStats.status === "eating";
    const isWorking = petStats.status === "working";

    // Common animation state classes
    const animationClass = isSleeping ? "opacity-90" : activeEmote ? "" : "animate-bounce";
    const animationStyle = { animationDuration: petStats.status === "working" ? "0.8s" : "3.5s" };

    // Helper for eye rendering based on states
    const renderEyes = (eyesColor: string) => {
      if (isSleeping) {
        return (
          <div className="flex justify-around items-center w-full px-2.5">
            <div className="w-3 h-0.5 bg-zinc-950 rounded-sm"></div>
            <div className="w-3 h-0.5 bg-zinc-950 rounded-sm"></div>
          </div>
        );
      }
      if (activeEmote === "curious_look") {
        return (
          <div className="flex justify-around items-center w-full px-1.5">
            <div className={`w-3.5 h-3.5 rounded-full ${eyesColor} border border-white flex items-center justify-center animate-pulse`} style={{ animationDuration: "0.5s" }}>
              <div className="w-1.5 h-1.5 bg-zinc-950 rounded-full"></div>
            </div>
            <div className={`w-3.5 h-3.5 rounded-full ${eyesColor} border border-white flex items-center justify-center animate-pulse`} style={{ animationDuration: "0.5s" }}>
              <div className="w-1.5 h-1.5 bg-zinc-950 rounded-full"></div>
            </div>
          </div>
        );
      }
      if (activeEmote === "sad_sigh") {
        return (
          <div className="flex justify-around items-center w-full px-2.5">
            <div className="w-3.5 h-1.5 bg-zinc-950 rounded-b-xl"></div>
            <div className="w-3.5 h-1.5 bg-zinc-950 rounded-b-xl"></div>
          </div>
        );
      }
      // Default normal eyes
      return (
        <div className="flex justify-around items-center w-full px-2.5">
          <div className={`w-2.5 h-3.5 rounded-sm ${eyesColor} relative flex items-center justify-center`}>
            <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-white rounded-full"></div>
          </div>
          <div className={`w-2.5 h-3.5 rounded-sm ${eyesColor} relative flex items-center justify-center`}>
            <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-white rounded-full"></div>
          </div>
        </div>
      );
    };

    // Helper for mouth rendering based on states
    const renderMouth = () => {
      if (activeEmote === "happy_dance") {
        return <div className="w-3.5 h-2 border-b-2 border-zinc-950 rounded-full -mt-0.5"></div>;
      }
      if (activeEmote === "sad_sigh") {
        return <div className="w-2.5 h-1.5 bg-zinc-950 rounded-t-lg"></div>;
      }
      return <div className="w-1.5 h-1 bg-zinc-950 rounded-sm"></div>;
    };

    const renderPetSpecificArt = () => {
      switch (petStats.type) {
        case "Hermes": // Cyber Fox: elegant pointy fox shape with tech visor and glowing tail
          return (
            <div 
              className={`relative w-16 h-15 bg-amber-500 border-2 border-amber-600 rounded-t-2xl rounded-b-lg flex flex-col justify-between p-1 shadow-md ${animationClass}`}
              style={animationStyle}
            >
              {/* Pointy Fox Ears */}
              <div className="absolute -top-3 left-0.5 right-0.5 flex justify-between z-10">
                <div className="w-4.5 h-5 bg-amber-600 rounded-tr-3xl rotate-[-12deg] flex items-end justify-center border-l border-t border-amber-700">
                  <div className="w-2 h-3.5 bg-rose-200 rounded-tr-2xl"></div>
                </div>
                <div className="w-4.5 h-5 bg-amber-600 rounded-tl-3xl rotate-[12deg] flex items-end justify-center border-r border-t border-amber-700">
                  <div className="w-2 h-3.5 bg-rose-200 rounded-tl-2xl"></div>
                </div>
              </div>

              {/* Eyes with Cyber holographic overlay */}
              <div className="mt-1.5 flex justify-around items-center w-full z-10">
                {renderEyes("bg-zinc-950")}
              </div>

              {/* Snout with white cheeks */}
              <div className="flex justify-center items-center gap-1 mb-1 z-10">
                <div className="w-2 h-1.5 bg-rose-300/40 rounded-full"></div>
                <div className="relative w-8 h-4 bg-white border border-amber-200 rounded-md flex flex-col items-center justify-center">
                  <div className="w-2 h-1.5 bg-zinc-950 rounded-b-md"></div>
                  {renderMouth()}
                </div>
                <div className="w-2 h-1.5 bg-rose-300/40 rounded-full"></div>
              </div>

              {/* Fluffy white-tipped fox tail at the back */}
              <div className="absolute -right-3 bottom-0.5 w-4 h-8 bg-amber-600 border border-amber-700 rounded-t-3xl rounded-b-lg rotate-[35deg] origin-bottom animate-pulse">
                <div className="w-full h-3.5 bg-slate-50 rounded-t-3xl"></div>
              </div>
            </div>
          );

        case "Mochi": // Pink Slime: adorable bouncy squishy droplet
          return (
            <div 
              className={`relative w-16 h-12 bg-pink-400 border-2 border-pink-500 rounded-t-[32px] rounded-b-md flex flex-col justify-end p-1 shadow-md ${animationClass}`}
              style={animationStyle}
            >
              {/* Highlight glass shine on top-left */}
              <div className="absolute top-1.5 left-3.5 w-4 h-1.5 bg-white/60 rounded-full rotate-[-15deg]"></div>

              {/* Slime Eyes */}
              <div className="mb-2 flex justify-around items-center w-full">
                {renderEyes("bg-zinc-950")}
              </div>

              {/* Blushing cheeks & tiny mouth */}
              <div className="flex justify-center items-center gap-2 mb-1.5">
                <div className="w-2.5 h-1 bg-pink-600/40 rounded-full animate-ping" style={{ animationDuration: "2.5s" }}></div>
                {renderMouth()}
                <div className="w-2.5 h-1 bg-pink-600/40 rounded-full animate-ping" style={{ animationDuration: "2.5s" }}></div>
              </div>

              {/* Puddle drops on the sides */}
              <div className="absolute -left-1 bottom-0 w-2.5 h-1.5 bg-pink-400 rounded-full"></div>
              <div className="absolute -right-1 bottom-0 w-2.5 h-1.5 bg-pink-400 rounded-full"></div>
            </div>
          );

        case "Kuro": // Abyss Cat: sleek pointed cat ears, mysterious violet slit eyes
          return (
            <div 
              className={`relative w-15 h-13 bg-zinc-900 border-2 border-zinc-950 rounded-t-xl rounded-b-2xl flex flex-col justify-between p-1 shadow-md ${animationClass}`}
              style={animationStyle}
            >
              {/* Pointy cat ears on top */}
              <div className="absolute -top-3 left-0 right-0 flex justify-between z-10 px-0.5">
                <div className="w-4 h-4 bg-zinc-900 border-l border-t border-zinc-950 rotate-[-15deg] rounded-tl-lg flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-purple-950 rotate-[5deg] rounded-tl"></div>
                </div>
                <div className="w-4 h-4 bg-zinc-900 border-r border-t border-zinc-950 rotate-[15deg] rounded-tr-lg flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-purple-950 rotate-[-5deg] rounded-tr"></div>
                </div>
              </div>

              {/* Glowing violet cat eyes */}
              <div className="mt-2.5 flex justify-around items-center w-full z-10">
                {renderEyes("bg-purple-500")}
              </div>

              {/* Whisker lines and cat mouth */}
              <div className="flex justify-center items-center gap-2 mb-1 relative z-10">
                {/* Left Whiskers */}
                <div className="absolute -left-2 top-0.5 w-3 h-[1.5px] bg-zinc-600/50 rotate-[-6deg]"></div>
                <div className="absolute -left-2 top-2 w-3 h-[1.5px] bg-zinc-600/50 rotate-[6deg]"></div>

                <div className="w-1.5 h-1 bg-rose-400/30 rounded-full"></div>
                
                {/* Cat nose/mouth */}
                <div className="flex flex-col items-center">
                  <div className="w-1.5 h-1 bg-zinc-950 rounded-full"></div>
                  {renderMouth()}
                </div>

                <div className="w-1.5 h-1 bg-rose-400/30 rounded-full"></div>

                {/* Right Whiskers */}
                <div className="absolute -right-2 top-0.5 w-3 h-[1.5px] bg-zinc-600/50 rotate-[6deg]"></div>
                <div className="absolute -right-2 top-2 w-3 h-[1.5px] bg-zinc-600/50 rotate-[-6deg]"></div>
              </div>

              {/* Sleek cat tail on the right side */}
              <div className="absolute -right-2 top-2 w-2 h-7 bg-zinc-900 border-r border-zinc-950 rounded-full origin-bottom rotate-[35deg] animate-pulse" style={{ animationDuration: "1.8s" }}></div>
            </div>
          );

        case "Pippin": // Clockwork wind-up Bird: round body with mechanical feathers & rotating key
          return (
            <div 
              className={`relative w-14 h-14 bg-amber-300 border-2 border-amber-400 rounded-full flex flex-col justify-between p-1 shadow-md ${animationClass}`}
              style={animationStyle}
            >
              {/* Crest feather on head */}
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-3.5 bg-amber-400 rounded-full rotate-[15deg]"></div>

              {/* Mechanical Bird Eyes */}
              <div className="mt-3 flex justify-around items-center w-full z-10">
                {renderEyes("bg-zinc-950")}
              </div>

              {/* Orange beak and metal wings */}
              <div className="flex justify-center items-center gap-1 mb-1 relative z-10">
                <div className="w-1.5 h-1 bg-rose-350/30 rounded-full"></div>
                
                {/* Triangular beak */}
                <div className="w-3.5 h-2.5 bg-orange-500 rounded-l-full rounded-r-3xl border-b border-orange-600 animate-pulse"></div>

                {/* Flapping mechanical side wing */}
                <div className="absolute left-[-4px] top-[-6px] w-5 h-3 bg-zinc-300 border border-zinc-400 rounded-full origin-right animate-bounce" style={{ animationDuration: "0.6s" }}></div>

                <div className="w-1.5 h-1 bg-rose-350/30 rounded-full"></div>
              </div>

              {/* Spinning mechanical wind-up key at the back */}
              <div className="absolute -left-3.5 top-4.5 flex items-center z-[-1]">
                <div className="w-2.5 h-1 bg-zinc-400"></div>
                <div className="w-4.5 h-4.5 border border-zinc-400 bg-zinc-300 rounded-full flex items-center justify-center animate-spin" style={{ animationDuration: "2.5s" }}>
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></div>
                </div>
              </div>
            </div>
          );

        case "Lulu": // Cotton Rabbit: Extremely long floppy ears & fluffy round tail
          return (
            <div 
              className={`relative w-14 h-14 bg-rose-50 border-2 border-rose-100 rounded-2xl flex flex-col justify-between p-1 shadow-md ${animationClass}`}
              style={animationStyle}
            >
              {/* Very long, adorable floppy rabbit ears */}
              <div className="absolute -top-7 left-1 right-1 flex justify-between z-10">
                <div className="w-3.5 h-8 bg-rose-50 border-t border-l border-rose-100 rounded-t-full rotate-[-8deg] origin-bottom flex items-center justify-center animate-pulse">
                  <div className="w-1.5 h-6 bg-rose-200/80 rounded-t-full"></div>
                </div>
                <div className="w-3.5 h-8 bg-rose-50 border-t border-r border-rose-100 rounded-t-full rotate-[8deg] origin-bottom flex items-center justify-center animate-pulse" style={{ animationDelay: "0.15s" }}>
                  <div className="w-1.5 h-6 bg-rose-200/80 rounded-t-full"></div>
                </div>
              </div>

              {/* Sweet pink eyes */}
              <div className="mt-2.5 flex justify-around items-center w-full z-10">
                {renderEyes("bg-rose-500")}
              </div>

              {/* Blush cheeks and rabbit nose */}
              <div className="flex justify-center items-center gap-1.5 mb-1 z-10">
                <div className="w-2.5 h-1.5 bg-rose-300/40 rounded-full"></div>
                <div className="flex flex-col items-center">
                  <div className="w-1.5 h-1 bg-rose-400 rounded-full"></div>
                  {renderMouth()}
                </div>
                <div className="w-2.5 h-1.5 bg-rose-300/40 rounded-full"></div>
              </div>

              {/* Fuzzy circular cotton tail at back */}
              <div className="absolute -right-2 bottom-1.5 w-3.5 h-3.5 rounded-full bg-rose-50 border border-rose-100 animate-bounce"></div>
            </div>
          );

        case "Cookie": // Neon Shiba: white cheeks/muzzle, floppy ears, glowing cyber collar
          return (
            <div 
              className={`relative w-15 h-13 bg-amber-500 border-2 border-amber-600 rounded-t-2xl rounded-b-xl flex flex-col justify-between p-1 shadow-md ${animationClass}`}
              style={animationStyle}
            >
              {/* Cute shiba dog ears */}
              <div className="absolute -top-3.5 left-0.5 right-0.5 flex justify-between z-10 px-0.5">
                <div className="w-4 h-5 bg-amber-600 border-l border-t border-amber-700 rotate-[-10deg] rounded-tl-lg flex items-center justify-center">
                  <div className="w-2.5 h-3.5 bg-amber-50 rounded-tl"></div>
                </div>
                <div className="w-4 h-5 bg-amber-600 border-r border-t border-amber-700 rotate-[10deg] rounded-tr-lg flex items-center justify-center">
                  <div className="w-2.5 h-3.5 bg-amber-50 rounded-tr"></div>
                </div>
              </div>

              {/* Friendly shiba eyes */}
              <div className="mt-2.5 flex justify-around items-center w-full z-10">
                {renderEyes("bg-zinc-950")}
              </div>

              {/* Shiba muzzle and snout */}
              <div className="flex justify-center items-center gap-1.5 mb-1 relative z-10">
                <div className="w-1.5 h-1.5 bg-rose-300/40 rounded-full"></div>
                
                {/* Shiba Snout Block */}
                <div className="w-7.5 h-4.5 bg-white border border-amber-200 rounded-md flex flex-col items-center justify-center shadow-sm">
                  <div className="w-2 h-1 bg-zinc-950 rounded-b-full"></div>
                  {renderMouth()}
                </div>

                <div className="w-1.5 h-1.5 bg-rose-300/40 rounded-full"></div>
              </div>

              {/* Glowing neon collar with golden bell */}
              <div className="absolute bottom-[-0.5px] left-1 right-1 h-1 bg-cyan-400 rounded-full flex justify-center items-center">
                <div className="w-1.5 h-1.5 bg-yellow-400 border border-yellow-500 rounded-full shadow-sm animate-pulse"></div>
              </div>

              {/* Fluffy curled Shiba tail at the back */}
              <div className="absolute -right-2 bottom-1.5 w-4 h-4 bg-amber-600 border border-amber-700 rounded-full origin-bottom animate-bounce"></div>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="relative flex flex-col items-center select-none">
        {/* Floating status bubbles */}
        <AnimatePresence>
          {isSleeping && (
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: -15 }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-6 -right-2 text-xs font-bold font-mono text-indigo-400 select-none pointer-events-none"
            >
              Zzz..
            </motion.span>
          )}
          {isWorking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -top-7 text-[10px] bg-zinc-900 border border-zinc-800 text-amber-400 px-1.5 py-0.5 rounded font-mono shadow"
            >
              ⌨️ Working..
            </motion.div>
          )}
          {isEating && (
            <motion.span
              initial={{ opacity: 0, y: -10, scale: 0.5 }}
              animate={{ opacity: 1, y: -25, scale: 1.2 }}
              exit={{ opacity: 0 }}
              className="absolute text-xl pointer-events-none"
            >
              ❤️
            </motion.span>
          )}
        </AnimatePresence>

        {/* Outer draggable Pet Body Wrapper */}
        <div className={`relative w-24 h-24 flex items-center justify-center transition-all ${
          isSleeping ? "rotate-90 origin-bottom mt-4" : ""
        }`}>
          {/* SPRINT MODE: Show Laptop / Coding desk */}
          {isWorking && (
            <div className="absolute bottom-0 w-28 h-6 bg-slate-800/80 border-t border-slate-700 rounded-md flex justify-between px-2 items-center z-10">
              <div className="w-6 h-4 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-center text-[8px] text-cyan-400">
                &lt;/&gt;
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></div>
            </div>
          )}

          <motion.div
            animate={emoteAnimation}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex items-center justify-center"
          >
            {/* Render custom detailed silhouette per pet species */}
            {renderPetSpecificArt()}
          </motion.div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.05}
      animate={{ x: walkOffset.x, y: walkOffset.y }}
      transition={{ type: "spring", damping: 15 }}
      onDragStart={() => {
        isDraggingRef.current = true;
      }}
      onDragEnd={() => {
        // Set a brief delay to allow click/tap events to resolve safely
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 120);
      }}
      onTap={handleClick}
      className="absolute bottom-20 right-20 z-40 pointer-events-auto cursor-grab active:cursor-grabbing flex flex-col items-center select-none"
    >
      {/* Interactive Speech bubble */}
      <AnimatePresence>
        {latestSpeech && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: -4 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mb-2 max-w-[180px] bg-zinc-900/95 border border-zinc-800 rounded-xl p-2.5 shadow-xl text-[11px] text-zinc-100 font-mono text-center select-none"
          >
            <p className="line-clamp-4 leading-normal">{latestSpeech}</p>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] w-2.5 h-2.5 rotate-45 bg-zinc-900 border-r border-b border-zinc-800"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Pet Body Graphic */}
      <div className={`transform ${direction === "left" ? "-scale-x-100" : ""}`}>
        {renderPixelArt()}
      </div>

      {/* Direct Desktop Chat Input Panel */}
      <AnimatePresence>
        {activeApp === null && showDirectChat && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="chat-panel-container mt-3 bg-white/95 backdrop-blur-md border-2 border-indigo-100 rounded-2xl p-2.5 shadow-2xl flex flex-col gap-1.5 pointer-events-auto select-none z-50 w-64 text-slate-800"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {/* Input field and action buttons */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!chatInput.trim() || isAiThinking) return;
                if (onSendMessage) {
                  onSendMessage(chatInput.trim());
                }
                setChatInput("");
              }}
              className="flex items-center gap-1.5"
            >
              {/* Mic toggle */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center font-bold border cursor-pointer ${
                  isListening
                    ? "bg-rose-500 text-white border-rose-500 animate-pulse"
                    : "bg-indigo-50 text-indigo-500 border-indigo-150 hover:bg-indigo-100"
                }`}
                title={isListening ? "停止语音录入" : "语音对话"}
              >
                {isListening ? (
                  <Mic className="w-3.5 h-3.5 text-white animate-pulse" />
                ) : (
                  <MicOff className="w-3.5 h-3.5 text-indigo-400" />
                )}
              </button>

              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={isListening ? "正在聆听..." : `和 ${petStats.name} 聊聊天吧...`}
                disabled={isAiThinking}
                className="flex-1 min-w-0 bg-indigo-50/30 border border-indigo-100 rounded-xl px-2.5 py-1 text-xs text-slate-800 placeholder-indigo-300 focus:outline-none focus:border-indigo-400 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!chatInput.trim() || isAiThinking}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>

            {/* Status bar / transcripts during listening */}
            {(isListening || isAiThinking) && (
              <div className="flex items-center gap-1.5 px-1 text-[9px] font-semibold text-indigo-600">
                {isListening ? (
                  <div className="flex items-center gap-1 truncate w-full">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                    </span>
                    <span className="text-rose-500 font-bold truncate">
                      {interimTranscript || "(请说话...)"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-indigo-500">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></span>
                    <span>思考中...</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emote menu popup panel */}
      <AnimatePresence>
        {showEmoteMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            className="emote-menu-container absolute bottom-full mb-3 bg-white/95 backdrop-blur-md border border-indigo-150 rounded-2xl p-2 shadow-xl flex gap-1.5 items-center pointer-events-auto select-none z-50 min-w-[210px]"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="text-[9px] font-black text-indigo-950 font-sans border-r border-indigo-100 pr-2 mr-1 leading-tight flex flex-col uppercase tracking-wider">
              <span>宠物</span>
              <span>指令</span>
            </div>
            
            {/* Happy Dance button */}
            <button
              onClick={() => {
                triggerEmote("happy_dance");
                setShowEmoteMenu(false);
              }}
              className="p-1.5 hover:bg-yellow-50 rounded-xl transition-all hover:scale-110 text-sm flex flex-col items-center gap-0.5 group"
              title="Happy Dance"
            >
              <span className="text-base filter drop-shadow group-hover:animate-bounce">💃</span>
              <span className="text-[8px] font-bold text-slate-500 group-hover:text-amber-600">跳舞</span>
            </button>

            {/* Curious Look button */}
            <button
              onClick={() => {
                triggerEmote("curious_look");
                setShowEmoteMenu(false);
              }}
              className="p-1.5 hover:bg-indigo-50 rounded-xl transition-all hover:scale-110 text-sm flex flex-col items-center gap-0.5 group"
              title="Curious Look"
            >
              <span className="text-base filter drop-shadow group-hover:rotate-12">🧐</span>
              <span className="text-[8px] font-bold text-slate-500 group-hover:text-indigo-600">观察</span>
            </button>

            {/* Sad Sigh button */}
            <button
              onClick={() => {
                triggerEmote("sad_sigh");
                setShowEmoteMenu(false);
              }}
              className="p-1.5 hover:bg-rose-50 rounded-xl transition-all hover:scale-110 text-sm flex flex-col items-center gap-0.5 group"
              title="Sad Sigh"
            >
              <span className="text-base filter drop-shadow group-hover:translate-y-0.5">🥺</span>
              <span className="text-[8px] font-bold text-slate-500 group-hover:text-rose-500">叹气</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Small Smile Toggle Button next to the pet */}
      <div 
        className="smile-toggle-button absolute -right-7 bottom-5 z-40 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowEmoteMenu(!showEmoteMenu);
          }}
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-lg transition-all transform hover:scale-115 active:scale-95 ${
            showEmoteMenu 
              ? "bg-[#FF6B6B] border-[#FF6B6B] text-white" 
              : "bg-white border-indigo-100 text-indigo-500 hover:border-indigo-300"
          }`}
          title="触发宠物专属表情动作"
        >
          <Smile className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Floating interactive Heart particles on click */}
      {hearts.map((h) => (
        <motion.span
          key={h.id}
          initial={{ opacity: 1, y: 0, scale: 0.8 }}
          animate={{ opacity: 0, y: -60, scale: 1.3 }}
          className="absolute text-rose-500 font-bold select-none pointer-events-none"
          style={{ left: h.x }}
        >
          ❤️
        </motion.span>
      ))}

      {/* Floating Emote Particles */}
      <AnimatePresence>
        {emoteParticles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ opacity: 1, y: 0, scale: 0.5, rotate: 0 }}
            animate={{ 
              opacity: 0, 
              y: -80 - Math.random() * 40, 
              x: p.x + (Math.random() * 40 - 20), 
              scale: p.scale || 1.3,
              rotate: Math.random() * 360 - 180
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute font-bold select-none pointer-events-none text-lg z-50"
            style={{ left: `calc(50% + ${p.x}px)`, top: "30%" }}
          >
            {p.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
