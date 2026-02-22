export type MagicMoveStepMeta = {
  lines: boolean;
  startLine: number;
};

export type MagicMoveStep = {
  lang: string;
  code: string;
  meta: MagicMoveStepMeta;
};

export type AnimationType = "magic-move" | "fade";

export type SimpleStep = {
  id: string;
  code: string;
};
