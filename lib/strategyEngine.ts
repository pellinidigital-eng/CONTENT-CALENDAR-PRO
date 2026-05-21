import type { FunnelPhase, Goal, PlannerInput } from "@/types/planner";
import { funnelPatterns, funnelSequences } from "@/data/contentLibraries";
import { pick } from "@/lib/random";

export function buildFunnelSequence(goal: Goal, duration: number): FunnelPhase[] {
  const sequence = funnelSequences[goal];
  return Array.from({ length: duration }, (_, index) => sequence[index % sequence.length]);
}

export function choosePhase(
  input: PlannerInput,
  dayIndex: number,
  random: () => number,
  previous?: FunnelPhase,
  blocked: FunnelPhase[] = []
) {
  const pattern = funnelPatterns[Math.floor(random() * funnelPatterns.length) % funnelPatterns.length];
  const sequence = dayIndex % 2 === 0 ? funnelSequences[input.goal] : pattern;
  let phase = sequence[dayIndex % sequence.length];

  if (phase === previous || blocked.includes(phase)) {
    const candidates = sequence.filter((item) => item !== previous && !blocked.includes(item));
    phase = candidates.length > 0 ? pick(candidates, random) : pick(sequence.filter((item) => item !== previous), random);
  }

  return phase;
}

export function summarizeStrategicIntent(input: PlannerInput) {
  const intentByGoal: Record<Goal, string> = {
    "crescita follower": "aprire nuove finestre di attenzione senza abbassare la qualita percepita",
    vendite: "preparare domanda, prova e scelta commerciale in una progressione naturale",
    "lead generation": "trasformare curiosita in conversazioni qualificate",
    "personal brand": "rendere riconoscibile una prospettiva, non solo una presenza",
    engagement: "attivare risposte reali e segnali utili per i contenuti successivi"
  };

  return `La regia privilegia ${intentByGoal[input.goal]} con frequenza ${input.frequency}.`;
}
