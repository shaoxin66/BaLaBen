
import React, { useState } from 'react';
import { Character, Scene, Prop, Lighting, Skill } from '../types';
import { 
  User, MapPin, Box, Lightbulb, Zap, Target, Sparkles, GripVertical, 
  ChevronDown, ArrowUpRight, History, PlayCircle, BookOpen, Quote, 
  SwitchCamera, Ghost, Dog, Users as UsersIcon, HardHat, ShieldAlert, HeartPulse
} from 'lucide-react';
import { motion } from 'framer-motion';

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'monster': return Ghost;
    case 'animal': return Dog;
    case 'professional': return HardHat;
    case 'crowd': return UsersIcon;
    default: return User;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'monster': return 'text-red-400 bg-red-400/10 border-red-400/20';
    case 'professional': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'crowd': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    default: return 'text-slate-400 bg-white/5 border-white/10';
  }
};

interface CardWrapperProps {
    children: React.ReactNode; 
    title: string; 
    subtitle: string; 
    icon: any; 
    sourceQuote?: string;
    isMain?: boolean;
    onLocate?: () => void;
    category?: string;
}

const CardWrapper: React.FC<CardWrapperProps> = ({ children, title, subtitle, icon: Icon, sourceQuote, isMain, onLocate, category }) => {
  const [showQuote, setShowQuote] = useState(false);

  return (
    <div className={`
      relative p-6 lg:p-10 rounded-4xl lg:rounded-5xl border transition-all duration-500 flex flex-col h-full overflow-hidden bg-brand-dark/40 border-white/5 hover:border-brand-neon/30 group cursor-pointer
      ${isMain ? 'ring-2 ring-brand-violet/40 shadow-[0_0_40px_rgba(124,58,237,0.1)]' : 'hover:shadow-[0_0_40px_rgba(217,253,80,0.05)]'}
    `}>
      <div className="absolute top-1/2 left-3 -translate-y-1/2 z-40 opacity-0 group-hover:opacity-40 transition-opacity cursor-grab active:cursor-grabbing p-2">
        <GripVertical className="w-5 h-5 text-brand-neon" />
      </div>

      <div className="flex items-center justify-between mb-6 lg:mb-10 pl-4 lg:pl-6">
        <div className="flex items-center gap-4 lg:gap-5">
          <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-2xl lg:rounded-3xl flex items-center justify-center bg-black border border-white/5 shadow-2xl transition-all duration-300 ${isMain ? 'text-brand-violet ring-1 ring-brand-violet/50' : 'text-slate-400 group-hover:text-brand-neon'}`}>
            <Icon className="w-6 h-6 lg:w-8 lg:h-8" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-xl lg:text-3xl font-black text-white tracking-tighter leading-none uppercase italic">{title}</h3>
            <div className="flex items-center gap-2 mt-2">
              {category && (
                <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border ${getCategoryColor(category)}`}>
                  {category}
                </span>
              )}
              <span className="text-[8px] lg:text-[10px] text-slate-500 uppercase font-black tracking-[0.4em] italic truncate max-w-[150px]">
                 {subtitle}
              </span>
            </div>
          </div>
        </div>
        
        {onLocate && (
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onLocate(); }}
            className="p-3 bg-brand-neon/10 text-brand-neon hover:bg-brand-neon hover:text-brand-dark rounded-2xl transition-all border border-brand-neon/20"
          >
            <Target className="w-4 h-4" />
          </motion.button>
        )}
      </div>
      
      <div className="flex-grow flex flex-col gap-6 lg:gap-8 pl-4 lg:pl-6">
        {children}
      </div>
      
      {sourceQuote && (
        <div className="mt-8 lg:mt-12 pt-6 lg:pt-8 border-t border-white/5 pl-4 lg:pl-6">
           <button onClick={(e) => { e.stopPropagation(); setShowQuote(!showQuote); }} className="flex items-center justify-between w-full text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 hover:text-brand-neon transition-colors group/btn">
             <span className="flex items-center gap-2 italic">原文设定锚点 <ArrowUpRight className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" /></span>
             <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${showQuote ? 'rotate-180 text-brand-neon' : ''}`} />
           </button>
           {showQuote && (
             <motion.div 
               initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
               className="mt-4 p-5 rounded-3xl bg-black/60 border border-brand-neon/10 italic text-[13px] text-slate-300 leading-relaxed font-medium"
             >
               “{sourceQuote}”
             </motion.div>
           )}
        </div>
      )}

      {isMain && (
        <div className="absolute top-0 right-0 p-4 lg:p-6 pointer-events-none">
          <div className="px-4 py-2 bg-brand-violet text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-xl border border-white/20">主角小传已收录</div>
        </div>
      )}
    </div>
  );
};

export const CharacterCard: React.FC<{ data: Character; onLocate?: () => void }> = ({ data, onLocate }) => (
    <CardWrapper title={data.name} subtitle={data.identity || '未知角色'} icon={getCategoryIcon(data.category)} category={data.category} sourceQuote={data.sourceQuote} isMain={data.role === 'main'} onLocate={onLocate}>
      <div className="space-y-6">
        {/* 动态视觉状态栏 */}
        {data.visualStates && data.visualStates.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {data.visualStates.map((state, i) => {
              const isDanger = state.includes('伤') || state.includes('血') || state.includes('负');
              const isSpecial = state.includes('Q版') || state.includes('形态') || state.includes('化');
              return (
                <span key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                  isDanger ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse' : 
                  isSpecial ? 'bg-brand-neon border-brand-neon text-brand-dark shadow-[0_0_15px_rgba(217,253,80,0.4)]' : 
                  'bg-white/5 border-white/10 text-slate-400'
                }`}>
                  {isDanger && <ShieldAlert className="w-3 h-3" />}
                  {isSpecial && <Sparkles className="w-3 h-3" />}
                  {!isDanger && !isSpecial && <HeartPulse className="w-3 h-3" />}
                  {state}
                </span>
              );
            })}
          </div>
        )}

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 group-hover:border-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">
              <History className="w-3 h-3" /> 背景说明
            </div>
            <p className="text-[12px] text-slate-400 leading-relaxed font-semibold">{data.pastBackground || '暂无详细背景记录'}</p>
          </div>

          <div className="p-4 rounded-3xl bg-brand-violet/5 border border-brand-violet/10 group-hover:bg-brand-violet/10 transition-colors">
            <div className="flex items-center gap-2 mb-2 text-[8px] font-black text-brand-violet uppercase tracking-widest">
              <PlayCircle className="w-3 h-3" /> 当前现状
            </div>
            <p className="text-[12px] text-white leading-relaxed font-bold tracking-tight">{data.presentStatus || '活跃中'}</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {data.personality?.split(/[，、]/).map((trait, i) => (
              <span key={i} className="px-3 py-1 rounded-lg bg-slate-800/50 border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                {trait}
              </span>
            ))}
          </div>
          <div className="p-4 bg-black/20 rounded-2xl border-l-2 border-brand-neon/20">
             <p className="text-[11px] text-slate-500 font-medium italic">"{data.description}"</p>
          </div>
        </div>
      </div>
    </CardWrapper>
);

