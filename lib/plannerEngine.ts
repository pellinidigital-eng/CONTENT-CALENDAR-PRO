import {
  angles,
  businessLens,
  contentFormats,
  contentTypes,
  ctas,
  experienceLens,
  hooks,
  materials,
  phaseObjectiveCopy,
  platformBias,
  practicalActions,
  quickTips,
  strategies,
  toneModifiers,
  weeklyChecklists
} from "@/data/contentLibraries";
import type { CalendarPlan, FunnelPhase, PlannedDay, PlannerInput, UsedMemory } from "@/types/planner";
import { rememberPlan, recent } from "@/lib/antiRepetition";
import { compactText, createSeed, pick, seededRandom, shuffle } from "@/lib/random";
import { chooseDistinct } from "@/lib/similarity";
import { choosePhase, summarizeStrategicIntent } from "@/lib/strategyEngine";

const weekdays = ["Lunedi", "Martedi", "Mercoledi", "Giovedi", "Venerdi", "Sabato", "Domenica"];

const publishByFrequency = {
  "3 post settimana": [0, 2, 4],
  "5 post settimana": [0, 1, 2, 3, 4],
  "daily posting": [0, 1, 2, 3, 4, 5, 6]
};

const phaseAccent: Record<FunnelPhase, number> = {
  awareness: 64,
  fiducia: 72,
  engagement: 68,
  valore: 70,
  vendita: 84,
  "prova sociale": 76
};

function avoidInputEcho(items: string[], input: PlannerInput) {
  const blocked = new Set([
    ...compactText(input.niche),
    ...compactText(input.product)
  ]);

  return items.filter((item) => {
    const words = compactText(item);
    const matches = words.filter((word) => blocked.has(word)).length;
    return matches === 0;
  });
}

function baseStrategyExclusions(memory: UsedMemory) {
  return memory.strategies.map((item) => item.split(": ").pop()?.split(", ")[0] ?? item);
}

function baseAngleExclusions(memory: UsedMemory) {
  return memory.angles.map((item) => item.split(". Lente:")[0]);
}

function phaseExclusions(memory: UsedMemory, previous?: PlannedDay, hardExclusions?: UsedMemory) {
  return [
    ...recent(memory.objectives, 2),
    ...(hardExclusions?.objectives ?? []),
    ...(previous ? [previous.objective] : [])
  ];
}

function publishingSlots(input: PlannerInput) {
  const publishDays = publishByFrequency[input.frequency];
  return Array.from({ length: input.duration }, (_, dayIndex) => publishDays.includes(dayIndex % 7));
}

function weightedFormats(input: PlannerInput, random: () => number) {
  const biased = platformBias[input.platform];
  const weighted = [...biased, ...biased, ...contentFormats];
  return shuffle(weighted, random);
}

