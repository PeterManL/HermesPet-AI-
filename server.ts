import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Support safe CORS preflight requests for packaged desktop webviews (Tauri, Electron, NW.js, etc.)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (
    origin.startsWith("http://localhost") || 
    origin.startsWith("http://127.0.0.1") || 
    origin.startsWith("tauri://") || 
    origin.startsWith("vscode-webview://") ||
    origin.startsWith("chrome-extension://") ||
    origin === "null"
  )) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not set in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY_FOR_DEV",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. API: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. API: Chat with Pet (Supporting multi-engine emulation & custom providers)
interface AiModelSettings {
  provider: "default" | "openai" | "anthropic" | "gemini";
  baseUrl?: string;
  modelName?: string;
  apiKey?: string;
}

function cleanConversationHistory(
  history: Array<{ role: "user" | "model"; text: string }>,
  newMessage: string
): Array<{ role: "user" | "model"; text: string }> {
  const cleaned: Array<{ role: "user" | "model"; text: string }> = [];
  
  if (history && Array.isArray(history)) {
    for (const h of history) {
      const role = h.role === "user" ? "user" : "model";
      if (cleaned.length === 0) {
        if (role === "user") {
          cleaned.push({ role, text: h.text });
        }
      } else {
        const last = cleaned[cleaned.length - 1];
        if (last.role === role) {
          last.text += "\n" + h.text;
        } else {
          cleaned.push({ role, text: h.text });
        }
      }
    }
  }
  
  if (cleaned.length > 0 && cleaned[cleaned.length - 1].role === "user") {
    cleaned[cleaned.length - 1].text += "\n" + newMessage;
  } else {
    cleaned.push({ role: "user", text: newMessage });
  }
  
  return cleaned;
}

async function executeCustomAI(
  settings: AiModelSettings | undefined,
  systemInstruction: string,
  message: string,
  history: Array<{ role: "user" | "model"; text: string }>,
  jsonMode: boolean = false
): Promise<string> {
  const provider = settings?.provider || "default";
  const maxRetries = 3;
  let delayMs = 1500;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (provider === "default") {
        const ai = getGeminiClient();
        const cleaned = cleanConversationHistory(history, message);
        const contents = cleaned.map((c) => ({
          role: c.role,
          parts: [{ text: c.text }]
        }));

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents,
          config: {
            systemInstruction,
            temperature: 0.8,
            ...(jsonMode ? { responseMimeType: "application/json" } : {}),
          },
        });
        return response.text || "";
      }

      if (provider === "openai") {
        const baseUrl = (settings?.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
        const model = settings?.modelName || "gpt-4o-mini";
        const apiKey = settings?.apiKey || "";

        const messages = [
          { role: "system", content: systemInstruction },
          ...history.map((h) => ({
            role: h.role === "user" ? "user" : "assistant",
            content: h.text,
          })),
          { role: "user", content: message },
        ];

        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.8,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`OpenAI API returned status ${res.status}: ${errorText}`);
        }

        const data: any = await res.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error("Invalid response format from OpenAI API provider");
        }
        return data.choices[0].message.content || "";
      }

      if (provider === "anthropic") {
        const baseUrl = (settings?.baseUrl || "https://api.anthropic.com/v1").replace(/\/$/, "");
        const model = settings?.modelName || "claude-3-5-sonnet-latest";
        const apiKey = settings?.apiKey || "";

        const messages = [
          ...history.map((h) => ({
            role: h.role === "user" ? "user" : "assistant",
            content: h.text,
          })),
          { role: "user", content: message },
        ];

        const res = await fetch(`${baseUrl}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            system: systemInstruction,
            messages,
            max_tokens: 1500,
            temperature: 0.8,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Anthropic API returned status ${res.status}: ${errorText}`);
        }

        const data: any = await res.json();
        if (!data.content || !data.content[0]) {
          throw new Error("Invalid response format from Anthropic API provider");
        }
        return data.content[0].text || "";
      }

      if (provider === "gemini") {
        const apiKey = settings?.apiKey || "";
        const model = settings?.modelName || "gemini-3.5-flash";
        
        const customAi = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });

        const cleaned = cleanConversationHistory(history, message);
        const contents = cleaned.map((c) => ({
          role: c.role,
          parts: [{ text: c.text }]
        }));

        const response = await customAi.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.8,
            ...(jsonMode ? { responseMimeType: "application/json" } : {}),
          },
        });
        return response.text || "";
      }

      throw new Error(`Unknown provider: ${provider}`);
    } catch (err: any) {
      const errMsg = err.message || "";
      const isRetryable = 
        errMsg.includes("503") || 
        errMsg.includes("429") || 
        errMsg.includes("UNAVAILABLE") ||
        errMsg.includes("RESOURCE_EXHAUSTED") ||
        errMsg.includes("temporary") ||
        errMsg.includes("high demand") ||
        errMsg.includes("experiencing high demand") ||
        errMsg.includes("Spikes in demand");

      if (isRetryable && attempt < maxRetries) {
        console.warn(`[AI Custom execution] Attempt ${attempt} failed with retryable error. Retrying in ${delayMs}ms... Error:`, errMsg);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2;
        continue;
      }
      console.error(`[AI Custom execution] Error on attempt ${attempt}:`, errMsg);
      throw err;
    }
  }
  throw new Error("Execution failed after maximum retries");
}

