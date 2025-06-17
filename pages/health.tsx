import React from 'react';
import { SupabaseStatus } from '@/components/SupabaseStatus';

export default function HealthPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Sistema de Monitoramento</h1>
      
      {/* Status do Supabase */}
      <SupabaseStatus />
      
      {/* Status Geral do Sistema */}
      <div className="bg-card text-card-foreground p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Status do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-800">Aplicação</h3>
            <p className="text-green-600">✅ Online</p>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-800">Next.js</h3>
            <p className="text-blue-600">✅ Funcionando</p>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-medium text-purple-800">Performance</h3>
            <p className="text-purple-600">✅ Ótima</p>
          </div>
        </div>
      </div>
    </div>
  );
} 