function buildDay(
  input: PlannerInput,
  dayIndex: number,
  random: () => number,
  memory: UsedMemory,
  previous?: PlannedDay,
  forcePublish = true,
  hardExclusions?: UsedMemory
): PlannedDay {
  const objective = choosePhase(input, dayIndex, random, previous?.objective, phaseExclusions(memory, previous, hardExclusions));
  const recentFormats = [...new Set([...recent(memory.formats, 80), ...(hardExclusions?.formats ?? [])])];
  const recentStrategies = [...new Set([...recent(baseStrategyExclusions(memory), 60), ...baseStrategyExclusions(hardExclusions ?? memory)])];
  const recentAngles = [...new Set([...recent(baseAngleExclusions(memory), 60), ...baseAngleExclusions(hardExclusions ?? memory)])];
  const recentCtas = [...new Set([...recent(memory.ctas, 60), ...(hardExclusions?.ctas ?? [])])];
  const recentHooks = [...new Set([...recent(memory.hooks, 60), ...(hardExclusions?.hooks ?? [])])];
  const recentTypes = [...new Set([...recent(memory.contentTypes, 60), ...(hardExclusions?.contentTypes ?? [])])];
  const recentMaterials = [...new Set([...recent(memory.materials, 80), ...(hardExclusions?.materials ?? [])])];
  const recentActions = [...new Set([...recent(memory.actions, 60), ...(hardExclusions?.actions ?? [])])];
  const recentTips = [...new Set([...recent(memory.quickTips, 50), ...(hardExclusions?.quickTips ?? [])])];
  const format = chooseDistinct(
    weightedFormats(input, random).filter((item) => item !== previous?.format),
    random,
    recentFormats,
    0.34
  );
  const strategyBase = avoidInputEcho(strategies, input);
  const angleBase = avoidInputEcho(angles, input);
  const hookBase = avoidInputEcho(hooks, input);
  const strategy = chooseDistinct(strategyBase.filter((item) => item !== previous?.strategy), random, recentStrategies, 0.38);
  const angle = chooseDistinct(angleBase.filter((item) => item !== previous?.angle), random, recentAngles, 0.34);
  const hook = chooseDistinct(hookBase.filter((item) => item !== previous?.hook), random, recentHooks, 0.34);
  const cta = chooseDistinct(ctas.filter((item) => item !== previous?.cta), random, recentCtas, 0.34);
  const contentType = chooseDistinct(contentTypes.filter((item) => item !== previous?.contentType), random, recentTypes, 0.42);
  const tone = pick(toneModifiers[input.tone], random);
  const lens = chooseDistinct(avoidInputEcho([...businessLens[input.businessType], ...experienceLens[input.experience]], input), random, [], 0.35);
  const objectiveLabel = chooseDistinct(phaseObjectiveCopy[objective], random, recent(memory.strategies, 8), 0.45);
  const action = chooseDistinct(avoidInputEcho(practicalActions, input), random, recentActions, 0.36);
  const material = chooseDistinct(avoidInputEcho(materials, input), random, recentMaterials, 0.34);
  const quickTip = chooseDistinct(avoidInputEcho(quickTips, input), random, recentTips, 0.36);

  return {
    id: `day-${dayIndex}-${Math.round(random() * 1000000)}`,
    dayIndex,
    weekday: weekdays[dayIndex % 7],
    week: Math.floor(dayIndex / 7) + 1,
    isPublishingDay: forcePublish,
    contentType,
    objective,
    objectiveLabel,
    format,
    strategy: `${strategy}, ${tone}`,
    angle: `${angle}. Lente: ${lens}.`,
    hook,
    action,
    cta,
    material,
    quickTip,
    progress: Math.min(96, phaseAccent[objective] + Math.floor(random() * 13))
  };
}

function buildRestDay(dayIndex: number): PlannedDay {
  return {
    id: `rest-${dayIndex}`,
    dayIndex,
    weekday: weekdays[dayIndex % 7],
    week: Math.floor(dayIndex / 7) + 1,
    isPublishingDay: false,
    contentType: "Ottimizzazione",
    objective: "fiducia",
    objectiveLabel: "Leggere segnali e preparare il blocco successivo",
    format: "Revisione asset",
    strategy: "Leggere segnali, salvare insight e preparare il prossimo blocco editoriale",
    angle: "giorno di regia per mantenere coerenza senza saturare il pubblico",
    hook: "Non ogni giorno deve pubblicare: alcuni giorni fanno respirare il sistema",
    action: "leggi i segnali raccolti e scegli cosa rinforzare nel prossimo contenuto",
    cta: "Raccogli una domanda reale",
    material: "note da commenti, DM, analytics e bozze",
    quickTip: "Un giorno senza pubblicazione puo migliorare la qualita del blocco successivo.",
    progress: 48
  };
}