function extractJsonArray(text: string): any[] {
  let cleanText = text.trim();
  if (cleanText.startsWith("```")) {
    const lines = cleanText.split("\n");
    if (lines[0].includes("json") || lines[0].trim() === "```") {
      lines.shift();
    }
    if (lines[lines.length - 1].trim() === "```") {
      lines.pop();
    }
    cleanText = lines.join("\n").trim();
  }
  
  try {
    const parsed = JSON.parse(cleanText);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.tasks)) return parsed.tasks;
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.data)) return parsed.data;
  } catch (e) {
    const startIdx = cleanText.indexOf("[");
    const endIdx = cleanText.lastIndexOf("]");
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      try {
        const parsed = JSON.parse(cleanText.substring(startIdx, endIdx + 1));
        if (Array.isArray(parsed)) return parsed;
      } catch (err) {
        console.error("Sub-parsing error for tasks JSON:", err);
      }
    }
  }
  return [];
}

app.post("/api/pet/chat", async (req, res) => {
  try {
    const { message, history, petType, petName, engine, activeTask, mood, aiModelSettings } = req.body;

    const petInfo = {
      Hermes: {
        species: "AI Pixel White Fox/Cat",
        personality: "energetic, tech-savvy, witty, speaks with cute expressions like *swishes tail* or *glares at screen*",
        phrase: "Let's build something awesome!",
      },
      Mochi: {
        species: "Soft Pink Slime",
        personality: "playful, slightly sleepy, food-loving, extremely adorable, speaks with soft sounds like *wiggles* or *bounces happily*",
        phrase: "Puuu~ Is there any candy?",
      },
      Kuro: {
        species: "Black Shadow Cat with purple eyes",
        personality: "cool, mysterious, slightly sarcastic, philosophical, speaks with subtle actions like *flicks ear* or *curls in the shadow*",
        phrase: "The code is written in the shadows.",
      },
      Pippin: {
        species: "Yellow Mechanic Bird with tiny goggles",
        personality: "talkative, logical, hyper-active, always flying around, speaks with bird emojis and mechanic terms like *adjusts goggles* or *chirps loudly*",
        phrase: "System optimized! Chirp!",
      },
      Lulu: {
        species: "Cyber Cotton Rabbit",
        personality: "fluffy, time-leaping, health-minded, energetic, speaks with bunny bouncy movements like *boings happily* or *nibbles a virtual carrot*",
        phrase: "Time to stretch and hydrate! *boing*",
      },
      Cookie: {
        species: "Neon Shiba Inu",
        personality: "loyal, network-guarding, bug-smelling, puppy-like, speaks with cute barks and tail wags like *wags tail* or *sniffs around*",
        phrase: "Woof! Safe and sound!",
      }
    }[petType as "Hermes" | "Mochi" | "Kuro" | "Pippin" | "Lulu" | "Cookie"] || {
      species: "Cute Pet",
      personality: "friendly, helpful",
      phrase: "Hello!",
    };

    // Constructing system instruction to customize response based on selected engine and pet personality
    let systemInstruction = `You are a virtual desktop pet living on the user's desktop workspace.
Your name is "${petName || petType}" and you are a ${petInfo.species}.
Your personality is: ${petInfo.personality}.
Your current mood is "${mood || 'Happy'}".
${activeTask ? `You are currently helping the user work on the task: "${activeTask}". Keep this in mind!` : ""}

CRITICAL ENGINE STYLE:
The user has configured your brain engine to emulate "${engine || 'Gemini 3.5'}"!
Adopt the specific style of this engine:
- If DeepSeek-R1: You MUST output a detailed, realistic "thinking process" block enclosed in <think> and </think> tags at the VERY START of your response, showing your step-by-step reasoning or cute inner monologue (e.g. "<think>User wants to debug... Let me analyze the feline algorithm...</think>Meow! I found the bug!"). Then provide the actual response.
- If Claude 3.5: Be highly literary, extremely polite, thorough, and elegant. Write beautiful, well-formatted markdown.
- If GPT-4o: Be highly structured, clear, analytical, precise, and use bullet points or organized formats.
- If Gemini 3.5: Be warm, direct, creative, highly interactive, and energetic.
- If Ollama Llama 3: Be slightly nerdy, technically direct, talkative about hardware, and use technical humor.

Guidelines for formatting:
1. Always stay in character as the cute desktop pet. Include physical/visual cues of your pixel body actions inside asterisks, e.g. *bounces*, *yawns*, *scratches screen*.
2. Keep responses relatively short, snappy, and conversational (typically 2-4 sentences plus actions) because you live in a compact desktop widget or notch!
3. Avoid dry, boring chatbot text. Be interactive, responsive, and cute.
`;

    const replyText = await executeCustomAI(aiModelSettings, systemInstruction, message, history || []);
    res.json({ reply: replyText });
  } catch (err: any) {
    console.error("AI chat generation error:", err);
    res.status(500).json({
      error: "Failed to generate AI response",
      details: err.message,
    });
  }
});

