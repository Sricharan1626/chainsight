'use client';

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode } from 'lucide-react';

interface QRCodeGeneratorProps {
  batchId: string;
  status: 'Complete' | 'In Progress';
  theme?: 'dark' | 'light';
}

export function QRCodeGenerator({ batchId, status, theme = 'dark' }: QRCodeGeneratorProps) {
  const qrRef = useRef<SVGSVGElement>(null);

  if (status !== 'Complete') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium">
        <QrCode className="w-4 h-4" />
        QR code awaits batch completion.
      </div>
    );
  }

  // Assuming the standard port for local development is 3000, 
  // in production this would be standard origin
  const verificationUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/verify/${batchId}` 
    : `https://app.elytrax.com/verify/${batchId}`;

  const downloadQR = () => {
    if (!qrRef.current) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size
      canvas.width = img.width + 40; // add padding
      canvas.height = img.height + 40;
      
      if (ctx) {
        // Fill white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the SVG image offset by padding
        ctx.drawImage(img, 20, 20);
        
        // Trigger download
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `Batch-${batchId}-Verification.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const isLight = theme === 'light';

  return (
    <div className={`p-6 border rounded-2xl flex flex-col items-center justify-center gap-4 text-center ${
      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 border-white/10'
    }`}>
      <div className={`p-4 rounded-xl shadow-lg ring-1 ${isLight ? 'bg-white ring-slate-900/5' : 'bg-white ring-black/5'}`}>
        <QRCodeSVG 
          value={verificationUrl}
          size={isLight ? 120 : 160}
          bgColor="#FFFFFF"
          fgColor="#000000"
          level="H"
          includeMargin={false}
          ref={qrRef}
        />
      </div>
      
      <div>
        <h4 className={`font-medium mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Authenticity verified</h4>
        <p className={`text-sm mb-4 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Scan to view traceability data</p>
        
        <button 
          onClick={downloadQR}
          className={`flex items-center gap-2 mx-auto px-4 py-2 font-semibold rounded-lg transition-colors text-sm ${
            isLight 
              ? 'bg-slate-900 hover:bg-slate-800 text-white' 
              : 'bg-emerald-500 hover:bg-emerald-400 text-black'
          }`}
        >
          <Download className="w-4 h-4" />
          Download Label
        </button>
      </div>
    </div>
  );
}
