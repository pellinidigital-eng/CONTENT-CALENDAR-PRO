import { emptyMemory } from "@/lib/antiRepetition";
import {
  angles,
  contentFormats,
  ctas,
  engagementTactics,
  funnelPatterns,
  hooks,
  materials,
  socialProofIdeas,
  softSellIdeas,
  strategies,
  weeklyChecklists
} from "@/data/contentLibraries";
import { exportPlanText, generatePlan, regenerateDay, regenerateWeek } from "@/lib/plannerEngine";
import { textSimilarity } from "@/lib/similarity";

const scenarios = [
  ["corso online", { niche: "formazione digitale", product: "corso online", goal: "lead generation", platform: "Instagram", frequency: "5 post settimana", tone: "educativo", experience: "intermedio", businessType: "creator" }],
  ["ecommerce prodotti beauty", { niche: "beauty ecommerce", product: "linea prodotti skincare", goal: "vendite", platform: "TikTok", frequency: "daily posting", tone: "diretto", experience: "intermedio", businessType: "ecommerce" }],
  ["ristorante locale", { niche: "ristorazione locale", product: "esperienza in sala", goal: "engagement", platform: "Facebook", frequency: "5 post settimana", tone: "empatico", experience: "principiante", businessType: "local business" }],
  ["consulente finanziario", { niche: "educazione finanziaria", product: "consulenza patrimoniale", goal: "lead generation", platform: "Multi piattaforma", frequency: "3 post settimana", tone: "autorevole", experience: "avanzato", businessType: "professionista" }],
  ["personal trainer", { niche: "fitness coaching", product: "percorso di allenamento", goal: "vendite", platform: "Instagram", frequency: "5 post settimana", tone: "diretto", experience: "intermedio", businessType: "professionista" }],
  ["creator digitale", { niche: "creator economy", product: "community digitale", goal: "personal brand", platform: "TikTok", frequency: "daily posting", tone: "ispirazionale", experience: "avanzato", businessType: "creator" }],
  ["agenzia marketing", { niche: "marketing B2B", product: "servizio strategico", goal: "lead generation", platform: "Multi piattaforma", frequency: "5 post settimana", tone: "premium", experience: "avanzato", businessType: "agenzia" }],
  ["centro estetico", { niche: "beauty locale", product: "trattamenti viso", goal: "vendite", platform: "Instagram", frequency: "5 post settimana", tone: "empatico", experience: "intermedio", businessType: "local business" }],
  ["fotografo", { niche: "fotografia professionale", product: "servizi fotografici", goal: "personal brand", platform: "Instagram", frequency: "3 post settimana", tone: "premium", experience: "intermedio", businessType: "professionista" }],
  ["coach crescita personale", { niche: "crescita personale", product: "percorso coaching", goal: "lead generation", platform: "Multi piattaforma", frequency: "5 post settimana", tone: "ispirazionale", experience: "avanzato", businessType: "professionista" }]
];

function duplicates(values) {
  return values.length - new Set(values).size;
}

function overlap(before, after, key) {
  const source = new Set(before.map((day) => day[key]));
  return after.filter((day) => source.has(day[key])).length;
}

