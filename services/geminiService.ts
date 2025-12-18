
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    style: { type: Type.STRING, description: "剧本风格（如：都市复仇、奇幻、短剧爽文）" },
    characters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING, description: "角色名、怪物名称或职业称呼（如：老人甲、护工、某某怪物）" },
          role: { type: Type.STRING, enum: ["main", "other", "creature", "crowd", "mob"] },
          category: { type: Type.STRING, enum: ["human", "monster", "animal", "professional", "generic", "crowd"] },
          gender: { type: Type.STRING },
          identity: { type: Type.STRING, description: "具体职业或身份背景" },
          pastBackground: { type: Type.STRING, description: "人物的前世、过去或基础设定背景" },
          presentStatus: { type: Type.STRING, description: "当前剧情中的处境、动机或状态" },
          personality: { type: Type.STRING },
          clothing: { type: Type.STRING },
          visualStates: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "实时状态或形态描述词，如：Q版、浑身是伤、黑化、变异、重伤等"
          },
          description: { type: Type.STRING, description: "综合小传描述" },
          sourceQuote: { type: Type.STRING, description: "原文中最能体现其特征的完整句子" }
        },
        required: ["id", "name", "role", "category", "visualStates", "sourceQuote"],
      },
    },
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          episode: { type: Type.STRING },
          oneSentence: { type: Type.STRING, description: "该场景的一句话戏剧冲突提炼" },
          type: { type: Type.STRING, enum: ["室内", "室外", "其他"] },
          time: { type: Type.STRING },
          description: { type: Type.STRING },
          sourceQuote: { type: Type.STRING }
        },
        required: ["id", "name", "oneSentence", "sourceQuote"],
      },
    },
    props: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          usage: { type: Type.STRING },
          sourceQuote: { type: Type.STRING }
        },
        required: ["id", "name", "sourceQuote"],
      },
    },
    lighting: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING },
          color: { type: Type.STRING },
          description: { type: Type.STRING },
          sourceQuote: { type: Type.STRING }
        },
        required: ["id", "type", "sourceQuote"],
      },
    },
    relationships: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING },
          target: { type: Type.STRING },
          type: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["source", "target", "type"],
      },
    },
  },
  required: ["style", "characters", "scenes", "props", "lighting", "relationships"],
};

export const analyzeScript = async (text: string): Promise<AnalysisResult> => {
  // Always initialize GoogleGenAI with the latest API key from process.env.API_KEY.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `你是一位全能的剧本/小说设定扒皮大师。请深度分析用户提供的长文本（可能达数万字），提取精准的设定包。
      
      【特别识别指令】
      1. 必须识别并提取每一个出现的实体：包括职业个体（护工、警察）、龙套（路人们）、怪物、灵异体、动物等。
      2. 深度捕捉“状态词”：如原文提到“Q版形态”、“浑身是伤”、“满脸血迹”、“机械义肢”等，必须记录在 visualStates 中。
      3. 性格弧光：如果是短剧，请区分角色的“前世/隐藏身份”与“今生/显性状态”。
      4. 即使是只出现一次的群体（如：围观的人群），也请记录其动态反应。
      
      文本内容：
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.1,
      },
    });

    const result = JSON.parse(response.text || "{}") as AnalysisResult;
    
    // 补全 ID 逻辑
    const ensureIds = (arr: any[]) => {
      if (!Array.isArray(arr)) return;
      arr.forEach(item => { if (!item.id) item.id = Math.random().toString(36).substr(2, 9); });
    };
    
    ensureIds(result.characters);
    ensureIds(result.scenes);
    ensureIds(result.props);
    ensureIds(result.lighting);

    return result;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("AI 深度解析失败，请检查网络或稍后重试。");
  }
};
