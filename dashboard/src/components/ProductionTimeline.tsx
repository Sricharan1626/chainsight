import { Package, Truck, CheckCircle, Clock } from "lucide-react";
import { clsx } from "clsx";

const batches = [
  { id: "BCH-8921", product: "Silicon Wafers", stage: "Quality Control", status: "active", time: "10 mins ago", icon: CheckCircle, color: "text-blue-400", bg: "bg-blue-500/20", glow: "shadow-[0_0_10px_rgba(59,130,246,0.6)]" },
  { id: "BCH-8920", product: "Lithium Cells", stage: "Assembly line 4", status: "processing", time: "45 mins ago", icon: Package, color: "text-amber-400", bg: "bg-amber-500/20", glow: "shadow-[0_0_10px_rgba(251,191,36,0.6)]" },
  { id: "BCH-8919", product: "Circuit Boards", stage: "In Transit to Hub", status: "transit", time: "2 hrs ago", icon: Truck, color: "text-purple-400", bg: "bg-purple-500/20", glow: "" },
  { id: "BCH-8918", product: "Capacitors", stage: "Awaiting Scrutiny", status: "pending", time: "5 hrs ago", icon: Clock, color: "text-slate-400", bg: "bg-slate-500/20", glow: "" },
];

export default function ProductionTimeline() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Active Batches</h3>
          <p className="text-xs text-slate-500">Real-time production timeline</p>
        </div>
        <div className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </div>
      </div>
      
      <div className="relative border-l border-slate-200 space-y-8 pb-4 ml-3 flex-1">
        {batches.map((batch, i) => (
          <div key={i} className="relative pl-6 group">
            <span className={clsx("absolute -left-3 top-1 w-6 h-6 rounded-full flex items-center justify-center border border-slate-200 bg-white shadow-sm transition-transform group-hover:scale-110", batch.glow)}>
              <div className={clsx("w-2 h-2 rounded-full", batch.color.replace('text-', 'bg-'))}></div>
            </span>
            <div className="glass-card p-4 hover:bg-slate-50 transition-colors border-l-2 border-l-transparent hover:border-l-blue-500 shadow-sm hover:shadow-md">
              <div className="flex justify-between items-start mb-1">
                <span className="font-mono text-xs font-bold text-blue-600">{batch.id}</span>
                <span className="text-xs font-medium text-slate-500">{batch.time}</span>
              </div>
              <h4 className="text-sm font-semibold text-slate-900">{batch.product}</h4>
              <div className="mt-2 flex items-center gap-2">
                <batch.icon className={clsx("w-4 h-4", batch.color)} />
                <span className="text-xs text-slate-600">{batch.stage}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