function maxAdjacentSimilarity(days, key) {
  let max = 0;
  for (let index = 1; index < days.length; index += 1) {
    max = Math.max(max, textSimilarity(days[index - 1][key], days[index][key]));
  }
  return Number(max.toFixed(2));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertLibraryCounts() {
  return [
    ["strategie", strategies.length, 150],
    ["CTA", ctas.length, 150],
    ["angoli", angles.length, 120],
    ["hook", hooks.length, 100],
    ["format", contentFormats.length, 80],
    ["materiali", materials.length, 80],
    ["checklist", weeklyChecklists.length, 80],
    ["pattern funnel", funnelPatterns.length, 60],
    ["engagement", engagementTactics.length, 60],
    ["prova sociale", socialProofIdeas.length, 60],
    ["vendita soft", softSellIdeas.length, 60]
  ].filter(([, actual, expected]) => actual < expected);
}

const report = [];
let memory = emptyMemory();

for (const [name, base] of scenarios) {
  for (const duration of [7, 14, 30]) {
    const input = { ...base, duration };
    const generated = generatePlan(input, memory, Date.now() + duration);
    let plan = generated.plan;
    memory = generated.memory;
    const originalPosts = plan.days.filter((day) => day.isPublishingDay);
    const firstWeek = originalPosts.filter((day) => day.week === 1);
    let weekFormatOverlap = 0;
    let weekStrategyOverlap = 0;

    for (let repeat = 0; repeat < 5; repeat += 1) {
      const previousWeek = plan.days.filter((day) => day.isPublishingDay && day.week === 1);
      const regenWeek = regenerateWeek(plan, 1, memory);
      const nextWeek = regenWeek.plan.days.filter((day) => day.isPublishingDay && day.week === 1);
      weekFormatOverlap += overlap(previousWeek.length ? previousWeek : firstWeek, nextWeek, "format");
      weekStrategyOverlap += overlap(previousWeek.length ? previousWeek : firstWeek, nextWeek, "strategy");
      plan = regenWeek.plan;
      memory = regenWeek.memory;
    }

    const target = plan.days.find((day) => day.isPublishingDay);
    const dayVariants = [];
    if (target) {
      let currentDayId = target.id;
      for (let repeat = 0; repeat < 10; repeat += 1) {
        const regenDay = regenerateDay(plan, currentDayId, memory);
        const variant = regenDay.plan.days.find((day) => day.dayIndex === target.dayIndex);
        if (variant) {
          dayVariants.push(variant);
          currentDayId = variant.id;
        }
        plan = regenDay.plan;
        memory = regenDay.memory;
      }
    }

    const posts = plan.days.filter((day) => day.isPublishingDay);
    const exported = exportPlanText(plan);
    const searchable = posts.map((day) => `${day.strategy} ${day.angle} ${day.hook} ${day.action} ${day.quickTip}`).join(" ").toLowerCase();
    const userWords = [...input.niche.split(/\s+/), ...input.product.split(/\s+/)].filter((word) => word.length > 4);

    report.push({
      scenario: name,
      duration,
      posts: posts.length,
      duplicateCta: duplicates(posts.map((day) => day.cta)),
      duplicateFormat: duplicates(posts.map((day) => day.format)),
      duplicateAngle: duplicates(posts.map((day) => day.angle)),
      duplicateAction: duplicates(posts.map((day) => day.action)),
      weekFormatOverlap,
      weekStrategyOverlap,
      dayVariantFormatDupes: duplicates(dayVariants.map((day) => day.format)),
      dayVariantCtaDupes: duplicates(dayVariants.map((day) => day.cta)),
      maxStrategySimilarity: maxAdjacentSimilarity(posts, "strategy"),
      maxAngleSimilarity: maxAdjacentSimilarity(posts, "angle"),
      exportChars: exported.length,
      inputEcho: userWords.filter((word) => new RegExp(`\\b${escapeRegex(word.toLowerCase())}\\b`).test(searchable)).length
    });
  }
}

console.table(report);

const libraryFailures = assertLibraryCounts();
if (libraryFailures.length) {
  console.error("Library count failures", libraryFailures);
}

const failures = report.filter((item) =>
  item.inputEcho > 0 ||
  item.weekStrategyOverlap > 0 ||
  item.weekFormatOverlap > 0 ||
  item.dayVariantCtaDupes > 0 ||
  item.dayVariantFormatDupes > 3 ||
  item.maxStrategySimilarity > 0.56 ||
  item.maxAngleSimilarity > 0.56 ||
  item.exportChars < 1800
);
if (failures.length) {
  console.error("QA failures", failures);
  process.exitCode = 1;
}

if (libraryFailures.length) {
  process.exitCode = 1;
}

process.exit(process.exitCode ?? 0);
