import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GameState, Industry, PlayerDecisions, SimulationResult, IntelType, Employee, Candidate, Product, ProductStage } from "../types";

const apiKey = process.env.API_KEY || '';

const getAI = () => new GoogleGenAI({ apiKey });

const cleanJSON = (text: string) => {
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json/, '').replace(/```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```/, '').replace(/```$/, '');
  }
  return clean;
};

// --- Initialization ---

interface InitGameResponse {
  marketContext: string;
  competitorName: string;
  initialFeedback: string;
  initialProductAnalysis: string;
}

export const initializeGameStory = async (industry: Industry, companyName: string, productName: string, productDesc: string): Promise<InitGameResponse> => {
  const ai = getAI();
  
  const prompt = `
    Bạn là một engine mô phỏng kinh doanh Startup.
    
    Startup: "${companyName}" (${industry}).
    Sản phẩm đầu tiên: "${productName}".
    Mô tả: "${productDesc}".
    
    Hãy tạo ra bối cảnh thị trường năm 2024-2025.
    
    Output format (JSON):
    {
      "marketContext": "Mô tả xu hướng thị trường (tối đa 2 câu)",
      "competitorName": "Tên đối thủ",
      "initialFeedback": "Lời khuyên cho CEO",
      "initialProductAnalysis": "Nhận xét ngắn về tiềm năng sản phẩm (Market Fit)"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            marketContext: { type: Type.STRING },
            competitorName: { type: Type.STRING },
            initialFeedback: { type: Type.STRING },
            initialProductAnalysis: { type: Type.STRING }
          },
          required: ['marketContext', 'competitorName', 'initialFeedback', 'initialProductAnalysis']
        }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(cleanJSON(text)) as InitGameResponse;
  } catch (error) {
    console.error("Error initializing game:", error);
    return {
      marketContext: "Thị trường đầy biến động.",
      competitorName: "Global Corp",
      initialFeedback: "Hãy cẩn trọng.",
      initialProductAnalysis: "Sản phẩm thú vị."
    };
  }
};

