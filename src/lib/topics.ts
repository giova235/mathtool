export interface TopicDef {
  label: string;
  keywords: string[];
  guidance: string;
}

export const TOPICS: Record<string, TopicDef> = {
  ellisse: {
    label: "Ellisse",
    keywords: ["ellisse", "ellipse", "eccentricità", "fuoco"],
    guidance: `ELLISSE: equazione canonica con fuochi sull'asse maggiore. Concetti: fuochi, vertici, eccentricità, intersezioni con rette, tangenti.`,
  },
  iperbole: {
    label: "Iperbole",
    keywords: ["iperbole", "hyperbola", "asintoti", "asintoto"],
    guidance: `IPERBOLE: equazione canonica, asintoti, eccentricità maggiore di 1. Concetti: fuochi, vertici, asintoti, iperbole equilatera.`,
  },
  parabola: {
    label: "Parabola",
    keywords: ["parabola", "vertice", "direttrice", "asse di simmetria"],
    guidance: `PARABOLA: equazione y = ax^2 + bx + c o x = ay^2 + by + c. Concetti: vertice, fuoco, direttrice, asse di simmetria, tangenti.`,
  },
  circonferenza: {
    label: "Circonferenza",
    keywords: ["circonferenza", "cerchio", "raggio", "centro", "circle"],
    guidance: `CIRCONFERENZA: equazione canonica con centro e raggio. Concetti: tangenti da punto esterno, intersezioni con rette, condizioni di tangenza.`,
  },
};

export const TOPIC_KEYS = Object.keys(TOPICS);

export const SUBTOPICS: Record<string, string[]> = {
  ellisse: [
    "fuochi e vertici",
    "eccentricità",
    "rette tangenti",
    "intersezioni con rette",
    "equazione da condizioni geometriche",
    "distanza dai fuochi",
  ],
  iperbole: [
    "fuochi e vertici",
    "asintoti",
    "eccentricità",
    "rette tangenti",
    "intersezioni con rette",
    "iperbole equilatera",
  ],
  parabola: [
    "vertice e fuoco",
    "direttrice e asse di simmetria",
    "rette tangenti",
    "intersezioni con rette",
    "equazione da condizioni geometriche",
    "problemi misti vertice-fuoco-retta",
  ],
  circonferenza: [
    "centro e raggio dall'equazione",
    "rette tangenti da punto esterno",
    "intersezioni con rette",
    "condizioni di tangenza",
    "equazione da tre punti",
    "posizione reciproca di due circonferenze",
  ],
};

export function searchTopic(query: string): string {
  const q = query.toLowerCase().trim();
  if (!q) return "mix";
  for (const [key, def] of Object.entries(TOPICS)) {
    if (def.label.toLowerCase().includes(q)) return key;
    if (def.keywords.some((kw) => kw.includes(q) || q.includes(kw))) return key;
  }
  return "mix";
}
