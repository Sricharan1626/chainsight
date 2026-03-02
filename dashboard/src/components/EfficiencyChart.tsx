"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Mon", efficiency: 82, target: 85 },
  { name: "Tue", efficiency: 88, target: 85 },
  { name: "Wed", efficiency: 91, target: 85 },
  { name: "Thu", efficiency: 86, target: 85 },
  { name: "Fri", efficiency: 94, target: 85 },
  { name: "Sat", efficiency: 96, target: 85 },
  { name: "Sun", efficiency: 98, target: 85 },
];

export default function EfficiencyChart() {
  return (
    <div className="w-full h-full min-h-[300px] flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900">Production Efficiency <span className="text-slate-500 font-normal">over Time</span></h3>
        <p className="text-xs text-slate-500">7-day performance vs target margin</p>
      </div>
      <div className="flex-1 w-full h-full min-h-[250px] -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} padding={{ left: 10, right: 10 }} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 100]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.1)' }} 
              itemStyle={{ color: '#0f172a' }}
            />
            <Area type="monotone" dataKey="target" stroke="#94a3b8" strokeDasharray="5 5" fill="none" />
            <Area type="monotone" dataKey="efficiency" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorEfficiency)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
