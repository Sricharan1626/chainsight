"use client";

import { useState } from "react";
import { Plus, Trash2, Save, Building2, CheckCircle2, ArrowRight } from "lucide-react";
import { clsx } from "clsx";

export default function OnboardingPage() {
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [stages, setStages] = useState([
    { id: "1", name: "Raw Material Sourcing", description: "Initial phase of acquiring assets" },
    { id: "2", name: "Assembly", description: "Putting together the core components" },
    { id: "3", name: "Packaging & QA", description: "Final testing and boxing" }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const addStage = () => {
    setStages([...stages, { id: Math.random().toString(), name: "", description: "" }]);
  };

  const updateStage = (id: string, field: string, value: string) => {
    setStages(stages.map((stage) => stage.id === id ? { ...stage, [field]: value } : stage));
  };

  const removeStage = (id: string) => {
    if (stages.length <= 1) return;
    setStages(stages.filter((stage) => stage.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, industry, stages }),
      });
      
      if (res.ok) {
        setSuccess(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 h-full flex items-center justify-center animate-fade-in w-full max-w-4xl mx-auto">
        <div className="glass-card p-12 text-center max-w-md w-full relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 border border-emerald-100 shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4 relative z-10">Onboarding Complete</h2>
          <p className="text-slate-600 mb-8 relative z-10">
            {companyName} has been successfully integrated. Their custom supply chain with {stages.length} stages is now active.
          </p>
          <button 
            onClick={() => { setSuccess(false); setCompanyName(""); setStages([{ id: "1", name: "Raw Material", description: "" }]); }}
            className="px-6 py-3 w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm rounded-xl text-sm font-semibold transition-colors duration-300 relative z-10"
          >
            Onboard Another Company
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 pb-32 animate-fade-in w-full max-w-5xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-slate-900">
          Company <span className="neon-text">Onboarding</span>
        </h1>
        <p className="text-slate-500">Configure new partners and define their custom supply chain lifecycle.</p>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: General Info */}
        <div className="xl:col-span-1 space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" /> General Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Company Name</label>
                <input 
                  required
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-sm"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Industry Focus</label>
                <select 
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all appearance-none shadow-sm"
                >
                  <option value="" disabled>Select Industry</option>
                  <option value="electronics">Electronics Manufacturing</option>
                  <option value="automotive">Automotive Assembly</option>
                  <option value="pharmaceuticals">Pharmaceuticals</option>
                  <option value="food">Food & Beverage</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6 border-blue-100 bg-blue-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-blue-100 flex items-center justify-center shadow-sm">
                <span className="text-blue-600 font-bold">{stages.length}</span>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Total Stages</div>
                <div className="text-xs text-slate-500">Custom pipeline length</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Stages */}
        <div className="xl:col-span-2 glass-card p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-900">Supply Chain Lifecycle</h3>
            <button 
              type="button" 
              onClick={addStage}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 shadow-sm rounded-lg text-sm font-medium transition-colors border border-slate-200 flex items-center gap-2 group"
            >
              <Plus className="w-4 h-4 text-emerald-600 group-hover:scale-125 transition-transform" /> Add Stage
            </button>
          </div>

          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div key={stage.id} className="relative group/stage">
                <div className="absolute left-6 top-8 bottom-[-24px] w-[2px] border-l-2 border-dashed border-slate-200 last-of-type:border-transparent z-0"></div>
                <div className="flex gap-6 relative z-10 w-full animate-slide-up">
                  <div className="w-12 h-12 rounded-full border-2 border-slate-200 bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-slate-500 font-mono font-bold group-hover/stage:border-blue-500 group-hover/stage:text-blue-600 transition-colors">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-2xl p-5 group-hover/stage:border-blue-300 transition-all flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-4">
                      <input
                        required
                        type="text"
                        value={stage.name}
                        onChange={(e) => updateStage(stage.id, "name", e.target.value)}
                        placeholder="Stage Name (e.g. Quality Check)"
                        className="w-full bg-transparent border-b border-slate-200 pb-2 text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:placeholder-slate-400 placeholder:font-normal placeholder:text-slate-400 transition-colors"
                      />
                      <input
                        type="text"
                        value={stage.description}
                        onChange={(e) => updateStage(stage.id, "description", e.target.value)}
                        placeholder="Brief description of this stage..."
                        className="w-full bg-transparent text-sm text-slate-600 focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                    
                    <button 
                      type="button" 
                      onClick={() => removeStage(stage.id)}
                      disabled={stages.length === 1}
                      className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-colors disabled:opacity-50 disabled:hover:text-slate-500 disabled:hover:bg-slate-50 disabled:hover:border-slate-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-slate-200 flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting || !companyName}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white rounded-xl font-bold transition-all shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_25px_rgba(59,130,246,0.4)] flex items-center gap-3 disabled:opacity-70 disabled:filter-grayscale"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Initialize Partner <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
