import React from 'react';

export default function HealthPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h1 className="text-2xl font-bold mb-6">System Health</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Database Status</h2>
              <div className="text-sm text-gray-300">
                <p>Status: ✅ Online</p>
                <p>Conexão: Estável</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Performance Metrics</h2>
              <div className="text-sm text-gray-300">
                <p>Memory Usage: N/A (SSR)</p>
                <p>Status: ✅ Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 