// --- HR ---
export const generateCandidates = async (industry: Industry, turn: number, jobDescription: string): Promise<Candidate[]> => {
    const ai = getAI();
    
    const prompt = `
      Bạn là một nhà tuyển dụng hài hước và sắc sảo cho ngành ${industry}.
      CEO của startup vừa đăng tin tuyển dụng với nội dung: "${jobDescription || 'Cần tìm nhân tài giúp công ty phát triển'}"
      
      Hãy tạo ra 3 hồ sơ ứng viên (CV) chi tiết.
      Nếu JD có nhắc 'Tester' hoặc 'QC', hãy tạo Tester.
      
      Output format (JSON Array).
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    role: { type: Type.STRING, enum: ['Developer', 'Designer', 'Marketer', 'Sales', 'Manager', 'Secretary', 'Tester'] },
                    level: { type: Type.STRING, enum: ['Junior', 'Senior', 'Lead', 'Expert'] },
                    skill: { type: Type.INTEGER },
                    specificSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                    salary: { type: Type.INTEGER },
                    hireCost: { type: Type.INTEGER },
                    bio: { type: Type.STRING },
                    matchAnalysis: { type: Type.STRING },
                    quirk: { type: Type.STRING },
                    education: { type: Type.STRING },
                    experienceYears: { type: Type.INTEGER },
                    interviewNotes: { type: Type.STRING }
                },
                required: ['name', 'role', 'level', 'skill', 'specificSkills', 'salary', 'hireCost', 'bio', 'matchAnalysis', 'quirk', 'education', 'experienceYears', 'interviewNotes']
            }
          }
        }
      });
  
      const text = response.text || "[]";
      let candidates = JSON.parse(cleanJSON(text));
      
      if (!Array.isArray(candidates)) candidates = [];
      
      return candidates.map((c: any, index: number) => ({
          ...c,
          id: `cand-${Date.now()}-${index}`,
          education: c.education || "Self-taught",
          experienceYears: c.experienceYears !== undefined ? c.experienceYears : 1,
          interviewNotes: c.interviewNotes || "Candidate seemed eager."
      }));

    } catch (error) {
      console.error("Error generating candidates:", error);
      return [];
    }
};

// --- Pitching Logic ---

export interface PitchResult {
    accepted: boolean;
    valuation: number;
    equityDemanded: number; // %
    investmentAmount: number;
    investorFeedback: string;
}

export const evaluatePitch = async (gameState: GameState, fundingRound: string): Promise<PitchResult> => {
    const ai = getAI();
    
    // Create a summarized portfolio for the AI
    const portfolio = gameState.products.map(p => 
        `- ${p.name} (${p.stage}): Qual ${p.quality}/100, Users ${p.users}, Rev $${p.revenue}/mo. ${p.activeFeedback[0] || ''}`
    ).join('\n');

    const prompt = `
        Bạn là một nhà đầu tư mạo hiểm (VC) khó tính nhưng công bằng (Kiểu Shark Tank).
        Startup "${gameState.companyName}" đang muốn gọi vốn vòng "${fundingRound}".
        
        TÌNH HÌNH CÔNG TY:
        - Tiền mặt còn: $${gameState.cash}
        - Tổng User: ${gameState.users}
        - Đội ngũ: ${gameState.employees.length} người.
        
        DANH MỤC SẢN PHẨM:
        ${portfolio || "Chưa có sản phẩm nào ra hồn."}
        
        Hãy đánh giá và quyết định có đầu tư không.
        
        LUẬT:
        - Nếu sản phẩm chỉ ở Concept/MVP mà đòi gọi vốn lớn (Series A/B), hãy từ chối.
        - Nếu user ít, doanh thu = 0, định giá thấp.
        - Nếu sản phẩm tốt (Quality > 80), user tăng trưởng, hãy deal sòng phẳng.
        
        Output JSON:
        {
            "accepted": boolean,
            "valuation": number (Định giá công ty pre-money),
            "equityDemanded": number (Số % bạn muốn lấy, 5-40%),
            "investmentAmount": number (Số tiền bạn rót vào),
            "investorFeedback": "Lời nhận xét chi tiết (khen/chê sản phẩm, team)"
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        accepted: { type: Type.BOOLEAN },
                        valuation: { type: Type.INTEGER },
                        equityDemanded: { type: Type.NUMBER },
                        investmentAmount: { type: Type.INTEGER },
                        investorFeedback: { type: Type.STRING }
                    },
                    required: ["accepted", "valuation", "equityDemanded", "investmentAmount", "investorFeedback"]
                }
            }
        });
        return JSON.parse(cleanJSON(response.text || "{}")) as PitchResult;
    } catch (e) {
        return { accepted: false, valuation: 0, equityDemanded: 0, investmentAmount: 0, investorFeedback: "Lỗi liên lạc với nhà đầu tư." };
    }
};

// --- Turn Processing ---

