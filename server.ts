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

// 2. API: Chat with Pet (Supporting multi-engine emulation)
app.post("/api/pet/chat", async (req, res) => {
  try {
    const { message, history, petType, petName, engine, activeTask, mood } = req.body;

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
    }[petType as "Hermes" | "Mochi" | "Kuro" | "Pippin"] || {
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

    // Initialize Gemini
    const ai = getGeminiClient();
    const contents = [];

    // Append formatted conversation history
    if (history && Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        });
      }
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    const replyText = response.text || "(*looks confused* I got a bit dizzy...)";
    res.json({ reply: replyText });
  } catch (err: any) {
    console.error("Gemini API error:", err);
    res.status(500).json({
      error: "Failed to generate AI response",
      details: err.message,
    });
  }
});

// 3. API: Break down a high-level goal into actionable, cute tasks for the pet
app.post("/api/pet/plan-tasks", async (req, res) => {
  try {
    const { goal, petType } = req.body;

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

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Generate tasks for goal: " + goal,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              estimatedMinutes: { type: Type.INTEGER },
              type: { type: Type.STRING },
            },
            required: ["title", "estimatedMinutes", "type"],
          },
        },
      },
    });

    const tasksJson = JSON.parse(response.text || "[]");
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
