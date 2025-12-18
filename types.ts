
export interface Character {
  id: string;
  name: string;
  gender: string;
  hairstyle: string;
  hairColor: string;
  clothing: string;
  identity: string;
  pastBackground: string; 
  presentStatus: string;  
  personality: string;    
  description: string;
  role: 'main' | 'other' | 'creature' | 'crowd' | 'mob'; // 细化角色权重
  category: 'human' | 'monster' | 'animal' | 'professional' | 'generic' | 'crowd'; // 新增角色类别
  visualStates: string[]; // 动态形态描述，如：Q版、浑身是伤
  sourceQuote?: string; 
}

export interface Scene {
  id: string;
  name: string;
  episode?: string;       
  oneSentence?: string;   
  type: '室内' | '室外' | '其他';
  time: string;
  angle: string;
  description: string;
  visualStates: string[];
  sourceQuote?: string; 
}

export interface Prop {
  id: string;
  name: string;
  description: string;
  usage: string;
  sourceQuote?: string;
}

export interface Lighting {
  id: string;
  type: string;
  color: string;
  shape: string;
  mood: string;
  description: string;
  sourceQuote?: string;
}

export interface Skill {
  id: string;
  name: string;
  owner: string;
  description: string;
  effect: string;
  sourceQuote?: string;
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
