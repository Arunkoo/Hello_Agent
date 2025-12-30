type Provider = "openai" | "gemini" | "groq";

type HelloOutput = {
  ok: true;
  provider: Provider;
  model: string;
  message: string;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

async function HelloGemini(): Promise<HelloOutput> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("Google api key is not presented!");
  const model = "gemini-2.0-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?=key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: "Hey, how  can i help you?",
            },
          ],
        },
      ],
    }),
  });
  if (!response.ok)
    throw new Error(`Gemini ${response.status}: ${await response.text()}`);
  const json = (await response.json()) as GeminiGenerateContentResponse;
  const text = json.candidates?.[0].content?.parts?.[0]?.text ?? "Hello output";

  return {
    ok: true,
    provider: "gemini",
    model,
    message: String(text).trim(),
  };
}

type OpenAiChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

export async function helloGroq(): Promise<HelloOutput> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Groq api key is not present");
  const model = "llama-3.1-8b-instant";
  const url = `https://api.groq.com/openai/v1/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "Application/Json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      message: [
        {
          role: "user",
          content: "How, i can help you?",
        },
      ],
      temprature: 0,
    }),
  });
  if (!response.ok)
    throw new Error(`Groq ${response.status}:${await response.text()}`);
  const json = (await response.json()) as OpenAiChatCompletionResponse;
  const content = json?.choices?.[0].message?.content ?? "Hello output";

  return {
    ok: true,
    provider: "groq",
    model,
    message: String(content).trim(),
  };
}
