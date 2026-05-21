export type Goal =
  | "crescita follower"
  | "vendite"
  | "lead generation"
  | "personal brand"
  | "engagement";

export type Platform = "Instagram" | "TikTok" | "Facebook" | "Multi piattaforma";
export type Frequency = "3 post settimana" | "5 post settimana" | "daily posting";
export type Tone = "autorevole" | "empatico" | "diretto" | "ispirazionale" | "premium" | "educativo";
export type ExperienceLevel = "principiante" | "intermedio" | "avanzato";
export type BusinessType = "creator" | "professionista" | "ecommerce" | "agenzia" | "local business" | "startup";
export type Duration = 7 | 14 | 30;

export type FunnelPhase =
  | "awareness"
  | "fiducia"
  | "engagement"
  | "valore"
  | "vendita"
  | "prova sociale";

export type PlannerInput = {
  niche: string;
  product: string;
  goal: Goal;
  platform: Platform;
  frequency: Frequency;
  tone: Tone;
  experience: ExperienceLevel;
  businessType: BusinessType;
  duration: Duration;
};

export type PlannedDay = {
  id: string;
  dayIndex: number;
  weekday: string;
  week: number;
  isPublishingDay: boolean;
  contentType: string;
  objective: FunnelPhase;
  objectiveLabel: string;
  format: string;
  strategy: string;
  angle: string;
  hook: string;
  action: string;
  cta: string;
  material: string;
  quickTip: string;
  progress: number;
};

export type WeeklyPlan = {
  week: number;
  days: PlannedDay[];
  checklist: string[];
};

export type CalendarPlan = {
  id: string;
  createdAt: string;
  input: PlannerInput;
  days: PlannedDay[];
  weeks: WeeklyPlan[];
  distribution: Record<FunnelPhase, number>;
  ctas: string[];
  formats: string[];
  materials: string[];
  funnelSequence: FunnelPhase[];
  strategyNotes: string[];
};

export type UsedMemory = {
  strategies: string[];
  ctas: string[];
  angles: string[];
  hooks: string[];
  formats: string[];
  contentTypes: string[];
  materials: string[];
  actions: string[];
  quickTips: string[];
  objectives: FunnelPhase[];
};