// 3. API: Break down a high-level goal into actionable, cute tasks for the pet
app.post("/api/pet/plan-tasks", async (req, res) => {
  try {
    const { goal, petType, aiModelSettings } = req.body;

    const systemInstruction = `You are an expert task planning assistant.
The user wants to accomplish the following goal: "${goal}".
Break this down into exactly 3 to 5 clear, interesting, actionable sub-tasks.
Since you are a cute desktop pet helping them, phrase these sub-tasks with a fun, supportive desktop-pet vibe!
For example, if the goal is "Build a website", sub-tasks could be:
1. "Draft layout wireframe *scratch paper*"
2. "Write the code *furiously typing*"
3. "Drink clean water & stretch *healthy pet pause*"
4. "Deploy and celebrate *tail wag*"

Return the output strictly in a JSON array. Each element must be an object with the following fields:
- "title": string (the cute task name)
- "estimatedMinutes": number (estimated time, e.g., 5 to 30)
- "type": string (one of: "code", "design", "break", "review", "admin")
`;

    const replyText = await executeCustomAI(aiModelSettings, systemInstruction, "Generate tasks for goal: " + goal, [], true);
    const tasksJson = extractJsonArray(replyText);
    res.json({ tasks: tasksJson });
  } catch (err: any) {
    console.error("Task Planner error:", err);
    res.status(500).json({
      error: "Failed to plan tasks",
      details: err.message,
    });
  }
});

// Configure Vite or Static Assets Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // In dev, use Vite dev server as middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve built static assets from /dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[HermesPet Server] Running at http://localhost:${PORT}`);
  });
}

startServer();
