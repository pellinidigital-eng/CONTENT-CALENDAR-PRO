"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { emptyMemory, loadMemory, saveMemory } from "@/lib/antiRepetition";
import { exportPlanText, generatePlan, regenerateDay, regenerateWeek } from "@/lib/plannerEngine";
import type {
  BusinessType,
  CalendarPlan,
  Duration,
  ExperienceLevel,
  Frequency,
  FunnelPhase,
  Goal,
  PlannerInput,
  Platform,
  Tone,
  UsedMemory
} from "@/types/planner";

const defaultInput: PlannerInput = {
  niche: "",
  product: "",
  goal: "lead generation",
  platform: "Instagram",
  frequency: "5 post settimana",
  tone: "premium",
  experience: "intermedio",
  businessType: "professionista",
  duration: 14
};

const goals: Goal[] = ["crescita follower", "vendite", "lead generation", "personal brand", "engagement"];
const platforms: Platform[] = ["Instagram", "TikTok", "Facebook", "Multi piattaforma"];
const frequencies: Frequency[] = ["3 post settimana", "5 post settimana", "daily posting"];
const tones: Tone[] = ["autorevole", "empatico", "diretto", "ispirazionale", "premium", "educativo"];
const levels: ExperienceLevel[] = ["principiante", "intermedio", "avanzato"];
const businessTypes: BusinessType[] = ["creator", "professionista", "ecommerce", "agenzia", "local business", "startup"];
const durations: Duration[] = [7, 14, 30];

const presets: Array<{ label: string; input: PlannerInput }> = [
  { label: "Corso online", input: { ...defaultInput, niche: "formazione digitale", product: "corso online", goal: "lead generation", businessType: "creator", tone: "educativo" } },
  { label: "Ecommerce", input: { ...defaultInput, niche: "beauty ecommerce", product: "linea prodotti", goal: "vendite", platform: "TikTok", businessType: "ecommerce", tone: "diretto" } },
  { label: "Locale", input: { ...defaultInput, niche: "servizio locale", product: "appuntamenti", goal: "vendite", platform: "Facebook", businessType: "local business", tone: "empatico" } },
  { label: "Consulente", input: { ...defaultInput, niche: "marketing strategico", product: "consulenza", goal: "lead generation", platform: "Multi piattaforma", tone: "premium" } }
];

const phaseClasses: Record<FunnelPhase, string> = {
  awareness: "border-cyan-200 bg-cyan-50 text-cyan-800",
  fiducia: "border-emerald-200 bg-emerald-50 text-emerald-800",
  engagement: "border-violet-200 bg-violet-50 text-violet-800",
  valore: "border-blue-200 bg-blue-50 text-blue-800",
  vendita: "border-orange-200 bg-orange-50 text-orange-800",
  "prova sociale": "border-yellow-200 bg-yellow-50 text-yellow-800"
};

