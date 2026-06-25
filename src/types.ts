export type PetType = "Hermes" | "Mochi" | "Kuro" | "Pippin" | "Lulu" | "Cookie";

export interface PetStats {
  type: PetType;
  name: string;
  level: number;
  xp: number;
  hunger: number; // 0-100
  mood: number; // 0-100
  energy: number; // 0-100
  coins: number;
  activeTaskId: string | null;
  status: "idle" | "walking" | "working" | "sleeping" | "eating" | "thinking";
}

export interface Task {
  id: string;
  title: string;
  estimatedMinutes: number;
  type: "code" | "design" | "break" | "review" | "admin";
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  engine: string;
  thinking?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  hungerRestore: number;
  moodRestore: number;
  energyRestore: number;
  description: string;
}

export interface DesktopIcon {
  id: string;
  title: string;
  icon: string; // Lucide icon name or emoji
  color: string;
  appId: string;
}

export interface AiModelSettings {
  provider: "default" | "openai" | "anthropic" | "gemini";
  baseUrl: string;
  modelName: string;
  apiKey: string;
}

