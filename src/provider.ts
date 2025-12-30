type Provider = "openai" | "gemini" | "groq";

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatOutput = {
  ok: true;
  provider: Provider;
  model: string;
  message: string;
};

async function ensureOk(response: Response, provider: string) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${provider} API error ${response.status}: ${text}`);
  }
}

/* ---------------- Gemini ---------------- */

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

async function chatGemini(messages: Message[]): Promise<ChatOutput> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY is missing");

  const model = "gemini-2.0-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    }),
  });

  await ensureOk(response, "Gemini");

  const data = (await response.json()) as GeminiResponse;
  const message = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  return {
    ok: true,
    provider: "gemini",
    model,
    message: message.trim(),
  };
}

/* ---------------- OpenAI / Groq ---------------- */

type OpenAIStyleResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

async function chatOpenAIStyle(
  provider: "openai" | "groq",
  url: string,
  apiKey: string,
  model: string,
  messages: Message[]
): Promise<ChatOutput> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
  });

  await ensureOk(response, provider);

  const data = (await response.json()) as OpenAIStyleResponse;
  const message = data.choices?.[0]?.message?.content ?? "";

  return {
    ok: true,
    provider,
    model,
    message: message.trim(),
  };
}

/* ---------------- Provider Wrappers ---------------- */

async function chatGroq(messages: Message[]): Promise<ChatOutput> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is missing");

  return chatOpenAIStyle(
    "groq",
    "https://api.groq.com/openai/v1/chat/completions",
    apiKey,
    "llama-3.1-8b-instant",
    messages
  );
}

async function chatOpenAI(messages: Message[]): Promise<ChatOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");

  return chatOpenAIStyle(
    "openai",
    "https://api.openai.com/v1/chat/completions",
    apiKey,
    "gpt-5-nano",
    messages
  );
}

/* ---------------- Selector ---------------- */

export async function sendMessage(
  provider: Provider,
  messages: Message[]
): Promise<ChatOutput> {
  switch (provider) {
    case "gemini":
      return chatGemini(messages);
    case "groq":
      return chatGroq(messages);
    case "openai":
      return chatOpenAI(messages);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
