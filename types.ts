
export interface Character {
  id: string;
  name: string;
  gender: string;
  hairstyle: string;
  hairColor: string;
  clothing: string;
  identity: string;
  description: string;
  role: 'main' | 'other' | 'creature';
  visualStates: string[];
  sourceQuote?: string; // 对应的原文片段
}

export interface Scene {
  id: string;
  name: string;
  type: '室内' | '室外' | '其他';
  time: string;
  angle: string;
  description: string;
  visualStates: string[];
  sourceQuote?: string; // 对应的原文片段
}

export interface Prop {
  id: string;
  name: string;
  description: string;
  usage: string;
  sourceQuote?: string; // 对应的原文片段
}

export interface Lighting {
  id: string;
  type: string;
  color: string;
  shape: string;
  mood: string;
  description: string;
  sourceQuote?: string; // 对应的原文片段
}

export interface Skill {
  id: string;
  name: string;
  owner: string;
  description: string;
  effect: string;
  sourceQuote?: string; // 对应的原文片段
}

export interface Relationship {
  source: string;
  target: string;
  type: string;
  description: string;
}

export interface AnalysisResult {
  style: string;
  characters: Character[];
  scenes: Scene[];
  props: Prop[];
  lighting: Lighting[];
  skills: Skill[];
  relationships: Relationship[];
}

export type TabType = 'characters' | 'scenes' | 'props' | 'lighting' | 'skills' | 'relationships';
