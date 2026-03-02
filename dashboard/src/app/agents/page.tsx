"use client";

import { useState, useEffect } from "react";
import { 
  Bot, 
  ShieldAlert, 
  MessageSquare, 
  FileCheck, 
  Network, 
  TrendingUp,
  Loader2,
  ChevronRight,
  Send,
  AlertTriangle,
  CheckCircle2,
  BarChart,
  ShieldCheck,
  TrendingDown,
  Activity
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getBatchesByCompany, getOrdersByCompany, getRiskEventsByCompany, getBatchEntriesByCompany } from "@/lib/firestore";

type AgentTab = 'risk' | 'chat' | 'compliance' | 'trust' | 'forecast';

export default function AgentsHubPage() {
  const { appUser } = useAuth();
  const companyId = appUser?.companyId || "";
  
  const [activeTab, setActiveTab] = useState<AgentTab>('chat');
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  // Chat specific state
  const [chatQuery, setChatQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user'|'agent', text: string, data?: any}>>([
    { role: 'agent', text: 'Hello! I am ChainChat. Ask me anything about your supply chain batches, risk alerts, or stage delays.' }
  ]);

  // Auto-scan RiskGuard every 1 minute
  useEffect(() => {
    if (!companyId) return;
    
    // Initial auto-scan for risk
    if (!results.risk) {
      runAgent('risk');
    }

    const interval = setInterval(() => {
      runAgent('risk');
    }, 60000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const runAgent = async (agentId: AgentTab) => {
    if (!companyId) return;
    
    setLoading(prev => ({ ...prev, [agentId]: true }));
    setError(null);
    
    try {
      const endpoint = ({
        risk: '/api/agents/risk-guard',
        compliance: '/api/agents/compliance',
        trust: '/api/agents/trust-score',
        forecast: '/api/agents/forecast'
      } as Record<string, string>)[agentId];
      
      if (!endpoint) return;

      // Fetch data securely on the client-side
      const [batches, orders, riskEvents, batchEntries] = await Promise.all([
        getBatchesByCompany(companyId),
        getOrdersByCompany(companyId),
        getRiskEventsByCompany(companyId),
        getBatchEntriesByCompany(companyId)
      ]);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, batches, orders, riskEvents, batchEntries }),
      });
      
      if (!res.ok) throw new Error(`Agent failed with status: ${res.status}`);
      const data = await res.json();
      setResults(prev => ({ ...prev, [agentId]: data }));
      
    } catch (err: any) {
      setError(err.message || 'Failed to run agent');
    } finally {
      setLoading(prev => ({ ...prev, [agentId]: false }));
    }
  };

  const submitChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim() || !companyId) return;
    
    const query = chatQuery;
    setChatQuery("");
    setChatHistory(prev => [...prev, { role: 'user', text: query }]);
    setLoading(prev => ({ ...prev, chat: true }));
    
    try {
      const [batches, orders, riskEvents, batchEntries] = await Promise.all([
        getBatchesByCompany(companyId),
        getOrdersByCompany(companyId),
        getRiskEventsByCompany(companyId),
        getBatchEntriesByCompany(companyId)
      ]);

      const res = await fetch('/api/agents/chain-chat', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, question: query, batches, orders, riskEvents, batchEntries }),
      });
      
      const data = await res.json();
      setChatHistory(prev => [...prev, { 
        role: 'agent', 
        text: data.answer,
        data: {
          chartData: data.data,
          chartType: data.chartType,
          suggestions: data.suggestions
        }
      }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'agent', text: "Sorry, I encountered an error processing your request." }]);
    } finally {
      setLoading(prev => ({ ...prev, chat: false }));
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setChatQuery(suggestion);
    // Use a timeout to ensure state update before submit
    setTimeout(() => {
        const form = document.getElementById('chat-form') as HTMLFormElement;
        if(form) form.requestSubmit();
    }, 50);
  };

  const tabs: { id: AgentTab; name: string; icon: any; describe: string; iconColor: string }[] = [
    { id: 'chat', name: 'ChainChat AI', icon: MessageSquare, describe: 'Natural language query engine', iconColor: 'text-blue-500' },
    { id: 'risk', name: 'RiskGuard AI', icon: ShieldAlert, describe: 'Predictive anomaly detection', iconColor: 'text-rose-500' },
    { id: 'compliance', name: 'ComplianceBot', icon: FileCheck, describe: 'Automated regulatory reporting', iconColor: 'text-emerald-500' },
    { id: 'trust', name: 'TrustScore AI', icon: Network, describe: 'Stage & supplier reputation', iconColor: 'text-indigo-500' },
    { id: 'forecast', name: 'ForecastIQ', icon: TrendingUp, describe: 'Demand & bottleneck prediction', iconColor: 'text-amber-500' },
  ];

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="p-8 pb-20 animate-fade-in w-full max-w-7xl mx-auto h-[calc(100vh-theme(spacing.16))] flex flex-col">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-slate-900 flex items-center gap-3">
          AI <span className="neon-text">Agents Hub</span>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full border border-indigo-200 ml-2">Beta</span>
        </h1>
        <p className="text-slate-500">
          A suite of 5 custom-built AI agents acting as your autonomous supply chain brain.
        </p>
      </header>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Sidebar Nav */}
        <div className="w-64 shrink-0 flex flex-col gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== 'chat' && !results[tab.id] && !loading[tab.id]) {
                    runAgent(tab.id);
                  }
                }}
                className={`text-left p-4 rounded-2xl border transition-all ${
                  isActive 
                    ? 'bg-white shadow-md border-indigo-200 ring-1 ring-indigo-500/20' 
                    : 'bg-transparent border-transparent hover:bg-slate-100 hover:border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className={`p-2 rounded-xl bg-slate-50 shadow-sm border border-slate-100 ${isActive ? tab.iconColor : 'text-slate-500'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`font-bold ${isActive ? 'text-slate-900' : ''}`}>{tab.name}</span>
                </div>
                <p className="text-xs text-slate-500 pl-11">{tab.describe}</p>
              </button>
            )
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 glass-card overflow-hidden flex flex-col relative">
          
          {/* Top Decorative gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"></div>

          {/* 1. ChainChat UI */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full bg-slate-50/50">
              <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">ChainChat</h3>
                  <p className="text-xs text-slate-500">Always online · Natural Language Interface</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md rounded-tr-sm' 
                        : 'bg-white border border-slate-200 shadow-sm rounded-tl-sm text-slate-700'
                    }`}>
                      {msg.role === 'agent' && (
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-bold text-slate-400">AI AGENT</span>
                        </div>
                      )}
                      
                      {/* Using standard markdown parsing for production, here we use simple line break mapping */}
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.text.split('\n').map((line, idx) => (
                          <span key={idx}>
                            {line.includes('**') ? (
                              // Very basic bold parsing for aesthetic
                              <span dangerouslySetInnerHTML={{__html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}} />
                            ) : line}
                            <br/>
                          </span>
                        ))}
                      </div>

                      {/* Render data if available */}
                      {msg.data?.chartData && msg.data.chartType && (
                        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          {msg.data.chartType === 'list' && Array.isArray(msg.data.chartData) && (
                            <div className="space-y-2">
                              {msg.data.chartData.map((b:any, j:number) => (
                                <div key={j} className="flex justify-between items-center text-xs p-2 bg-white rounded-lg border border-slate-200">
                                  <span className="font-bold">{b.batch || b.stage || b.type}</span>
                                  <span className="text-slate-500">{b.stage || !!b.onChain?.toString()}</span>
                                  {b.status && <span className="bg-slate-100 px-2 py-0.5 rounded-full">{b.status}</span>}
                                  {b.confidence && <span className="text-rose-500">{b.confidence}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                          {msg.data.chartType === 'bar' && Array.isArray(msg.data.chartData) && (
                            <div className="flex h-24 items-end gap-2 pt-4">
                              {msg.data.chartData.map((d:any, j:number) => {
                                const max = Math.max(...msg.data.chartData.map((x:any) => Number(x.count || x.avgDays || x.total || x[Object.keys(x)[1]] || 1)));
                                const val = Number(d.count || d.avgDays || d.total || d[Object.keys(d)[1]]);
                                const pct = (val / max) * 100;
                                return (
                                  <div key={j} className="flex-1 flex flex-col items-center gap-1 group">
                                    <div className="w-full bg-blue-100 rounded-t-sm relative group-hover:bg-blue-200 transition-colors" style={{ height: `${pct}%` }}>
                                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">{val}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 truncate w-full text-center">{d.stage || d.name || Object.keys(d)[0]}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                          {/* Fallback primitive rendering for objects */}
                          {(!Array.isArray(msg.data.chartData) || msg.data.chartType === 'number') && (
                            <div className="flex gap-4 p-2">
                              {Object.entries(msg.data.chartData).map(([k,v], j) => (
                                <div key={j} className="flex flex-col">
                                  <span className="text-xl font-black text-blue-600">{String(v)}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">{k}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Suggestions */}
                      {msg.data?.suggestions && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
                          {msg.data.suggestions.map((s:string, j:number) => (
                            <button 
                              key={j} 
                              onClick={() => handleSuggestion(s)}
                              className="text-[11px] font-medium px-2.5 py-1.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-colors"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading['chat'] && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 rounded-tl-sm flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      <span className="text-sm font-medium text-slate-500 animate-pulse">Agent is thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white border-t border-slate-200">
                <form id="chat-form" onSubmit={submitChat} className="flex gap-3">
                  <input 
                    type="text"
                    value={chatQuery}
                    onChange={e => setChatQuery(e.target.value)}
                    placeholder="Ask about your batches, risks, or pipeline..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
                    disabled={loading['chat']}
                  />
                  <button 
                    type="submit"
                    disabled={loading['chat'] || !chatQuery.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 flex items-center justify-center transition-colors disabled:opacity-50 shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Detailed Agent Views (Risk, Compliance, Trust, Forecast) */}
          {activeTab !== 'chat' && (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white/50">
                <div className="flex items-center gap-3">
                  {(() => {
                    const tab = tabs.find(t => t.id === activeTab);
                    if (!tab) return null;
                    const Icon = tab.icon;
                    return <Icon className={`w-6 h-6 ${tab.iconColor}`} />;
                  })()}
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{tabs.find(t => t.id === activeTab)?.name}</h2>
                    <p className="text-sm text-slate-500">{tabs.find(t => t.id === activeTab)?.describe}</p>
                  </div>
                </div>
                <button 
                  onClick={() => runAgent(activeTab)}
                  disabled={loading[activeTab]}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {loading[activeTab] ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : "Run Full Analysis"}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl mb-4">
                    {error}
                  </div>
                )}

                {loading[activeTab] && !results[activeTab] ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <p>Agent is gathering and analyzing data...</p>
                  </div>
                ) : !results[activeTab] ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                    {(() => {
                      const Icon = tabs.find(t => t.id === activeTab)?.icon;
                      return Icon ? <Icon className="w-12 h-12 opacity-20 mb-2" /> : null;
                    })()}
                    <p>Click "Run Full Analysis" to unleash the agent.</p>
                  </div>
                ) : (
                  <div className="animate-slide-up space-y-6">
                    {/* RISK GUARD AI RENDER */}
                    {activeTab === 'risk' && results.risk && (
                      <>
                        <div className="grid grid-cols-4 gap-4">
                          {[
                            { label: 'Total Analyzed', val: results.risk.summary.totalAnalyzed, color: 'text-slate-900' },
                            { label: 'Critical Risks', val: results.risk.summary.critical, color: 'text-red-600' },
                            { label: 'High Risks', val: results.risk.summary.high, color: 'text-orange-500' },
                            { label: 'Average Score', val: `${results.risk.summary.avgRiskScore}/100`, color: 'text-indigo-600' }
                          ].map((s,i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                              <div className={`text-2xl font-black ${s.color} mb-1`}>{s.val}</div>
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.label}</div>
                            </div>
                          ))}
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-900 mt-6 mb-4">Prioritized Batch Risks</h3>
                        <div className="space-y-4">
                          {results.risk.results.slice(0, 5).map((r:any) => (
                            <div key={r.batchId} className={`p-4 rounded-xl border ${getRiskColor(r.riskLevel)} bg-white shadow-sm relative overflow-hidden`}>
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${r.riskLevel === 'critical' ? 'bg-red-500' : r.riskLevel === 'high' ? 'bg-orange-500' : r.riskLevel === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-lg">{r.batchNumber}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase ${r.riskLevel==='critical'? 'bg-red-100 text-red-700':'bg-slate-100 text-slate-600'}`}>{r.riskLevel}</span>
                                  </div>
                                  <div className="text-sm text-slate-500">Current Stage: <strong>{r.currentStage}</strong></div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-black">{r.riskScore}<span className="text-sm text-slate-400">/100</span></div>
                                  <div className="text-xs uppercase font-bold text-slate-400">Risk Score</div>
                                </div>
                              </div>
                              
                              <div className="bg-slate-50 rounded-lg p-3 my-3">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Key Risk Factors</h4>
                                <ul className="space-y-1">
                                  {r.factors.slice(0, 3).map((f:any, i:number) => (
                                    <li key={i} className="text-sm flex gap-2">
                                      <span className="font-semibold">{f.factor}:</span> 
                                      <span className="text-slate-600">{f.detail}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <p className="text-sm"><strong>Agent Recommendation:</strong> {r.recommendation}</p>
                            </div>
                          ))}
                          {results.risk.results.length === 0 && (
                            <div className="p-8 text-center bg-white border border-slate-200 rounded-xl">
                              <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                              <h3 className="text-lg font-bold">No active batches to analyze.</h3>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* COMPLIANCE BOT AI RENDER */}
                    {activeTab === 'compliance' && results.compliance && (
                      <>
                        <div className="bg-gradient-to-br from-slate-900 to-indigo-900 text-white p-6 rounded-2xl shadow-lg mb-6 relative overflow-hidden">
                          <div className="flex justify-between items-center relative z-10">
                            <div>
                              <h2 className="text-2xl font-bold mb-1">Regulatory Compliance Report</h2>
                              <p className="text-indigo-200 text-sm">Generated: {new Date(results.compliance.generatedAt).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <div className={`text-4xl font-black ${results.compliance.overallScore >= 80 ? 'text-emerald-400' : results.compliance.overallScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                {results.compliance.overallScore}%
                              </div>
                              <div className="uppercase tracking-widest text-xs font-bold text-indigo-200 mt-1">Overall Core</div>
                            </div>
                          </div>
                          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          {results.compliance.checks.map((chk:any, i:number) => (
                            <div key={i} className={`p-4 bg-white rounded-xl border-l-4 shadow-sm ${chk.status === 'pass' ? 'border-emerald-500' : chk.status === 'warning' ? 'border-amber-500' : 'border-red-500'}`}>
                              <div className="flex items-start gap-3">
                                {chk.status === 'pass' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className={`w-5 h-5 ${chk.status === 'warning' ? 'text-amber-500' : 'text-red-500'}`} />}
                                <div>
                                  <h4 className="font-bold text-slate-900 text-sm">{chk.category}</h4>
                                  <p className="font-medium text-slate-700 text-sm mt-1">{chk.description}</p>
                                  <p className="text-slate-500 text-xs mt-1">{chk.details}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {results.compliance.recommendations.length > 0 && (
                          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Bot className="w-4 h-4 text-indigo-500"/> Actionable Recommendations</h3>
                            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
                              {results.compliance.recommendations.map((rec:string, i:number) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}

                    {/* TRUST SCORE AI RENDER */}
                    {activeTab === 'trust' && results.trust && (
                      <>
                        <div className="flex gap-4 mb-6">
                          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex-1 flex items-center gap-5">
                            <div className="w-16 h-16 rounded-full bg-indigo-50 border-4 border-indigo-100 flex items-center justify-center text-2xl font-black text-indigo-600">
                              {results.trust.overallGrade}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-slate-900 mb-1">Overall Pipeline Trust</h3>
                              <p className="text-sm text-slate-500">Based on {results.trust.totalStagesAnalyzed} stages analyzed</p>
                            </div>
                          </div>
                          
                          {results.trust.weakestLink && (
                            <div className="bg-red-50 border border-red-100 p-5 rounded-2xl shadow-sm flex-1">
                              <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Weakest Link Detected</h4>
                              <div className="text-lg font-bold text-red-900 mb-1">"{results.trust.weakestLink.stage}" Stage</div>
                              <div className="text-sm text-red-700">Trust Score: {results.trust.weakestLink.score}/100</div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          {results.trust.stageScores.map((score:any) => (
                            <div key={score.stage} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                              <div className="flex justify-between items-center mb-4">
                                <div>
                                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">{score.stage}</h3>
                                  <div className="text-sm text-slate-500">{score.batchesProcessed} batches processed</div>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black text-indigo-600">{score.trustScore}</span>
                                    <span className={`px-2 py-0.5 rounded text-sm font-bold ${['A+','A'].includes(score.grade)?'bg-emerald-100 text-emerald-700':score.grade==='B'?'bg-blue-100 text-blue-700':'bg-red-100 text-red-700'}`}>{score.grade}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-5 gap-2 mb-4">
                                {[
                                  { label: 'Time', val: score.metrics.onTimeDelivery },
                                  { label: 'Quality', val: score.metrics.qualityScore },
                                  { label: 'Data', val: score.metrics.dataCompleteness },
                                  { label: 'Risk', val: score.metrics.riskFrequency },
                                  { label: 'Chain', val: score.metrics.blockchainVerification }
                                ].map(m => (
                                  <div key={m.label} className="bg-slate-50 rounded p-2 text-center border border-slate-100">
                                    <div className="text-lg font-bold text-slate-700">{m.val}</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">{m.label}</div>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="text-sm text-slate-600 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                                <span className="font-semibold text-indigo-700">AI Insight: </span>
                                {score.insights[0]}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* FORECAST IQ AI RENDER */}
                    {activeTab === 'forecast' && results.forecast && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                           <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white p-5 rounded-2xl shadow-md">
                             <div className="flex gap-2 items-center mb-1 text-amber-100">
                               <TrendingUp className="w-4 h-4"/> <span className="text-xs uppercase font-bold tracking-widest">Growth Rate</span>
                             </div>
                             <div className="text-4xl font-black mb-1">{results.forecast.forecast.growthRate}%</div>
                             <div className="text-sm">Month-over-month completion</div>
                           </div>
                           
                           <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                             <div className="flex gap-2 items-center mb-1 text-slate-400">
                               <Activity className="w-4 h-4"/> <span className="text-xs uppercase font-bold tracking-widest">Avg Cycle Time</span>
                             </div>
                             <div className="text-4xl font-black text-slate-900 mb-1">{results.forecast.performance.avgCycleTimeDays}</div>
                             <div className="text-sm text-slate-500">Days from start to finish</div>
                           </div>

                           <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                             <div className="flex gap-2 items-center mb-1 text-slate-400">
                               <BarChart className="w-4 h-4"/> <span className="text-xs uppercase font-bold tracking-widest">Daily Burn Rate</span>
                             </div>
                             <div className="text-4xl font-black text-indigo-600 mb-1">{results.forecast.forecast.dailyRate}</div>
                             <div className="text-sm text-slate-500">Batches processed per day</div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> Forward Predictions</h3>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                <span className="font-medium text-slate-600">Next 7 Days</span>
                                <span className="text-lg font-bold text-slate-900">{results.forecast.forecast.next7Days} batches</span>
                              </div>
                              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                <span className="font-medium text-slate-600">Next 14 Days</span>
                                <span className="text-lg font-bold text-slate-900">{results.forecast.forecast.next14Days} batches</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-slate-600">Next 30 Days</span>
                                <span className="text-lg font-bold text-slate-900">{results.forecast.forecast.next30Days} batches</span>
                              </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                              <ShieldCheck className="w-3 h-3" /> Prediction Confidence: <strong className="uppercase">{results.forecast.forecast.confidenceLevel}</strong>
                            </div>
                          </div>

                          <div className="space-y-4">
                             {results.forecast.bottleneck && (
                              <div className="bg-rose-50 border border-rose-200 p-5 rounded-xl shadow-sm flex gap-4">
                                <AlertTriangle className="w-8 h-8 text-rose-500 shrink-0" />
                                <div>
                                  <h4 className="font-bold text-rose-900 text-sm">Bottleneck Predicted</h4>
                                  <p className="text-sm text-rose-700 mt-1">Stage <strong>"{results.forecast.bottleneck.stage}"</strong> has {results.forecast.bottleneck.queueSize} batches queued. Capacity add recommended.</p>
                                </div>
                              </div>
                             )}

                             <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl shadow-sm">
                                <h4 className="font-bold text-indigo-900 text-sm mb-3">AI Recommendations</h4>
                                <ul className="space-y-2">
                                  {results.forecast.recommendations.map((r:string, i:number) => (
                                    <li key={i} className="text-sm text-indigo-800 flex items-start gap-2">
                                      <ChevronRight className="w-4 h-4 shrink-0 mt-0.5" />
                                      {r}
                                    </li>
                                  ))}
                                </ul>
                             </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
