import readline from "readline";
import { sendMessage, Message } from "./provider";
import { LoadEnv } from "./env";

type Provider = "openai" | "gemini" | "groq";

async function main() {
  LoadEnv();

  const provider = process.env.PROVIDER as Provider;
  if (!provider) {
    throw new Error("PROVIDER must be openai | gemini | groq");
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const messages: Message[] = [
    { role: "system", content: "You are a helpful assistant." },
  ];

  console.log(`🤖 CLI Chatbot (${provider})`);
  console.log("Commands: /exit , /clear\n");

  const ask = () => {
    rl.question("You: ", async (input) => {
      if (input === "/exit") {
        rl.close();
        return;
      }

      if (input === "/clear") {
        messages.length = 1;
        console.log("🧹 Chat cleared\n");
        return ask();
      }

      messages.push({ role: "user", content: input });

      try {
        const result = await sendMessage(provider, messages);
        console.log(`Bot: ${result.message}\n`);

        messages.push({
          role: "assistant",
          content: result.message,
        });
      } catch (error) {
        console.error("❌ Error:", error);
      }

      ask();
    });
  };

  ask();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
