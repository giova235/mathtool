import Anthropic from "@anthropic-ai/sdk";
import { TOPICS, TOPIC_KEYS } from "../../../lib/topics";

const client = new Anthropic();

const SYSTEM_PROMPT = (topic: string) => `Sei un insegnante di matematica del liceo scientifico italiano. Generi problemi per studenti del terzo anno.

ARGOMENTO: ${topic.toUpperCase()}
${TOPICS[topic]?.guidance ?? TOPICS.ellisse.guidance}

REGOLE:
- Scrivi sempre in italiano.
- Formatta tutta la matematica in LaTeX con $...$ inline e $$...$$ display.
- Difficoltà adatta a verifica di terzo liceo scientifico.
- Varia il tipo di problema.

FORMATO:

## Problema
[testo con LaTeX]

## Soluzione
[soluzione passo-passo con LaTeX]`;

export async function POST(request: Request) {
  try {
    const { difficulty, topic } = await request.json();
    const resolvedTopic =
      topic === "mix" || !TOPIC_KEYS.includes(topic)
        ? TOPIC_KEYS[Math.floor(Math.random() * TOPIC_KEYS.length)]
        : topic;

    const userMessage = `Genera un problema su "${resolvedTopic}", livello ${difficulty || "medio"}. Varia il tipo di problema.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      system: SYSTEM_PROMPT(resolvedTopic),
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock && textBlock.type === "text" ? textBlock.text : "";

    return Response.json({ problem: text });
  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: "Failed to generate problem" }, { status: 500 });
  }
}
