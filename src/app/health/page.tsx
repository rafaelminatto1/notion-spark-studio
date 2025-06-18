import { HealthDashboard } from '@/utils/HealthMonitor';

export default function HealthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">System Health Monitor</h1>
          <p className="text-lg text-gray-600">
            Monitoramento em tempo real da saúde e performance do sistema
          </p>
        </div>
        
        <HealthDashboard />
      </div>
    </div>
  );
} 