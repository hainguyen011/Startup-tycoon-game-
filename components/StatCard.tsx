import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number; 
  colorClass?: string;
  suffix?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, change, colorClass = "text-slate-800", suffix = "" }) => {
  return (
    <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md hover:border-blue-200 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-xl bg-slate-50 group-hover:scale-110 transition-transform duration-300 ${colorClass}`}>
            {icon}
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-slate-800 font-heading tracking-tight">
          {value}{suffix}
        </div>
        
        {change !== undefined && change !== 0 && (
          <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {change > 0 ? <ArrowUp size={12} className="mr-0.5" /> : <ArrowDown size={12} className="mr-0.5" />}
            {Math.abs(change)}
          </div>
        )}
        {change === 0 && (
           <div className="flex items-center text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500">
             <Minus size={12} className="mr-0.5" />
             0
           </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;