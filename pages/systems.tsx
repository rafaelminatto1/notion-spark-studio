import React from 'react';

export default function SystemsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h1 className="text-3xl font-bold mb-8">Advanced Systems Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Performance Monitor</h2>
              <p className="text-sm text-gray-300">Status: ✅ Online</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Cache System</h2>
              <p className="text-sm text-gray-300">Status: ✅ Active</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Health Monitor</h2>
              <p className="text-sm text-gray-300">Status: ✅ Running</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 