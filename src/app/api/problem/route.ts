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

FORMATO DI RISPOSTA — scrivi prima il problema completo, poi aggiungi il blocco dati:

## Problema
[testo con LaTeX]

## Soluzione
[soluzione passo-passo con LaTeX]

[EQ]{"type":"${topic}","h":0,"k":0,...}[/EQ]

Per il blocco [EQ]...[/EQ] usa ESATTAMENTE uno di questi formati (valori numerici reali dal problema):
- ellisse:        {"type":"ellisse","h":0,"k":0,"a":5,"b":3}
- iperbole:       {"type":"iperbole","h":0,"k":0,"a":4,"b":3}
- parabola:       {"type":"parabola","h":2,"k":-1,"a":0.5}   ← y=a(x-h)²+k
- circonferenza:  {"type":"circonferenza","h":1,"k":-2,"r":5}

Scrivi SEMPRE il blocco [EQ]...[/EQ] alla fine.`;

export async function POST(request: Request) {
  try {
    const { difficulty, topic, weakSubtopics } = await request.json();
    const resolvedTopic =
      topic === "mix" || !TOPIC_KEYS.includes(topic)
        ? TOPIC_KEYS[Math.floor(Math.random() * TOPIC_KEYS.length)]
        : topic;

    const userMessage =
      weakSubtopics && weakSubtopics.length > 0
        ? `Genera un problema su "${resolvedTopic}" che testa SPECIFICAMENTE: ${weakSubtopics.join(", ")}. Livello ${difficulty || "medio"}.`
        : `Genera un problema su "${resolvedTopic}", livello ${difficulty || "medio"}. Varia il tipo di problema.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2500,
      system: SYSTEM_PROMPT(resolvedTopic),
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.type === "text" ? textBlock.text.trim() : "";

    // Extract equation from [EQ]...[/EQ] tag
    const eqMatch = raw.match(/\[EQ\]([\s\S]*?)\[\/EQ\]/);
    let equation = null;
    if (eqMatch) {
      try { equation = JSON.parse(eqMatch[1].trim()); } catch { /* ignore */ }
    }

    // Strip the [EQ] block from the problem text
    const problem = raw.replace(/\[EQ\][\s\S]*?\[\/EQ\]/, "").trim();

    return Response.json({ problem, equation });
  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: "Failed to generate problem" }, { status: 500 });
  }
}
