export type StepMeta = {
  lines: boolean;
  startLine: number;
};

export type Step = {
  lang: string;
  code: string;
  meta: StepMeta;
};

export type SimpleStep = {
  id: string;
  code: string;
};

export type AnimationType = "typing" | "token-flow";

export type TimelineInfo = {
  totalMs: number;
  startHold: number;
  betweenHold: number;
  endHold: number;
};
