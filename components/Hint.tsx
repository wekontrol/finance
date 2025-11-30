import React from 'react';
import { HelpCircle } from 'lucide-react';

interface HintProps {
  text: string;
  className?: string;
}

const Hint: React.FC<HintProps> = ({ text, className = '' }) => {
  return (
    <div className={`group relative inline-block ml-2 align-middle z-10 ${className}`}>
      <HelpCircle 
        size={16} 
        className="text-slate-400 hover:text-primary-500 cursor-help transition-colors" 
      />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none text-center leading-relaxed border border-slate-700">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
      </div>
    </div>
  );
};

export default Hint;