export default function ContentPlannerApp() {
  const [input, setInput] = useState<PlannerInput>(defaultInput);
  const [plan, setPlan] = useState<CalendarPlan | null>(null);
  const [memory, setMemory] = useState<UsedMemory>(emptyMemory());
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setMemory(loadMemory());
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const canGenerate = input.niche.trim().length > 1 && input.product.trim().length > 1;
  const posts = useMemo(() => plan?.days.filter((day) => day.isPublishingDay).length ?? 0, [plan]);
  const score = useMemo(() => {
    if (!plan) return 0;
    const publishDays = plan.days.filter((day) => day.isPublishingDay);
    if (!publishDays.length) return 0;
    return Math.round(publishDays.reduce((sum, day) => sum + day.progress, 0) / publishDays.length);
  }, [plan]);

  function update<Key extends keyof PlannerInput>(key: Key, value: PlannerInput[Key]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function handleGenerate() {
    if (!canGenerate) return;
    setLoading(true);
    window.setTimeout(() => {
      const result = generatePlan(input, memory);
      setPlan(result.plan);
      setMemory(result.memory);
      saveMemory(result.memory);
      setLoading(false);
    }, 650);
  }

  function handleRegenerateWeek(week: number) {
    if (!plan) return;
    const result = regenerateWeek(plan, week, memory);
    setPlan(result.plan);
    setMemory(result.memory);
    saveMemory(result.memory);
  }

  function handleRegenerateDay(dayId: string) {
    if (!plan) return;
    const result = regenerateDay(plan, dayId, memory);
    setPlan(result.plan);
    setMemory(result.memory);
    saveMemory(result.memory);
  }

  function handleExportText() {
    if (!plan) return;
    const blob = new Blob([exportPlanText(plan)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "content-calendar-pro.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-teal-600">Content Calendar PRO</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Planner editoriale strategico</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Crea una base operativa per organizzare pubblicazioni, CTA, materiali e fasi funnel. Il piano va adattato alla voce del brand e non promette risultati automatici.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDark((value) => !value)}
              className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-teal-300"
            >
              {dark ? "Tema chiaro" : "Tema scuro"}
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft lg:sticky lg:top-5 lg:self-start">
            <div className="grid gap-4">
              <Field label="Nicchia">
                <input className="field-input" value={input.niche} onChange={(event) => update("niche", event.target.value)} placeholder="es. fitness, beauty, consulenza" />
              </Field>
              <Field label="Prodotto o servizio">
                <input className="field-input" value={input.product} onChange={(event) => update("product", event.target.value)} placeholder="es. corso, servizio, shop" />
              </Field>
              <Choice label="Obiettivo" value={input.goal} options={goals} onChange={(value) => update("goal", value as Goal)} />
              <Choice label="Piattaforma" value={input.platform} options={platforms} onChange={(value) => update("platform", value as Platform)} />
              <Choice label="Frequenza" value={input.frequency} options={frequencies} onChange={(value) => update("frequency", value as Frequency)} />
              <Choice label="Durata" value={String(input.duration)} options={durations.map(String)} onChange={(value) => update("duration", Number(value) as Duration)} />
              <Choice label="Tono" value={input.tone} options={tones} onChange={(value) => update("tone", value as Tone)} />
              <Choice label="Esperienza" value={input.experience} options={levels} onChange={(value) => update("experience", value as ExperienceLevel)} />
              <Choice label="Business" value={input.businessType} options={businessTypes} onChange={(value) => update("businessType", value as BusinessType)} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button key={preset.label} type="button" onClick={() => setInput(preset.input)} className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs font-black text-slate-600 transition hover:border-teal-300 hover:text-slate-950">
                  {preset.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={!canGenerate || loading}
              onClick={handleGenerate}
              className="mt-5 w-full rounded-lg bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "Costruzione piano..." : "Genera calendario"}
            </button>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Gli input guidano la strategia: il planner evita di riciclare le parole inserite come testo del piano.
            </p>
          </aside>

          <section className="lg:col-span-2">
            {!plan && !loading ? <EmptyState /> : null}
            {loading ? <LoadingState /> : null}
            {plan ? (
              <Dashboard
                plan={plan}
                posts={posts}
                score={score}
                onExportText={handleExportText}
                onExportPdf={() => window.print()}
                onRegenerateWeek={handleRegenerateWeek}
                onRegenerateDay={handleRegenerateDay}
              />
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Choice({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            type="button"
            key={option}
            onClick={() => onChange(option)}
            className={value === option ? "choice-active" : "choice-idle"}
          >
            {option}
          </button>
        ))}
      </div>
    </Field>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-soft">
      <p className="text-xs font-black uppercase tracking-widest text-teal-600">Workspace</p>
      <h2 className="mt-3 text-3xl font-black text-slate-950">Compila il form e genera una regia editoriale.</h2>
      <p className="mt-3 max-w-2xl text-slate-600">
        Otterrai una sequenza con funnel, format, angoli, azioni pratiche, CTA e materiali da preparare. Non e un generatore di caption lunghe.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-soft">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />
      <p className="mt-5 text-lg font-black text-slate-950">Sto bilanciando funnel, CTA e format...</p>
      <p className="mt-2 text-slate-600">Il planner evita pattern troppo vicini e prepara una sequenza leggibile.</p>
    </div>
  );
}

function Dashboard({
  plan,
  posts,
  score,
  onExportText,
  onExportPdf,
  onRegenerateWeek,
  onRegenerateDay
}: {
  plan: CalendarPlan;
  posts: number;
  score: number;
  onExportText: () => void;
  onExportPdf: () => void;
  onRegenerateWeek: (week: number) => void;
  onRegenerateDay: (dayId: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft print-area">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-teal-600">Piano pronto</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">{plan.input.duration} giorni di calendario</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {posts} pubblicazioni pianificate. Usa questo output come base operativa modificabile.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 no-print">
            <button type="button" onClick={onExportText} className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-teal-300">
              Esporta testo
            </button>
            <button type="button" onClick={onExportPdf} className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-700">
              Esporta PDF
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric label="Solidita" value={`${score}%`} />
          <Metric label="Fasi usate" value={Object.values(plan.distribution).filter(Boolean).length.toString()} />
          <Metric label="Format unici" value={plan.formats.length.toString()} />
        </div>
      </div>

      {plan.weeks.map((week) => (
        <section key={week.week} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft print-area">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-teal-600">Settimana {week.week}</p>
              <h3 className="text-2xl font-black text-slate-950">Sequenza contenuti</h3>
            </div>
            <button type="button" onClick={() => onRegenerateWeek(week.week)} className="no-print rounded-lg border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-teal-300">
              Rigenera settimana
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {week.days.map((day) => (
              <article key={day.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">{day.weekday}</p>
                    <h4 className="mt-1 text-lg font-black text-slate-950">{day.format}</h4>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${phaseClasses[day.objective]}`}>{day.objective}</span>
                </div>

                <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                  <Info label="Tipo" value={day.contentType} />
                  <Info label="Obiettivo" value={day.objectiveLabel} />
                  <Info label="Strategia" value={day.strategy} />
                  <Info label="Angolo" value={day.angle} />
                  <Info label="Azione pratica" value={day.action} />
                  <Info label="CTA" value={day.cta} strong />
                  <Info label="Materiale" value={day.material} />
                  <Info label="Consiglio rapido" value={day.quickTip} />
                </div>

                {day.isPublishingDay ? (
                  <button type="button" onClick={() => onRegenerateDay(day.id)} className="no-print mt-4 rounded-lg bg-white px-4 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:ring-teal-300">
                    Rigenera giorno
                  </button>
                ) : null}
              </article>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Checklist</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {week.checklist.map((item) => (
                <li key={item} className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function Info({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className={strong ? "font-black text-slate-950" : ""}>{value}</p>
    </div>
  );
}
