
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
    console.error('Failed to copy: ', err);
    return false;
  }
};

export const getFormattedSummary = (result: AnalysisResult): string => {
  let summary = `【剧本分析报告 - ${result.style}】\n\n`;

  summary += `一、人物设定\n`;
  result.characters.forEach((c, idx) => {
    summary += `${idx + 1}. ${c.name}：${c.identity}。${c.description}\n`;
  });

  summary += `\n二、场景清单\n`;
  result.scenes.forEach((s, idx) => {
    summary += `${idx + 1}. ${s.name} (${s.type}/${s.time})：${s.description}\n`;
  });

  if (result.props.length > 0) {
    summary += `\n三、关键道具\n`;
    result.props.forEach(p => summary += `· ${p.name}：${p.description}\n`);
  }

  return summary;
};

export const exportToJson = (result: AnalysisResult) => {
  const content = JSON.stringify(result, null, 2);
  downloadBlob(content, `剧本分析_${result.style}.json`, 'application/json');
};

export const exportToMarkdown = (result: AnalysisResult) => {
  let md = `# ${result.style} - 剧本设定分析报告\n\n`;

  md += `## 1. 人物角色\n\n`;
  result.characters.forEach(c => {
    md += `### ${c.name} (${c.identity})\n`;
    md += `- **角色类型**: ${c.role === 'main' ? '主角' : '配角'}\n`;
    md += `- **外貌描述**: ${c.gender} | ${c.hairstyle} | ${c.clothing}\n`;
    md += `- **视觉细节**: ${c.description}\n`;
    md += `- **画面指令**:\n  - ${c.visualStates.join('\n  - ')}\n\n`;
  });

  md += `## 2. 场景设定\n\n`;
  result.scenes.forEach(s => {
    md += `### ${s.name}\n`;
    md += `- **类型**: ${s.type} | **时间**: ${s.time} | **机位**: ${s.angle}\n`;
    md += `- **场景描述**: ${s.description}\n`;
    md += `- **分镜细节**:\n  - ${s.visualStates.join('\n  - ')}\n\n`;
  });

  md += `## 3. 道具物品\n\n`;
  result.props.forEach(p => {
    md += `- **${p.name}**: (用途: ${p.usage}) ${p.description}\n`;
  });
  md += '\n';

  md += `## 4. 灯光氛围\n\n`;
  result.lighting.forEach(l => {
    md += `- **${l.type}**: (颜色: ${l.color} | 氛围: ${l.mood}) ${l.description}\n`;
  });
  md += '\n';

  md += `## 5. 技能招式\n\n`;
  result.skills.forEach(sk => {
    md += `- **${sk.name}** (使用者: ${sk.owner}): ${sk.effect} - ${sk.description}\n`;
  });

  downloadBlob(md, `剧本分析_${result.style}.md`, 'text/markdown');
};

export const exportToTxt = (result: AnalysisResult) => {
  let txt = `剧本设定分析报告 - ${result.style}\n`;
  txt += `====================================\n\n`;

  txt += `【人物角色】\n`;
  result.characters.forEach(c => {
    txt += `${c.name} [${c.identity}]\n特征: ${c.gender}, ${c.clothing}\n描述: ${c.description}\n画面关键词: ${c.visualStates.join(', ')}\n\n`;
  });

  txt += `【场景设定】\n`;
  result.scenes.forEach(s => {
    txt += `${s.name} (${s.type}/${s.time})\n描述: ${s.description}\n机位: ${s.angle}\n细节: ${s.visualStates.join(', ')}\n\n`;
  });

  downloadBlob(txt, `剧本分析_${result.style}.txt`, 'text/plain');
};

export const exportToCsvPack = (result: AnalysisResult) => {
  // 导出角色 CSV
  const charHeader = "姓名,身份,角色类型,性别,发型,服装,描述,画面指令\n";
  const charRows = result.characters.map(c => 
    `"${c.name}","${c.identity}","${c.role}","${c.gender}","${c.hairstyle}","${c.clothing}","${c.description.replace(/"/g, '""')}","${c.visualStates.join('|')}"`
  ).join('\n');
  downloadBlob('\uFEFF' + charHeader + charRows, `1_人物角色.csv`, 'text/csv;charset=utf-8');

  // 导出场景 CSV
  const sceneHeader = "名称,类型,时间,机位,描述,细节\n";
  const sceneRows = result.scenes.map(s => 
    `"${s.name}","${s.type}","${s.time}","${s.angle}","${s.description.replace(/"/g, '""')}","${s.visualStates.join('|')}"`
  ).join('\n');
  downloadBlob('\uFEFF' + sceneHeader + sceneRows, `2_场景设定.csv`, 'text/csv;charset=utf-8');

  // 导出道具 CSV
  const propHeader = "名称,用途,描述\n";
  const propRows = result.props.map(p => 
    `"${p.name}","${p.usage}","${p.description.replace(/"/g, '""')}"`
  ).join('\n');
  downloadBlob('\uFEFF' + propHeader + propRows, `3_道具物品.csv`, 'text/csv;charset=utf-8');
};