export function generatePlan(input: PlannerInput, memory: UsedMemory, nonce = Date.now()): {
  plan: CalendarPlan;
  memory: UsedMemory;
} {
  const random = seededRandom(createSeed(JSON.stringify(input) + nonce));
  const publishing = publishingSlots(input);
  const nextMemory: UsedMemory = { ...memory };
  const days: PlannedDay[] = [];

  for (let dayIndex = 0; dayIndex < input.duration; dayIndex += 1) {
    if (!publishing[dayIndex]) {
      days.push(buildRestDay(dayIndex));
      continue;
    }

    const day = buildDay(input, dayIndex, random, nextMemory, days[days.length - 1]);
    days.push(day);
    Object.assign(nextMemory, rememberPlan(nextMemory, [day]));
  }

  return {
    plan: assemblePlan(input, days, random),
    memory: nextMemory
  };
}

export function regenerateDay(plan: CalendarPlan, dayId: string, memory: UsedMemory): {
  plan: CalendarPlan;
  memory: UsedMemory;
} {
  const dayIndex = plan.days.findIndex((day) => day.id === dayId);
  if (dayIndex < 0) {
    return { plan, memory };
  }

  const random = seededRandom(createSeed(dayId + Date.now() + JSON.stringify(memory)));
  const original = plan.days[dayIndex];
  const previous = plan.days[dayIndex - 1];
  const expandedMemory = rememberPlan(memory, plan.days.filter((day) => day.isPublishingDay));
  const hardExclusions: UsedMemory = {
    strategies: [original.strategy],
    ctas: [original.cta],
    angles: [original.angle],
    hooks: [original.hook],
    formats: [original.format, previous?.format].filter(Boolean) as string[],
    contentTypes: [original.contentType, previous?.contentType].filter(Boolean) as string[],
    materials: [original.material],
    actions: [original.action],
    quickTips: [original.quickTip],
    objectives: [original.objective, previous?.objective].filter(Boolean) as FunnelPhase[]
  };
  const replacement = buildDay(plan.input, original.dayIndex, random, expandedMemory, previous, original.isPublishingDay, hardExclusions);
  const days = plan.days.map((day, index) => (index === dayIndex ? replacement : day));
  const nextMemory = rememberPlan(memory, [replacement]);
  return { plan: assemblePlan(plan.input, days, random), memory: nextMemory };
}

export function regenerateWeek(plan: CalendarPlan, week: number, memory: UsedMemory): {
  plan: CalendarPlan;
  memory: UsedMemory;
} {
  const random = seededRandom(createSeed(`${plan.id}-${week}-${Date.now()}-${JSON.stringify(memory)}`));
  const expandedMemory = rememberPlan(memory, plan.days.filter((day) => day.isPublishingDay));
  const days = [...plan.days];
  const start = (week - 1) * 7;
  const end = Math.min(start + 7, days.length);
  const newDays: PlannedDay[] = [];
  const originalWeekDays = plan.days.slice(start, end).filter((day) => day.isPublishingDay);
  const hardExclusions: UsedMemory = {
    strategies: originalWeekDays.map((day) => day.strategy),
    ctas: originalWeekDays.map((day) => day.cta),
    angles: originalWeekDays.map((day) => day.angle),
    hooks: originalWeekDays.map((day) => day.hook),
    formats: originalWeekDays.map((day) => day.format),
    contentTypes: originalWeekDays.map((day) => day.contentType),
    materials: originalWeekDays.map((day) => day.material),
    actions: originalWeekDays.map((day) => day.action),
    quickTips: originalWeekDays.map((day) => day.quickTip),
    objectives: originalWeekDays.map((day) => day.objective)
  };

  for (let index = start; index < end; index += 1) {
    if (!days[index].isPublishingDay) {
      continue;
    }

    const replacement = buildDay(plan.input, days[index].dayIndex, random, expandedMemory, days[index - 1], true, hardExclusions);
    days[index] = replacement;
    newDays.push(replacement);
    Object.assign(expandedMemory, rememberPlan(expandedMemory, [replacement]));
    hardExclusions.strategies.push(replacement.strategy);
    hardExclusions.ctas.push(replacement.cta);
    hardExclusions.angles.push(replacement.angle);
    hardExclusions.hooks.push(replacement.hook);
    hardExclusions.formats.push(replacement.format);
    hardExclusions.contentTypes.push(replacement.contentType);
    hardExclusions.materials.push(replacement.material);
    hardExclusions.actions.push(replacement.action);
    hardExclusions.quickTips.push(replacement.quickTip);
    hardExclusions.objectives.push(replacement.objective);
  }

  return { plan: assemblePlan(plan.input, days, random), memory: rememberPlan(memory, newDays) };
}

