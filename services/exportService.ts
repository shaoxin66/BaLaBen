
import { AnalysisResult } from "../types";

const downloadBlob = (content: string, filename: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('复制失败: ', err);
    return false;
  }
};

export const getFormattedSummary = (result: AnalysisResult): string => {
  let summary = `【SHAOXIN 剧本分析简报 - 提取风格：${result.style}】\n\n`;

  summary += `一、核心人物\n`;
  result.characters.forEach((c, idx) => {
    summary += `${idx + 1}. ${c.name} [${c.identity}]：${c.description}\n`;
  });

  summary += `\n二、场景序列\n`;
  result.scenes.forEach((s, idx) => {
    summary += `${idx + 1}. ${s.name} (${s.type}/${s.time})：${s.description}\n`;
  });

  if (result.props.length > 0) {
    summary += `\n三、关键设定\n`;
    result.props.forEach(p => summary += `· ${p.name}：${p.description}\n`);
  }

  return summary;
};

export const exportToJson = (result: AnalysisResult) => {
  const content = JSON.stringify(result, null, 2);
  downloadBlob(content, `SHAOXIN_数据提取_${Date.now()}.json`, 'application/json');
};

export const exportToMarkdown = (result: AnalysisResult) => {
  let md = `# ${result.style} - 剧本设定分析报告\n\n`;

  md += `## 1. 角色库\n\n`;
  result.characters.forEach(c => {
    md += `### ${c.name} (${c.identity})\n`;
    md += `- **外貌特征**: ${c.gender} | ${c.hairstyle} | ${c.clothing}\n`;
    md += `- **描述信息**: ${c.description}\n\n`;
  });

  md += `## 2. 场景库\n\n`;
  result.scenes.forEach(s => {
    md += `### ${s.name}\n`;
    md += `- **详情**: ${s.type} | ${s.time} | 机位: ${s.angle}\n\n`;
  });

  downloadBlob(md, `SHAOXIN_报告_${Date.now()}.md`, 'text/markdown');
};

export const exportToTxt = (result: AnalysisResult) => {
  let txt = getFormattedSummary(result);
  downloadBlob(txt, `SHAOXIN_简报_${Date.now()}.txt`, 'text/plain');
};

export const exportToCsvPack = (result: AnalysisResult) => {
  const charHeader = "姓名,身份,性别,描述\n";
  const charRows = result.characters.map(c => `"${c.name}","${c.identity}","${c.gender}","${c.description.replace(/"/g, '""')}"`).join('\n');
  downloadBlob('\uFEFF' + charHeader + charRows, `1_人物清单.csv`, 'text/csv;charset=utf-8');
};
