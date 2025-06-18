import { AdvancedSystemsDashboard } from '@/components/AdvancedSystemsDashboard';

export default function SystemsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Advanced Systems Management</h1>
          <p className="text-lg text-gray-600">
            Controle avançado e monitoramento de todos os sistemas da plataforma
          </p>
        </div>
        
        <AdvancedSystemsDashboard />
      </div>
    </div>
  );
} 