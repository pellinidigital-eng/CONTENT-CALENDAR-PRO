import type { PlannedDay, UsedMemory } from "@/types/planner";

export const emptyMemory = (): UsedMemory => ({
  strategies: [],
  ctas: [],
  angles: [],
  hooks: [],
  formats: [],
  contentTypes: [],
  materials: [],
  actions: [],
  quickTips: [],
  objectives: []
});

export function rememberDay(memory: UsedMemory, day: PlannedDay): UsedMemory {
  return trimMemory({
    strategies: [...memory.strategies, day.strategy],
    ctas: [...memory.ctas, day.cta],
    angles: [...memory.angles, day.angle],
    hooks: [...memory.hooks, day.hook],
    formats: [...memory.formats, day.format],
    contentTypes: [...memory.contentTypes, day.contentType],
    materials: [...memory.materials, day.material],
    actions: [...memory.actions, day.action],
    quickTips: [...memory.quickTips, day.quickTip],
    objectives: [...memory.objectives, day.objective]
  });
}

export function rememberPlan(memory: UsedMemory, days: PlannedDay[]): UsedMemory {
  return days.reduce((next, day) => rememberDay(next, day), memory);
}

export function recent<T>(items: T[], size = 8): T[] {
  return items.slice(Math.max(0, items.length - size));
}

export function trimMemory(memory: UsedMemory, max = 90): UsedMemory {
  return {
    strategies: memory.strategies.slice(-max),
    ctas: memory.ctas.slice(-max),
    angles: memory.angles.slice(-max),
    hooks: memory.hooks.slice(-max),
    formats: memory.formats.slice(-max),
    contentTypes: memory.contentTypes.slice(-max),
    materials: memory.materials.slice(-max),
    actions: memory.actions.slice(-max),
    quickTips: memory.quickTips.slice(-max),
    objectives: memory.objectives.slice(-max)
  };
}

export function loadMemory(): UsedMemory {
  if (typeof window === "undefined") {
    return emptyMemory();
  }

  try {
    const raw = window.sessionStorage.getItem("content-calendar-pro-memory");
    return raw ? { ...emptyMemory(), ...JSON.parse(raw) } : emptyMemory();
  } catch {
    return emptyMemory();
  }
}

export function saveMemory(memory: UsedMemory) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem("content-calendar-pro-memory", JSON.stringify(trimMemory(memory)));
}

export function mergeMemory(base: UsedMemory, next: UsedMemory): UsedMemory {
  return trimMemory({
    strategies: [...base.strategies, ...next.strategies],
    ctas: [...base.ctas, ...next.ctas],
    angles: [...base.angles, ...next.angles],
    hooks: [...base.hooks, ...next.hooks],
    formats: [...base.formats, ...next.formats],
    contentTypes: [...base.contentTypes, ...next.contentTypes],
    materials: [...base.materials, ...next.materials],
    actions: [...base.actions, ...next.actions],
    quickTips: [...base.quickTips, ...next.quickTips],
    objectives: [...base.objectives, ...next.objectives]
  });
}
