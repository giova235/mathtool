import Anthropic from "@anthropic-ai/sdk";
import { TOPICS, TOPIC_KEYS, SUBTOPICS } from "../../../lib/topics";

const client = new Anthropic();

export async function POST(request: Request) {
  try {
    const { topic } = await request.json();
    const resolvedTopic = TOPIC_KEYS.includes(topic) ? topic : TOPIC_KEYS[0];
    const topicDef = TOPICS[resolvedTopic];
    const subtopics = SUBTOPICS[resolvedTopic];

    const system = `Sei un insegnante di matematica del liceo scientifico italiano.
Generi problemi diagnostici per studenti del terzo anno.
Rispondi SOLO con JSON valido. Nessun testo aggiuntivo, nessun markdown, nessun code block.`;

    const user = `Genera esattamente 6 problemi diagnostici per: ${topicDef.label.toUpperCase()}
${topicDef.guidance}

Una per ciascuna sottocategoria (nell'ordine esatto):
${subtopics.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Formato richiesto — array JSON di 6 oggetti:
[
  {
    "subtopic": "nome esatto dalla lista sopra",
    "problem": "## Problema\\n\\ntesto del problema con LaTeX usando $...$ inline e $$...$$ display",
    "solution": "## Soluzione\\n\\nsoluzione passo-passo con LaTeX"
  }
]

Difficoltà: adatta a verifica di terzo liceo scientifico.
Rispondi SOLO con il JSON.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system,
      messages: [{ role: "user", content: user }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.type === "text" ? textBlock.text.trim() : "";

    const json = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const problems = JSON.parse(json);

    if (!Array.isArray(problems) || problems.length === 0) {
      throw new Error("Invalid response shape");
    }

    return Response.json({ problems });
  } catch (error) {
    console.error("Diagnostic API error:", error);
    return Response.json({ error: "Failed to generate diagnostic" }, { status: 500 });
  }
}
