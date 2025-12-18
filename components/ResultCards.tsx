
import React, { useState } from 'react';
import { Character, Scene, Prop, Lighting, Skill } from '../types';
import { User, MapPin, Box, Lightbulb, Zap, Trash2, Target, Hash, Info, Sparkles, Quote, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { EditableList } from './EditableList';

interface ControlProps {
  onDelete?: () => void;
  onLocate?: () => void;
  isActiveHighlight?: boolean;
}

const CardControls: React.FC<ControlProps> = ({ onDelete, onLocate, isActiveHighlight }) => (
  <div className={`flex items-center gap-1 bg-slate-950/80 backdrop-blur-xl rounded-xl p-1 border border-white/5 transition-all duration-500 shadow-2xl ${isActiveHighlight ? 'opacity-100 translate-y-0' : 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'}`}>
    {onLocate && (
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLocate(); }}
        className={`p-1.5 rounded-lg transition-all flex items-center gap-1.5 text-[10px] font-bold ${isActiveHighlight ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-white hover:bg-violet-600'}`}
      >
        <Target className="w-3.5 h-3.5" /> {isActiveHighlight ? '已定位' : '定位原文'}
      </button>
    )}
    <div className="w-px h-4 bg-white/10 mx-0.5" />
    {onDelete && (
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

const SourceQuotePreview: React.FC<{ quote?: string }> = ({ quote }) => {
  const [expanded, setExpanded] = useState(false);
  if (!quote) return null;

  return (
    <div className="mt-4 pt-4 border-t border-white/5">
        <button 
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full text-[9px] uppercase font-black tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
        >
            <span className="flex items-center gap-2"><Quote className="w-3 h-3 text-violet-500" /> 证据摘录</span>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {expanded && (
            <div className="mt-2 bg-slate-950/80 p-3 rounded-xl border border-white/5 text-[11px] text-slate-400 leading-relaxed italic animate-in fade-in slide-in-from-top-1 duration-300">
                “{quote}”
            </div>
        )}
    </div>
  );
};

const CardWrapper: React.FC<{ 
    children: React.ReactNode; 
    colorClass: string; 
    isMain?: boolean; 
    title: string; 
    subtitle: string; 
    icon: any; 
    controls: React.ReactNode;
    sourceQuote?: string;
    isActiveHighlight?: boolean;
}> = ({ children, colorClass, isMain, title, subtitle, icon: Icon, controls, sourceQuote, isActiveHighlight }) => {
  const themes: Record<string, string> = {
    violet: 'border-violet-500/20 hover:border-violet-500/50 bg-violet-950/10 shadow-violet-900/5',
    blue: 'border-blue-500/20 hover:border-blue-500/50 bg-blue-950/10 shadow-blue-900/5',
    emerald: 'border-emerald-500/20 hover:border-emerald-500/50 bg-emerald-950/10 shadow-emerald-900/5',
    amber: 'border-amber-500/20 hover:border-amber-500/50 bg-amber-950/10 shadow-amber-900/5',
    pink: 'border-pink-500/20 hover:border-pink-500/50 bg-pink-950/10 shadow-pink-900/5',
  };

  const textColors: Record<string, string> = {
    violet: 'text-violet-400',
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    pink: 'text-pink-400',
  };

  return (
    <div className={`
      group relative border rounded-2xl p-6 transition-all duration-500 flex flex-col h-full overflow-hidden backdrop-blur-sm
      ${themes[colorClass] || 'border-slate-800 bg-slate-900/20'}
      ${isMain ? 'ring-2 ring-violet-500/20' : ''}
      ${isActiveHighlight ? 'border-amber-500/60 ring-4 ring-amber-500/10 shadow-[0_0_50px_rgba(251,191,36,0.15)] bg-slate-900/60' : 'hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] hover:-translate-y-1'}
    `}>
      <div className="absolute top-4 left-4 z-40 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-slate-700">
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="absolute top-4 right-4 z-30">
        {controls}
      </div>
      
      <div className="mb-6 pr-10">
        <div className="flex items-center gap-3 mb-1.5">
          <div className={`p-2 rounded-xl bg-slate-950 border border-white/5 ${textColors[colorClass]}`}>
             <Icon className="w-4.5 h-4.5" />
          </div>
          <h3 className="text-lg font-black text-slate-50 truncate tracking-tight">{title}</h3>
        </div>
        <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] block truncate ml-11">{subtitle}</span>
      </div>
      
      <div className="flex-grow flex flex-col gap-5">
        {children}
      </div>
      
      <SourceQuotePreview quote={sourceQuote} />
      
      {isMain && (
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-violet-500 to-indigo-600 shadow-[2px_0_10px_rgba(124,58,237,0.3)]" />
      )}
      {isActiveHighlight && (
          <div className="absolute top-0 right-0 p-2">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 shadow-lg"></span>
              </span>
          </div>
      )}
    </div>
  );
};

interface BaseCardProps {
    onDelete?: (id: string) => void;
    onLocate?: (q: string) => void;
    activeHighlightQuote?: string | null;
}

export const CharacterCard: React.FC<{ data: Character; onUpdate?: (c: Character) => void } & BaseCardProps> = ({ data, onUpdate, onDelete, onLocate, activeHighlightQuote }) => {
  const isMain = data.role === 'main';
  const isActive = activeHighlightQuote === data.sourceQuote;

  return (
    <CardWrapper 
      colorClass="violet" 
      isMain={isMain} 
      title={data.name} 
      subtitle={data.identity || '角色身份未定'} 
      icon={User}
      sourceQuote={data.sourceQuote}
      isActiveHighlight={isActive}
      controls={<CardControls onDelete={onDelete ? () => onDelete(data.id) : undefined} onLocate={onLocate && data.sourceQuote ? () => onLocate(data.sourceQuote!) : undefined} isActiveHighlight={isActive} />}
    >
      <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 space-y-3">
        <div className="flex flex-wrap gap-2">
          {[data.gender, data.hairstyle, data.clothing].filter(Boolean).map((tag, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-900/80 text-[10px] text-slate-400 border border-slate-800 font-bold uppercase tracking-wider shadow-sm">
              {tag}
            </span>
          ))}
        </div>
        <p className="text-[12px] text-slate-400 italic leading-relaxed line-clamp-3 font-medium opacity-80">“{data.description}”</p>
      </div>
      <EditableList 
        items={data.visualStates || []} 
        onUpdate={(items) => onUpdate?.({ ...data, visualStates: items })} 
        title="视觉/动作特征" 
        colorClass="violet" 
      />
    </CardWrapper>
  );
};

export const SceneCard: React.FC<{ data: Scene; onUpdate?: (s: Scene) => void } & BaseCardProps> = ({ data, onUpdate, onDelete, onLocate, activeHighlightQuote }) => {
  const isActive = activeHighlightQuote === data.sourceQuote;
  
  return (
    <CardWrapper 
        colorClass="blue" 
        title={data.name} 
        subtitle={`${data.type} · ${data.time}`} 
        icon={MapPin}
        sourceQuote={data.sourceQuote}
        isActiveHighlight={isActive}
        controls={<CardControls onDelete={onDelete ? () => onDelete(data.id) : undefined} onLocate={onLocate && data.sourceQuote ? () => onLocate(data.sourceQuote!) : undefined} isActiveHighlight={isActive} />}
    >
        <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-black text-blue-400/90 uppercase tracking-[0.2em]">
            <Hash className="w-3.5 h-3.5" /> 机位建议: {data.angle || '默认角度'}
        </div>
        <p className="text-[12px] text-slate-400 leading-relaxed italic line-clamp-3 opacity-80">{data.description}</p>
        </div>
        <EditableList 
        items={data.visualStates || []} 
        onUpdate={(items) => onUpdate?.({ ...data, visualStates: items })} 
        title="分镜/美术细节" 
        colorClass="blue" 
        />
    </CardWrapper>
  );
}

export const PropCard: React.FC<{ data: Prop } & BaseCardProps> = ({ data, onDelete, onLocate, activeHighlightQuote }) => {
  const isActive = activeHighlightQuote === data.sourceQuote;
  
  return (
    <CardWrapper 
        colorClass="emerald" 
        title={data.name} 
        subtitle={`设定用途: ${data.usage || '关键道具'}`} 
        icon={Box}
        sourceQuote={data.sourceQuote}
        isActiveHighlight={isActive}
        controls={<CardControls onDelete={onDelete ? () => onDelete(data.id) : undefined} onLocate={onLocate && data.sourceQuote ? () => onLocate(data.sourceQuote!) : undefined} isActiveHighlight={isActive} />}
    >
        <div className="bg-slate-950/40 p-5 rounded-2xl border border-white/5 flex-grow shadow-inner">
        <p className="text-[12px] text-slate-400 italic leading-relaxed line-clamp-8 opacity-90">{data.description}</p>
        </div>
    </CardWrapper>
  );
}

export const LightingCard: React.FC<{ data: Lighting } & BaseCardProps> = ({ data, onDelete, onLocate, activeHighlightQuote }) => {
  const isActive = activeHighlightQuote === data.sourceQuote;
  
  return (
    <CardWrapper 
        colorClass="amber" 
        title={data.type} 
        subtitle={data.mood || '光影调性'} 
        icon={Lightbulb}
        sourceQuote={data.sourceQuote}
        isActiveHighlight={isActive}
        controls={<CardControls onDelete={onDelete ? () => onDelete(data.id) : undefined} onLocate={onLocate && data.sourceQuote ? () => onLocate(data.sourceQuote!) : undefined} isActiveHighlight={isActive} />}
    >
        <div className="bg-slate-950/40 p-5 rounded-2xl border border-white/5 space-y-4 flex-grow">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-xl border border-amber-500/20 text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> 主色调: {data.color}
        </div>
        <p className="text-[12px] text-slate-400 italic leading-relaxed line-clamp-6 opacity-90">{data.description}</p>
        </div>
    </CardWrapper>
  );
}

export const SkillCard: React.FC<{ data: Skill } & BaseCardProps> = ({ data, onDelete, onLocate, activeHighlightQuote }) => {
  const isActive = activeHighlightQuote === data.sourceQuote;
  
  return (
    <CardWrapper 
        colorClass="pink" 
        title={data.name} 
        subtitle={`所属角色: ${data.owner}`} 
        icon={Zap}
        sourceQuote={data.sourceQuote}
        isActiveHighlight={isActive}
        controls={<CardControls onDelete={onDelete ? () => onDelete(data.id) : undefined} onLocate={onLocate && data.sourceQuote ? () => onLocate(data.sourceQuote!) : undefined} isActiveHighlight={isActive} />}
    >
        <div className="bg-slate-950/40 p-5 rounded-2xl border border-white/5 space-y-3 flex-grow">
        <p className="text-[13px] text-pink-300 font-black tracking-tight leading-snug">{data.effect}</p>
        <div className="w-10 h-0.5 bg-gradient-to-r from-pink-500 to-transparent rounded-full" />
        <p className="text-[12px] text-slate-500 italic leading-relaxed line-clamp-6">{data.description}</p>
        </div>
    </CardWrapper>
  );
}
