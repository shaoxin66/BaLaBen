
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  FileText, Wand2, Users, MapPin, Box, Lightbulb, Zap, Share2, 
  Loader2, Layout, Hash, Edit3,
  Download, FileJson, FileType, FileSpreadsheet, ChevronDown,
  Cpu, ZapOff, XCircle, Link, Link2Off, BookOpen, ClipboardCheck, Clipboard,
  GripVertical, Monitor, Smartphone, Maximize2
} from 'lucide-react';
import { analyzeScript } from './services/geminiService';
import { analyzeScriptLocal } from './services/localAnalysisService';
import { AnalysisResult, TabType } from './types';
import RelationshipGraph from './components/RelationshipGraph';
import { CharacterCard, SceneCard, PropCard, LightingCard, SkillCard } from './components/ResultCards';
import { 
  exportToJson, 
  exportToMarkdown, 
  exportToTxt, 
  exportToCsvPack, 
  copyToClipboard, 
  getFormattedSummary 
} from './services/exportService';

const App: React.FC = () => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('characters');
  const [viewMode, setViewMode] = useState<'edit' | 'compare'>('compare');
  const [highlightQuote, setHighlightQuote] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [syncScroll, setSyncScroll] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  const [leftWidth, setLeftWidth] = useState(35);
  const [isResizing, setIsResizing] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const sourceContainerRef = useRef<HTMLDivElement>(null);
  const resultContainerRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isSyncingSource = useRef(false);
  const isSyncingResult = useRef(false);

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Use a ghost image or just styling
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    setDraggedItemIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
    // Swap items in state
    setResult(prev => {
      if (!prev) return null;
      const currentList = [...(prev[activeTab as keyof AnalysisResult] as any[])];
      const draggedItem = currentList[draggedItemIndex];
      currentList.splice(draggedItemIndex, 1);
      currentList.splice(index, 0, draggedItem);
      
      return {
        ...prev,
        [activeTab]: currentList
      };
    });
    setDraggedItemIndex(index);
  };

  // Sync scroll implementation
  const handleSourceScroll = useCallback(() => {
    if (!syncScroll || isSyncingResult.current || !sourceContainerRef.current || !resultContainerRef.current) return;
    isSyncingSource.current = true;
    const { scrollTop, scrollHeight, clientHeight } = sourceContainerRef.current;
    const ratio = scrollTop / (scrollHeight - clientHeight);
    resultContainerRef.current.scrollTop = ratio * (resultContainerRef.current.scrollHeight - resultContainerRef.current.clientHeight);
    setTimeout(() => { isSyncingSource.current = false; }, 50);
  }, [syncScroll]);

  const handleResultScroll = useCallback(() => {
    if (!syncScroll || isSyncingSource.current || !sourceContainerRef.current || !resultContainerRef.current) return;
    isSyncingResult.current = true;
    const { scrollTop, scrollHeight, clientHeight } = resultContainerRef.current;
    const ratio = scrollTop / (scrollHeight - clientHeight);
    sourceContainerRef.current.scrollTop = ratio * (sourceContainerRef.current.scrollHeight - sourceContainerRef.current.clientHeight);
    setTimeout(() => { isSyncingResult.current = false; }, 50);
  }, [syncScroll]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth > 15 && newWidth < 85) {
        setLeftWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocateSource = useCallback((quote?: string) => {
    if (!quote) return;
    setViewMode('compare');
    setHighlightQuote(null);
    setTimeout(() => {
      setHighlightQuote(quote);
    }, 50);
  }, []);

  useEffect(() => {
    if (highlightQuote && viewMode === 'compare') {
      const timer = setTimeout(() => {
        const mark = sourceContainerRef.current?.querySelector('.source-highlight');
        if (mark) {
          mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
          mark.classList.remove('animate-feishu-flash');
          void (mark as HTMLElement).offsetWidth;
          mark.classList.add('animate-feishu-flash');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightQuote, viewMode]);

  const handleAnalyze = async (type: 'smart' | 'local') => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setResult(null); 
    setProgress(0);
    setViewMode('compare');

    const progressInterval = setInterval(() => {
      setProgress(prev => prev >= 95 ? prev : prev + 1);
    }, 150);

    try {
      const data = type === 'smart' ? await analyzeScript(text) : await analyzeScriptLocal(text);
      setResult(data);
    } catch (error) {
      alert("分析失败，请稍后重试。");
    } finally {
      setIsAnalyzing(false);
      clearInterval(progressInterval);
      setProgress(100);
    }
  };

  const handleCopySummary = async () => {
    if (!result) return;
    const summary = getFormattedSummary(result);
    const success = await copyToClipboard(summary);
    if (success) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
    setShowExportMenu(false);
  };

  const renderedOriginalText = useMemo(() => {
    if (!text) return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-600 italic gap-3 opacity-50">
        <Edit3 className="w-10 h-10" />
        <p>剧本正文区域为空</p>
      </div>
    );
    
    if (!highlightQuote) return <div className="whitespace-pre-wrap leading-relaxed">{text}</div>;

    const quoteIndex = text.indexOf(highlightQuote);
    if (quoteIndex === -1) {
        const fuzzyQuote = highlightQuote.substring(0, 20);
        const fuzzyIndex = text.indexOf(fuzzyQuote);
        if (fuzzyIndex === -1) return <div className="whitespace-pre-wrap leading-relaxed">{text}</div>;
        
        const before = text.substring(0, fuzzyIndex);
        const middle = text.substring(fuzzyIndex, fuzzyIndex + highlightQuote.length);
        const after = text.substring(fuzzyIndex + highlightQuote.length);
        
        return (
          <div className="whitespace-pre-wrap leading-relaxed">
            {before}
            <mark className="source-highlight bg-amber-400/90 text-slate-950 rounded px-1.5 py-0.5 mx-0.5 font-bold shadow-[0_0_15px_rgba(251,191,36,0.5)] transition-all duration-300">
              {middle}
            </mark>
            {after}
          </div>
        );
    }

    const before = text.substring(0, quoteIndex);
    const after = text.substring(quoteIndex + highlightQuote.length);

    return (
      <div className="whitespace-pre-wrap leading-relaxed">
        {before}
        <mark className="source-highlight bg-amber-400 text-slate-950 rounded px-1.5 py-0.5 mx-0.5 font-bold shadow-[0_0_20px_rgba(251,191,36,0.6)] transition-all duration-300">
          {highlightQuote}
        </mark>
        {after}
      </div>
    );
  }, [text, highlightQuote]);

  const renderContent = () => {
    if (isAnalyzing) {
      return (
        <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="relative mb-8">
             <Loader2 className="w-16 h-16 text-violet-500 animate-spin" />
             <Cpu className="w-6 h-6 text-violet-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-slate-100 font-bold text-xl tracking-tight">AI 正在深度解构剧本...</h2>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">海量字符处理中，Gemini 3 正在精准识别每一个核心设定。</p>
          </div>
          <div className="w-72 h-1.5 bg-slate-800 rounded-full mt-10 overflow-hidden shadow-inner">
            <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-500 shadow-[0_0_10px_rgba(124,58,237,0.5)]" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-[10px] font-mono text-slate-600 uppercase tracking-widest">{progress}% 完成</p>
        </div>
      );
    }

    if (!result) return (
      <div className="h-full flex flex-col items-center justify-center opacity-40 animate-in zoom-in-95 duration-700">
        <div className="p-8 bg-slate-900/50 rounded-full mb-6 border border-slate-800/50">
           <BookOpen className="w-20 h-20 text-slate-700" />
        </div>
        <h3 className="text-xl font-bold text-slate-400">准备就绪</h3>
        <p className="text-slate-600 text-sm mt-2 max-w-sm text-center">粘贴您的超长剧本或小说，AI 将为您自动化梳理所有设定细节。</p>
      </div>
    );

    const common = {
      onLocate: handleLocateSource,
      activeHighlightQuote: highlightQuote,
      onDelete: (id: string) => {
        setResult(prev => {
          if (!prev) return null;
          return {
            ...prev,
            [activeTab]: (prev[activeTab as keyof AnalysisResult] as any[]).filter(it => it.id !== id)
          };
        });
      }
    };

    const gridClass = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20";

    const getTabContent = () => {
      const items = result[activeTab as keyof AnalysisResult] as any[];
      if (activeTab === 'relationships') return <RelationshipGraph data={result} />;
      
      return (
        <div className={gridClass}>
          {items.map((item, idx) => (
            <div 
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, idx)}
              className="relative transition-all duration-300"
            >
              <div className="absolute top-4 left-4 z-40 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-slate-600">
                <GripVertical className="w-4 h-4" />
              </div>
              {activeTab === 'characters' && <CharacterCard data={item} onUpdate={(u) => setResult(p => p ? ({...p, characters: p.characters.map(x => x.id === u.id ? u : x)}) : null)} {...common} />}
              {activeTab === 'scenes' && <SceneCard data={item} onUpdate={(u) => setResult(p => p ? ({...p, scenes: p.scenes.map(x => x.id === u.id ? u : x)}) : null)} {...common} />}
              {activeTab === 'props' && <PropCard data={item} {...common} />}
              {activeTab === 'lighting' && <LightingCard data={item} {...common} />}
              {activeTab === 'skills' && <SkillCard data={item} {...common} />}
            </div>
          ))}
        </div>
      );
    };

    return getTabContent();
  };

  const tabs = [
    { id: 'characters', icon: Users, label: '人物角色' },
    { id: 'scenes', icon: MapPin, label: '场景设定' },
    { id: 'props', icon: Box, label: '道具物品' },
    { id: 'lighting', icon: Lightbulb, label: '灯光氛围' },
    { id: 'skills', icon: Zap, label: '技能招式' },
    { id: 'relationships', icon: Share2, label: '人物关系' },
  ];

  return (
    <div className="h-screen bg-[#020617] text-slate-200 flex flex-col overflow-hidden font-sans select-none antialiased">
      <header className="h-16 border-b border-slate-800/60 bg-slate-950/40 backdrop-blur-2xl px-6 flex items-center justify-between z-50 shadow-2xl shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-2.5 rounded-2xl shadow-lg shadow-violet-900/20 ring-1 ring-white/10">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              SHAOXIN 扒拉本
            </h1>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Interactive Mode v2.1
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex bg-slate-900/80 p-1 rounded-2xl border border-slate-800 shadow-inner relative overflow-hidden">
            <div 
              className="absolute top-1 bottom-1 bg-slate-800 rounded-xl transition-all duration-300 shadow-lg ring-1 ring-white/10"
              style={{ 
                left: viewMode === 'edit' ? '4px' : 'calc(50% + 1px)',
                width: 'calc(50% - 4px)'
              }}
            />
            <button 
              onClick={() => setViewMode('edit')}
              className={`relative z-10 flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-colors duration-300 ${viewMode === 'edit' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Edit3 className="w-3.5 h-3.5" /> 剧本录入
            </button>
            <button 
              onClick={() => setViewMode('compare')}
              className={`relative z-10 flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-colors duration-300 ${viewMode === 'compare' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Layout className="w-3.5 h-3.5" /> 智能对照
            </button>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-1 hidden md:block" />

          {result && (
            <div className="relative" ref={exportMenuRef}>
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="group flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-violet-400 text-xs font-bold rounded-xl border border-violet-500/20 hover:border-violet-500/50 transition-all active:scale-95 shadow-lg shadow-violet-900/10"
              >
                <Download className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" /> 导出 <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showExportMenu && (
                <div className="absolute top-full right-0 mt-3 w-64 bg-[#0f172a]/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-[100] overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="px-4 py-2 text-[9px] text-slate-500 uppercase font-black tracking-widest border-b border-slate-800 mb-1">格式选择</div>
                  
                  <button onClick={handleCopySummary} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-xs text-slate-300 hover:bg-violet-600/20 hover:text-violet-200 transition-all group">
                    <div className="flex items-center gap-3">
                      <Clipboard className="w-4 h-4 opacity-70 group-hover:scale-110 transition-transform" /> 复制分析摘要
                    </div>
                    {copyFeedback && <ClipboardCheck className="w-4 h-4 text-emerald-400" />}
                  </button>

                  <div className="border-t border-slate-800/50 my-1 opacity-50"></div>

                  {[
                    { fn: () => exportToMarkdown(result), label: 'Markdown (.md)', icon: FileType },
                    { fn: () => exportToTxt(result), label: '纯文本 (.txt)', icon: FileText },
                    { fn: () => exportToCsvPack(result), label: 'CSV 数据包', icon: FileSpreadsheet },
                    { fn: () => exportToJson(result), label: '开发者 JSON', icon: FileJson },
                  ].map((opt, i) => (
                    <button key={i} onClick={() => { opt.fn(); setShowExportMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs text-slate-300 hover:bg-white/5 transition-all">
                      <opt.icon className="w-4 h-4 opacity-50" /> {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleAnalyze('local')}
              disabled={isAnalyzing || !text}
              className="hidden sm:flex group bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 px-4 py-2 rounded-xl font-black text-xs transition-all active:scale-95 items-center gap-2 border border-slate-700"
            >
              <ZapOff className="w-3.5 h-3.5" /> 普通
            </button>
            <button 
              onClick={() => handleAnalyze('smart')}
              disabled={isAnalyzing || !text}
              className="relative overflow-hidden group bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-black text-xs transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-violet-900/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              智能扒本
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow flex overflow-hidden relative" ref={containerRef}>
        {/* Source Panel */}
        <section 
          style={{ width: viewMode === 'edit' ? '100%' : `${leftWidth}%` }}
          className={`transition-all ${isResizing ? 'transition-none' : 'duration-700 cubic-bezier(0.16, 1, 0.3, 1)'} border-r border-slate-800/40 flex flex-col bg-slate-950/20 ${viewMode === 'compare' ? 'hidden lg:flex' : 'flex'}`}
        >
          <div className="h-12 border-b border-slate-800/40 flex items-center justify-between px-6 bg-slate-900/20">
             <div className="flex items-center gap-3">
               <div className="p-1.5 rounded-lg bg-slate-900 border border-white/5">
                 <Monitor className="w-3.5 h-3.5 text-violet-400" />
               </div>
               <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">剧本原文</span>
             </div>
             <div className="flex items-center gap-4">
                {highlightQuote && (
                    <button 
                        onClick={() => setHighlightQuote(null)}
                        className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition-colors text-[10px] font-bold"
                    >
                        <XCircle className="w-3.5 h-3.5" /> 重置高亮
                    </button>
                )}
                <span className="bg-slate-800/80 px-2 py-0.5 rounded-lg text-[9px] font-mono text-slate-400 border border-white/5">
                  {text.length.toLocaleString()} Chars
                </span>
             </div>
          </div>
          <div className="flex-grow relative overflow-hidden">
             {viewMode === 'edit' ? (
               <textarea 
                 value={text} onChange={(e) => setText(e.target.value)}
                 className="w-full h-full bg-transparent p-10 outline-none resize-none font-sans text-[16px] leading-[2] text-slate-300 focus:text-slate-100 transition-colors custom-scrollbar select-text placeholder:text-slate-700"
                 placeholder="在这里粘贴您的剧本、短剧或小说内容。Gemini 3 将为您执行无损设定提取..."
               />
             ) : (
               <div 
                ref={sourceContainerRef} 
                onScroll={handleSourceScroll}
                className="w-full h-full overflow-y-auto p-12 font-sans text-[16px] text-slate-300 leading-[2.4] tracking-wide scroll-smooth custom-scrollbar select-text selection:bg-violet-500/40"
               >
                 <div className="max-w-4xl mx-auto pb-48 opacity-90">
                   {renderedOriginalText}
                 </div>
               </div>
             )}
          </div>
        </section>

        {/* Resizer Handle */}
        {viewMode === 'compare' && (
          <div 
            onMouseDown={startResizing}
            className={`w-1.5 h-full cursor-col-resize hover:bg-violet-600/50 active:bg-violet-600 transition-all hidden lg:flex items-center justify-center z-40 group ${isResizing ? 'bg-violet-600' : 'bg-slate-950 border-x border-slate-900'}`}
          >
            <div className={`w-8 h-14 rounded-full bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-1.5 shadow-2xl transition-all ${isResizing ? 'scale-110' : 'group-hover:scale-105 group-hover:bg-slate-900'}`}>
               <div className="w-0.5 h-4 bg-slate-700 rounded-full" />
               <div className="w-0.5 h-4 bg-slate-700 rounded-full" />
            </div>
          </div>
        )}

        {/* Result Panel */}
        <section 
          style={{ width: viewMode === 'edit' ? '0%' : `${100 - (viewMode === 'compare' ? leftWidth : 0)}%` }}
          className={`flex flex-col bg-[#01040a] transition-all ${isResizing ? 'transition-none' : 'duration-700 cubic-bezier(0.16, 1, 0.3, 1)'} ${viewMode === 'edit' ? 'hidden' : 'w-full'}`}
        >
           <nav className="h-14 border-b border-slate-800/40 flex items-center justify-between px-6 bg-slate-950/20 shrink-0">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide relative bg-slate-900/30 p-1 rounded-2xl border border-white/5">
                {/* Tab Indicator */}
                <div 
                  className="absolute top-1 bottom-1 bg-violet-600 rounded-xl transition-all duration-500 cubic-bezier(0.23, 1, 0.32, 1) shadow-lg shadow-violet-900/20"
                  style={{ 
                    width: `${100 / tabs.length}%`,
                    transform: `translateX(${tabs.findIndex(t => t.id === activeTab) * 100}%)`,
                    left: 0
                  }}
                />
                {tabs.map(tab => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`group relative flex items-center gap-2.5 px-5 py-2 rounded-xl text-xs font-black transition-all duration-300 whitespace-nowrap z-10 ${activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <tab.icon className={`w-3.5 h-3.5 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} /> 
                    {tab.label}
                    {result && tab.id !== 'relationships' && (
                      <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-md font-mono transition-colors ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500'}`}>
                         {((result as any)[tab.id]?.length || 0)}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 border-l border-slate-800 pl-4 ml-2">
                 <button 
                  onClick={() => setSyncScroll(!syncScroll)}
                  className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${syncScroll ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-900 text-slate-500 border border-white/5 hover:border-slate-700'}`}
                 >
                   {syncScroll ? <Link className="w-3.5 h-3.5" /> : <Link2Off className="w-3.5 h-3.5 opacity-50" />}
                   <span className="hidden xl:inline">{syncScroll ? "同步锁定" : "自由查看"}</span>
                 </button>
              </div>
           </nav>
           
           <div 
            ref={resultContainerRef}
            onScroll={handleResultScroll}
            className="flex-grow overflow-y-auto p-8 lg:p-12 custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.06)_0%,transparent_40%)]"
           >
             <div className="max-w-7xl mx-auto">
                {renderContent()}
             </div>
           </div>
        </section>
      </main>

      {/* Floating Toggle for Mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-[100] flex gap-2">
          <button 
            onClick={() => setViewMode(viewMode === 'compare' ? 'edit' : 'compare')}
            className="p-4 bg-violet-600 rounded-2xl shadow-2xl text-white active:scale-95 transition-transform"
          >
            {viewMode === 'compare' ? <Edit3 className="w-6 h-6" /> : <Layout className="w-6 h-6" />}
          </button>
      </div>

      {isResizing && <div className="fixed inset-0 z-[9999] cursor-col-resize" />}

      {/* Success Notification for Copy */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 bg-emerald-600/90 backdrop-blur-xl text-white rounded-2xl shadow-2xl flex items-center gap-3 transition-all duration-700 cubic-bezier(0.175, 0.885, 0.32, 1.275) ${copyFeedback ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'}`}>
          <div className="bg-white/20 p-1.5 rounded-lg">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <span className="text-sm font-black tracking-tight">摘要已成功复制到剪贴板</span>
      </div>

      <style>{`
        .animate-feishu-flash {
          animation: feishu-flash 2.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes feishu-flash {
          0% { background-color: #fbbf24; transform: scale(1.1); box-shadow: 0 0 50px rgba(251, 191, 36, 1); border-radius: 8px; }
          20% { background-color: #f59e0b; transform: scale(1); box-shadow: 0 0 15px rgba(251, 191, 36, 0.4); }
          40% { background-color: #fbbf24; transform: scale(1.05); box-shadow: 0 0 30px rgba(251, 191, 36, 0.8); }
          100% { background-color: #fbbf24; transform: scale(1); box-shadow: 0 0 0px rgba(251, 191, 36, 0); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        .drag-over {
          border-color: #7c3aed !important;
          transform: translateY(-4px);
        }
      `}</style>
    </div>
  );
};

export default App;
