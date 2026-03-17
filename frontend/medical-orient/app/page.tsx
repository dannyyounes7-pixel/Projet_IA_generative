"use client";

import { useMemo, useState } from "react";
import {
  Stethoscope,
  HeartPulse,
  Brain,
  Eye,
  ShieldAlert,
  Pill,
  Activity,
  Thermometer,
  Droplets,
  Bone,
  UserRound,
  Hospital,
  BarChart2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Timer,
  Flame,
} from "lucide-react";

type Guided = {
  fever?: boolean;
  chest_pain?: boolean;
  severe_breathing?: boolean;
  fainting?: boolean;
  neuro_signs?: boolean;
  severe_abdominal_pain?: boolean;
  blood_in_stool?: boolean;
  blood_in_urine?: boolean;
};

type Recommendation = {
  specialty: string;
  score: number;
  score_label: string;
  med_id: number;
};

type ApiResponse = {
  disclaimer: string;
  red_flags: string[];
  urgency: "urgent" | "non_urgent";
  top3: Recommendation[];
  explanation: string;
};

const SECTION_DEFS = [
  { key: "resume", titles: ["Resume", "Résumé"], icon: "📋", color: "sky" },
  {
    key: "orientation",
    titles: ["Orientation proposee", "Orientation proposée"],
    icon: "🧭",
    color: "violet",
  },
  {
    key: "symptomes",
    titles: ["Symptomes reperes", "Symptômes repérés"],
    icon: "🔍",
    color: "amber",
  },
  {
    key: "alertes",
    titles: ["Signaux d alerte", "Signaux d'alerte"],
    icon: "⚠️",
    color: "red",
  },
  {
    key: "etapes",
    titles: ["Prochaines etapes", "Prochaines étapes"],
    icon: "✅",
    color: "emerald",
  },
];

type GenAISection = {
  key: string;
  title: string;
  icon: string;
  color: string;
  content: string;
};

function parseGenAISections(text: string): GenAISection[] {
  if (!text) return [];

  const allTitles = SECTION_DEFS.flatMap((s) => s.titles);
  const escaped = allTitles.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const splitRegex = new RegExp(`(${escaped.join("|")})`, "gi");

  const parts = text
    .split(splitRegex)
    .map((p) => p.trim())
    .filter(Boolean);

  const sections: GenAISection[] = [];
  let i = 0;
  while (i < parts.length) {
    const chunk = parts[i];
    const def = SECTION_DEFS.find((s) =>
      s.titles.some((t) => t.toLowerCase() === chunk.toLowerCase()),
    );

    if (def && i + 1 < parts.length) {
      sections.push({
        key: def.key,
        title: def.titles[0],
        icon: def.icon,
        color: def.color,
        content: parts[i + 1],
      });
      i += 2;
    } else {
      if (sections.length === 0 && chunk.length > 10) {
        sections.push({
          key: "intro",
          title: "Introduction",
          icon: "💬",
          color: "slate",
          content: chunk,
        });
      }
      i++;
    }
  }

  if (sections.length === 0) {
    sections.push({
      key: "raw",
      title: "Synthèse",
      icon: "🤖",
      color: "slate",
      content: text,
    });
  }

  return sections;
}

const sectionColors: Record<string, { bg: string; border: string; title: string; icon: string }> = {
  sky: {
    bg: "bg-sky-50/90",
    border: "border-sky-200",
    title: "text-sky-800",
    icon: "bg-sky-100",
  },
  violet: {
    bg: "bg-violet-50/90",
    border: "border-violet-200",
    title: "text-violet-800",
    icon: "bg-violet-100",
  },
  amber: {
    bg: "bg-amber-50/90",
    border: "border-amber-200",
    title: "text-amber-800",
    icon: "bg-amber-100",
  },
  red: {
    bg: "bg-red-50/90",
    border: "border-red-200",
    title: "text-red-800",
    icon: "bg-red-100",
  },
  emerald: {
    bg: "bg-emerald-50/90",
    border: "border-emerald-200",
    title: "text-emerald-800",
    icon: "bg-emerald-100",
  },
  slate: {
    bg: "bg-slate-50/90",
    border: "border-slate-200",
    title: "text-slate-700",
    icon: "bg-slate-100",
  },
};