export const SceneCard: React.FC<{ data: Scene; onLocate?: () => void }> = ({ data, onLocate }) => (
    <CardWrapper title={data.name} subtitle={`${data.episode ? `第 ${data.episode} 场` : '独立场次'} · ${data.type || '通用'}`} icon={MapPin} sourceQuote={data.sourceQuote} onLocate={onLocate}>
        <div className="space-y-6">
          {data.oneSentence && (
            <motion.div whileHover={{ scale: 1.01 }} className="bg-brand-neon/10 border border-brand-neon/30 p-5 rounded-4xl relative overflow-hidden group/sentence">
              <div className="flex items-center gap-2 mb-1 text-[8px] font-black text-brand-neon uppercase tracking-widest relative z-10">
                <BookOpen className="w-3 h-3" /> 核心剧情钩子
              </div>
              <p className="text-[15px] text-white font-black italic tracking-tight leading-tight relative z-10">“{data.oneSentence}”</p>
            </motion.div>
          )}
          <div className="bg-black/40 p-6 rounded-4xl border border-white/5">
             <p className="text-[13px] text-slate-400 leading-relaxed font-bold opacity-90">{data.description}</p>
          </div>
        </div>
    </CardWrapper>
);

export const PropCard: React.FC<{ data: Prop; onLocate?: () => void }> = ({ data, onLocate }) => (
    <CardWrapper title={data.name} subtitle="关键设定物品" icon={Box} sourceQuote={data.sourceQuote} onLocate={onLocate}>
        <div className="bg-black/60 p-6 rounded-4xl border border-brand-neon/10 flex items-start gap-4">
          <p className="text-slate-300 text-[13px] leading-loose font-semibold italic">{data.description}</p>
        </div>
    </CardWrapper>
);

export const LightingCard: React.FC<{ data: Lighting; onLocate?: () => void }> = ({ data, onLocate }) => (
    <CardWrapper title={data.type} subtitle={data.mood || '光影基调'} icon={Lightbulb} sourceQuote={data.sourceQuote} onLocate={onLocate}>
        <div className="bg-white/[0.03] p-6 rounded-4xl border border-white/5 space-y-4">
          <p className="text-[13px] text-slate-400 font-bold leading-relaxed italic opacity-80 border-l-2 border-brand-neon/30 pl-4">{data.description}</p>
        </div>
    </CardWrapper>
);

export const SkillCard: React.FC<{ data: Skill; onLocate?: () => void }> = ({ data, onLocate }) => (
    <CardWrapper title={data.name} subtitle={`核心设定`} icon={Zap} sourceQuote={data.sourceQuote} onLocate={onLocate}>
        <div className="p-6 bg-brand-violet/10 rounded-4xl border border-brand-violet/20">
          <p className="text-[14px] text-white font-black leading-relaxed tracking-tight">{data.description}</p>
        </div>
    </CardWrapper>
);
