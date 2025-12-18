
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    style: { type: Type.STRING, description: "剧本风格" },
    characters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          role: { type: Type.STRING, enum: ["main", "other", "creature"] },
          gender: { type: Type.STRING },
          hairstyle: { type: Type.STRING },
          hairColor: { type: Type.STRING },
          clothing: { type: Type.STRING },
          identity: { type: Type.STRING },
          description: { type: Type.STRING },
          visualStates: { type: Type.ARRAY, items: { type: Type.STRING } },
          sourceQuote: { type: Type.STRING, description: "该设定在原文中的证据摘录（约50字）" }
        },
        required: ["id", "name", "role", "identity", "sourceQuote"],
      },
    },
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          type: { type: Type.STRING, enum: ["室内", "室外", "其他"] },
          time: { type: Type.STRING },
          angle: { type: Type.STRING },
          description: { type: Type.STRING },
          visualStates: { type: Type.ARRAY, items: { type: Type.STRING } },
          sourceQuote: { type: Type.STRING, description: "该场景出现的原文片段" }
        },
        required: ["id", "name", "type", "time", "sourceQuote"],
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
          sourceQuote: { type: Type.STRING, description: "道具出现的原文片段" }
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
          shape: { type: Type.STRING },
          mood: { type: Type.STRING },
          description: { type: Type.STRING },
          sourceQuote: { type: Type.STRING, description: "描写光效的原文片段" }
        },
        required: ["id", "type", "color", "sourceQuote"],
      },
    },
    skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          owner: { type: Type.STRING },
          description: { type: Type.STRING },
          effect: { type: Type.STRING },
          sourceQuote: { type: Type.STRING, description: "技能释放的原文片段" }
        },
        required: ["id", "name", "owner", "sourceQuote"],
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
  required: ["style", "characters", "scenes", "props", "lighting", "skills", "relationships"],
};

const generateUniqueId = () => Math.random().toString(36).substring(2, 9);

export const analyzeScript = async (text: string): Promise<AnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `分析提供的剧本/小说，提取详细设定。
      要求：
      1. 全中文。
      2. 必须为每个非关系类的提取项提供 'sourceQuote'，即该设定在原文中的字面出处片段。
      3. 设定描述要具备视觉参考价值。
      
      原文：
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.1,
      },
    });

    const result = JSON.parse(response.text || "{}") as AnalysisResult;
    
    // 安全地补全缺失的 ID
    const fixIds = (list: any[]) => {
      if (!Array.isArray(list)) return;
      list.forEach(item => {
        if (!item.id) {
          item.id = generateUniqueId();
        }
      });
    };
    
    fixIds(result.characters);
    fixIds(result.scenes);
    fixIds(result.props);
    fixIds(result.lighting);
    fixIds(result.skills);

    return result;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error("扒取失败，可能由于文本过长或格式问题。");
  }
};
