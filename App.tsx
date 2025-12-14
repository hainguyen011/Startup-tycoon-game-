import React, { useState, useEffect } from 'react';
import SetupGame from './components/SetupGame';
import GameDashboard from './components/GameDashboard';
import { GameState, GameStage, Industry, PlayerDecisions, INITIAL_CASH, SimulationResult, IntelType, IntelItem, INITIAL_FACILITIES, INITIAL_SKILLS, Employee, Candidate, Product, ProductStage } from './types';
import { initializeGameStory, processTurn, getAdvisorInsight, generateCandidates, chatWithEmployee, evaluatePitch } from './services/gemini';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [currentIntel, setCurrentIntel] = useState<IntelItem[]>([]);
  const [lastEventChoice, setLastEventChoice] = useState<string | null>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    companyName: '',
    industry: Industry.TECH,
    cash: INITIAL_CASH,
    users: 0,
    morale: 80,
    productQuality: 50,
    marketShare: 0,
    equity: 100, 
    turn: 1,
    history: [],
    stage: GameStage.SETUP,
    marketContext: '',
    competitorName: '',
    employees: [],
    candidates: [], 
    products: [],
    facilities: JSON.parse(JSON.stringify(INITIAL_FACILITIES)), 
    playerSkills: { ...INITIAL_SKILLS }
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setError("Thiếu API Key. Vui lòng cấu hình process.env.API_KEY.");
    }
  }, []);

  const handleStartGame = async (name: string, industry: Industry, productName: string, productDesc: string) => {
    setLoading(true);
    try {
      const initData = await initializeGameStory(industry, name, productName, productDesc);
      
      // Create initial product
      const initialProduct: Product = {
          id: `prod-${Date.now()}`,
          name: productName,
          description: productDesc,
          stage: ProductStage.CONCEPT,
          developmentProgress: 0,
          quality: 50,
          marketFit: 50, // Average start
          bugs: 0,
          users: 0,
          revenue: 0,
          activeFeedback: [initData.initialProductAnalysis]
      };

      setGameState(prev => ({
        ...prev,
        companyName: name,
        industry: industry,
        stage: GameStage.PLAYING,
        marketContext: initData.marketContext,
        competitorName: initData.competitorName,
        products: [initialProduct],
        history: [{
            narrative: `Khởi đầu hành trình. ${initData.marketContext}. Sản phẩm đầu tiên "${productName}" đang ở giai đoạn ý tưởng. ${initData.initialFeedback}`,
            cashChange: 0,
            equityChange: 0,
            userChange: 0,
            moraleChange: 0,
            productUpdates: [],
            competitorUpdate: "Chưa có động thái.",
            advice: "Hãy tuyển dụng và gán nhân sự để phát triển sản phẩm.",
            randomEvent: null,
            skillXpEarned: {},
            decisions: undefined 
        }]
      }));
    } catch (e) {
      console.error(e);
      setError("Không thể khởi tạo game. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyIntel = async (type: IntelType, cost: number) => {
    if (gameState.cash < cost) return;
    setLoading(true);
    try {
        setGameState(prev => ({ ...prev, cash: prev.cash - cost }));
        const insightText = await getAdvisorInsight(gameState, type);
        const newIntel: IntelItem = {
            id: Date.now().toString(),
            type,
            title: type === IntelType.MARKET ? "Market Report" : type === IntelType.COMPETITOR ? "Spy Report" : "Internal Audit",
            content: insightText,
            cost
        };
        setCurrentIntel(prev => [...prev, newIntel]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleRecruit = async (jobDesc: string) => {
      const cost = 500;
      if (gameState.cash < cost) {
          alert("Không đủ tiền đăng tin tuyển dụng ($500)!");
          return;
      }
      setLoading(true);
      try {
          const candidates = await generateCandidates(gameState.industry, gameState.turn, jobDesc);
          setGameState(prev => ({
              ...prev,
              cash: prev.cash - cost,
              candidates: candidates
          }));
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const handleHireCandidate = (candidate: Candidate) => {
      const office = gameState.facilities.find(f => f.id === 'office');
      if (office && gameState.employees.length >= office.value) {
          alert(`Văn phòng đã đầy (Max ${office.value})! Hãy nâng cấp văn phòng trước.`);
          return;
      }
      if (gameState.cash < candidate.hireCost) {
          alert(`Không đủ tiền để trả phí lót tay ($${candidate.hireCost})!`);
          return;
      }

      const possibleTraits = ["Siêng năng", "Lười biếng", "Trung thành", "Dễ tự ái", "Tham vọng", "Hòa đồng", "Lập dị"];
      const randomTraits = [possibleTraits[Math.floor(Math.random() * possibleTraits.length)]];
      if (Math.random() > 0.5) randomTraits.push(possibleTraits[Math.floor(Math.random() * possibleTraits.length)]);

      const newEmp: Employee = {
          id: candidate.id,
          name: candidate.name,
          role: candidate.role,
          level: candidate.level,
          skill: candidate.skill,
          specificSkills: candidate.specificSkills,
          salary: candidate.salary,
          morale: 80 + Math.floor(Math.random() * 20), 
          quirk: candidate.quirk,
          education: candidate.education,
          backgroundStory: candidate.bio,
          stress: 0,
          loyalty: 50 + Math.floor(Math.random() * 50),
          traits: randomTraits,
          assignedProductId: null // Initially unassigned
      };

      setGameState(prev => ({
          ...prev,
          cash: prev.cash - candidate.hireCost,
          employees: [...prev.employees, newEmp],
          candidates: prev.candidates.filter(c => c.id !== candidate.id)
      }));
  };

  const handleFire = (id: string) => {
      setGameState(prev => ({
          ...prev,
          employees: prev.employees.filter(e => e.id !== id),
          morale: Math.max(0, prev.morale - 10) 
      }));
  };

  // --- PRODUCT MANAGEMENT HANDLERS ---

  const handleAssignEmployee = (empId: string, productId: string | null) => {
      setGameState(prev => ({
          ...prev,
          employees: prev.employees.map(e => 
              e.id === empId ? { ...e, assignedProductId: productId } : e
          )
      }));
  };

  const handleCreateProduct = (name: string, desc: string) => {
      const newProduct: Product = {
          id: `prod-${Date.now()}`,
          name,
          description: desc,
          stage: ProductStage.CONCEPT,
          developmentProgress: 0,
          quality: 50,
          marketFit: 50,
          bugs: 0,
          users: 0,
          revenue: 0,
          activeFeedback: []
      };
      setGameState(prev => ({
          ...prev,
          products: [...prev.products, newProduct]
      }));
  };

  // --- CHAT & PITCH ---

  const handleChatWithEmployee = async (empId: string, message: string): Promise<string> => {
      const emp = gameState.employees.find(e => e.id === empId);
      if (!emp) return "Nhân viên không tồn tại.";
      const response = await chatWithEmployee(emp, gameState, message);
      if (emp.stress < 70) {
          setGameState(prev => ({
              ...prev,
              employees: prev.employees.map(e => e.id === empId ? { ...e, morale: Math.min(100, e.morale + 2) } : e)
          }));
      }
      return response;
  };

  const handlePitchInvestors = async (roundName: string): Promise<{success: boolean, message: string}> => {
      setLoading(true);
      try {
          const result = await evaluatePitch(gameState, roundName);
          
          if (result.accepted) {
              setGameState(prev => ({
                  ...prev,
                  cash: prev.cash + result.investmentAmount,
                  equity: Math.max(0, prev.equity - result.equityDemanded),
                  history: [...prev.history, {
                      narrative: `GỌI VỐN THÀNH CÔNG! ${result.investorFeedback}`,
                      cashChange: result.investmentAmount,
                      equityChange: -result.equityDemanded,
                      userChange: 0,
                      moraleChange: 10,
                      productUpdates: [],
                      competitorUpdate: "",
                      advice: "Sử dụng vốn khôn ngoan.",
                      randomEvent: null
                  }]
              }));
              return { success: true, message: `Deal! $${result.investmentAmount.toLocaleString()} for ${result.equityDemanded}% equity. Valuation: $${result.valuation.toLocaleString()}` };
          } else {
              setGameState(prev => ({
                  ...prev,
                  morale: Math.max(0, prev.morale - 5), // Rejected hurts morale
                  history: [...prev.history, {
                      narrative: `GỌI VỐN THẤT BẠI. ${result.investorFeedback}`,
                      cashChange: 0,
                      equityChange: 0,
                      userChange: 0,
                      moraleChange: -5,
                      productUpdates: [],
                      competitorUpdate: "",
                      advice: "Cải thiện chỉ số và thử lại.",
                      randomEvent: null
                  }]
              }));
              return { success: false, message: `Rejected: ${result.investorFeedback}` };
          }
      } finally {
          setLoading(false);
      }
  };

  // --- TURN PROCESSING ---

  const handleUpgradeFacility = (facilityId: string) => {
      const facility = gameState.facilities.find(f => f.id === facilityId);
      if (!facility) return;
      if (facility.level >= facility.maxLevel) return;
      if (gameState.cash < facility.costToUpgrade) return;

      setGameState(prev => ({
          ...prev,
          cash: prev.cash - facility.costToUpgrade,
          facilities: prev.facilities.map(f => {
              if (f.id === facilityId) {
                  return {
                      ...f,
                      level: f.level + 1,
                      costToUpgrade: f.costToUpgrade * 2,
                      value: f.value * 3,
                      description: `Level ${f.level + 1} Facility`
                  };
              }
              return f;
          })
      }));
  };
  
  const handleEventDecision = (decision: string) => {
      setLastEventChoice(decision);
  };

  const handleTurnSubmit = async (decisions: PlayerDecisions) => {
    setLoading(true);
    try {
      const fullDecisions: PlayerDecisions = { ...decisions, eventChoice: lastEventChoice };

      const salaryBurn = gameState.employees.reduce((acc, emp) => acc + emp.salary, 0);
      const facilityBurn = gameState.facilities.reduce((acc, fac) => acc + fac.maintenanceCost, 0);
      const totalBurnRate = salaryBurn + facilityBurn;

      const result = await processTurn(gameState, fullDecisions, totalBurnRate);
      result.decisions = fullDecisions;
      setLastEventChoice(null);

      setGameState(prev => {
        // 1. Update Global Stats
        const newCash = prev.cash + result.cashChange;
        const totalUserChange = result.productUpdates.reduce((acc, p) => acc + p.userChange, 0);
        const newUsers = Math.max(0, prev.users + totalUserChange);
        let newMorale = Math.min(100, Math.max(0, prev.morale + result.moraleChange));
        
        // 2. Update Products
        const updatedProducts = prev.products.map(prod => {
            const update = result.productUpdates.find(u => u.productId === prod.id);
            if (!update) return prod;

            let newProgress = prod.developmentProgress + update.devProgressChange;
            let newStage = prod.stage;
            
            // State Transitions
            if (newProgress >= 100) {
                if (prod.stage === ProductStage.CONCEPT) { newStage = ProductStage.MVP; newProgress = 0; }
                else if (prod.stage === ProductStage.MVP) { newStage = ProductStage.ALPHA; newProgress = 0; }
                else if (prod.stage === ProductStage.ALPHA) { newStage = ProductStage.RELEASE; newProgress = 0; }
                else if (prod.stage === ProductStage.RELEASE) { newStage = ProductStage.GROWTH; newProgress = 50; }
                else { newProgress = 100; } // Cap at max
            }

            const newFeedback = update.newFeedback ? [update.newFeedback, ...prod.activeFeedback].slice(0, 5) : prod.activeFeedback;

            return {
                ...prod,
                stage: newStage,
                developmentProgress: newProgress,
                quality: Math.min(100, Math.max(0, prod.quality + update.qualityChange)),
                bugs: Math.max(0, prod.bugs + update.bugChange),
                users: Math.max(0, prod.users + update.userChange),
                revenue: Math.max(0, prod.revenue + update.revenueChange),
                activeFeedback: newFeedback
            };
        });

        // 3. Update Employees (Stress)
        const updatedEmployees = prev.employees.map(e => {
            let s = e.stress + (newCash < 0 ? 5 : 0);
            if (e.assignedProductId) s += 2; // Working causes stress
            s -= (prev.playerSkills.management * 0.5); 
            s = Math.max(0, Math.min(100, s));
            return { ...e, stress: s, morale: s > 80 ? Math.max(0, e.morale - 5) : e.morale };
        });

        // Check Game Over
        let newStage = prev.stage;
        let gameOverReason = undefined;
        if (newCash < -10000) { 
            newStage = GameStage.GAME_OVER;
            gameOverReason = "Phá sản (Nợ > $10k).";
        }

        return {
          ...prev,
          cash: newCash,
          users: newUsers,
          morale: newMorale,
          products: updatedProducts,
          employees: updatedEmployees,
          turn: prev.turn + 1,
          history: [...prev.history, result],
          stage: newStage,
          gameOverReason
        };
      });

      setCurrentIntel([]);

    } catch (e) {
      console.error(e);
      setError("Lỗi xử lý lượt chơi.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    // Reload page to clear clean state or reset manually
    window.location.reload(); 
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-800 bg-grid-pattern">
        <div className="bg-white border border-red-200 p-8 rounded-xl max-w-md text-center shadow-xl">
            <h2 className="text-xl font-bold text-red-600 mb-2">System Failure</h2>
            <p className="text-slate-600">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm text-slate-700">Reload</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900 bg-grid-pattern overflow-x-hidden">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[50%] h-[50%] bg-blue-200/40 rounded-full blur-[100px]"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-purple-200/40 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full px-4 md:px-6 lg:px-8 py-6 min-h-screen flex flex-col">
        {gameState.stage === GameStage.SETUP && (
            <div className="flex-1 flex items-center justify-center">
                <SetupGame onStart={handleStartGame} isLoading={loading} />
            </div>
        )}

        {(gameState.stage === GameStage.PLAYING || gameState.stage === GameStage.GAME_OVER || gameState.stage === GameStage.VICTORY) && (
            <GameDashboard 
                state={gameState}
                currentIntel={currentIntel}
                onTurnSubmit={handleTurnSubmit}
                onBuyIntel={handleBuyIntel}
                onRecruit={handleRecruit}
                onHireCandidate={handleHireCandidate}
                onFire={handleFire}
                onUpgradeFacility={handleUpgradeFacility}
                isProcessing={loading} 
                onRestart={handleRestart}
                onEventDecision={handleEventDecision}
                onChatWithEmployee={handleChatWithEmployee}
                onAssignEmployee={handleAssignEmployee}
                onCreateProduct={handleCreateProduct}
                onPitch={handlePitchInvestors}
            />
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-center flex-col transition-all">
            <div className="relative">
                <div className="absolute inset-0 bg-blue-200 blur-xl opacity-50 animate-pulse"></div>
                <Loader2 size={64} className="text-blue-600 animate-spin mb-4 relative z-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 animate-pulse font-heading tracking-widest">
                {gameState.stage === GameStage.SETUP ? "ANALYZING MARKET..." : "PROCESSING TURN..."}
            </h3>
            <p className="text-slate-500 mt-2 text-sm font-mono uppercase tracking-widest">AI Simulation Running</p>
        </div>
      )}
    </div>
  );
};