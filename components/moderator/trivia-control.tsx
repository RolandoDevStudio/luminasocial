"use client";

import { useEffect, useState } from "react";
import { Loader2, Rocket } from "lucide-react";
import {
  ensureDemoTriviaQuestions,
  launchTrivia,
  parseTriviaOptions,
} from "@/lib/supabase/gamification";
import type { TriviaQuestion } from "@/types/database";

type TriviaControlProps = {
  eventId: string;
};

export function TriviaControl({ eventId }: TriviaControlProps) {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const rows = await ensureDemoTriviaQuestions(eventId);
        if (!cancelled) {
          setQuestions(rows);
          setSelectedId(rows[0]?.id ?? "");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error cargando trivia");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function handleLaunch() {
    if (!selectedId || launching) return;
    setLaunching(true);
    setError(null);
    try {
      await launchTrivia(eventId, selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo lanzar");
    } finally {
      setLaunching(false);
    }
  }

  return (
    <section className="border border-[#D4AF37]/20 bg-[#12100e] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]">
            Trivia en vivo
          </p>
          <h2 className="font-display mt-1 text-xl text-[#f8f0e3]">
            Lanzar pregunta
          </h2>
        </div>
        <button
          type="button"
          disabled={!selectedId || launching || loading}
          onClick={() => void handleLaunch()}
          className="inline-flex min-h-11 items-center gap-2 bg-[#D4AF37] px-4 text-sm font-semibold text-[#1a140c] disabled:opacity-40"
        >
          {launching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Rocket className="h-4 w-4" />
          )}
          Lanzar Trivia
        </button>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-[#f4ead7]/45">Cargando preguntas…</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {questions.map((q) => (
            <li key={q.id}>
              <label className="flex cursor-pointer gap-3 border border-[#D4AF37]/15 px-3 py-3 hover:border-[#D4AF37]/40">
                <input
                  type="radio"
                  name="trivia-q"
                  checked={selectedId === q.id}
                  onChange={() => setSelectedId(q.id)}
                  className="mt-1 accent-[#D4AF37]"
                />
                <span>
                  <span className="block text-sm text-[#f4ead7]">
                    {q.question}
                  </span>
                  <span className="mt-1 block text-[11px] text-[#f4ead7]/40">
                    {parseTriviaOptions(q.options).join(" · ")}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
    </section>
  );
}
