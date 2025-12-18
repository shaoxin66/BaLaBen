
import { AnalysisResult, Character, Scene, Prop, Lighting, Skill, Relationship } from "../types";

const generateId = () => Math.random().toString(36).substring(2, 9);

// 扩展职业与泛称关键词
const genericKeywords = ['护工', '医生', '警察', '路人', '群众', '老人', '小孩', '怪物', '生物', '守卫', '保镖', '管家', '司机'];

export const analyzeScriptLocal = async (text: string): Promise<AnalysisResult> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  const lines = text.split('\n');
  const characters: Character[] = [];
  const scenes: Scene[] = [];
  const props: Prop[] = [];
  const lighting: Lighting[] = [];
  const relationships: Relationship[] = [];
  
  const characterNames = new Map<string, Character>();
  const sceneCharacterMap = new Map<string, Set<string>>();

  let currentScene: Scene | null = null;
  let currentEpisode: string = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 1. 识别场景
    const sceneMatch = line.match(/^(?:第?\s*\d+\s*场|SCENE|\d+[\s-]+\d+|场景|地点)\s*(.*)/i);
    if (sceneMatch) {
      currentScene = {
        id: generateId(),
        name: sceneMatch[1] || `场次 ${scenes.length + 1}`,
        episode: currentEpisode,
        oneSentence: "本地扫描：识别场次转换",
        type: line.includes('内') ? '室内' : '室外',
        time: line.includes('日') ? '日' : '夜',
        angle: '默认',
        description: '',
        visualStates: [],
        sourceQuote: line
      };
      scenes.push(currentScene);
      sceneCharacterMap.set(currentScene.id, new Set());
      continue;
    }

    // 2. 识别角色 (包含对话中的非特定称呼)
    // 修正正则：使用 Unicode 转义并对半角括号进行显式转义，防止部分环境下的 Unterminated group 报错
    // \uff1a = ：, \uff08 = （, \uff09 = ）, \u3010 = 【, \u3011 = 】
    const diaMatch = line.match(/^([^\s\uff1a:\uff08\(\u3010]{1,15})(?:\s*[\uff08\(\u3010]([^\uff09\)\u3011]+)[\uff09\)\u3011])?[\uff1a:]/);
    
    if (diaMatch) {
      const name = diaMatch[1].trim();
      const detail = diaMatch[2] || "剧中实体";
      
      if (!characterNames.has(name) && !['场景', '地点', '时间', '剧情', '注'].includes(name)) {
        // 判断类别
        let category: any = 'human';
        if (name.includes('怪物') || name.includes('尸') || name.includes('灵')) category = 'monster';
        else if (genericKeywords.some(k => name.includes(k))) category = 'professional';
        else if (name.includes('群') || name.includes('众')) category = 'crowd';

        // 识别视觉状态
        const vStates = [];
        if (line.includes('Q版')) vStates.push('Q版形态');
        if (line.includes('伤') || line.includes('血')) vStates.push('受损/负伤');

        const newChar: Character = {
          id: generateId(),
          name: name,
          role: 'other',
          category: category,
          gender: detail.includes('女') ? '女' : '男',
          identity: detail,
          pastBackground: '本地分析待确认',
          presentStatus: '活跃于剧情中',
          personality: '待定',
          clothing: '未知',
          description: line.substring(0, 100),
          visualStates: vStates,
          sourceQuote: line,
          hairstyle: '', hairColor: ''
        };
        characters.push(newChar);
        characterNames.set(name, newChar);
      }
      if (currentScene) sceneCharacterMap.get(currentScene.id)?.add(name);
    }
  }

  return {
    style: "离线本地广义识别 V4.1",
    characters,
    scenes,
    props,
    lighting,
    skills: [],
    relationships
  };
};