function assemblePlan(input: PlannerInput, days: PlannedDay[], random: () => number): CalendarPlan {
  const published = days.filter((day) => day.isPublishingDay);
  const distribution = published.reduce(
    (acc, day) => ({ ...acc, [day.objective]: (acc[day.objective] ?? 0) + 1 }),
    {
      awareness: 0,
      fiducia: 0,
      engagement: 0,
      valore: 0,
      vendita: 0,
      "prova sociale": 0
    } as Record<FunnelPhase, number>
  );
  const weeks = Array.from({ length: Math.ceil(input.duration / 7) }, (_, index) => {
    const weekDays = days.filter((day) => day.week === index + 1);
    return {
      week: index + 1,
      days: weekDays,
      checklist: shuffle(weeklyChecklists, random).slice(0, 5)
    };
  });

  return {
    id: `plan-${Math.round(random() * 100000000)}`,
    createdAt: new Date().toISOString(),
    input,
    days,
    weeks,
    distribution,
    ctas: Array.from(new Set(published.map((day) => day.cta))).slice(0, 10),
    formats: Array.from(new Set(published.map((day) => day.format))).slice(0, 10),
    materials: Array.from(new Set(published.map((day) => day.material))).slice(0, 10),
    funnelSequence: published.map((day) => day.objective),
    strategyNotes: [
      summarizeStrategicIntent(input),
      "Il calendario alterna attenzione, fiducia e conversione per evitare una presenza monotematica.",
      "Le CTA sono distribuite tra salvataggio, conversazione e azione commerciale.",
      "Le rigenerazioni usano memoria di sessione per non riproporre subito pattern gia visti."
    ]
  };
}

export function exportPlanText(plan: CalendarPlan) {
  const lines = [
    "Content Calendar PRO",
    "Piano operativo da adattare alla voce del brand. I risultati dipendono da qualita dei contenuti, costanza e mercato.",
    `Durata: ${plan.input.duration} giorni`,
    `Piattaforma: ${plan.input.platform}`,
    `Obiettivo: ${plan.input.goal}`,
    "",
    "Riepilogo strategico",
    ...plan.strategyNotes.map((note) => `- ${note}`),
    "",
    "Calendario",
    "",
    ...plan.days.map((day) =>
      [
        `${day.weekday} - Settimana ${day.week}`,
        `Formato: ${day.format}`,
        `Fase funnel: ${day.objective}`,
        `Obiettivo: ${day.objectiveLabel}`,
        `Strategia: ${day.strategy}`,
        `Angolo: ${day.angle}`,
        `Azione pratica: ${day.action}`,
        `CTA: ${day.cta}`,
        `Materiale: ${day.material}`,
        `Consiglio rapido: ${day.quickTip}`,
        ""
      ].join("\n")
    ),
    "Checklist settimanale",
    ...plan.weeks.flatMap((week) => [`Settimana ${week.week}`, ...week.checklist.map((item) => `- ${item}`)]),
    "",
    "CTA principali",
    ...plan.ctas.map((cta) => `- ${cta}`),
    "",
    "Materiali da preparare",
    ...plan.materials.map((material) => `- ${material}`),
    "",
    "Nota finale",
    "Usa questo planner come base operativa: adatta esempi, ritmo e voice-over alla tua audience prima di pubblicare."
  ];

  return lines.join("\n");
}
