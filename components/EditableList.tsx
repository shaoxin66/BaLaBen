
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Plus, X, Edit2, Check, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

interface EditableListProps {
  items: string[];
  onUpdate: (items: string[]) => void;
  title: string;
  placeholder?: string;
  colorClass?: string;
}

export const EditableList: React.FC<EditableListProps> = ({ 
  items, 
  onUpdate, 
  title, 
  placeholder = "新项目...",
  colorClass = "amber"
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null || isAdding) {
      inputRef.current?.focus();
    }
  }, [editingIndex, isAdding]);

  const handleAdd = () => {
    const trimmed = newItemText.trim();
    if (trimmed) {
      onUpdate([...(items || []), trimmed]);
    }
    setNewItemText("");
    setIsAdding(false);
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = editText.trim();
    if (trimmed) {
      const newItems = [...items];
      newItems[index] = trimmed;
      onUpdate(newItems);
      setEditingIndex(null);
    } else {
      handleDelete(index);
    }
  };

  const handleDelete = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onUpdate(newItems);
    setEditingIndex(null);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    onUpdate(newItems);
  };

  const accentColors: Record<string, string> = {
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    pink: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  };

  return (
    <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/50">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
           <Sparkles className={`w-3 h-3 ${accentColors[colorClass].split(' ')[0]}`} />
           <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{title}</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="p-1 hover:bg-white/5 rounded-lg transition-colors group">
          <Plus className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300" />
        </button>
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-0.5">
        {(items || []).map((state, idx) => (
          <div key={idx} className="group/item flex items-center gap-2 animate-in fade-in slide-in-from-left-1 duration-200" style={{ animationDelay: `${idx * 50}ms` }}>
            {editingIndex === idx ? (
              <div className="flex-grow flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-violet-500/50 shadow-inner">
                <input 
                  ref={inputRef}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={() => handleSaveEdit(idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur(); // 显式触发失焦，以便调用 handleSaveEdit
                    }
                    if (e.key === 'Escape') {
                      setEditingIndex(null);
                    }
                  }}
                  className="bg-transparent text-[11px] text-white outline-none flex-grow"
                />
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleSaveEdit(idx)} className="text-emerald-400 hover:scale-110 transition-transform">
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex-grow flex items-center gap-1.5">
                <div 
                  onClick={() => { setEditingIndex(idx); setEditText(state); }}
                  className="flex-grow bg-slate-800/30 hover:bg-slate-800/60 p-2 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 cursor-text transition-all border border-transparent hover:border-white/5 flex items-start gap-2"
                >
                  <span className="text-[9px] opacity-30 font-mono mt-0.5">{String(idx + 1).padStart(2, '0')}</span>
                  <span className="flex-grow">{state}</span>
                </div>
                <div className="flex items-center opacity-0 group-hover/item:opacity-100 transition-all scale-95 group-hover/item:scale-100">
                   <button onClick={() => handleMove(idx, 'up')} className="p-1 hover:bg-white/10 rounded-md text-slate-600 hover:text-slate-400"><ArrowUp className="w-3 h-3" /></button>
                   <button onClick={() => handleDelete(idx)} className="p-1 hover:bg-red-500/20 rounded-md text-slate-600 hover:text-red-400"><X className="w-3 h-3" /></button>
                </div>
              </div>
            )}
          </div>
        ))}

        {isAdding && (
          <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-violet-500/50 animate-in zoom-in-95 duration-200">
            <input 
              ref={inputRef}
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onBlur={handleAdd}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur(); // 显式触发失焦，以便调用 handleAdd
                }
                if (e.key === 'Escape') {
                  setIsAdding(false);
                }
              }}
              placeholder={placeholder}
              className="bg-transparent text-[11px] text-white outline-none flex-grow"
            />
            <button onMouseDown={(e) => e.preventDefault()} onClick={handleAdd} className="text-emerald-400">
              <Check className="w-4 h-4" />
            </button>
          </div>
        )}

        {(!items || items.length === 0) && !isAdding && (
          <div className="py-4 text-center">
            <button onClick={() => setIsAdding(true)} className="text-[10px] text-slate-600 hover:text-slate-500 flex items-center gap-1 mx-auto">
               <Plus className="w-3 h-3" /> 添加细节特征
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
