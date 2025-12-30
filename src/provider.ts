type Provider = "openai" | "gemini" | "groq";

export type HelloOutput = {
  ok: true;
  provider: Provider;
  model: string;
  message: string;
};

const DEFAULT_PROMPT = "Hey, how can I help you?";

async function ensureOk(response: Response, provider: string) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${provider} API error ${response.status}: ${text}`);
  }
}

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

async function helloGemini(): Promise<HelloOutput> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is missing");
  }

  const model = "gemini-2.0-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: DEFAULT_PROMPT }],
        },
      ],
    }),
  });

  await ensureOk(response, "Gemini");

  const data = (await response.json()) as GeminiResponse;
  const message =
    data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Hello output";

  return {
    ok: true,
    provider: "gemini",
    model,
    message: message.trim(),
  };
}

type OpenAIStyleResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

async function openAICompatibleCall(
  provider: "openai" | "groq",
  url: string,
  apiKey: string,
  model: string
): Promise<HelloOutput> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: DEFAULT_PROMPT,
        },
      ],
      temperature: 0,
    }),
  });

  await ensureOk(response, provider);

  const data = (await response.json()) as OpenAIStyleResponse;
  const message = data.choices?.[0]?.message?.content ?? "Hello output";

  return {
    ok: true,
    provider,
    model,
    message: message.trim(),
  };
}

async function helloGroq(): Promise<HelloOutput> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing");
  }

  return openAICompatibleCall(
    "groq",
    "https://api.groq.com/openai/v1/chat/completions",
    apiKey,
    "llama-3.1-8b-instant"
  );
}

async function helloOpenAI(): Promise<HelloOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  return openAICompatibleCall(
    "openai",
    "https://api.openai.com/v1/chat/completions",
    apiKey,
    "gpt-5-nano"
  );
}

export async function selectProvider(): Promise<HelloOutput> {
  const provider = (process.env.PROVIDER || "").toLowerCase() as Provider;

  switch (provider) {
    case "gemini":
      return helloGemini();

    case "groq":
      return helloGroq();

    case "openai":
      return helloOpenAI();

    default:
      throw new Error(
        `Unsupported PROVIDER="${provider}". Use: openai | gemini | groq`
      );
  }
}
