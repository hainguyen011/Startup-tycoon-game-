import React, { useState, useEffect, useRef } from 'react';
import { GameState, GameStage, PlayerDecisions, Industry, SimulationResult, IntelType, IntelItem, Employee, Facility, Candidate, InteractiveEvent, Product, ProductStage } from '../types';
import StatCard from './StatCard';
import Button from './Button';
import { DollarSign, Users, TrendingUp, Zap, Activity, PieChart, Send, AlertTriangle, ShieldAlert, Lock, Search, Eye, FileText, BrainCircuit, Landmark, Briefcase, Server, User, UserPlus, XCircle, ChevronUp, Sparkles, Smile, Frown, CheckCircle, Tag, Trophy, Target, ClipboardList, Bell, AlertOctagon, HelpCircle, GraduationCap, History, FileSearch, Quote, Coffee, MessageSquare, Heart, BatteryWarning, MessageCircle, Loader2, Package, Plus, Bug, Gem, Megaphone, TrendingDown, Wallet, CreditCard, BarChart3 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, AreaChart, Area, BarChart, Bar, Cell } from 'recharts';

interface GameDashboardProps {
  state: GameState;
  currentIntel: IntelItem[];
  onTurnSubmit: (decisions: PlayerDecisions) => void;
  onBuyIntel: (type: IntelType, cost: number) => void;
  onRecruit: (jobDesc: string) => void; 
  onHireCandidate: (candidate: Candidate) => void;
  onFire: (id: string) => void;
  onUpgradeFacility: (facilityId: string) => void;
  isProcessing: boolean;
  onRestart: () => void;
  onEventDecision: (decision: string) => void;
  onChatWithEmployee?: (empId: string, message: string) => Promise<string>;
  onAssignEmployee: (empId: string, productId: string | null) => void;
  onCreateProduct: (name: string, desc: string) => void;
  onPitch: (round: string) => Promise<{success: boolean, message: string}>;
}

// Estimated costs for UI display (AI handles actual logic, but this helps player plan)
const MARKETING_COSTS: Record<string, number> = {
    'Chạy quảng cáo Facebook/Google': 1500,
    'Content Marketing (SEO)': 500,
    'Thuê Influencer/KOL': 3000,
    'Tổ chức Event/Webinar': 2000,
    'Cold Emailing/Sales': 200
};

