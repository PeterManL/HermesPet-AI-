import React, { useState } from "react";
import { 
  Laptop, Cpu, Terminal, Copy, Check, Download, AlertCircle, 
  HelpCircle, ExternalLink, RefreshCw, Layers 
} from "lucide-react";
import { ELECTRON_GUIDE_FILES } from "../data";

interface WindowsCompanionProps {
  appUrl: string;
  onClose: () => void;
}

export default function WindowsCompanion({ appUrl, onClose }: WindowsCompanionProps) {
  const [activeTab, setActiveTab] = useState<"intro" | "mainjs" | "packagejson">("intro");
  const [copied, setCopied] = useState<string | null>(null);

  const cleanAppUrl = appUrl || "https://your-app-url-placeholder.run.app";

  const getCustomMainJs = () => {
    return ELECTRON_GUIDE_FILES.mainJs.replace("YOUR_APP_URL_HERE", cleanAppUrl);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadSkeleton = () => {
    try {
      const mainJsContent = getCustomMainJs();
      const pkgContent = ELECTRON_GUIDE_FILES.packageJson;

      // Download main.js
      let element = document.createElement("a");
      let file = new Blob([mainJsContent], { type: "text/javascript" });
      element.href = URL.createObjectURL(file);
      element.download = "main.js";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      // Download package.json
      setTimeout(() => {
        let el2 = document.createElement("a");
        let f2 = new Blob([pkgContent], { type: "application/json" });
        el2.href = URL.createObjectURL(f2);
        el2.download = "package.json";
        document.body.appendChild(el2);
        el2.click();
        document.body.removeChild(el2);
      }, 500);

    } catch (err) {
      alert("下载失败，请直接复制右侧代码块。");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-2 border-indigo-100 rounded-3xl overflow-hidden shadow-xl text-slate-800">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-indigo-50/80 border-b-2 border-indigo-100/60 px-5 py-3 select-none">
        <div className="flex items-center gap-2">
          <Laptop className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span className="font-sans text-xs font-black tracking-wide text-indigo-950">
            Windows 桌面穿透客户端打包引导
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-bold text-indigo-500 hover:text-indigo-700 bg-indigo-100/50 hover:bg-indigo-100 py-1 px-2.5 rounded-lg transition-colors"
        >
          收起
        </button>
      </div>

      {/* Outer wrapper */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        
        {/* Left Side Navigation tabs */}
        <div className="w-full md:w-48 bg-indigo-50/30 border-b md:border-b-0 md:border-r-2 border-indigo-100 p-3 space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible shrink-0 select-none">
          <button
            onClick={() => setActiveTab("intro")}
            className={`w-full text-left p-2.5 rounded-xl border-2 transition-all flex items-center gap-2 ${
              activeTab === "intro" 
                ? "bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-sm shadow-indigo-100" 
                : "border-transparent text-slate-500 hover:bg-indigo-50"
            }`}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span className="text-xs">Windows 接入指南</span>
          </button>
          
          <button
            onClick={() => setActiveTab("mainjs")}
            className={`w-full text-left p-2.5 rounded-xl border-2 transition-all flex items-center gap-2 ${
              activeTab === "mainjs" 
                ? "bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-sm shadow-indigo-100" 
                : "border-transparent text-slate-500 hover:bg-indigo-50"
            }`}
          >
            <Terminal className="w-4 h-4 shrink-0" />
            <span className="text-xs">main.js (窗口配置)</span>
          </button>

          <button
            onClick={() => setActiveTab("packagejson")}
            className={`w-full text-left p-2.5 rounded-xl border-2 transition-all flex items-center gap-2 ${
              activeTab === "packagejson" 
                ? "bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-sm shadow-indigo-100" 
                : "border-transparent text-slate-500 hover:bg-indigo-50"
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span className="text-xs">package.json (配给)</span>
          </button>
        </div>

        {/* Right Side Code Panel / Instructions */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "intro" && (
            <div className="space-y-4 leading-relaxed text-slate-600 text-[11px]">
              <div className="bg-[#FF6B6B]/10 border-2 border-[#FF6B6B]/20 rounded-2xl p-4 flex gap-3 items-start shadow-sm shadow-red-50">
                <AlertCircle className="w-5 h-5 text-[#FF6B6B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-black text-slate-800 block text-xs">如何让宠物完全脱离浏览器，真正的透明置顶浮在桌面上？</span>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-normal">
                    由于网页的安全运行域限制，真实的“Windows 桌面窗口穿透”和“多窗口置顶悬浮”功能需要借助 Electron 壳封装。
                    我们已经为你一键算好了适配于本容器的专属 Electron 打包代码配置！
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-extrabold text-slate-800 flex items-center gap-1.5 border-b-2 border-slate-50 pb-1.5 text-xs">
                  <span className="w-5 h-5 bg-[#FF6B6B] text-white font-black rounded-full flex items-center justify-center text-[10px]">1</span>
                  一键获取 Electron 骨架配置文件
                </span>
                <p className="text-[11px] text-slate-500 leading-normal">
                  点击下方按钮，一键打包下载你的专属 `main.js` 与 `package.json` 脚手架配置包：
                </p>
                <button
                  onClick={handleDownloadSkeleton}
                  className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-yellow-100 text-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>下载 Windows Electron 配置文件模板</span>
                </button>
              </div>

              <div className="space-y-2">
                <span className="font-extrabold text-slate-800 flex items-center gap-1.5 border-b-2 border-slate-50 pb-1.5 text-xs">
                  <span className="w-5 h-5 bg-[#FF6B6B] text-white font-black rounded-full flex items-center justify-center text-[10px]">2</span>
                  在 Windows 电脑上快捷启动
                </span>
                <p className="text-[11px] text-slate-500 leading-normal">
                  在你的 Windows PC 电脑桌面上任意新建一个空文件夹（比如命名为 `hermes-companion`），将下载出来的两个文件放置进去。右键文件夹空白处选择“在终端中打开”，输入以下控制台指令：
                </p>
                <div className="bg-slate-950 border border-slate-900 p-4 rounded-2xl space-y-1.5 text-[11px] font-mono shadow-sm">
                  <div className="text-emerald-400"># 1. 确认已置身对应文件夹路径下</div>
                  <div className="text-slate-300">cd path/to/hermes-companion</div>
                  <div className="text-emerald-400 mt-2.5"># 2. 安装 Electron 本地桌面环境</div>
                  <div className="text-slate-300">npm install</div>
                  <div className="text-emerald-400 mt-2.5"># 3. 极速调配启动</div>
                  <div className="text-slate-300">npm start</div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
                  <span className="w-5 h-5 bg-indigo-100 text-indigo-700 font-black rounded-full flex items-center justify-center text-[10px]">🔗</span>
                  当前实例专属绑定常驻链接
                </span>
                <p className="text-[11px] text-slate-500 leading-normal">
                  配置文件中已经绑定写入了本容器专享的 AI Studio 加速访问实例，支持在 Windows 机器进行常驻加载：
                </p>
                <div className="bg-indigo-50/80 p-2 rounded-xl border border-indigo-100/50 truncate text-[10px] text-indigo-600 font-mono font-bold">
                  {cleanAppUrl}
                </div>
              </div>
            </div>
          )}

          {activeTab === "mainjs" && (
            <div className="space-y-3.5">
              <div className="flex justify-between items-center pb-1 border-b-2 border-slate-50">
                <span className="font-extrabold text-slate-800">main.js 窗口透明穿透核心控制逻辑</span>
                <button
                  onClick={() => handleCopy(getCustomMainJs(), "mainjs")}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-xl border border-indigo-100 flex items-center gap-1.5 transition-all text-xs font-bold"
                >
                  {copied === "mainjs" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === "mainjs" ? "复制成功" : "复制代码"}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal font-medium">
                该脚本指引 Electron 壳以 `transparent: true`, `frame: false` 以及 `alwaysOnTop: true` 的模式启动加载，以此消除操作系统自带的窗体和边框，实现纯粹的悬浮效果。
              </p>
              <pre className="bg-slate-950 border border-slate-900 p-4 rounded-2xl overflow-x-auto text-[10px] text-slate-300 leading-relaxed font-mono max-h-64 scrollbar-thin">
                {getCustomMainJs()}
              </pre>
            </div>
          )}

          {activeTab === "packagejson" && (
            <div className="space-y-3.5">
              <div className="flex justify-between items-center pb-1 border-b-2 border-slate-50">
                <span className="font-extrabold text-slate-800">package.json 壳依赖描述配置</span>
                <button
                  onClick={() => handleCopy(ELECTRON_GUIDE_FILES.packageJson, "packagejson")}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-xl border border-indigo-100 flex items-center gap-1.5 transition-all text-xs font-bold"
                >
                  {copied === "packagejson" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === "packagejson" ? "复制成功" : "复制代码"}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal font-medium">
                声明了 Electron 外壳打包环境的版本清单：
              </p>
              <pre className="bg-slate-950 border border-slate-900 p-4 rounded-2xl overflow-x-auto text-[10px] text-slate-300 leading-relaxed font-mono max-h-64 scrollbar-thin">
                {ELECTRON_GUIDE_FILES.packageJson}
              </pre>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
