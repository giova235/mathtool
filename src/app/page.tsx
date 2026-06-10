"use client";

import { useState, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { TOPICS, TOPIC_KEYS } from "../lib/topics";
import { ConicDiagram } from "../components/ConicDiagram";

type AppMode = "practice" | "diagnostic";
type DiagState = "idle" | "loading" | "quiz" | "results";

interface DiagProblem {
  subtopic: string;
  problem: string;
  solution: string;
  result?: "solved" | "struggled";
}

const DIFFICULTIES = [
  { key: "facile",    label: "Facile",    active: "bg-emerald-500 text-black shadow-[0_0_18px_rgba(16,185,129,0.3)]",  hover: "hover:border-emerald-700 hover:text-emerald-300" },
  { key: "medio",     label: "Medio",     active: "bg-amber-400 text-black shadow-[0_0_18px_rgba(251,191,36,0.3)]",    hover: "hover:border-amber-700 hover:text-amber-300"   },
  { key: "difficile", label: "Difficile", active: "bg-red-500 text-white shadow-[0_0_18px_rgba(239,68,68,0.3)]",       hover: "hover:border-red-700 hover:text-red-300"       },
];

const PROSE = "prose prose-invert prose-neutral max-w-none prose-headings:text-white prose-headings:font-semibold prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h2:border-b prose-h2:border-neutral-800 prose-h2:pb-2 prose-p:leading-relaxed prose-p:text-neutral-300 prose-p:text-sm prose-strong:text-white";

export default function Home() {
  // Practice
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("mix");
  const [difficulty, setDifficulty] = useState("medio");
  const [weakSubtopics, setWeakSubtopics] = useState<string[]>([]);
  const [practiceMode, setPracticeMode] = useState<"free" | "targeted">("free");

  // Mode
  const [appMode, setAppMode] = useState<AppMode>("practice");

  // Diagnostic
  const [diagState, setDiagState] = useState<DiagState>("idle");
  const [diagTopic, setDiagTopic] = useState("ellisse");
  const [diagProblems, setDiagProblems] = useState<DiagProblem[]>([]);
  const [diagIndex, setDiagIndex] = useState(0);
  const [diagShowSolution, setDiagShowSolution] = useState(false);
  const [diagError, setDiagError] = useState("");

  const cardRef = useRef<HTMLElement>(null);

  const filteredTopics = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return TOPIC_KEYS;
    return TOPIC_KEYS.filter((key) => {
      const def = TOPICS[key];
      return (
        def.label.toLowerCase().includes(q) ||
        def.keywords.some((kw) => kw.includes(q) || q.includes(kw))
      );
    });
  }, [search]);

  function handleCardMove(e: React.MouseEvent<HTMLElement>) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    card.style.boxShadow = `${-x * 20}px ${-y * 20}px 40px rgba(99,102,241,0.12)`;
  }

  function handleCardLeave() {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
    card.style.boxShadow = "none";
  }

  async function generateProblem() {
    setLoading(true);
    setProblem("");
    try {
      const res = await fetch("/api/problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty,
          topic: selectedTopic,
          weakSubtopics: practiceMode === "targeted" ? weakSubtopics : undefined,
        }),
      });
      const data = await res.json();
      setProblem(data.problem || "Errore nel generare il problema.");
    } catch {
      setProblem("Errore di connessione.");
    }
    setLoading(false);
  }

  async function startDiagnostic() {
    setDiagState("loading");
    setDiagError("");
    try {
      const res = await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: diagTopic }),
      });
      const data = await res.json();
      if (data.problems && Array.isArray(data.problems) && data.problems.length > 0) {
        setDiagProblems(data.problems);
        setDiagIndex(0);
        setDiagShowSolution(false);
        setDiagState("quiz");
      } else {
        setDiagError("Errore nella generazione. Riprova.");
        setDiagState("idle");
      }
    } catch {
      setDiagError("Errore di connessione. Riprova.");
      setDiagState("idle");
    }
  }

  function answerDiagnostic(result: "solved" | "struggled") {
    const updated = diagProblems.map((p, i) =>
      i === diagIndex ? { ...p, result } : p
    );
    setDiagProblems(updated);
    if (diagIndex < diagProblems.length - 1) {
      setDiagIndex(diagIndex + 1);
      setDiagShowSolution(false);
    } else {
      setDiagState("results");
    }
  }

  function startTargetedPractice() {
    const weak = diagProblems.filter((p) => p.result === "struggled").map((p) => p.subtopic);
    setWeakSubtopics(weak);
    setPracticeMode(weak.length > 0 ? "targeted" : "free");
    setSelectedTopic(diagTopic);
    setProblem("");
    setAppMode("practice");
  }

  function resetDiagnostic() {
    setDiagState("idle");
    setDiagProblems([]);
    setDiagIndex(0);
    setDiagShowSolution(false);
    setDiagError("");
  }

  const solidSubtopics = diagProblems.filter((p) => p.result === "solved").map((p) => p.subtopic);
  const weakResults    = diagProblems.filter((p) => p.result === "struggled").map((p) => p.subtopic);
  const currentDiag    = diagProblems[diagIndex];

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100 overflow-hidden">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="bg-grid absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-950" />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 py-16">

        {/* Header */}
        <header className="mb-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.25)]">
              <span className="text-black font-bold text-sm">M</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">MathTool</h1>
          </div>
          <p className="text-neutral-500 text-sm ml-12">Preparati alla verifica</p>
        </header>

        {/* Mode tabs */}
        <div className="flex gap-1 mb-10 p-1 bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-xl w-fit animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <button
            onClick={() => setAppMode("practice")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${appMode === "practice" ? "bg-white text-black shadow-sm" : "text-neutral-400 hover:text-neutral-200"}`}
          >
            Pratica
          </button>
          <button
            onClick={() => { setAppMode("diagnostic"); resetDiagnostic(); }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${appMode === "diagnostic" ? "bg-white text-black shadow-sm" : "text-neutral-400 hover:text-neutral-200"}`}
          >
            Diagnosi
          </button>
        </div>

        {/* ── PRACTICE ── */}
        {appMode === "practice" && (
          <>
            {practiceMode === "targeted" && weakSubtopics.length > 0 && (
              <div className="mb-6 p-4 bg-indigo-950/60 backdrop-blur border border-indigo-800/50 rounded-xl animate-fade-in">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest mb-1">Pratica mirata</p>
                    <p className="text-sm text-neutral-400">Focus su: <span className="text-white">{weakSubtopics.join(", ")}</span></p>
                  </div>
                  <button onClick={() => { setPracticeMode("free"); setWeakSubtopics([]); }} className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors shrink-0">
                    Rimuovi
                  </button>
                </div>
              </div>
            )}

            <div className="animate-slide-up" style={{ animationDelay: "0.08s" }}>
              <div className="relative mb-4">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cerca argomento..."
                  className="w-full bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors duration-200"
                />
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                <button onClick={() => setSelectedTopic("mix")} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${selectedTopic === "mix" ? "bg-white text-black scale-105 shadow-[0_0_18px_rgba(255,255,255,0.2)]" : "bg-neutral-900/80 backdrop-blur text-neutral-400 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-200"}`}>
                  Misto
                </button>
                {filteredTopics.map((key) => (
                  <button key={key} onClick={() => setSelectedTopic(key)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${selectedTopic === key ? "bg-white text-black scale-105 shadow-[0_0_18px_rgba(255,255,255,0.2)]" : "bg-neutral-900/80 backdrop-blur text-neutral-400 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-200"}`}>
                    {TOPICS[key].label}
                  </button>
                ))}
              </div>
            </div>

            <ConicDiagram topic={selectedTopic} />

            <div className="animate-slide-up mb-8" style={{ animationDelay: "0.12s" }}>
              <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Difficoltà</p>
              <div className="flex gap-2">
                {DIFFICULTIES.map(({ key, label, active, hover }) => (
                  <button key={key} onClick={() => setDifficulty(key)} className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${difficulty === key ? `${active} scale-105` : `bg-neutral-900/80 backdrop-blur text-neutral-400 border border-neutral-800 ${hover}`}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="animate-slide-up" style={{ animationDelay: "0.16s" }}>
              <button onClick={generateProblem} disabled={loading} className="relative bg-white text-black px-8 py-3 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 hover:bg-neutral-100 hover:shadow-[0_0_32px_rgba(255,255,255,0.2)]">
                <span className={`transition-opacity duration-150 ${loading ? "opacity-0" : "opacity-100"}`}>Genera problema</span>
                {loading && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin w-4 h-4 text-black" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </span>
                )}
              </button>
            </div>

            {loading && (
              <div className="mt-10 p-8 bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-2xl animate-fade-in">
                <div className="skeleton h-5 w-1/3 mb-6" />
                <div className="space-y-3 mb-8">
                  <div className="skeleton h-3 w-full" /><div className="skeleton h-3 w-5/6" /><div className="skeleton h-3 w-4/6" />
                </div>
                <div className="skeleton h-4 w-1/4 mb-5" />
                <div className="space-y-3">
                  <div className="skeleton h-3 w-full" /><div className="skeleton h-3 w-3/4" /><div className="skeleton h-3 w-5/6" />
                </div>
              </div>
            )}

            {problem && !loading && (
              <article ref={cardRef} onMouseMove={handleCardMove} onMouseLeave={handleCardLeave} className={`card-3d mt-10 p-8 bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-2xl animate-fade-in ${PROSE}`}>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{problem}</ReactMarkdown>
              </article>
            )}
          </>
        )}

        {/* ── DIAGNOSTIC ── */}
        {appMode === "diagnostic" && (
          <>
            {/* Idle */}
            {diagState === "idle" && (
              <div className="animate-slide-up">
                <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
                  Completa 6 esercizi per scoprire i tuoi punti deboli, poi ricevi una sessione di pratica mirata sulle aree in difficoltà.
                </p>
                <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Argomento</p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {TOPIC_KEYS.map((key) => (
                    <button key={key} onClick={() => setDiagTopic(key)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${diagTopic === key ? "bg-white text-black scale-105 shadow-[0_0_18px_rgba(255,255,255,0.2)]" : "bg-neutral-900/80 backdrop-blur text-neutral-400 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-200"}`}>
                      {TOPICS[key].label}
                    </button>
                  ))}
                </div>
                {diagError && <p className="text-red-400 text-sm mb-4">{diagError}</p>}
                <button onClick={startDiagnostic} className="bg-white text-black px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 hover:bg-neutral-100 hover:shadow-[0_0_32px_rgba(255,255,255,0.2)]">
                  Inizia diagnosi
                </button>
              </div>
            )}

            {/* Loading */}
            {diagState === "loading" && (
              <div className="animate-fade-in">
                <p className="text-neutral-400 text-sm mb-6">Generazione dei 6 problemi diagnostici in corso…</p>
                <div className="p-8 bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-2xl space-y-4">
                  <div className="skeleton h-5 w-1/3" />
                  <div className="skeleton h-3 w-full" /><div className="skeleton h-3 w-5/6" /><div className="skeleton h-3 w-4/6" />
                </div>
              </div>
            )}

            {/* Quiz */}
            {diagState === "quiz" && currentDiag && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-neutral-500 uppercase tracking-widest">Problema {diagIndex + 1} / {diagProblems.length}</span>
                  <span className="text-xs text-neutral-500">{currentDiag.subtopic}</span>
                </div>
                <div className="w-full h-1 bg-neutral-800 rounded-full mb-8 overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${((diagIndex + 1) / diagProblems.length) * 100}%` }} />
                </div>

                <div className={`p-8 bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-2xl mb-4 ${PROSE}`}>
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{currentDiag.problem}</ReactMarkdown>
                </div>

                {!diagShowSolution && (
                  <button onClick={() => setDiagShowSolution(true)} className="w-full py-3 rounded-xl border border-neutral-700 text-sm text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-all duration-200 mb-4">
                    Mostra soluzione
                  </button>
                )}

                {diagShowSolution && (
                  <div className="animate-fade-in">
                    <div className={`p-6 bg-neutral-900/60 backdrop-blur border border-neutral-700 rounded-2xl mb-4 ${PROSE}`}>
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{currentDiag.solution}</ReactMarkdown>
                    </div>
                    <p className="text-xs text-neutral-500 text-center mb-3">Hai risolto questo problema?</p>
                    <div className="flex gap-3">
                      <button onClick={() => answerDiagnostic("solved")} className="flex-1 py-3 rounded-xl bg-emerald-600/20 border border-emerald-700/50 text-emerald-400 text-sm font-medium hover:bg-emerald-600/30 hover:border-emerald-600 transition-all duration-200 active:scale-95">
                        ✓ Risolto
                      </button>
                      <button onClick={() => answerDiagnostic("struggled")} className="flex-1 py-3 rounded-xl bg-red-600/20 border border-red-700/50 text-red-400 text-sm font-medium hover:bg-red-600/30 hover:border-red-600 transition-all duration-200 active:scale-95">
                        ✗ Ho avuto difficoltà
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Results */}
            {diagState === "results" && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-bold mb-1">Risultati diagnosi</h2>
                <p className="text-neutral-400 text-sm mb-8">{TOPICS[diagTopic]?.label} — {diagProblems.length} problemi completati</p>

                {solidSubtopics.length > 0 && (
                  <div className="mb-4 p-5 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl">
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">Solido in</p>
                    <div className="flex flex-wrap gap-2">
                      {solidSubtopics.map((s) => (
                        <span key={s} className="px-3 py-1 bg-emerald-900/40 border border-emerald-800/60 rounded-full text-sm text-emerald-300">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {weakResults.length > 0 ? (
                  <div className="mb-8 p-5 bg-red-950/40 border border-red-800/40 rounded-2xl">
                    <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-3">Da rivedere</p>
                    <div className="flex flex-wrap gap-2">
                      {weakResults.map((s) => (
                        <span key={s} className="px-3 py-1 bg-red-900/40 border border-red-800/60 rounded-full text-sm text-red-300">{s}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 p-5 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl">
                    <p className="text-emerald-300 text-sm">Ottimo! Nessuna area debole rilevata.</p>
                  </div>
                )}

                <div className="flex gap-3">
                  {weakResults.length > 0 && (
                    <button onClick={startTargetedPractice} className="flex-1 bg-white text-black py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 hover:bg-neutral-100 hover:shadow-[0_0_32px_rgba(255,255,255,0.2)]">
                      Inizia pratica mirata →
                    </button>
                  )}
                  <button onClick={resetDiagnostic} className={`py-3 rounded-xl border border-neutral-700 text-sm text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-all duration-200 ${weakResults.length > 0 ? "px-5" : "flex-1"}`}>
                    Rifai diagnosi
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