export const processTurn = async (
  gameState: GameState,
  decisions: PlayerDecisions,
  burnRate: number
): Promise<SimulationResult> => {
  const ai = getAI();

  const hasSecretary = gameState.employees.some(e => e.role === 'Secretary');

  // Prepare Product Context for AI
  const productsContext = gameState.products.map(p => {
      // Find employees assigned to this product
      const team = gameState.employees.filter(e => e.assignedProductId === p.id);
      const devPower = team.filter(e => e.role === 'Developer').reduce((sum, e) => sum + e.skill, 0);
      const designPower = team.filter(e => e.role === 'Designer').reduce((sum, e) => sum + e.skill, 0);
      const marketingPower = team.filter(e => e.role === 'Marketer').reduce((sum, e) => sum + e.skill, 0);
      const testPower = team.filter(e => e.role === 'Tester').reduce((sum, e) => sum + e.skill, 0);
      
      return {
          id: p.id,
          name: p.name,
          stage: p.stage,
          currentStats: { quality: p.quality, bugs: p.bugs, users: p.users },
          teamPower: { dev: devPower, design: designPower, marketing: marketingPower, test: testPower }
      };
  });

  const prompt = `
    Bạn là engine mô phỏng game "Startup Tycoon AI".
    Tuần ${gameState.turn}. Giai đoạn công ty: ${gameState.stage}.
    
    CÁC SẢN PHẨM ĐANG PHÁT TRIỂN:
    ${JSON.stringify(productsContext, null, 2)}
    
    Quyết định Marketing chung: ${decisions.marketingFocus}
    Quyết định R&D chung: ${decisions.rdFocus}
    
    YÊU CẦU MÔ PHỎNG (Logic Product):
    1. Với mỗi sản phẩm, dựa trên "teamPower" (Tổng skill của nhân viên gán vào):
       - Dev cao -> Tăng Dev Progress nhanh.
       - Design cao -> Tăng Quality/MarketFit.
       - Tester cao -> Giảm Bugs.
       - Marketing cao (khi đã Release) -> Tăng Users/Revenue.
       - Nếu không có ai làm (teamPower = 0) -> Progress dậm chân, Users có thể giảm (churn).
    
    2. Logic Giai đoạn (Stage):
       - Nếu Dev Progress >= 100% ở Concept -> Chuyển sang MVP.
       - Nếu Dev Progress >= 100% ở MVP -> Chuyển sang Alpha (cần test).
       - Nếu Dev Progress >= 100% ở Alpha -> Chuyển sang Release (Bắt đầu có User/Revenue).
    
    3. Tạo Feedback:
       - Nếu Quality thấp hoặc Bug nhiều -> Feedback chê bai.
       - Nếu Quality cao -> Khen ngợi.
    
    Output format (JSON):
    {
      "narrative": "Tổng quan tuần này.",
      "cashChange": Số nguyên (Doanh thu - BurnRate - Marketing),
      "userChange": Số nguyên (Tổng user thay đổi),
      "moraleChange": Số nguyên,
      "productUpdates": [
        {
            "productId": "id",
            "devProgressChange": number (0-20),
            "qualityChange": number (-5 đến 5),
            "bugChange": number (Dev sinh bug (+), Tester diệt bug (-)),
            "userChange": number,
            "revenueChange": number,
            "newFeedback": "Một câu review ngắn từ khách hàng (nếu có)"
        }
      ],
      "secretaryReport": "Tin đồn/Báo cáo (nếu có thư ký)",
      "randomEvent": { ... } (hoặc null),
      "skillXpEarned": { ... }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                narrative: { type: Type.STRING },
                cashChange: { type: Type.INTEGER },
                userChange: { type: Type.INTEGER },
                moraleChange: { type: Type.INTEGER },
                productUpdates: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            productId: { type: Type.STRING },
                            devProgressChange: { type: Type.INTEGER },
                            qualityChange: { type: Type.INTEGER },
                            bugChange: { type: Type.INTEGER },
                            userChange: { type: Type.INTEGER },
                            revenueChange: { type: Type.INTEGER },
                            newFeedback: { type: Type.STRING, nullable: true }
                        },
                        required: ["productId", "devProgressChange", "qualityChange", "bugChange", "userChange", "revenueChange"]
                    }
                },
                secretaryReport: { type: Type.STRING, nullable: true },
                randomEvent: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['crisis', 'opportunity', 'dilemma'] },
                        options: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    label: { type: Type.STRING },
                                    risk: { type: Type.STRING }
                                },
                                required: ['label', 'risk']
                            }
                        }
                    },
                    required: ["title", "description", "type", "options"],
                    nullable: true
                },
                skillXpEarned: {
                    type: Type.OBJECT,
                    properties: {
                        management: { type: Type.INTEGER },
                        tech: { type: Type.INTEGER },
                        charisma: { type: Type.INTEGER }
                    },
                    nullable: true
                }
            },
            required: ["narrative", "cashChange", "userChange", "moraleChange", "productUpdates"]
        }
      }
    });

    const text = response.text || "{}";
    const result = JSON.parse(cleanJSON(text)) as SimulationResult;
    return result;

  } catch (error) {
    console.error("Error processing turn:", error);
    return {
      narrative: "Lỗi mô phỏng.",
      cashChange: -burnRate,
      userChange: 0,
      moraleChange: -2,
      productUpdates: [],
      equityChange: 0,
      competitorUpdate: "",
      advice: "Kiểm tra lại hệ thống.",
      randomEvent: null
    };
  }
};

export const chatWithEmployee = async (employee: Employee, gameState: GameState, message: string): Promise<string> => {
    // Keep existing chat logic but updated with simple return
    const ai = getAI();
    const prompt = `Roleplay employee ${employee.name} (${employee.role}). Boss asks: "${message}". Reply short.`;
    try {
        const r = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return r.text || "...";
    } catch { return "Em đang bận fix bug ạ."; }
};

export const getAdvisorInsight = async (gameState: GameState, type: IntelType): Promise<string> => {
    // Keep existing logic
    const ai = getAI();
    const prompt = `Advisor insight for ${type} in industry ${gameState.industry}. Short.`;
    try {
        const r = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return r.text || "No data.";
    } catch { return "N/A"; }
};