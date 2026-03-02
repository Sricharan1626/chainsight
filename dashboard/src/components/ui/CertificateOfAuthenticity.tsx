'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink,
  Box,
  Factory
} from 'lucide-react';
import { BatchData } from '@/lib/mockData';
import { QRCodeGenerator } from './QRCodeGenerator';

interface Props {
  data: BatchData;
}

export function CertificateOfAuthenticity({ data }: Props) {
  const isComplete = data.status === 'Complete';

  // Format date safely
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="p-8 md:p-12 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
            <div className="space-y-4 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-medium">
                <ShieldCheck className="w-4 h-4" />
                Verified Certificate of Authenticity
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                {data.productName}
              </h1>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-3 text-slate-300">
                  <Box className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Batch ID</p>
                    <p className="font-medium text-white">{data.batchId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Origin</p>
                    <p className="font-medium text-white">{data.origin}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Factory className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Producer</p>
                    <p className="font-medium text-white">{data.producer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Harvest Date</p>
                    <p className="font-medium text-white">{formatDate(data.harvestDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-64 shrink-0">
              <QRCodeGenerator batchId={data.batchId} status={data.status} />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Blockchain & AI Risk */}
        <div className="lg:col-span-1 space-y-8">
          {/* Blockchain Verification */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-3xl bg-slate-900 border border-slate-800"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Blockchain Immutability
            </h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              This batch's provenance data is permanently hashed and recorded on the Algorand blockchain, guaranteeing it cannot be tampered with.
            </p>
            
            <div className="space-y-3">
              {data.algorandTxId ? (
                <>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 break-all">
                    <p className="text-xs text-slate-500 mb-1 tracking-wider uppercase">Algorand TxID</p>
                    <p className="font-mono text-sm text-slate-300">{data.algorandTxId}</p>
                  </div>
                  
                  <a 
                    href={`https://testnet.explorer.perawallet.app/tx/${data.algorandTxId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl transition-all"
                  >
                    Verify on Pera Explorer
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </>
              ) : (
                <div className="text-center p-6 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-amber-400 font-medium">Pending Blockchain Verification</p>
                  <p className="text-sm text-amber-400/70">This batch has not yet been recorded on Algorand.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* AI Risk Logs */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-3xl bg-slate-900 border border-slate-800"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              AI Risk Detection Logs
            </h3>
            
            {data.aiRiskEvents.length === 0 ? (
              <div className="text-center p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-emerald-400 font-medium">No Anomalies Detected</p>
                <p className="text-sm text-emerald-400/70">Journey completed perfectly.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.aiRiskEvents.map((event, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-black/40 border border-white/5 relative overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      event.riskLevel === 'high' ? 'bg-red-500' :
                      event.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <h4 className="text-white font-medium text-sm mb-1">{event.title}</h4>
                    <p className="text-slate-400 text-xs mb-2 leading-relaxed">{event.description}</p>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {formatDate(event.timestamp)}
                      </span>
                      {event.location && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column - Supply Chain Timeline */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 p-8 rounded-3xl bg-slate-900 border border-slate-800"
        >
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
            Provenance Timeline
          </h3>
          
          <div className="space-y-0 text-white relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
            {data.stages.map((stage, index) => (
              <div key={stage.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Icon Marker */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2
                  ${stage.status === 'completed' ? 'bg-emerald-500 text-white' : 
                    stage.status === 'in-progress' ? 'bg-indigo-500 text-white animate-pulse' : 
                    'bg-slate-700 text-slate-400'}
                `}>
                  {stage.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : 
                   stage.status === 'in-progress' ? <Box className="w-4 h-4" /> : 
                   <span className="w-2 h-2 rounded-full bg-slate-400" />}
                </div>

                {/* Content Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] pb-8 pt-1">
                  <div className={`p-5 rounded-2xl border transition-all ${
                    stage.status === 'completed' ? 'bg-slate-800/50 border-emerald-500/20 hover:border-emerald-500/40' :
                    stage.status === 'in-progress' ? 'bg-indigo-500/5 border-indigo-500/30' :
                    'bg-slate-800/20 border-white/5 opacity-50'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <h4 className="font-bold text-lg text-white">{stage.name}</h4>
                      <span className="text-xs font-medium text-slate-400 bg-black/40 px-2 py-1 rounded-md">
                        {formatDate(stage.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                      {stage.description}
                    </p>
                    
                    {stage.location && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-4 h-4" />
                        {stage.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
