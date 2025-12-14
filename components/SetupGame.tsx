import React, { useState } from 'react';
import { Industry } from '../types';
import Button from './Button';
import { Rocket, Briefcase, Cpu, Heart, ShoppingBag, GraduationCap, Lightbulb } from 'lucide-react';

interface SetupGameProps {
  onStart: (name: string, industry: Industry, productName: string, productDesc: string) => void;
  isLoading: boolean;
}

const SetupGame: React.FC<SetupGameProps> = ({ onStart, isLoading }) => {
  const [name, setName] = useState('');
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [industry, setIndustry] = useState<Industry>(Industry.TECH);

  const industries = [
    { value: Industry.TECH, label: "SaaS Tech", icon: <Cpu size={20} />, desc: "High growth, high risk" },
    { value: Industry.HEALTH, label: "Health", icon: <Heart size={20} />, desc: "Slow regulation, big payoff" },
    { value: Industry.AI, label: "AI & ML", icon: <Rocket size={20} />, desc: "Trending, expensive talent" },
    { value: Industry.EDTECH, label: "EdTech", icon: <GraduationCap size={20} />, desc: "Impact driven, steady" },
    { value: Industry.FMCG, label: "FMCG", icon: <ShoppingBag size={20} />, desc: "Consumer focused, volume" },
  ];

  return (
    <div className="max-w-3xl w-full mx-auto p-8 md:p-12 bg-white border border-slate-200 rounded-3xl shadow-xl relative overflow-hidden animate-fadeIn my-10">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-50 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2"></div>

      <div className="text-center mb-10">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-4 font-heading tracking-tight">
          Startup <span className="text-blue-600">Tycoon</span> AI
        </h1>
        <p className="text-slate-500 text-lg max-w-lg mx-auto">
          Xây dựng đế chế công nghệ tiếp theo của Silicon Valley. <br/>Mô phỏng chân thực bởi AI.
        </p>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Tên Công Ty</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Pied Piper..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium text-lg shadow-inner"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Sản Phẩm Đầu Tiên</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ví dụ: App nén dữ liệu..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all placeholder:text-slate-400 font-medium text-lg shadow-inner"
              />
            </div>
        </div>

        <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                <Lightbulb size={16} className="text-yellow-500"/> Mô tả sản phẩm
            </label>
            <textarea
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
                placeholder="Sản phẩm này giải quyết vấn đề gì? (Ngắn gọn)"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none shadow-inner"
            />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Chọn Ngành</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {industries.map((ind) => (
              <button
                key={ind.value}
                onClick={() => setIndustry(ind.value)}
                className={`flex items-start p-4 rounded-xl border-2 transition-all text-left group relative overflow-hidden ${
                  industry === ind.value
                    ? 'bg-blue-50 border-blue-600 shadow-md'
                    : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`mt-1 mr-4 p-2 rounded-lg ${industry === ind.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-blue-500'} transition-colors`}>
                  {ind.icon}
                </div>
                <div>
                  <div className={`font-bold text-base ${industry === ind.value ? 'text-blue-900' : 'text-slate-700'}`}>
                    {ind.label}
                  </div>
                  <div className={`text-xs mt-1 ${industry === ind.value ? 'text-blue-700' : 'text-slate-500'}`}>{ind.desc}</div>
                </div>
                {industry === ind.value && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6">
          <Button 
            onClick={() => onStart(name, industry, productName, productDesc)} 
            disabled={!name.trim() || !productName.trim() || !productDesc.trim()} 
            isLoading={isLoading}
            className="w-full py-5 text-xl shadow-blue-200 shadow-lg hover:shadow-xl hover:translate-y-[-2px]"
          >
            <Rocket size={24} /> Khởi Nghiệp ($10,000 vốn)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SetupGame;