"use client";

import { useMemo, useState } from "react";
import {
  Stethoscope, HeartPulse, Brain, Eye, ShieldAlert, Pill,
  Activity, Thermometer, Droplets, Bone, UserRound, Hospital,
  ArrowRight, ArrowLeft, RotateCcw, Sparkles, AlertTriangle,
  CheckCircle2, Smile, FlaskConical, Wind, Zap
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// Icônes par spécialité (toutes les 15 couvertes)
// ─────────────────────────────────────────────────────────────
function SpecialtyIcon({ name, className }: { name: string; className?: string }) {
  const n = name.toLowerCase();
  const cls = className ?? "h-5 w-5";
  if (n.includes("cardio")) return <HeartPulse className={cls} />;
  if (n.includes("neuro")) return <Brain className={cls} />;
  if (n.includes("opht")) return <Eye className={cls} />;
  if (n.includes("pneumo")) return <Wind className={cls} />;
  if (n.includes("derm")) return <Droplets className={cls} />;
  if (n.includes("orl")) return <Stethoscope className={cls} />;
  if (n.includes("rhum")) return <Bone className={cls} />;
  if (n.includes("endo")) return <Thermometer className={cls} />;
  if (n.includes("uro")) return <Pill className={cls} />;
  if (n.includes("gyn")) return <UserRound className={cls} />;
  if (n.includes("psych")) return <Smile className={cls} />;
  if (n.includes("gastro")) return <Activity className={cls} />;
  if (n.includes("infect")) return <FlaskConical className={cls} />;
  if (n.includes("neph") || n.includes("néph")) return <Zap className={cls} />;
  return <Hospital className={cls} />;
}

// ─────────────────────────────────────────────────────────────
// Score metadata
// ─────────────────────────────────────────────────────────────
function scoreMeta(score: number) {
  if (score >= 0.6) return {
    color: "text-emerald-600", barColor: "#10b981",
    bg: "bg-emerald-50", border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700", label: "Principale",
  };
  if (score >= 0.4) return {
    color: "text-amber-600", barColor: "#f59e0b",
    bg: "bg-amber-50", border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700", label: "Secondaire",
  };
  return {
    color: "text-slate-500", barColor: "#94a3b8",
    bg: "bg-slate-50", border: "border-slate-200",
    badge: "bg-slate-100 text-slate-600", label: "Faible",
  };
}

// ─────────────────────────────────────────────────────────────
// Radar Chart SVG (EF — Graphique radar)
// ─────────────────────────────────────────────────────────────
function RadarChart({ top3 }: { top3: Recommendation[] }) {
  const cx = 160, cy = 145, r = 100;
  const n = Math.min(top3.length, 3);
  if (n === 0) return null;

  // Angles : départ à -90° (haut), répartis équitablement
  const angles = Array.from({ length: n }, (_, i) =>
    -Math.PI / 2 + (2 * Math.PI * i) / n
  );

  // Points des axes
  const axisPoints = angles.map(a => ({
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a),
  }));

  // Polygones de la grille (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridPaths = gridLevels.map(lvl =>
    angles.map((a, i) =>
      `${i === 0 ? "M" : "L"} ${cx + lvl * r * Math.cos(a)} ${cy + lvl * r * Math.sin(a)}`
    ).join(" ") + " Z"
  );

  // Polygone des scores
  const scorePoints = top3.map((rec, i) => ({
    x: cx + rec.score * r * Math.cos(angles[i]),
    y: cy + rec.score * r * Math.sin(angles[i]),
  }));
  const scorePath = scorePoints.map((p, i) =>
    `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
  ).join(" ") + " Z";

  // Positionnement des labels (un peu au-delà de l'axe)
  const labelOffset = r + 26;

  return (
    <div className="radar-animate flex justify-center">
      <svg viewBox="0 0 320 290" className="w-full max-w-xs">
        {/* Grille */}
        {gridPaths.map((path, i) => (
          <path key={i} d={path} fill="none" stroke="#e2e8f0" strokeWidth={i === 3 ? 1.5 : 1} />
        ))}
        {/* Axes */}
        {axisPoints.map((pt, i) => (
          <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#cbd5e1" strokeWidth="1" />
        ))}
        {/* Graduations sur les axes */}
        {gridLevels.map((lvl, gi) =>
          angles.map((a, ai) => (
            <text
              key={`${gi}-${ai}`}
              x={cx + lvl * r * Math.cos(a) + (ai === 0 ? 4 : ai === 1 ? 4 : -20)}
              y={cy + lvl * r * Math.sin(a)}
              fontSize="9"
              fill="#94a3b8"
              fontFamily="DM Sans, sans-serif"
            >
              {ai === 0 ? `${Math.round(lvl * 100)}%` : ""}
            </text>
          ))
        )}
        {/* Zone score (remplie) */}
        <path d={scorePath} fill="rgba(14,165,233,0.18)" stroke="#0ea5e9" strokeWidth="2.5" strokeLinejoin="round" />
        {/* Points */}
        {scorePoints.map((pt, i) => (
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r="7" fill="#0ea5e9" opacity="0.25" />
            <circle cx={pt.x} cy={pt.y} r="4" fill="#0ea5e9" />
          </g>
        ))}
        {/* Labels des spécialités */}
        {axisPoints.map((pt, i) => {
          const lx = cx + labelOffset * Math.cos(angles[i]);
          const ly = cy + labelOffset * Math.sin(angles[i]);
          const anchor = angles[i] > Math.PI / 6 && angles[i] < (5 * Math.PI) / 6 ? "end"
            : angles[i] < -Math.PI / 6 ? "middle" : "start";
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="600"
              fontFamily="DM Sans, sans-serif"
              fill="#334155"
            >
              {top3[i].specialty.length > 14 ? top3[i].specialty.slice(0, 13) + "…" : top3[i].specialty}
            </text>
          );
        })}
        {/* % sur les points */}
        {scorePoints.map((pt, i) => (
          <text
            key={i}
            x={pt.x + (Math.cos(angles[i]) > 0 ? 10 : -10)}
            y={pt.y - 10}
            fontSize="10"
            fontWeight="700"
            fontFamily="DM Sans, sans-serif"
            fill="#0369a1"
            textAnchor={Math.cos(angles[i]) > 0 ? "start" : "end"}
          >
            {Math.round(top3[i].score * 100)}%
          </text>
        ))}
        {/* Titre */}
        <text x={cx} y="280" textAnchor="middle" fontSize="11" fill="#94a3b8" fontFamily="DM Sans, sans-serif">
          Similarité sémantique par spécialité
        </text>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Barre de score animée
// ─────────────────────────────────────────────────────────────
function ScoreBar({ score, color }: { score: number; color: string }) {
  const pct = Math.round(score * 100);
  return (
    <div className="h-2 w-full rounded-full overflow-hidden bg-slate-100">
      <div
        className="h-2 rounded-full bar-animate"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sections GenAI parsées
// ─────────────────────────────────────────────────────────────
const SECTION_DEFS = [
  { key: "resume", titles: ["Resume", "Résumé"], icon: "📋", accent: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd" },
  { key: "orientation", titles: ["Orientation proposee", "Orientation proposée"], icon: "🧭", accent: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
  { key: "symptomes", titles: ["Symptomes reperes", "Symptômes repérés"], icon: "🔍", accent: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
  { key: "alertes", titles: ["Signaux d alerte", "Signaux d'alerte"], icon: "⚠️", accent: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  { key: "etapes", titles: ["Prochaines etapes", "Prochaines étapes"], icon: "✅", accent: "#10b981", bg: "#f0fdf4", border: "#bbf7d0" },
];
type GenAISection = { key: string; title: string; icon: string; accent: string; bg: string; border: string; content: string };

function parseGenAISections(text: string): GenAISection[] {
  if (!text) return [];
  const allTitles = SECTION_DEFS.flatMap(s => s.titles);
  const escaped = allTitles.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const splitRegex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(splitRegex).map(p => p.trim()).filter(Boolean);
  const sections: GenAISection[] = [];
  let i = 0;
  while (i < parts.length) {
    const chunk = parts[i];
    const def = SECTION_DEFS.find(s => s.titles.some(t => t.toLowerCase() === chunk.toLowerCase()));
    if (def && i + 1 < parts.length) {
      sections.push({ key: def.key, title: def.titles[0], icon: def.icon, accent: def.accent, bg: def.bg, border: def.border, content: parts[i + 1] });
      i += 2;
    } else {
      if (sections.length === 0 && chunk.length > 10)
        sections.push({ key: "intro", title: "Introduction", icon: "💬", accent: "#64748b", bg: "#f8fafc", border: "#e2e8f0", content: chunk });
      i++;
    }
  }
  if (sections.length === 0)
    sections.push({ key: "raw", title: "Synthèse IA", icon: "🤖", accent: "#64748b", bg: "#f8fafc", border: "#e2e8f0", content: text });
  return sections;
}

function GenAIExplanation({ explanation }: { explanation: string }) {
  const sections = parseGenAISections(explanation);
  return (
    <div className="mt-3 space-y-3">
      {sections.map(s => (
        <div key={s.key} className="rounded-2xl border p-4" style={{ background: s.bg, borderColor: s.border }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base leading-none">{s.icon}</span>
            <span className="text-sm font-600 font-semibold" style={{ color: s.accent }}>{s.title}</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{s.content}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Indicateur d'étapes
// ─────────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Symptômes" },
    { n: 2, label: "Signaux" },
    { n: 3, label: "Résultats" },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {steps.map((s, idx) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <div key={s.n} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300"
                style={{
                  background: done ? "#10b981" : active ? "#1e3a8a" : "#e2e8f0",
                  color: done || active ? "white" : "#94a3b8",
                }}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : s.n}
              </div>
              <span className="text-xs font-medium" style={{ color: active ? "#1e3a8a" : done ? "#10b981" : "#94a3b8" }}>
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className="w-16 h-0.5 mb-5 transition-all duration-500"
                style={{ background: step > s.n ? "#10b981" : "#e2e8f0" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────
export default function OrientPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [slideDir, setSlideDir] = useState<"right" | "left">("right");
  const [symptomsText, setSymptomsText] = useState("");
  const [location, setLocation] = useState("poitrine");
  const [durationDays, setDurationDays] = useState(1);
  const [intensity, setIntensity] = useState(3);
  const [guided, setGuided] = useState<Guided>({
    fever: false, chest_pain: false, severe_breathing: false, fainting: false,
    neuro_signs: false, severe_abdominal_pain: false, blood_in_stool: false, blood_in_urine: false,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canContinue = useMemo(() => symptomsText.trim().length >= 8, [symptomsText]);

  // FIX: navigation avec direction pour l'animation
  function goTo(n: 1 | 2 | 3) {
    setSlideDir(n > step ? "right" : "left");
    setStep(n);
    if (n !== step) setError(null); // FIX: effacer l'erreur lors du changement d'étape
  }

  // FIX: réinitialisation complète de TOUS les champs (y compris guided)
  function resetAll() {
    setSymptomsText("");
    setLocation("poitrine");
    setDurationDays(1);
    setIntensity(3);
    setGuided({
      fever: false, chest_pain: false, severe_breathing: false, fainting: false,
      neuro_signs: false, severe_abdominal_pain: false, blood_in_stool: false, blood_in_urine: false
    });
    setResult(null);
    setError(null);
    setSlideDir("left");
    setStep(1);
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/orient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms_text: symptomsText, intensity, duration_days: durationDays, location, guided }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail ?? "Erreur API");
      setResult(data);
      setSlideDir("right");
      setStep(3);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inconnue. Vérifiez que le backend est démarré.");
    } finally {
      setLoading(false);
    }
  }

  const LOCATIONS = [
    { value: "tête", label: "Tête" },
    { value: "poitrine", label: "Poitrine" },
    { value: "ventre", label: "Ventre" },
    { value: "dos", label: "Dos" },
    { value: "gorge", label: "Gorge" },
    { value: "peau", label: "Peau" },
    { value: "yeux", label: "Yeux" },
    { value: "urinaire", label: "Urinaire" },
    { value: "pelvien", label: "Pelvien" },
  ];

  const GUIDED_QUESTIONS: Array<[keyof Guided, string, string]> = [
    ["chest_pain", "Douleur thoracique importante", "❤️"],
    ["severe_breathing", "Difficulté respiratoire", "💨"],
    ["fainting", "Malaise / perte de connaissance", "😵"],
    ["neuro_signs", "Trouble de la parole ou faiblesse d'un côté", "🧠"],
    ["fever", "Fièvre", "🌡️"],
    ["severe_abdominal_pain", "Douleur abdominale très intense", "🫁"],
    ["blood_in_stool", "Sang dans les selles ou vomissements sanglants", "🩸"],
    ["blood_in_urine", "Sang dans les urines", "💧"],
  ];

  const animClass = slideDir === "right" ? "step-enter" : "step-enter-back";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #eef4fb 0%, #e0f0ff 100%)" }}>

      {/* ── HEADER ── */}
      <header style={{ background: "linear-gradient(135deg, #172554 0%, #1e3a8a 60%, #1d4ed8 100%)" }}>
        <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}>
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">Orientation Médicale</h1>
              <p className="text-sm text-blue-200">Analyse sémantique par IA · EFREI 2025–26</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-blue-200 bg-white/10 px-4 py-2 rounded-full border border-white/20">
            <Sparkles className="h-3.5 w-3.5" />
            Propulsé par SBERT + Llama
          </div>
        </div>
      </header>

      {/* ── CONTENU ── */}
      <div className="mx-auto max-w-5xl px-6 py-8">
        <StepIndicator step={step} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── COLONNE PRINCIPALE ── */}
          <div className="lg:col-span-2">

            {/* ═══ ÉTAPE 1 ═══ */}
            {step === 1 && (
              <div key="step1" className={`bg-white rounded-3xl shadow-sm border border-blue-100/80 p-6 ${animClass}`}>
                <h2 className="text-lg font-semibold text-slate-800 mb-1">Décrivez vos symptômes</h2>
                <p className="text-sm text-slate-500 mb-5">Exprimez-vous librement, comme vous le feriez avec votre médecin.</p>

                {/* Textarea */}
                <div className="relative">
                  <textarea
                    className="w-full rounded-2xl border-2 border-slate-200 p-4 focus:outline-none focus:border-blue-400 transition-colors resize-none text-sm leading-relaxed text-slate-800"
                    rows={5}
                    placeholder="Ex : douleur dans la poitrine depuis 2 jours, surtout la nuit, avec un peu d'essoufflement et de fatigue…"
                    value={symptomsText}
                    onChange={e => setSymptomsText(e.target.value)}
                  />
                  <span className="absolute bottom-3 right-4 text-xs text-slate-400">
                    {symptomsText.length} car.
                  </span>
                </div>
                {symptomsText.length > 0 && symptomsText.trim().length < 8 && (
                  <p className="mt-1 text-xs text-amber-600">Minimum 8 caractères pour continuer.</p>
                )}

                {/* Grille : localisation + durée + intensité */}
                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* Localisation */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Localisation</label>
                    <select
                      className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm text-slate-800 focus:outline-none focus:border-blue-400 transition-colors bg-white"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                    >
                      {LOCATIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>

                  {/* Durée */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Durée (jours)</label>
                    <input
                      className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm text-slate-800 focus:outline-none focus:border-blue-400 transition-colors"
                      type="number"
                      min={0} max={3650}
                      value={durationDays}
                      onChange={e => setDurationDays(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    />
                  </div>

                  {/* Intensité */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Intensité
                      <span className="ml-2 text-blue-600 font-bold">{intensity}/5</span>
                    </label>
                    <input
                      type="range" min={1} max={5} step={1}
                      value={intensity}
                      onChange={e => setIntensity(parseInt(e.target.value, 10))}
                      className="w-full mt-2"
                      style={{
                        background: `linear-gradient(to right, #0ea5e9 0%, #0ea5e9 ${(intensity - 1) * 25}%, #e2e8f0 ${(intensity - 1) * 25}%, #e2e8f0 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>Légère</span><span>Sévère</span>
                    </div>
                  </div>
                </div>

                {/* Boutons */}
                <div className="mt-6 flex gap-3">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: canContinue ? "linear-gradient(135deg,#1e3a8a,#1d4ed8)" : "#94a3b8" }}
                    disabled={!canContinue}
                    onClick={() => goTo(2)}
                  >
                    Continuer <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-2xl border-2 border-slate-200 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                    onClick={resetAll}
                  >
                    <RotateCcw className="h-4 w-4" /> Réinitialiser
                  </button>
                </div>
              </div>
            )}

            {/* ═══ ÉTAPE 2 ═══ */}
            {step === 2 && (
              <div key="step2" className={`bg-white rounded-3xl shadow-sm border border-blue-100/80 p-6 ${animClass}`}>
                <h2 className="text-lg font-semibold text-slate-800 mb-1">Signaux spécifiques</h2>
                <p className="text-sm text-slate-500 mb-5">
                  Cochez les signaux présents. Ils aident à détecter les <span className="text-red-500 font-medium">situations urgentes</span>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {GUIDED_QUESTIONS.map(([key, label, icon]) => {
                    const checked = Boolean((guided as Record<string, boolean>)[key]);
                    return (
                      <label
                        key={key}
                        className="flex items-center gap-3 rounded-2xl border-2 p-3.5 cursor-pointer transition-all duration-150"
                        style={{
                          borderColor: checked ? "#1d4ed8" : "#e2e8f0",
                          background: checked ? "#eff6ff" : "white",
                        }}
                      >
                        <div
                          className="h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                          style={{
                            borderColor: checked ? "#1d4ed8" : "#cbd5e1",
                            background: checked ? "#1d4ed8" : "white",
                          }}
                        >
                          {checked && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={e => setGuided(g => ({ ...g, [key]: e.target.checked }))}
                        />
                        <span className="text-base leading-none">{icon}</span>
                        <span className="text-sm text-slate-700 leading-snug">{label}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Boutons */}
                <div className="mt-6 flex gap-3">
                  <button
                    className="rounded-2xl border-2 border-slate-200 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                    onClick={() => goTo(1)}
                  >
                    <ArrowLeft className="h-4 w-4" /> Retour
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)" }}
                    disabled={loading}
                    onClick={submit}
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Analyse sémantique en cours…
                      </>
                    ) : (
                      <><Sparkles className="h-4 w-4" /> Obtenir l&apos;orientation</>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="mt-4 flex items-start gap-2 rounded-2xl bg-red-50 border border-red-200 p-4">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ ÉTAPE 3 : RÉSULTATS ═══ */}
            {step === 3 && result && (
              <div key="step3" className={`space-y-5 ${animClass}`}>

                {/* Red Flags */}
                {result.red_flags?.length > 0 && (
                  <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-5 pulse-urgent">
                    <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                      <ShieldAlert className="h-5 w-5" />
                      Signaux d&apos;alerte détectés — {result.urgency === "urgent" ? "Consultation urgente recommandée" : "À surveiller"}
                    </div>
                    <ul className="space-y-1">
                      {result.red_flags.map(rf => (
                        <li key={rf} className="flex items-center gap-2 text-sm text-red-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                          {rf}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-red-600 font-medium border-t border-red-200 pt-3">
                      ⚠️ En cas de symptômes sévères ou s&apos;aggravant, appelez le <strong>15 (SAMU)</strong> ou le <strong>112</strong>.
                    </p>
                  </div>
                )}

                {/* Radar + Scores */}
                <div className="bg-white rounded-3xl shadow-sm border border-blue-100/80 p-6 result-enter">
                  <h2 className="text-base font-semibold text-slate-800 mb-4">Scores de correspondance sémantique</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">

                    {/* Graphique radar */}
                    <RadarChart top3={result.top3} />

                    {/* Barres */}
                    <div className="space-y-4">
                      {result.top3.map((r, i) => {
                        const meta = scoreMeta(r.score);
                        const pct = Math.round(r.score * 100);
                        return (
                          <div key={r.med_id}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
                                <span className={meta.color}><SpecialtyIcon name={r.specialty} className="h-4 w-4" /></span>
                                <span className="text-sm font-semibold text-slate-800">{r.specialty}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.badge}`}>{meta.label}</span>
                                <span className={`text-sm font-bold ${meta.color}`}>{pct}%</span>
                              </div>
                            </div>
                            <ScoreBar score={r.score} color={meta.barColor} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Cartes spécialités */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {result.top3.map((r, i) => {
                    const meta = scoreMeta(r.score);
                    return (
                      <div
                        key={r.med_id}
                        className={`result-enter bg-white rounded-3xl border-2 p-5 shadow-sm ${meta.border}`}
                        style={{ animationDelay: `${i * 80}ms` }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-xs font-bold ${meta.color}`}>#{i + 1}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.badge}`}>{meta.label}</span>
                        </div>
                        <div className={`mb-1 ${meta.color}`}>
                          <SpecialtyIcon name={r.specialty} className="h-7 w-7" />
                        </div>
                        <div className="text-sm font-semibold text-slate-800 mt-2">{r.specialty}</div>
                        <div className={`text-2xl font-bold mt-1 ${meta.color}`}>{Math.round(r.score * 100)}%</div>
                      </div>
                    );
                  })}
                </div>

                {/* Synthèse IA */}
                <div className="bg-white rounded-3xl shadow-sm border border-blue-100/80 p-6 result-enter" style={{ animationDelay: "160ms" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    <h3 className="text-base font-semibold text-slate-800">Synthèse IA</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 ml-1">
                      Llama 3.2 · local
                    </span>
                  </div>
                  <GenAIExplanation explanation={result.explanation} />
                </div>

                {/* Disclaimer + Recommencer */}
                <div className="flex items-start justify-between gap-4 px-1">
                  <p className="text-xs text-slate-400 leading-relaxed max-w-lg">{result.disclaimer}</p>
                  <button
                    className="flex-shrink-0 flex items-center gap-1.5 rounded-2xl border-2 border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    onClick={resetAll}
                  >
                    <RotateCcw className="h-4 w-4" /> Recommencer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <aside className="space-y-4 h-fit">

            {/* Conseils */}
            <div className="bg-white rounded-3xl shadow-sm border border-blue-100/80 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">💡 Bien décrire ses symptômes</h3>
              <ul className="space-y-2">
                {[
                  "Précisez la localisation exacte de la douleur",
                  "Indiquez depuis quand et comment ça évolue",
                  "Mentionnez ce qui aggrave ou soulage",
                  "Ajoutez les symptômes associés (fièvre, nausées…)",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Urgence */}
            <div className="rounded-3xl border-2 border-red-100 bg-red-50 p-5">
              <div className="text-sm font-semibold text-red-700 flex items-center gap-1.5 mb-2">
                <ShieldAlert className="h-4 w-4" /> Urgence médicale ?
              </div>
              <p className="text-sm text-red-700">
                En cas de douleur thoracique sévère, difficultés respiratoires ou perte de connaissance :
              </p>
              <div className="mt-3 flex gap-2">
                <span className="rounded-xl bg-red-600 text-white text-xs font-bold px-3 py-1.5">15 SAMU</span>
                <span className="rounded-xl bg-red-600 text-white text-xs font-bold px-3 py-1.5">112</span>
              </div>
            </div>

            {/* Légende scores */}
            <div className="bg-white rounded-3xl shadow-sm border border-blue-100/80 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Légende des scores</h3>
              <div className="space-y-2.5">
                {[
                  { color: "#10b981", label: "≥ 60%", desc: "Orientation principale" },
                  { color: "#f59e0b", label: "≥ 40%", desc: "Orientation secondaire" },
                  { color: "#94a3b8", label: "< 40%", desc: "Faible correspondance" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <span className="text-xs font-semibold text-slate-500 w-10">{item.label}</span>
                    <span className="text-xs text-slate-600">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline technique */}
            <div className="bg-white rounded-3xl shadow-sm border border-blue-100/80 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Pipeline technique</h3>
              <div className="space-y-2">
                {[
                  { label: "Embeddings", tech: "SBERT all-MiniLM" },
                  { label: "Similarité", tech: "Cosinus (numpy)" },
                  { label: "GenAI", tech: "Llama 3.2 (Ollama)" },
                  { label: "Backend", tech: "FastAPI + Python" },
                  { label: "Frontend", tech: "Next.js + Tailwind" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{item.label}</span>
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg">{item.tech}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}