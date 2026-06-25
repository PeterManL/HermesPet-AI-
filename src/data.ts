import { FoodItem, PetType } from "./types";

export interface PetProfile {
  type: PetType;
  name: string;
  species: string;
  description: string;
  phrase: string;
  accentColor: string;
  bgClass: string;
  colorClass: string;
  // Simple CSS pixel-art styled mock representation
  pixelArt: {
    eyes: string;
    body: string;
    ears: string;
    accessory: string;
  };
}

export const PET_PROFILES: Record<PetType, PetProfile> = {
  Hermes: {
    type: "Hermes",
    name: "Hermes",
    species: "AI Cyber Fox",
    description: "An energetic cyber fox who loves coding, task optimization, and drinking simulated cappuccino.",
    phrase: "Optimizing work pipelines, let's write code!",
    accentColor: "#f97316", // orange
    bgClass: "bg-orange-500/10 border-orange-500/30",
    colorClass: "text-orange-500",
    pixelArt: {
      body: "bg-amber-500",
      eyes: "bg-sky-400",
      ears: "bg-amber-600",
      accessory: "bg-slate-700",
    },
  },
  Mochi: {
    type: "Mochi",
    name: "Mochi",
    species: "Sweet Pink Slime",
    description: "A soft, jelly-like pink slime who loves bouncing, eating pastries, and taking long, cozy naps.",
    phrase: "Puuu~ Working hard or resting hard?",
    accentColor: "#ec4899", // pink
    bgClass: "bg-pink-500/10 border-pink-500/30",
    colorClass: "text-pink-500",
    pixelArt: {
      body: "bg-pink-400 rounded-full",
      eyes: "bg-slate-800",
      ears: "hidden",
      accessory: "bg-pink-300",
    },
  },
  Kuro: {
    type: "Kuro",
    name: "Kuro",
    species: "Void Shadow Cat",
    description: "A cool, mysterious cat that lives in the shadows, writing deep algorithms and contemplating feline eternity.",
    phrase: "The shadows are compiles, silent and efficient.",
    accentColor: "#a855f7", // purple
    bgClass: "bg-purple-500/10 border-purple-500/30",
    colorClass: "text-purple-500",
    pixelArt: {
      body: "bg-zinc-800",
      eyes: "bg-fuchsia-400",
      ears: "bg-zinc-900",
      accessory: "bg-indigo-500",
    },
  },
  Pippin: {
    type: "Pippin",
    name: "Pippin",
    species: "Chrono Mech Bird",
    description: "A talkative mechanical bird who wears copper goggles and keeps track of CPU workloads and strict task timers.",
    phrase: "Timers calibrated! High-frequency chirps activated!",
    accentColor: "#eab308", // yellow
    bgClass: "bg-yellow-500/10 border-yellow-500/30",
    colorClass: "text-yellow-600",
    pixelArt: {
      body: "bg-yellow-400",
      eyes: "bg-emerald-400",
      ears: "bg-yellow-600",
      accessory: "bg-zinc-600", // Goggles
    },
  },
  Lulu: {
    type: "Lulu",
    name: "Lulu",
    species: "Cyber Cotton Rabbit",
    description: "A fluffy, time-leaping cotton bunny who reminds you to stay hydrated, stretch your back, and take healthy breaks.",
    phrase: "Boing! Perfect timing for a quick hydration stretch, master! 🐰",
    accentColor: "#f43f5e", // rose
    bgClass: "bg-rose-500/10 border-rose-500/30",
    colorClass: "text-rose-500",
    pixelArt: {
      body: "bg-rose-100",
      eyes: "bg-rose-500",
      ears: "bg-rose-200",
      accessory: "bg-amber-300",
    },
  },
  Cookie: {
    type: "Cookie",
    name: "Cookie",
    species: "Neon Shiba Inu",
    description: "A loyal, high-contrast neon Shiba puppy who patrols network ports, smells logic bugs, and begs for cyber cookie treats.",
    phrase: "Woof! 100% of pipeline targets completed flawlessly! Good job! 🐶",
    accentColor: "#06b6d4", // cyan
    bgClass: "bg-cyan-500/10 border-cyan-500/30",
    colorClass: "text-cyan-500",
    pixelArt: {
      body: "bg-amber-200",
      eyes: "bg-cyan-400",
      ears: "bg-amber-300",
      accessory: "bg-red-500",
    },
  },
};

export const SHOP_ITEMS: FoodItem[] = [
  {
    id: "cookie",
    name: "Cyber Cookie",
    emoji: "🍪",
    cost: 15,
    hungerRestore: 20,
    moodRestore: 10,
    energyRestore: 5,
    description: "Loaded with simulated chocolate chips and high-bandwidth neural sugars.",
  },
  {
    id: "coffee",
    name: "Overclocked Coffee",
    emoji: "☕",
    cost: 25,
    hungerRestore: 5,
    moodRestore: 15,
    energyRestore: 40,
    description: "Instantly restores pet energy. Perfect for long task-sprinting sessions.",
  },
  {
    id: "fish",
    name: "Binary Salmon",
    emoji: "🐟",
    cost: 35,
    hungerRestore: 45,
    moodRestore: 10,
    energyRestore: 15,
    description: "A delicious fish structured in pristine 0s and 1s, rich in Omega-3 logic gates.",
  },
  {
    id: "boba",
    name: "Matrix Boba Tea",
    emoji: "🧋",
    cost: 20,
    hungerRestore: 15,
    moodRestore: 30,
    energyRestore: 10,
    description: "Sweet brown sugar boba that brings intense joy to any digital pet.",
  },
  {
    id: "battery",
    name: "Gamma Battery Pack",
    emoji: "🔋",
    cost: 40,
    hungerRestore: 0,
    moodRestore: 20,
    energyRestore: 60,
    description: "Pure radioactive current. Boosts mechanical and cyber energy instantly.",
  },
];

export const DEMO_GOALS = [
  "完成桌面宠物演示网页开发",
  "准备一份关于大模型并行的报告",
  "修复后台数据库连接池漏洞",
  "写完今天的个人工作总结与日志",
  "整理一下乱糟糟的文件夹和笔记",
];

export const ELECTRON_GUIDE_FILES = {
  packageJson: `{
  "name": "hermes-pet-windows",
  "version": "1.0.0",
  "description": "Windows Desktop Wrapper for HermesPet AI Companion",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  },
  "dependencies": {
    "electron": "^30.0.0"
  }
}`,
  mainJs: `const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

function createPetWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // Create a transparent, frameless window to let the pet float over Windows desktop
  const petWin = new BrowserWindow({
    width: 320,
    height: 380,
    x: width - 340, // Position on bottom-right of Windows Desktop
    y: height - 400,
    transparent: true, // Crucial: Transparent background!
    frame: false,      // Crucial: Frameless window!
    resizable: false,
    alwaysOnTop: true, // Keep pet floating on top of all windows
    skipTaskbar: true,  // Hide from Windows taskbar
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the hosted URL of your HermesPet Web applet
  // Or load a local build folder if bundled
  const APP_URL = "YOUR_APP_URL_HERE"; 
  petWin.loadURL(APP_URL + "?standalone=true");

  // Allow clicking through transparent areas on Windows
  petWin.setIgnoreMouseEvents(false); 
}

app.whenReady().then(() => {
  createPetWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createPetWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});`
};