const GameDashboard: React.FC<GameDashboardProps> = ({ 
    state, currentIntel, onTurnSubmit, onBuyIntel, onRecruit, onHireCandidate, onFire, onUpgradeFacility, isProcessing, onRestart, onEventDecision, onChatWithEmployee, onAssignEmployee, onCreateProduct, onPitch
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'report' | 'hr' | 'products' | 'facilities' | 'profile' | 'secretary'>('overview');
  const [hrSubTab, setHrSubTab] = useState<'manage' | 'recruit'>('manage');

  // Turn Decision State
  const [rdFocus, setRdFocus] = useState('Nâng cấp tính năng cốt lõi');
  const [marketingFocus, setMarketingFocus] = useState('Chạy quảng cáo Facebook/Google');
  const [fundingRound, setFundingRound] = useState('Seed Round ($200k)');
  const [strategyNote, setStrategyNote] = useState('');
  
  // Event State
  const [activeEvent, setActiveEvent] = useState<InteractiveEvent | null>(null);
  
  // Recruitment State
  const [jobDescription, setJobDescription] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Chat State
  const [chatEmployeeId, setChatEmployeeId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{sender: 'user' | 'bot', text: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  // Product Creation State
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');

  // Pitch State
  const [pitchResult, setPitchResult] = useState<{success: boolean, message: string} | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Check for Secretary
  const secretary = state.employees.find(e => e.role === 'Secretary');
  const hasSecretary = !!secretary;

  // --- CALCULATE METRICS ---
  const totalRevenue = state.products.reduce((acc, p) => acc + p.revenue, 0);
  const totalSalaries = state.employees.reduce((acc, e) => acc + e.salary, 0);
  const facilityCosts = state.facilities.reduce((acc, f) => acc + f.maintenanceCost, 0);
  const marketingCost = MARKETING_COSTS[marketingFocus] || 0;
  
  const totalExpenses = totalSalaries + facilityCosts + marketingCost;
  const netIncome = totalRevenue - totalExpenses;
  const burnRate = netIncome < 0 ? Math.abs(netIncome) : 0;
  const runway = burnRate > 0 ? Math.floor(state.cash / burnRate) : 999;
  
  const avgStress = state.employees.length > 0 ? Math.round(state.employees.reduce((acc, e) => acc + e.stress, 0) / state.employees.length) : 0;
  const avgSkill = state.employees.length > 0 ? Math.round(state.employees.reduce((acc, e) => acc + e.skill, 0) / state.employees.length) : 0;

  useEffect(() => {
    if (state.history.length > 0) {
        const lastResult = state.history[state.history.length - 1];
        if (lastResult.randomEvent) {
            setActiveEvent(lastResult.randomEvent);
        }
    }
  }, [state.history]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.history]);

  // Handle choice made in modal
  const handleEventChoice = (choiceLabel: string) => {
      onEventDecision(choiceLabel);
      setActiveEvent(null); // Dismiss modal
  };

  const handleHireFromModal = () => {
      if (selectedCandidate) {
          onHireCandidate(selectedCandidate);
          setSelectedCandidate(null);
      }
  };
  
  const openChat = (emp: Employee) => {
      setChatEmployeeId(emp.id);
      setChatHistory([{sender: 'bot', text: `Chào sếp, tôi là ${emp.name}. Có chuyện gì không ạ?`}]);
  };

  const sendChat = async () => {
      if (!chatMessage.trim() || !chatEmployeeId || !onChatWithEmployee) return;
      const msg = chatMessage;
      setChatMessage('');
      setChatHistory(prev => [...prev, {sender: 'user', text: msg}]);
      setIsChatting(true);
      const response = await onChatWithEmployee(chatEmployeeId, msg);
      setChatHistory(prev => [...prev, {sender: 'bot', text: response}]);
      setIsChatting(false);
  };

  const handleCreateProductSubmit = () => {
      if(newProdName && newProdDesc) {
          onCreateProduct(newProdName, newProdDesc);
          setIsCreatingProduct(false);
          setNewProdName('');
          setNewProdDesc('');
      }
  }

  const handlePitchClick = async () => {
      if(isProcessing) return;
      const res = await onPitch(fundingRound);
      setPitchResult(res);
      setTimeout(() => setPitchResult(null), 8000);
  }

  // Handle Game Over / Victory Screen
  if (state.stage === GameStage.GAME_OVER || state.stage === GameStage.VICTORY) {
     return (
        <div className="max-w-2xl mx-auto text-center p-12 bg-white/90 border border-white shadow-2xl rounded-3xl mt-10 relative overflow-hidden animate-fadeIn backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 z-0"></div>
          <div className="relative z-10">
            <div className="mb-8 inline-flex items-center justify-center p-8 bg-slate-50 rounded-full shadow-inner border border-slate-100">
                {state.stage === GameStage.VICTORY ? <Trophy size={80} className="text-yellow-500 drop-shadow-md" /> : <AlertTriangle size={80} className="text-red-500 drop-shadow-md" />}
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 font-heading tracking-tight">
                {state.stage === GameStage.VICTORY ? "Kỳ Lân Công Nghệ!" : "Game Over"}
            </h2>
            <p className="text-slate-600 mb-10 text-xl leading-relaxed">
                {state.stage === GameStage.VICTORY 
                ? `Chúc mừng! ${state.companyName} đã trở thành công ty tỷ đô và IPO thành công.` 
                : `${state.gameOverReason || "Startup của bạn đã dừng bước."}`}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-10 max-w-lg mx-auto">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">Final Users</div>
                    <div className="text-3xl font-bold text-slate-900">{state.users.toLocaleString()}</div>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">Equity Kept</div>
                    <div className="text-3xl font-bold text-yellow-600">{state.equity}%</div>
                </div>
            </div>
            
            <Button onClick={onRestart} className="w-full py-4 text-lg shadow-lg hover:shadow-xl" variant={state.stage === GameStage.VICTORY ? 'success' : 'primary'}>
                Chơi lại từ đầu
            </Button>
          </div>
        </div>
      );
  }

  const latestResult = state.history.length > 0 ? state.history[state.history.length - 1] : null;
  
  // Chart Data
  let runningUsers = 0;
  const growthChartData = state.history.map((h, i) => {
      runningUsers += h.userChange;
      return { name: `T${i+1}`, users: runningUsers > 0 ? runningUsers : 0 };
  });

  const INTEL_OPTIONS = [
    { type: IntelType.MARKET, title: "Market Research", cost: 500, icon: <TrendingUp size={16}/>, desc: "Dự báo xu hướng" },
    { type: IntelType.COMPETITOR, title: "Spy Competitor", cost: 1200, icon: <Eye size={16}/>, desc: "Soi đối thủ" },
    { type: IntelType.INTERNAL, title: "Internal Audit", cost: 300, icon: <FileText size={16}/>, desc: "Đánh giá team" },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Activity size={16}/> },
    { id: 'products', label: `Products (${state.products.length})`, icon: <Package size={16}/> },
    { id: 'report', label: 'Report', icon: <ClipboardList size={16}/> },
    { id: 'secretary', label: 'Secretary', icon: <Coffee size={16}/>, hidden: !hasSecretary },
    { id: 'hr', label: `Team (${state.employees.length})`, icon: <Users size={16}/> },
    { id: 'facilities', label: 'Infra', icon: <Server size={16}/> },
    { id: 'profile', label: 'Founder', icon: <User size={16}/> },
  ].filter(t => !t.hidden) as { id: typeof activeTab, label: string, icon: React.ReactNode }[];

  const activeChatEmployee = state.employees.find(e => e.id === chatEmployeeId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full animate-fadeIn items-start relative">
      
      {/* CHAT MODAL */}
      {chatEmployeeId && activeChatEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden relative flex flex-col h-[600px]">
                  {/* Header */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                              {activeChatEmployee.name.charAt(0)}
                          </div>
                          <div>
                              <div className="font-bold text-slate-900">{activeChatEmployee.name}</div>
                              <div className="text-xs text-slate-500">{activeChatEmployee.role}</div>
                          </div>
                      </div>
                      <button onClick={() => setChatEmployeeId(null)} className="p-2 hover:bg-slate-200 rounded-full">
                          <XCircle size={20} className="text-slate-400" />
                      </button>
                  </div>

                  {/* Stats Bar */}
                  <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100 flex gap-4 justify-around text-xs">
                      <div className="flex items-center gap-1 text-red-600 font-bold">
                          <BatteryWarning size={12}/> Stress: {Math.round(activeChatEmployee.stress)}%
                      </div>
                      <div className="flex items-center gap-1 text-blue-600 font-bold">
                          <Zap size={12}/> Morale: {Math.round(activeChatEmployee.morale)}%
                      </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                      {chatHistory.map((msg, i) => (
                          <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                                  {msg.text}
                              </div>
                          </div>
                      ))}
                      {isChatting && (
                           <div className="flex justify-start">
                               <div className="bg-slate-100 px-4 py-2 rounded-2xl text-xs text-slate-500 italic flex items-center gap-1">
                                   <Loader2 size={12} className="animate-spin"/> Typing...
                               </div>
                           </div>
                      )}
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-slate-200 bg-white">
                      <div className="flex gap-2">
                          <input 
                              className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="Type a message..."
                              value={chatMessage}
                              onChange={e => setChatMessage(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && sendChat()}
                              disabled={isChatting}
                          />
                          <button 
                             onClick={sendChat}
                             disabled={!chatMessage.trim() || isChatting}
                             className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
                          >
                              <Send size={18} />
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* CANDIDATE CV MODAL */}
      {selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col">
                  {/* Header */}
                  <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-start shrink-0">
                      <div className="flex gap-4 items-center">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                {selectedCandidate.name.charAt(0)}
                          </div>
                          <div>
                              <h2 className="text-2xl font-bold font-heading text-slate-900">{selectedCandidate.name}</h2>
                              <div className="flex items-center gap-2 mt-1">
                                  <span className="text-blue-600 font-bold text-sm bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wide">
                                      {selectedCandidate.level} {selectedCandidate.role}
                                  </span>
                                  <span className="text-slate-500 text-sm flex items-center gap-1">
                                      <History size={14}/> {selectedCandidate.experienceYears}y Exp
                                  </span>
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                          <XCircle size={24} className="text-slate-400" />
                      </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                      
                      {/* Bio Section */}
                      <div className="prose prose-slate max-w-none">
                          <p className="text-slate-700 italic text-lg leading-relaxed border-l-4 border-blue-300 pl-4">
                              "{selectedCandidate.bio}"
                          </p>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                      <GraduationCap size={14}/> Education
                                  </h4>
                                  <p className="text-sm font-medium text-slate-800">{selectedCandidate.education}</p>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                      <BrainCircuit size={14}/> Skills
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                      {selectedCandidate.specificSkills.map((s, i) => (
                                          <span key={i} className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-md">{s}</span>
                                      ))}
                                  </div>
                              </div>
                          </div>

                          <div className="space-y-4">
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                      <Target size={14}/> Assessment
                                  </h4>
                                  <div className="flex justify-between items-center mb-2">
                                      <span className="text-sm text-slate-600">Technical Rating</span>
                                      <span className="font-bold text-slate-900">{selectedCandidate.skill}/100</span>
                                  </div>
                                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                      <div className="bg-blue-500 h-full" style={{width: `${selectedCandidate.skill}%`}}></div>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-2">{selectedCandidate.matchAnalysis}</p>
                              </div>

                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                      <Sparkles size={14}/> Personality Quirk
                                  </h4>
                                  <p className="text-sm text-yellow-700 font-medium">{selectedCandidate.quirk}</p>
                              </div>
                          </div>
                      </div>

                      {/* Interview Notes */}
                      <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100 relative">
                          <Quote className="absolute top-4 right-4 text-yellow-200" size={40} />
                          <h4 className="text-xs font-bold text-yellow-800 uppercase mb-2 flex items-center gap-2 relative z-10">
                              <FileSearch size={14}/> Interviewer Notes
                          </h4>
                          <p className="text-yellow-900 font-medium text-sm leading-relaxed relative z-10 font-mono">
                              {selectedCandidate.interviewNotes}
                          </p>
                      </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                      <div className="flex flex-col">
                          <span className="text-xs text-slate-500 font-bold uppercase">Hiring Cost</span>
                          <span className="text-2xl font-bold text-green-600">${selectedCandidate.hireCost.toLocaleString()}</span>
                          <span className="text-xs text-slate-400"> + ${selectedCandidate.salary}/mo salary</span>
                      </div>
                      <div className="flex gap-3">
                          <Button variant="secondary" onClick={() => setSelectedCandidate(null)}>Close</Button>
                          <Button 
                              variant="success" 
                              onClick={handleHireFromModal}
                              disabled={state.cash < selectedCandidate.hireCost}
                          >
                              Hire Candidate
                          </Button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* EVENT MODAL OVERLAY */}
      {activeEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden relative" style={{minWidth: "40vw", maxWidth: "60vw"}}>
                  {/* Event Header */}
                  <div className={`p-6 text-white ${activeEvent.type === 'crisis' ? 'bg-red-500' : activeEvent.type === 'opportunity' ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                      <div className="flex items-center gap-2 mb-2 opacity-90 text-xs font-bold uppercase tracking-widest">
                          {activeEvent.type === 'crisis' ? <AlertOctagon size={16}/> : activeEvent.type === 'opportunity' ? <Sparkles size={16}/> : <HelpCircle size={16}/>}
                          Incoming Alert
                      </div>
                      <h2 className="text-2xl font-bold font-heading">{activeEvent.title}</h2>
                  </div>
                  
                  {/* Content */}
                  <div className="p-8">
                      <p className="text-slate-700 text-lg leading-relaxed mb-8 font-medium">
                          {activeEvent.description}
                      </p>
                      
                      <div className="space-y-3">
                          {activeEvent.options?.map((opt, idx) => (
                              <button 
                                  key={idx}
                                  onClick={() => handleEventChoice(opt.label)}
                                  className="w-full text-left p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all group relative overflow-hidden"
                              >
                                  <div className="flex justify-between items-center relative z-10">
                                      <span className="font-bold text-slate-800 group-hover:text-blue-700">{opt.label}</span>
                                      <span className="text-xs font-bold px-2 py-1 rounded bg-slate-200 text-slate-600 group-hover:bg-blue-200 group-hover:text-blue-800">{opt.risk}</span>
                                  </div>
                              </button>
                          ))}
                          
                          <button 
                             onClick={() => handleEventChoice("Ignore")}
                             className="w-full text-center p-3 text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
                          >
                              Ignore & Continue
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Left Column: Stats & Dashboard */}
      <div className="lg:col-span-8 flex flex-col gap-6 w-full">
        
        {/* Header & Stats */}
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading flex items-center gap-3">
                        {state.companyName}
                        <span className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-mono tracking-wider font-bold">
                            WEEK {state.turn.toString().padStart(2, '0')}
                        </span>
                    </h2>
                    <div className="flex items-center gap-3 text-slate-500 text-sm mt-1 font-medium">
                        <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{state.industry}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="flex items-center gap-1 text-slate-700 font-bold"><PieChart size={14} className="text-yellow-500"/> {state.equity}% Equity</span>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard 
                    label="Funds" 
                    value={`$${state.cash.toLocaleString()}`} 
                    icon={<DollarSign size={18} className="text-green-600" />} 
                    change={latestResult?.cashChange}
                    colorClass="bg-green-100 text-green-600"
                />
                <StatCard 
                    label="Active Users" 
                    value={state.users.toLocaleString()} 
                    icon={<Users size={18} className="text-blue-600" />} 
                    change={latestResult?.userChange}
                    colorClass="bg-blue-100 text-blue-600"
                />
                <StatCard 
                    label="Team Morale" 
                    value={state.morale} 
                    suffix="%"
                    icon={<Zap size={18} className="text-yellow-600" />} 
                    change={latestResult?.moraleChange}
                    colorClass="bg-yellow-100 text-yellow-600"
                />
                <StatCard 
                    label="Products" 
                    value={state.products.length} 
                    icon={<Package size={18} className="text-purple-600" />} 
                    colorClass="bg-purple-100 text-purple-600"
                />
            </div>
        </div>

        {/* --- MAIN DASHBOARD AREA --- */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-1 min-h-[600px] flex flex-col shadow-xl shadow-slate-200/50">
            
            {/* Tab Navigation */}
            <div className="flex p-1 gap-1 border-b border-slate-200/50 bg-white/50 rounded-t-3xl overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all rounded-xl whitespace-nowrap
                        ${activeTab === tab.id 
                            ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' 
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className="p-6 flex-1 bg-white/40 rounded-b-3xl">
                
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 gap-6 h-full content-start">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col min-h-[300px]">
                                <h3 className="text-slate-500 text-xs font-bold mb-4 uppercase flex items-center gap-2">
                                    <TrendingUp size={14} className="text-green-500"/> Growth Trajectory
                                </h3>
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={growthChartData}>
                                            <defs>
                                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                itemStyle={{ color: '#2563eb', fontWeight: 'bold' }} 
                                            />
                                            <Area type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-2">Market Share</div>
                                    <div className="flex items-end gap-2">
                                        <div className="text-4xl font-bold text-slate-900 font-heading">{state.marketShare.toFixed(1)}%</div>
                                        <div className="text-xs text-slate-400 mb-1.5">of Total Addressable Market</div>
                                    </div>
                                    <div className="w-full bg-slate-100 h-3 rounded-full mt-4 overflow-hidden">
                                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full" style={{width: `${Math.min(100, state.marketShare)}%`}}></div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex-1">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-3">Key Competitor</div>
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-red-50 rounded-xl text-red-500 border border-red-100">
                                            <ShieldAlert size={24} />
                                        </div>
                                        <div>
                                            <div className="text-base font-bold text-slate-800">{state.competitorName}</div>
                                            <div className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-3">
                                                "{state.marketContext}"
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COMPANY HEALTH DASHBOARD */}
                        <div className="mt-4">
                            <h3 className="text-slate-500 text-xs font-bold mb-4 uppercase flex items-center gap-2">
                                <BarChart3 size={14} className="text-blue-500"/> Company Health & Financials
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                {/* P&L Card */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-slate-400 font-bold uppercase">Net Profit/Loss</span>
                                        <Wallet size={16} className={netIncome >= 0 ? "text-green-500" : "text-red-500"}/>
                                    </div>
                                    <div className={`text-2xl font-bold font-heading ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                                        {netIncome >= 0 ? '+' : '-'}${Math.abs(netIncome).toLocaleString()}
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden flex">
                                        <div className="h-full bg-green-500" style={{width: `${(totalRevenue / (totalRevenue + totalExpenses || 1)) * 100}%`}}></div>
                                        <div className="h-full bg-red-500" style={{width: `${(totalExpenses / (totalRevenue + totalExpenses || 1)) * 100}%`}}></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                                        <span>Rev: ${totalRevenue.toLocaleString()}</span>
                                        <span>Exp: ${totalExpenses.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Burn Rate & Runway */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-slate-400 font-bold uppercase">Runway</span>
                                        <CreditCard size={16} className="text-purple-500"/>
                                    </div>
                                    <div className="text-2xl font-bold font-heading text-slate-800">
                                        {runway === 999 ? "∞" : runway} <span className="text-sm font-normal text-slate-500">Months</span>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        Burn Rate: <span className="text-red-500 font-bold">${burnRate.toLocaleString()}/mo</span>
                                    </div>
                                    <div className="mt-2 text-[10px] text-slate-400 flex flex-wrap gap-1">
                                        <span className="bg-slate-100 px-1.5 rounded">Sal: ${totalSalaries.toLocaleString()}</span>
                                        <span className="bg-slate-100 px-1.5 rounded">Ops: ${facilityCosts.toLocaleString()}</span>
                                        <span className="bg-slate-100 px-1.5 rounded">Mkt: ${marketingCost.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* HR Stats */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-slate-400 font-bold uppercase">Team Efficiency</span>
                                        <Users size={16} className="text-blue-500"/>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <div className="text-2xl font-bold font-heading text-slate-800">{state.employees.length}</div>
                                            <div className="text-[10px] text-slate-400 uppercase">Headcount</div>
                                        </div>
                                        <div className="h-8 w-px bg-slate-200"></div>
                                        <div>
                                            <div className="text-2xl font-bold font-heading text-slate-800">{avgSkill}</div>
                                            <div className="text-[10px] text-slate-400 uppercase">Avg Skill</div>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <div className="flex justify-between text-[10px] mb-1 font-bold">
                                            <span className="text-slate-500">Stress Level</span>
                                            <span className={avgStress > 70 ? "text-red-500" : "text-green-500"}>{avgStress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                            <div className={`h-full ${avgStress > 70 ? 'bg-red-500' : avgStress > 40 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{width: `${avgStress}%`}}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Marketing & Ops */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-slate-400 font-bold uppercase">Company Age</span>
                                        <History size={16} className="text-slate-400"/>
                                    </div>
                                    <div className="text-2xl font-bold font-heading text-slate-800">
                                        Week {state.turn}
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        <div className="flex justify-between text-xs text-slate-600">
                                            <span>Current Stage</span>
                                            <span className="font-bold text-blue-600">{state.users > 100000 ? "Growth" : state.users > 1000 ? "Early" : "Seed"}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-600">
                                            <span>Est. Valuation</span>
                                            <span className="font-bold text-green-600">${(totalRevenue * 12 * 5 || 10000).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PRODUCTS TAB */}
                {activeTab === 'products' && (
                    <div className="flex flex-col h-full space-y-6">
                        {/* New Product Creator */}
                        {isCreatingProduct ? (
                            <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-lg animate-slideUp">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Start New Product</h3>
                                <div className="space-y-4">
                                    <input 
                                        className="w-full p-3 border rounded-xl" 
                                        placeholder="Product Name"
                                        value={newProdName}
                                        onChange={(e) => setNewProdName(e.target.value)}
                                    />
                                    <input 
                                        className="w-full p-3 border rounded-xl" 
                                        placeholder="Description"
                                        value={newProdDesc}
                                        onChange={(e) => setNewProdDesc(e.target.value)}
                                    />
                                    <div className="flex gap-3">
                                        <Button onClick={handleCreateProductSubmit}>Launch</Button>
                                        <Button variant="secondary" onClick={() => setIsCreatingProduct(false)}>Cancel</Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-end">
                                <Button onClick={() => setIsCreatingProduct(true)} className="text-sm">
                                    <Plus size={16}/> New Product
                                </Button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6">
                            {state.products.map(prod => (
                                <div key={prod.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 font-heading">{prod.name}</h3>
                                            <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded mt-1 font-bold">
                                                {prod.stage}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-green-600">${prod.revenue.toLocaleString()}/mo</div>
                                            <div className="text-xs text-slate-400">Revenue</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Development</div>
                                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-1">
                                                <div className="bg-blue-500 h-full transition-all duration-500" style={{width: `${prod.developmentProgress}%`}}></div>
                                            </div>
                                            <div className="text-right text-xs font-bold text-blue-600">{prod.developmentProgress}% to next stage</div>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase font-bold">Quality</div>
                                                <div className="text-lg font-bold text-slate-800 flex items-center gap-1">
                                                    <Gem size={14} className="text-blue-400"/> {prod.quality}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase font-bold">Bugs</div>
                                                <div className="text-lg font-bold text-red-600 flex items-center gap-1">
                                                    <Bug size={14}/> {prod.bugs}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Active Users</div>
                                            <div className="text-xl font-bold text-slate-800">{prod.users.toLocaleString()}</div>
                                        </div>
                                    </div>

                                    {/* Feedback */}
                                    {prod.activeFeedback.length > 0 && (
                                        <div className="mb-4 bg-yellow-50 p-3 rounded-xl border border-yellow-100 text-sm text-yellow-800 italic">
                                            "<Megaphone size={12} className="inline mr-1"/> {prod.activeFeedback[0]}"
                                        </div>
                                    )}

                                    {/* Team Assignment */}
                                    <div className="border-t border-slate-100 pt-4">
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-2">Assigned Team</div>
                                        <div className="flex flex-wrap gap-2">
                                            {state.employees.map(emp => {
                                                const isAssigned = emp.assignedProductId === prod.id;
                                                return (
                                                    <button
                                                        key={emp.id}
                                                        onClick={() => onAssignEmployee(emp.id, isAssigned ? null : prod.id)}
                                                        className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                                                            isAssigned 
                                                            ? 'bg-blue-600 text-white border-blue-600' 
                                                            : emp.assignedProductId 
                                                                ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed' // Assigned elsewhere
                                                                : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                                                        }`}
                                                        disabled={!!emp.assignedProductId && !isAssigned}
                                                    >
                                                        {emp.name} ({emp.role})
                                                        {isAssigned && <CheckCircle size={10}/>}
                                                    </button>
                                                )
                                            })}
                                            {state.employees.length === 0 && <span className="text-xs text-slate-400 italic">No employees available.</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SECRETARY REPORT TAB */}
                {activeTab === 'secretary' && hasSecretary && (
                    <div className="h-full flex flex-col">
                        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-6 flex items-start gap-4">
                            <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                                <Coffee size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-orange-900 font-heading">Secretary's Desk</h3>
                                <p className="text-orange-800/80 text-sm mt-1">
                                    Xin chào Boss! Tôi là <span className="font-bold">{secretary.name}</span>. Đây là những tin đồn và thông tin hành lang tôi thu thập được.
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                             {state.history.slice().reverse().map((hist, idx) => hist.secretaryReport ? (
                                 <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative group hover:border-orange-200 transition-colors">
                                     <div className="absolute top-4 right-4 text-xs font-bold text-slate-300 bg-slate-50 px-2 py-1 rounded">Week {state.history.length - idx}</div>
                                     <div className="flex gap-3">
                                         <MessageSquare size={16} className="text-slate-400 mt-1 shrink-0" />
                                         <p className="text-slate-700 text-sm italic leading-relaxed">"{hist.secretaryReport}"</p>
                                     </div>
                                 </div>
                             ) : null)}
                             {state.history.every(h => !h.secretaryReport) && (
                                 <div className="text-center text-slate-400 py-10 italic">Chưa có tin đồn nào được thu thập...</div>
                             )}
                        </div>
                    </div>
                )}

                {/* WEEKLY REPORT TAB */}
                {activeTab === 'report' && (
                    <div className="h-full animate-fadeIn space-y-6">
                        {latestResult ? (
                            <>
                                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0"></div>
                                     <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                <ClipboardList size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-slate-900 font-heading">Executive Summary</h3>
                                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Week {state.turn - 1} Report</p>
                                            </div>
                                        </div>
                                        
                                        <div className="prose prose-slate max-w-none">
                                            <p className="text-lg text-slate-700 leading-8 font-medium whitespace-pre-line">
                                                {latestResult.narrative}
                                            </p>
                                        </div>
                                     </div>
                                </div>
                                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex flex-col">
                                    <div className="flex items-center gap-2 mb-3 text-indigo-700">
                                        <BrainCircuit size={18} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Advisor Note</span>
                                    </div>
                                    <div className="flex-1 flex items-center">
                                        <p className="text-indigo-900 text-base italic font-medium leading-relaxed">
                                            "{latestResult.advice}"
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 border-2 border-dashed border-slate-200 rounded-3xl">
                                <FileText size={48} className="mb-4 opacity-20" />
                                <p className="text-lg font-medium">Waiting for first week report...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* HR TAB */}
                {activeTab === 'hr' && (
                    <div className="h-full flex flex-col">
                        <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl w-fit">
                            <button 
                                onClick={() => setHrSubTab('manage')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${hrSubTab === 'manage' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Management
                            </button>
                            <button 
                                onClick={() => setHrSubTab('recruit')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${hrSubTab === 'recruit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Recruitment
                            </button>
                        </div>

                        {hrSubTab === 'manage' && (
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {state.employees.map(emp => (
                                        <div key={emp.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group relative">
                                            <button 
                                                onClick={() => openChat(emp)}
                                                className="absolute top-4 right-14 p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                <MessageCircle size={18} />
                                            </button>
                                            <button onClick={() => onFire(emp.id)} className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors">
                                                <XCircle size={18}/>
                                            </button>

                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                                                    {emp.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900">{emp.name}</h4>
                                                    <div className="text-xs font-bold text-blue-600 uppercase tracking-wide">{emp.level} {emp.role}</div>
                                                </div>
                                            </div>

                                            <div className="space-y-3 mb-4">
                                                <div>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="font-bold text-slate-500 flex items-center gap-1"><Zap size={10}/> Morale</span>
                                                        <span className={`font-bold ${emp.morale < 30 ? 'text-red-500' : 'text-slate-700'}`}>{Math.round(emp.morale)}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all duration-500 ${emp.morale < 30 ? 'bg-red-500' : 'bg-yellow-400'}`} style={{width: `${emp.morale}%`}}></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="font-bold text-slate-500 flex items-center gap-1"><BatteryWarning size={10}/> Stress</span>
                                                        <span className={`font-bold ${emp.stress > 70 ? 'text-red-500' : 'text-slate-700'}`}>{Math.round(emp.stress)}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all duration-500 ${emp.stress > 70 ? 'bg-red-500' : 'bg-green-500'}`} style={{width: `${emp.stress}%`}}></div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
                                                <span>Salary: <b>${emp.salary.toLocaleString()}/mo</b></span>
                                                {emp.assignedProductId && <span className="text-blue-600 font-bold">On Product</span>}
                                            </div>
                                        </div>
                                    ))}
                                    {state.employees.length === 0 && (
                                        <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                                            <Users size={48} className="mx-auto mb-3 opacity-20"/>
                                            <p className="font-medium">No active employees</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {hrSubTab === 'recruit' && (
                             <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
                                <div className="flex flex-col h-full">
                                    <div className="mb-4">
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                                            <div className="relative">
                                                <textarea
                                                    value={jobDescription}
                                                    onChange={(e) => setJobDescription(e.target.value)}
                                                    placeholder="Describe the role... (e.g. 'Rockstar AI Engineer needed' or 'Need a Secretary')"
                                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none h-24"
                                                />
                                                <div className="absolute bottom-3 right-3">
                                                    <Button onClick={() => onRecruit(jobDescription)} disabled={state.cash < 500 || isProcessing || !jobDescription.trim()} variant="primary" className="text-xs py-1.5 px-3 h-8 shadow-sm">
                                                        Headhunt ($500)
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] pr-1">
                                        {state.candidates.map(cand => (
                                            <div key={cand.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="font-bold text-slate-900">{cand.name}</div>
                                                        <div className="text-xs text-blue-600 font-bold">{cand.level} {cand.role}</div>
                                                    </div>
                                                    <div className="text-green-600 font-bold text-sm">${cand.hireCost}</div>
                                                </div>
                                                <div className="text-xs text-slate-500 mb-2">Skills: {cand.specificSkills.join(', ')}</div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button onClick={() => setSelectedCandidate(cand)} variant="secondary" className="w-full py-1 text-xs">View CV</Button>
                                                    <Button onClick={() => onHireCandidate(cand)} disabled={state.cash < cand.hireCost} className="w-full py-1 text-xs" variant="success">Hire</Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* FACILITIES TAB */}
                {activeTab === 'facilities' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {state.facilities.map(fac => (
                             <div key={fac.id} className="bg-white p-6 rounded-2xl border border-slate-200 relative overflow-hidden group hover:border-blue-300 hover:shadow-md transition-all">
                                 {/* Background Icon */}
                                 <div className="absolute -bottom-4 -right-4 text-slate-100 group-hover:text-blue-50 transition-all transform group-hover:scale-110 group-hover:-rotate-12">
                                     {fac.id === 'office' ? <Briefcase size={120} /> : <Server size={120} />}
                                 </div>
                                 
                                 <div className="relative z-10">
                                     <div className="flex justify-between items-start mb-4">
                                         <div>
                                            <h4 className="font-bold text-xl text-slate-900 font-heading">{fac.name}</h4>
                                            <div className="text-blue-600 text-xs font-bold uppercase tracking-widest mt-1">Level {fac.level}</div>
                                         </div>
                                         {fac.id === 'server' ? <Server className="text-slate-400"/> : <Briefcase className="text-slate-400"/>}
                                     </div>
                                     
                                     <p className="text-slate-600 text-sm mb-6 h-12 leading-relaxed">{fac.description}</p>
                                     
                                     <div className="flex items-center gap-2 text-xs font-bold text-yellow-700 mb-6 bg-yellow-50 px-3 py-2 rounded-lg w-fit border border-yellow-100">
                                         <Zap size={14}/> {fac.benefit}
                                     </div>
                                     
                                     {fac.level < fac.maxLevel ? (
                                        <Button 
                                            variant="secondary"
                                            onClick={() => onUpgradeFacility(fac.id)}
                                            disabled={state.cash < fac.costToUpgrade || isProcessing}
                                            className="w-full text-sm py-3 border-slate-200 hover:bg-slate-50 text-slate-700"
                                        >
                                            Upgrade <ChevronUp size={16}/> (${fac.costToUpgrade.toLocaleString()})
                                        </Button>
                                     ) : (
                                         <div className="w-full text-center py-3 text-sm text-green-600 font-bold bg-green-50 rounded-lg border border-green-100">
                                             MAX LEVEL REACHED
                                         </div>
                                     )}
                                 </div>
                             </div>
                         ))}
                    </div>
                )}
                
                {/* PROFILE TAB */}
                 {activeTab === 'profile' && (
                    <div className="max-w-xl mx-auto py-6">
                         <div className="text-center mb-8 relative">
                             <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-xl shadow-blue-200 rotate-3 transform hover:rotate-0 transition-all duration-500">
                                 CEO
                             </div>
                             <h3 className="text-2xl font-bold text-slate-900 font-heading">{state.companyName} Founder</h3>
                             <p className="text-slate-500 text-sm mt-1 font-medium">Tech Visionary & Serial Entrepreneur</p>
                         </div>
                         
                         <div className="space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                             {[
                                { label: 'Management', val: state.playerSkills.management, desc: 'Giữ morale, tối ưu lương & tuyển dụng', color: 'bg-blue-500' },
                                { label: 'Tech Vision', val: state.playerSkills.tech, desc: 'Tăng chất lượng R&D và giảm lỗi', color: 'bg-purple-500' },
                                { label: 'Charisma', val: state.playerSkills.charisma, desc: 'Gọi vốn & Marketing tốt hơn', color: 'bg-orange-500' }
                             ].map((skill, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-700 font-bold tracking-wide">{skill.label}</span>
                                        <span className="text-slate-800 font-mono bg-slate-100 px-2 rounded border border-slate-200">{skill.val}/10</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200 relative">
                                        <div className={`absolute top-0 left-0 h-full ${skill.color} transition-all duration-1000 shadow-sm`} style={{width: `${skill.val * 10}%`}}></div>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1.5 italic font-medium">{skill.desc}</p>
                                </div>
                             ))}
                         </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Right Column: Actions (Sticky Sidebar) */}
      <div className="lg:col-span-4 flex flex-col h-[calc(100vh-2rem)] sticky top-4 bg-white/90 border border-white/60 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden ring-1 ring-slate-200"
      style={{position: 'fixed', right: "2rem", maxWidth: "450px"}}
      >
        <div className="p-6 border-b border-slate-100 bg-white/50 flex justify-between items-center shrink-0">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 font-heading tracking-wide">
                <BrainCircuit size={20} className="text-blue-600"/>
                Command Center
            </h3>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-sm"></div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* PITCH RESULT NOTIFICATION */}
            {pitchResult && (
                <div className={`p-4 rounded-xl border ${pitchResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'} animate-slideUp`}>
                    <h4 className="font-bold flex items-center gap-2">
                        {pitchResult.success ? <CheckCircle size={16}/> : <XCircle size={16}/>}
                        Investor Response
                    </h4>
                    <p className="text-sm mt-1">{pitchResult.message}</p>
                </div>
            )}

            {/* INTEL */}
             <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Search size={14}/> Intelligence Network
                </h4>
                <div className="grid grid-cols-1 gap-2">
                    {INTEL_OPTIONS.map((opt) => (
                        <button
                            key={opt.type}
                            disabled={state.cash < opt.cost || isProcessing || activeEvent !== null}
                            onClick={() => onBuyIntel(opt.type, opt.cost)}
                            className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-left shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                                    {opt.icon}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800">{opt.title}</div>
                                    <div className="text-[10px] text-slate-500">{opt.desc}</div>
                                </div>
                            </div>
                            <div className="text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded-md">
                                ${opt.cost}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* CEO DIRECTIVE */}
            <div>
                <label className="block text-xs font-bold text-purple-600 mb-2 flex items-center gap-2 uppercase tracking-wide">
                    <Zap size={14} /> 
                    Strategy Override
                </label>
                <div className="relative">
                    <textarea 
                        value={strategyNote}
                        onChange={(e) => setStrategyNote(e.target.value)}
                        disabled={activeEvent !== null}
                        placeholder="Enter specific instructions for the AI..."
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl p-4 min-h-[80px] text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                    />
                </div>
            </div>

            <div className="h-px bg-slate-200 my-2 w-full"></div>

            {/* FUNDING (PITCH) */}
            <div className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-yellow-600 mb-2 uppercase flex items-center gap-2 tracking-wide">
                        <Landmark size={14} /> Funding Pitch
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <select 
                                value={fundingRound}
                                onChange={(e) => setFundingRound(e.target.value)}
                                disabled={activeEvent !== null || isProcessing}
                                className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-yellow-500 outline-none text-sm font-medium appearance-none"
                            >
                                <option value="Seed Round ($200k)">Seed Round ($200k)</option>
                                <option value="Series A ($1M)">Series A ($1M)</option>
                                <option value="Series B ($5M)">Series B ($5M)</option>
                            </select>
                            <ChevronUp className="absolute right-3 top-3.5 text-slate-400 pointer-events-none rotate-180" size={16} />
                        </div>
                        <Button 
                            onClick={handlePitchClick}
                            disabled={isProcessing || activeEvent !== null}
                            className="whitespace-nowrap bg-yellow-500 hover:bg-yellow-600 text-white shadow-yellow-200"
                        >
                            Pitch
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">R&D Focus</label>
                         <div className="relative">
                            <select 
                                value={rdFocus}
                                onChange={(e) => setRdFocus(e.target.value)}
                                disabled={activeEvent !== null}
                                className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-xs shadow-sm appearance-none"
                            >
                                <option>Nâng cấp tính năng cốt lõi</option>
                                <option>Sửa lỗi & Ổn định hệ thống</option>
                                <option>Nghiên cứu công nghệ mới (AI)</option>
                                <option>Cải thiện UI/UX</option>
                            </select>
                         </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Marketing</label>
                        <div className="relative">
                            <select 
                                value={marketingFocus}
                                onChange={(e) => setMarketingFocus(e.target.value)}
                                disabled={activeEvent !== null}
                                className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-xs shadow-sm appearance-none"
                            >
                                <option>Chạy quảng cáo Facebook/Google</option>
                                <option>Content Marketing (SEO)</option>
                                <option>Thuê Influencer/KOL</option>
                                <option>Tổ chức Event/Webinar</option>
                                <option>Cold Emailing/Sales</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 shrink-0">
            {/* Removed fundingRound from onTurnSubmit object to match PlayerDecisions interface */}
            <Button 
                onClick={() => onTurnSubmit({ rdFocus, marketingFocus, strategyNote, eventChoice: null })}
                isLoading={isProcessing}
                disabled={activeEvent !== null}
                className="w-full py-4 text-lg font-bold shadow-blue-300/50 hover:shadow-blue-400/50 disabled:opacity-50 disabled:shadow-none"
            >
                {activeEvent ? "Resolve Alert First" : "End Week"}
            </Button>
            <div className="flex justify-between items-center mt-3 px-1">
                <span className="text-xs text-slate-400 font-mono">Week {state.turn}</span>
                <span className="text-xs text-green-600 font-mono font-bold">${state.cash.toLocaleString()} Available</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GameDashboard;