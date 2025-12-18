
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  FileText, Zap, 
  Loader2, Link, Link2Off, LayoutGrid, SquareSplitVertical,
  ArrowRight, CircleDashed, SearchCode, Eye, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeScript } from './services/geminiService';
import { analyzeScriptLocal } from './services/localAnalysisService';
import { AnalysisResult, TabType } from './types';
import RelationshipGraph from './components/RelationshipGraph';
import { CharacterCard, SceneCard, PropCard, LightingCard, SkillCard } from './components/ResultCards';
import { 
  exportToJson, 
  exportToMarkdown, 
  exportToTxt
} from './services/exportService';

const App: React.FC = () => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('characters');
  const [viewMode, setViewMode] = useState<'edit' | 'compare'>('edit');
  const [highlightQuote, setHighlightQuote] = useState<string | null>(null);
  const [activeSourceName, setActiveSourceName] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true); 
  
  const [leftWidth, setLeftWidth] = useState(40);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const sourceContainerRef = useRef<HTMLDivElement>(null);
  const resultContainerRef = useRef<HTMLDivElement>(null);
  const highlightedRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isSyncingSource = useRef(false);
  const isSyncingResult = useRef(false);
  const isAutoScrolling = useRef(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (highlightQuote && sourceContainerRef.current) {
      isAutoScrolling.current = true;
      setTimeout(() => {
        if (highlightedRef.current) {
          highlightedRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
        setTimeout(() => { isAutoScrolling.current = false; }, 1000);
      }, 50);
    }
  }, [highlightQuote]);

  const handleSourceScroll = useCallback(() => {
    if (!syncScroll || isSyncingResult.current || isAutoScrolling.current || !sourceContainerRef.current || !resultContainerRef.current) return;
    isSyncingSource.current = true;
    const { scrollTop, scrollHeight, clientHeight } = sourceContainerRef.current;
    const ratio = scrollTop / (scrollHeight - clientHeight);
    resultContainerRef.current.scrollTop = ratio * (resultContainerRef.current.scrollHeight - resultContainerRef.current.clientHeight);
    setTimeout(() => { isSyncingSource.current = false; }, 50);
  }, [syncScroll]);

  const handleResultScroll = useCallback(() => {
    if (!syncScroll || isSyncingSource.current || isAutoScrolling.current || !sourceContainerRef.current || !resultContainerRef.current) return;
    isSyncingResult.current = true;
    const { scrollTop, scrollHeight, clientHeight } = resultContainerRef.current;
    const ratio = scrollTop / (scrollHeight - clientHeight);
    sourceContainerRef.current.scrollTop = ratio * (sourceContainerRef.current.scrollHeight - sourceContainerRef.current.clientHeight);
    setTimeout(() => { isSyncingResult.current = false; }, 50);
  }, [syncScroll]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth > 20 && newWidth < 80) setLeftWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleAnalyze = async (type: 'smart' | 'local') => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setResult(null); 
    setProgress(0);
    setViewMode('compare');
    setHighlightQuote(null);
    setActiveSourceName(null);

    const progressInterval = setInterval(() => {
      setProgress(prev => prev >= 95 ? prev : prev + 1);
    }, 150);

    try {
      const data = type === 'smart' ? await analyzeScript(text) : await analyzeScriptLocal(text);
      setResult(data);
    } catch (error: any) {
      alert(error.message || "分析异常，请尝试缩短文本或检查网络。");
      setViewMode('edit');
    } finally {
      setIsAnalyzing(false);
      clearInterval(progressInterval);
      setProgress(100);
    }
  };

  const renderedOriginalText = useMemo(() => {
    if (!text) return <p className="opacity-20 italic text-center py-20">等待输入内容...</p>;
    if (!highlightQuote) return <div className="whitespace-pre-wrap">{text}</div>;

    const cleanQuote = highlightQuote.trim();
    const escapedQuote = cleanQuote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
    const regex = new RegExp(`(${escapedQuote})`, 'g');
    const parts = text.split(regex);
    let matchedOnce = false;
    
    return (
      <div className={`whitespace-pre-wrap transition-opacity duration-700 ${highlightQuote ? 'opacity-100' : ''}`}>
        {parts.map((part, i) => {
          const isMatch = part.length > 0 && !matchedOnce && (part === cleanQuote || new RegExp(`^${escapedQuote}$`).test(part));
          
          if (isMatch) {
            matchedOnce = true;
            return (
              <motion.mark 
                key={i}
                initial={{ backgroundColor: "rgba(217, 253, 80, 0)" }}
                animate={{ 
                  backgroundColor: "rgba(217, 253, 80, 1)",
                  boxShadow: "0 0 40px rgba(217, 253, 80, 0.8)"
                }}
                ref={(el) => { highlightedRef.current = el; }}
                className="text-brand-dark px-2 py-1.5 rounded-xl font-black relative inline-block mx-1 z-20 group/mark"
              >
                {part}
                {/* 浮动来源标记 - 让对照极度明显 */}
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute -top-8 left-0 flex items-center gap-1.5 px-3 py-1 bg-brand-dark text-brand-neon rounded-full border border-brand-neon/30 shadow-2xl z-30 whitespace-nowrap"
                >
                   <Eye className="w-3 h-3" />
                   <span className="text-[10px] font-black uppercase tracking-widest italic">来源: {activeSourceName || '选定条目'}</span>
                </motion.div>
                <motion.span 
                  animate={{ opacity: [0.6, 0.1, 0.6], scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-brand-neon rounded-xl -z-10"
                />
              </motion.mark>
            );
          }
          
          return (
            <span 
              key={i} 
              className={`transition-all duration-700 ${highlightQuote ? 'opacity-30 blur-[0.5px] grayscale-[0.5]' : 'opacity-100'}`}
            >
              {part}
            </span>
          );
        })}
      </div>
    );
  }, [text, highlightQuote, activeSourceName]);

  const tabs = [
    { id: 'characters', label: '角色设定' },
    { id: 'scenes', label: '场景大纲' },
    { id: 'props', label: '关键设定' },
    { id: 'lighting', label: '氛围呈现' },
    { id: 'relationships', label: '关系网络' },
  ];

  return (
    <div className="h-screen bg-brand-dark flex flex-col overflow-hidden text-slate-100 selection:bg-brand-neon selection:text-brand-dark">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-violet/10 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-neon/5 blur-[120px] rounded-full pointer-events-none z-0" />

      <header className="h-16 px-6 lg:px-10 flex items-center justify-between z-50 shrink-0 border-b border-white/5 bg-brand-dark/80 backdrop-blur-xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-neon rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(217,253,80,0.2)]">
               <Zap className="w-5 h-5 text-brand-dark fill-brand-dark" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-black tracking-tighter uppercase italic leading-none">SHAOXIN</h1>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 mt-1">深度扒本设定引擎</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {viewMode === 'compare' && (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Info className="w-3.5 h-3.5 text-brand-neon" />
                点击卡片 原文自动“剥离”聚焦
              </div>
              <button 
                onClick={() => setSyncScroll(!syncScroll)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${syncScroll ? 'bg-brand-neon border-brand-neon text-brand-dark shadow-[0_0_20px_rgba(217,253,80,0.2)]' : 'bg-white/5 border-white/10 text-slate-500'}`}
              >
                {syncScroll ? <Link className="w-3 h-3" /> : <Link2Off className="w-3 h-3" />}
                {syncScroll ? '同步滚动' : '独立滚动'}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className={`flex-grow flex ${isMobile ? 'flex-col overflow-y-auto' : 'p-4 overflow-hidden'} relative`} ref={containerRef}>
        <section 
          style={{ 
            width: isMobile ? '100%' : (viewMode === 'edit' ? '100%' : `${leftWidth}%`),
            height: isMobile && viewMode === 'compare' ? '40vh' : 'auto'
          }}
          className={`relative shrink-0 rounded-4xl overflow-hidden z-10 border transition-all duration-500 ${viewMode === 'compare' ? 'bg-brand-neon border-brand-neon shadow-[0_0_80px_rgba(217,253,80,0.1)]' : 'bg-white/5 border-white/10'}`}
        >
          <div className={`h-12 px-6 flex items-center justify-between border-b ${viewMode === 'compare' ? 'text-brand-dark border-brand-dark/10' : 'text-slate-500 border-white/5'}`}>
             <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-widest italic">SOURCE CODE / 原文池</span>
             </div>
             {viewMode === 'compare' && (
               <button onClick={() => setViewMode('edit')} className="bg-brand-dark text-white px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                  编辑原文
               </button>
             )}
          </div>

          <div 
            ref={sourceContainerRef} 
            onScroll={handleSourceScroll}
            className={`h-[calc(100%-3rem)] overflow-y-auto custom-scrollbar transition-colors duration-500 ${viewMode === 'compare' ? 'bg-brand-neon text-brand-dark' : 'bg-transparent text-slate-200'}`}
          >
             {viewMode === 'edit' ? (
               <textarea 
                 value={text} onChange={(e) => setText(e.target.value)}
                 className="w-full h-full bg-transparent p-10 outline-none resize-none font-sans text-xl font-bold leading-relaxed placeholder:text-white/10"
                 placeholder="粘贴长篇剧本，开启深度扒拉..."
               />
             ) : (
               <div className="w-full p-10 font-bold text-base lg:text-xl leading-relaxed pb-96">
                  {renderedOriginalText}
               </div>
             )}
          </div>
        </section>

        {!isMobile && viewMode === 'compare' && (
          <div onMouseDown={startResizing} className="w-6 cursor-col-resize flex items-center justify-center group active:cursor-grabbing">
            <div className="w-1 h-20 bg-white/10 rounded-full group-hover:bg-brand-neon transition-all group-hover:h-32" />
          </div>
        )}

        <section 
          style={{ 
            width: isMobile ? '100%' : (viewMode === 'edit' ? '0%' : `${100 - leftWidth}%`),
            height: isMobile ? 'auto' : '100%'
          }}
          className={`flex flex-col bg-slate-900/50 backdrop-blur-3xl rounded-4xl border border-white/10 ${viewMode === 'edit' ? 'hidden' : 'flex-grow shadow-2xl overflow-hidden'}`}
        >
          <nav className="h-16 shrink-0 px-6 flex items-center justify-between border-b border-white/5 bg-black/40">
             <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 shrink-0">
                {tabs.map(tab => (
                  <button 
                    key={tab.id} onClick={() => setActiveTab(tab.id as TabType)}
                    className={`relative px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-brand-violet text-white shadow-xl shadow-brand-violet/30' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {tab.label}
                  </button>
                ))}
             </div>
          </nav>

          <div 
            ref={resultContainerRef} 
            onScroll={handleResultScroll}
            className="flex-grow overflow-y-auto p-8 custom-scrollbar space-y-8"
          >
             <AnimatePresence mode="wait">
               {isAnalyzing ? (
                 <motion.div 
                   key="loading"
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                   className="h-full flex flex-col items-center justify-center text-center"
                 >
                    <div className="relative mb-8">
                       <Loader2 className="w-20 h-20 text-brand-neon animate-spin opacity-20" />
                       <CircleDashed className="w-12 h-12 text-brand-neon animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-200">正在深度解构剧本</h3>
                    <p className="text-slate-500 font-black uppercase tracking-[0.5em] mt-3 text-[10px]">{progress}% 神经网络同步中</p>
                 </motion.div>
               ) : result ? (
                  <motion.div 
                    key="content"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="max-w-5xl mx-auto space-y-8 pb-32"
                  >
                    {activeTab === 'relationships' ? (
                      <div className="h-[700px]"><RelationshipGraph data={result} /></div>
                    ) : (
                      <div className="grid grid-cols-1 gap-8">
                        {(result[activeTab as keyof AnalysisResult] as any[]).map((item) => {
                          const isHighlighted = highlightQuote === item.sourceQuote;
                          return (
                            <motion.div 
                              key={item.id}
                              onClick={() => {
                                if (item.sourceQuote) {
                                  setHighlightQuote(item.sourceQuote);
                                  setActiveSourceName(item.name || item.type || '当前条目');
                                }
                              }}
                              animate={isHighlighted ? { 
                                // Fix: 'ring' is not a valid CSS property for Framer Motion animate, using 'boxShadow' instead
                                boxShadow: "0 0 0 2px rgba(217, 253, 80, 1)",
                                scale: 1.02,
                                backgroundColor: "rgba(255,255,255,0.05)"
                              } : { 
                                // Fix: 'ring' is not a valid CSS property for Framer Motion animate, using 'boxShadow' instead
                                boxShadow: "0 0 0 0px rgba(217, 253, 80, 0)",
                                scale: 1,
                                backgroundColor: "rgba(255,255,255,0.02)"
                              }}
                              className={`transition-all duration-500 rounded-5xl relative overflow-hidden group cursor-pointer`}
                            >
                              {isHighlighted && (
                                <motion.div 
                                  layoutId="neon-bg"
                                  className="absolute inset-0 bg-brand-neon/5 -z-10 blur-xl"
                                />
                              )}
                              {activeTab === 'characters' && <CharacterCard data={item} onLocate={() => { setHighlightQuote(item.sourceQuote); setActiveSourceName(item.name); }} />}
                              {activeTab === 'scenes' && <SceneCard data={item} onLocate={() => { setHighlightQuote(item.sourceQuote); setActiveSourceName(item.name); }} />}
                              {activeTab === 'props' && <PropCard data={item} onLocate={() => { setHighlightQuote(item.sourceQuote); setActiveSourceName(item.name); }} />}
                              {activeTab === 'lighting' && <LightingCard data={item} onLocate={() => { setHighlightQuote(item.sourceQuote); setActiveSourceName(item.type); }} />}
                              {activeTab === 'skills' && <SkillCard data={item} onLocate={() => { setHighlightQuote(item.sourceQuote); setActiveSourceName(item.name); }} />}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center opacity-10">
                    <SquareSplitVertical className="w-20 h-20 mb-6" />
                    <span className="text-2xl font-black uppercase italic tracking-[0.2em]">待扒取的设定序列</span>
                 </div>
               )}
             </AnimatePresence>
          </div>
        </section>
      </main>

      {viewMode === 'edit' && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] flex gap-6 w-full px-8 lg:w-auto"
        >
           <button onClick={() => handleAnalyze('local')} className="flex-1 lg:flex-none px-10 py-5 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">极速扫描模式</button>
           <button onClick={() => handleAnalyze('smart')} className="flex-[2] lg:flex-none px-16 py-5 bg-brand-neon rounded-2xl text-brand-dark font-black uppercase tracking-widest text-[10px] shadow-[0_0_50px_rgba(217,253,80,0.3)] flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all">AI 深度全量提取 <ArrowRight className="w-5 h-5" /></button>
        </motion.div>
      )}

      {result && viewMode === 'compare' && (
        <div className="fixed bottom-10 right-10 z-[100]">
          <button onClick={() => setShowExportMenu(!showExportMenu)} className="w-16 h-16 bg-brand-violet rounded-2xl flex items-center justify-center text-white shadow-2xl hover:scale-110 active:rotate-12 transition-all">
            <LayoutGrid className="w-7 h-7" />
          </button>
          
          <AnimatePresence>
            {showExportMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 15 }}
                className="absolute bottom-20 right-0 w-64 bg-slate-900 border border-white/10 rounded-3xl p-4 shadow-3xl overflow-hidden backdrop-blur-2xl"
              >
                <div className="px-3 py-2 mb-2 text-[8px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">导出设定资源包</div>
                <button onClick={() => { exportToJson(result); setShowExportMenu(false); }} className="w-full text-left p-4 rounded-xl hover:bg-brand-violet/20 hover:text-brand-violet transition-colors text-[11px] font-black uppercase tracking-widest flex items-center justify-between group">
                  JSON 结构化数据 <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
                <button onClick={() => { exportToMarkdown(result); setShowExportMenu(false); }} className="w-full text-left p-4 rounded-xl hover:bg-brand-violet/20 hover:text-brand-violet transition-colors text-[11px] font-black uppercase tracking-widest flex items-center justify-between group mt-1">
                  Markdown 精美报告 <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
                <button onClick={() => { exportToTxt(result); setShowExportMenu(false); }} className="w-full text-left p-4 rounded-xl hover:bg-brand-violet/20 hover:text-brand-violet transition-colors text-[11px] font-black uppercase tracking-widest flex items-center justify-between group mt-1">
                  TXT 文字大纲 <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default App;
