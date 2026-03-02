import { AlertOctagon, TrendingDown, ThermometerSnowflake } from "lucide-react";
import { clsx } from "clsx";

const alerts = [
  { title: "Supplier Hub Alpha Offline", desc: "API connection dropped 4 mins ago.", criticality: "critical", icon: AlertOctagon, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30" },
  { title: "Material Shortage Predicted", desc: "Lithium stock projected to deplete in 48h.", criticality: "high", icon: TrendingDown, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  { title: "Temperature Variance", desc: "Storage facility B reports -2°C deviation.", criticality: "medium", icon: ThermometerSnowflake, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
];

export default function AnomaliesAlerts() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4 flex items-center gap-2">
        <AlertOctagon className="w-5 h-5 text-rose-500 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-900">Risk Alerts</h3>
      </div>
      
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2">
        {alerts.map((alert, i) => (
          <div key={i} className={clsx("p-4 rounded-xl border backdrop-blur-md transition-all hover:translate-x-1 shadow-sm", alert.bg, alert.border)}>
            <div className="flex items-start gap-3">
              <div className={clsx("p-2 rounded-lg bg-white shadow-sm border border-slate-100", alert.color)}>
                <alert.icon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1">{alert.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{alert.desc}</p>
                <div className="mt-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  {alert.criticality} priority
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="mt-4 w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200">
        View All Logs
      </button>
    </div>
  );
}
