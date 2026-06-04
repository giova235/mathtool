"use client";

import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { TOPICS, TOPIC_KEYS } from "../lib/topics";

export default function Home() {
  const [problem, setProblem] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("mix");

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

  async function generateProblem() {
    setLoading(true);
    setProblem("");
    try {
      const res = await fetch("/api/problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty: "medio", topic: selectedTopic }),
      });
      const data = await res.json();
      setProblem(data.problem || "Errore nel generare il problema.");
    } catch {
      setProblem("Errore di connessione.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-3xl mx-auto px-6 py-16">

        <header className="mb-12 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
              <span className="text-black font-bold text-sm">M</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">MathTool</h1>
          </div>
          <p className="text-neutral-500 text-sm ml-11">
            Generatore di problemi — terzo liceo scientifico
          </p>
        </header>

        <div className="animate-slide-up" style={{ animationDelay: "0.08s" }}>
          <div className="relative mb-4">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca argomento..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors duration-200"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setSelectedTopic("mix")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedTopic === "mix"
                  ? "bg-white text-black scale-105 shadow-[0_0_16px_rgba(255,255,255,0.12)]"
                  : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-200"
              }`}
            >
              Misto
            </button>
            {filteredTopics.map((key) => (
              <button
                key={key}
                onClick={() => setSelectedTopic(key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedTopic === key
                    ? "bg-white text-black scale-105 shadow-[0_0_16px_rgba(255,255,255,0.12)]"
                    : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-200"
                }`}
              >
                {TOPICS[key].label}
              </button>
            ))}
          </div>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "0.16s" }}>
          <button
            onClick={generateProblem}
            disabled={loading}
            className="relative bg-white text-black px-8 py-3 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 hover:bg-neutral-100 hover:shadow-[0_0_28px_rgba(255,255,255,0.18)]"
          >
            <span className={`transition-opacity duration-150 ${loading ? "opacity-0" : "opacity-100"}`}>
              Genera problema
            </span>
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
          <div className="mt-10 p-8 bg-neutral-900 rounded-xl animate-fade-in">
            <div className="skeleton h-5 w-1/3 mb-6" />
            <div className="space-y-3">
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-5/6" />
              <div className="skeleton h-3 w-4/6" />
            </div>
            <div className="skeleton h-4 w-1/4 mt-8 mb-5" />
            <div className="space-y-3">
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-3/4" />
              <div className="skeleton h-3 w-5/6" />
            </div>
          </div>
        )}

        {problem && !loading && (
          <article className="mt-10 p-8 bg-neutral-900 rounded-xl animate-fade-in prose prose-invert prose-neutral max-w-none prose-headings:text-white prose-headings:font-semibold prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-neutral-800 prose-h2:pb-2 prose-p:leading-relaxed prose-p:text-neutral-300 prose-p:text-sm prose-strong:text-white">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {problem}
            </ReactMarkdown>
          </article>
        )}

      </div>
    </div>
  );
}