function GenAIExplanation({ explanation }: { explanation: string }) {
  const sections = parseGenAISections(explanation);
  return (
    <div className="mt-3 space-y-3">
      {sections.map((s, idx) => {
        const c = sectionColors[s.color] ?? sectionColors.slate;
        return (
          <div
            key={`${s.key}-${idx}`}
            className={`rounded-2xl border p-4 backdrop-blur-sm transition-all hover:-translate-y-0.5 ${c.bg} ${c.border}`}
          >
            <div className={`mb-2 flex items-center gap-2 text-sm font-semibold ${c.title}`}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-base ${c.icon}`}>
                {s.icon}
              </span>
              {s.title}
            </div>
            <div className={`whitespace-pre-wrap text-sm leading-relaxed ${c.title} opacity-90`}>
              {s.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function scoreMeta(score: number): { color: string; bg: string; border: string; label: string } {
  if (score >= 0.6)
    return {
      color: "text-emerald-700",
      bg: "from-emerald-400 to-emerald-600",
      border: "border-emerald-200",
      label: "Orientation principale",
    };
  if (score >= 0.4)
    return {
      color: "text-orange-600",
      bg: "from-orange-300 to-orange-500",
      border: "border-orange-200",
      label: "Orientation secondaire",
    };
  if (score >= 0.3)
    return {
      color: "text-slate-500",
      bg: "from-slate-300 to-slate-500",
      border: "border-slate-200",
      label: "Faible correspondance",
    };

  return {
    color: "text-slate-400",
    bg: "from-slate-200 to-slate-400",
    border: "border-slate-100",
    label: "Très faible correspondance",
  };
}

function ScoreChart({ top3 }: { top3: Recommendation[] }) {
  return (
    <div className="mt-5 rounded-3xl border border-white/60 bg-white/80 p-5 shadow-lg shadow-sky-100 backdrop-blur">
      <div className="mb-4 flex items-center gap-2">
        <BarChart2 className="h-5 w-5 text-sky-600" />
        <h3 className="text-sm font-semibold text-slate-700">Scores de correspondance</h3>
      </div>

      <div className="space-y-4">
        {top3.map((r, i) => {
          const meta = scoreMeta(r.score);
          const pct = Math.round(r.score * 100);
          return (
            <div key={r.med_id}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${meta.color}`}>#{i + 1}</span>
                  <span className="text-sm font-medium text-slate-700">{r.specialty}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border bg-white px-2 py-0.5 text-xs font-medium ${meta.color} ${meta.border}`}
                  >
                    {meta.label}
                  </span>
                  <span className={`text-sm font-bold ${meta.color}`}>{pct}%</span>
                </div>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-3 rounded-full bg-gradient-to-r transition-all duration-700 ease-out ${meta.bg}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const guidedQuestions: Array<[keyof Guided, string]> = [
  ["chest_pain", "Douleur thoracique importante"],
  ["severe_breathing", "Difficulté respiratoire importante"],
  ["fainting", "Malaise ou perte de connaissance"],
  ["neuro_signs", "Trouble de la parole ou faiblesse d'un côté"],
  ["fever", "Fièvre"],
  ["severe_abdominal_pain", "Douleur abdominale très intense"],
  ["blood_in_stool", "Sang dans les selles ou vomissements sanglants"],
  ["blood_in_urine", "Sang dans les urines"],
];

function specialtyIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("cardio")) return <HeartPulse className="h-5 w-5" />;
  if (n.includes("neuro")) return <Brain className="h-5 w-5" />;
  if (n.includes("opht")) return <Eye className="h-5 w-5" />;
  if (n.includes("pneumo")) return <Activity className="h-5 w-5" />;
  if (n.includes("derm")) return <Droplets className="h-5 w-5" />;
  if (n.includes("orl")) return <Stethoscope className="h-5 w-5" />;
  if (n.includes("rhum")) return <Bone className="h-5 w-5" />;
  if (n.includes("endo")) return <Thermometer className="h-5 w-5" />;
  if (n.includes("uro")) return <Pill className="h-5 w-5" />;
  if (n.includes("gyne")) return <UserRound className="h-5 w-5" />;
  if (n.includes("infect")) return <ShieldAlert className="h-5 w-5" />;
  return <Hospital className="h-5 w-5" />;
}

export default function OrientPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [symptomsText, setSymptomsText] = useState("");
  const [location, setLocation] = useState("poitrine");
  const [durationDays, setDurationDays] = useState(1);
  const [intensity, setIntensity] = useState(3);

  const [guided, setGuided] = useState<Guided>({
    fever: false,
    chest_pain: false,
    severe_breathing: false,
    fainting: false,
    neuro_signs: false,
    severe_abdominal_pain: false,
    blood_in_stool: false,
    blood_in_urine: false,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canContinue = useMemo(() => symptomsText.trim().length >= 8, [symptomsText]);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/orient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms_text: symptomsText,
          intensity,
          duration_days: durationDays,
          location,
          guided,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail ?? "Erreur API");
      setResult(data);
      setStep(3);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-violet-50 text-slate-900">
      <div className="pointer-events-none absolute -top-20 left-0 h-72 w-72 rounded-full bg-sky-300/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-violet-300/30 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 py-8">
        <header className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-sky-100 backdrop-blur-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow-lg">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Orientation médicale intelligente</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Une expérience plus fluide pour décrire vos symptômes et obtenir une orientation rapide.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700">
              <Sparkles className="h-3.5 w-3.5" /> EFREI&apos;lib
            </span>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Progression</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-violet-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {step !== 3 && (
              <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-sky-100 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {step === 1 ? "Étape 1 · Décrire les symptômes" : "Étape 2 · Questions guidées"}
                  </h2>
                  <div className="text-xs font-medium text-slate-500">{step}/3</div>
                </div>

                {step === 1 && (
                  <div className="mt-5 space-y-5">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Description libre</label>
                      <textarea
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm shadow-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                        rows={6}
                        placeholder="Ex: douleur thoracique depuis 2 jours avec essoufflement, fatigue et sensation d'oppression..."
                        value={symptomsText}
                        onChange={(e) => setSymptomsText(e.target.value)}
                      />
                      <p className="mt-2 text-xs text-slate-500">Décrivez le lieu, l&apos;évolution, l&apos;intensité et les symptômes associés.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                          <MapPin className="h-4 w-4 text-sky-600" /> Localisation
                        </div>
                        <select
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                        >
                          <option>poitrine</option>
                          <option>tête</option>
                          <option>abdomen</option>
                          <option>dos</option>
                          <option>gorge</option>
                          <option>peau</option>
                        </select>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Timer className="h-4 w-4 text-sky-600" /> Durée (jours)
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={30}
                          value={durationDays}
                          onChange={(e) => setDurationDays(Number(e.target.value))}
                          className="w-full accent-sky-600"
                        />
                        <div className="mt-2 text-sm font-semibold text-slate-700">{durationDays} jour(s)</div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Flame className="h-4 w-4 text-sky-600" /> Intensité
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          value={intensity}
                          onChange={(e) => setIntensity(Number(e.target.value))}
                          className="w-full accent-violet-600"
                        />
                        <div className="mt-2 text-sm font-semibold text-slate-700">{intensity}/5</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-violet-600 px-5 py-3 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!canContinue}
                        onClick={() => setStep(2)}
                      >
                        Continuer <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium transition hover:bg-slate-50"
                        onClick={() => {
                          setSymptomsText("");
                          setIntensity(3);
                          setDurationDays(1);
                          setLocation("poitrine");
                        }}
                      >
                        Réinitialiser
                      </button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="mt-5 space-y-4">
                    <p className="text-sm text-slate-600">
                      Ces questions aident à détecter rapidement des signaux d&apos;alerte potentiels.
                    </p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {guidedQuestions.map(([key, label]) => (
                        <label
                          key={key}
                          className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-sky-300 hover:bg-sky-50/40"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-sky-600"
                            checked={Boolean(guided[key])}
                            onChange={(e) =>
                              setGuided((g) => ({
                                ...g,
                                [key]: e.target.checked,
                              }))
                            }
                          />
                          <span className="text-sm text-slate-700">{label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium transition hover:bg-slate-50"
                        onClick={() => setStep(1)}
                      >
                        <ArrowLeft className="h-4 w-4" /> Retour
                      </button>
                      <button
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={loading}
                        onClick={submit}
                      >
                        {loading ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Analyse en cours...
                          </>
                        ) : (
                          "Obtenir l'orientation"
                        )}
                      </button>
                    </div>

                    {error && (
                      <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                        {error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 3 && result && (
              <div className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-sky-100 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Bilan d&apos;orientation</h2>
                  <span
                    className={`mr-2 hidden rounded-full px-3 py-1 text-xs font-semibold md:inline-flex ${
                      result.urgency === "urgent"
                        ? "border border-red-200 bg-red-50 text-red-700"
                        : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {result.urgency === "urgent" ? "Priorité: élevée" : "Priorité: standard"}
                  </span>
                  <button
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
                    onClick={() => {
                      setResult(null);
                      setStep(1);
                    }}
                  >
                    Recommencer
                  </button>
                </div>

                {result.red_flags?.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/90 p-4">
                    <div className="flex items-center gap-2 font-semibold text-red-700">
                      <ShieldAlert className="h-5 w-5" /> Signaux d&apos;alerte détectés
                    </div>
                    <ul className="mt-2 list-disc pl-5 text-sm text-red-700">
                      {result.red_flags.map((rf) => (
                        <li key={rf}>{rf}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <ScoreChart top3={result.top3} />

                <h3 className="mt-6 text-sm font-semibold text-slate-700">Détail des spécialités recommandées</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {result.top3.map((r) => {
                    const meta = scoreMeta(r.score);
                    return (
                      <div
                        key={r.med_id}
                        className={`rounded-2xl border bg-white/90 p-4 transition hover:-translate-y-0.5 hover:shadow-md ${meta.border}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={meta.color}>{specialtyIcon(r.specialty)}</span>
                          <div>
                            <div className="text-sm font-semibold">{r.specialty}</div>
                            <div className={`mt-0.5 text-xs font-medium ${meta.color}`}>{meta.label}</div>
                          </div>
                        </div>
                        <div className={`mt-3 text-2xl font-bold ${meta.color}`}>{Math.round(r.score * 100)}%</div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-700">Synthèse IA</h3>
                  <span className="rounded-full border border-violet-200 bg-violet-100 px-2 py-0.5 text-xs text-violet-700">
                    Généré par Llama 3.2
                  </span>
                </div>
                <GenAIExplanation explanation={result.explanation} />

                <p className="mt-4 text-xs text-slate-500">{result.disclaimer}</p>
              </div>
            )}
          </div>

          <aside className="h-fit rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-sky-100 backdrop-blur-md">
            <h3 className="text-sm font-semibold text-slate-700">Conseils pour une description claire</h3>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
              <li>• Où se situe la douleur ou la gêne</li>
              <li>• Depuis quand et comment cela évolue</li>
              <li>• Ce qui aggrave ou soulage</li>
              <li>• Symptômes associés : fièvre, nausées, essoufflement</li>
            </ul>

            <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <div className="text-sm font-semibold text-sky-800">Rappel important</div>
              <p className="mt-1 text-sm text-sky-800">
                Orientation indicative uniquement. En cas d&apos;urgence, appelez le 15 (SAMU) ou le 112.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-sm font-semibold text-slate-700">Code couleur des scores</div>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" /> ≥ 60% — Principale
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-orange-400" /> ≥ 40% — Secondaire
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-slate-400" /> &lt; 40% — Faible
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
