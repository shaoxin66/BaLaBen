
import { AnalysisResult, Character, Scene, Prop, Lighting, Skill, Relationship } from "../types";

// Helper to generate random IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to extract visual states from text (looking for numbered lists or bracketed text)
const extractVisualStates = (text: string): string[] => {
  const visuals: string[] = [];
  
  // Pattern 1: Numbered lists like "1. Close up 2. Wide shot"
  const numberedRegex = /(?:^|\s)(\d+[.、]\s*[^\d\n]+)/g;
  let match;
  while ((match = numberedRegex.exec(text)) !== null) {
    visuals.push(match[1].trim());
  }

  // Pattern 2: Bracketed text like "【Close up】" if no numbered list found
  if (visuals.length === 0) {
    const bracketRegex = /[【\[]([^】\]]+)[】\]]/g;
    while ((match = bracketRegex.exec(text)) !== null) {
        // Filter out common non-visual tags
        if (!['场景', '时间', '角色'].includes(match[1])) {
            visuals.push(match[1].trim());
        }
    }
  }

  return visuals;
};

export const analyzeScriptLocal = async (text: string): Promise<AnalysisResult> => {
  // Simulate a short processing delay for UX
  await new Promise(resolve => setTimeout(resolve, 800));

  const lines = text.split('\n');
  const characters: Character[] = [];
  const scenes: Scene[] = [];
  const props: Prop[] = [];
  const lighting: Lighting[] = [];
  
  // Temporary storage sets
  const characterNames = new Set<string>();
  
  let currentScene: Scene | null = null;
  let currentBuffer = ""; // To store description text

  // Regex Patterns
  const sceneStartRegex = /^(?:第[0-9一二三四五六七八九十]+场|SCENE|EXT\.|INT\.|场景|地点)[：:]?\s*(.*)/i;
  const characterIntroRegex = /^(?:角色|人物|Name)[：:]\s*([^\s：:]+)/i;
  const dialogueRegex = /^([^\s：:("]+)[：:]\s*(.*)/; // Simple "Name: Dialogue"
  
  // Simple Parsing Loop
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 1. Detect Scenes
    const sceneMatch = line.match(sceneStartRegex);
    if (sceneMatch || line.startsWith('【') && line.includes('场')) {
      // Save previous scene description/visuals if exists
      if (currentScene) {
          currentScene.visualStates = extractVisualStates(currentBuffer);
      }

      const sceneName = sceneMatch ? sceneMatch[1] || line : line.replace(/[【】]/g, '');
      currentScene = {
        id: generateId(),
        name: sceneName,
        type: line.includes('内') || line.includes('INT') ? '室内' : '室外',
        time: line.includes('夜') ? '夜' : '日',
        angle: '默认',
        description: '',
        visualStates: [],
        sourceQuote: line // 记录来源行用于定位
      };
      scenes.push(currentScene);
      currentBuffer = "";
      continue;
    }

    // 2. Detect Characters (Explicit Introduction)
    const charMatch = line.match(characterIntroRegex);
    if (charMatch) {
        const name = charMatch[1];
        if (!characterNames.has(name) && name.length < 10) {
            characters.push({
                id: generateId(),
                name: name,
                role: characters.length < 2 ? 'main' : 'other',
                gender: '未知',
                hairstyle: '未知',
                hairColor: '未知',
                clothing: '未知',
                identity: '未知',
                description: line,
                visualStates: extractVisualStates(line),
                sourceQuote: line // 记录来源行用于定位
            });
            characterNames.add(name);
        }
    }

    // 3. Detect Characters (Dialogue inference)
    const diaMatch = line.match(dialogueRegex);
    if (diaMatch) {
        const name = diaMatch[1];
        if (!characterNames.has(name) && name.length < 8 && !['时间','地点','场景'].includes(name)) {
             characters.push({
                id: generateId(),
                name: name,
                role: 'other',
                gender: '未知',
                hairstyle: '未知',
                hairColor: '未知',
                clothing: '未知',
                identity: '未知',
                description: '从对话提取',
                visualStates: [],
                sourceQuote: line // 记录来源行用于定位
            });
            characterNames.add(name);
        }
    }

    // 4. Collect Props/Lighting keywords
    if (line.includes('道具') || line.includes('物品')) {
        props.push({
            id: generateId(),
            name: line.split(/[：:]/)[1] || '未命名道具',
            description: line,
            usage: '剧情使用',
            sourceQuote: line // 记录来源行用于定位
        });
    }
    
    if (line.includes('光效') || line.includes('灯光')) {
        lighting.push({
            id: generateId(),
            type: '环境光',
            color: '未知',
            shape: '未知',
            mood: '未知',
            description: line,
            sourceQuote: line // 记录来源行用于定位
        });
    }

    // Accumulate description for current scene
    if (currentScene) {
        if (line.match(/^\d+[.、]/)) {
            currentScene.visualStates.push(line);
        } else {
            currentScene.description += line + "\n";
            currentBuffer += line + "\n";
        }
    }
  }

  // Post-processing
  if (currentScene) {
     const remainingVisuals = extractVisualStates(currentBuffer);
     remainingVisuals.forEach(v => {
         if(!currentScene?.visualStates.includes(v)) currentScene?.visualStates.push(v);
     });
  }

  // Basic Relationship Inference
  const relationships: Relationship[] = [];
  if (characters.length > 1) {
      relationships.push({
          source: characters[0].name,
          target: characters[1].name,
          type: '共演',
          description: '出现在同一剧本中'
      });
  }

  if (characters.length === 0) {
      characters.push({ 
          id: 'temp', name: '未识别角色', role: 'other', gender: '-', hairstyle: '-', hairColor: '-', clothing: '-', identity: '-', description: '本地模式依赖“角色：”或对话格式。', visualStates: [] 
      });
  }

  return {
    style: "本地分析模式",
    characters,
    scenes,
    props,
    lighting,
    skills: [],
    relationships
  };
};
