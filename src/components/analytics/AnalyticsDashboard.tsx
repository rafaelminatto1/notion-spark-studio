import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Edit,
  MessageCircle,
  Calendar,
  Download,
  Share2,
  Filter,
  RefreshCw,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Tipos para analytics
export interface AnalyticsData {
  period: string;
  users: number;
  notes: number;
  views: number;
  edits: number;
  comments: number;
  collaborations: number;
  avgSessionTime: number;
}

export interface UserActivity {
  userId: string;
  userName: string;
  avatar?: string;
  lastActive: Date;
  notesCreated: number;
  notesEdited: number;
  commentsPosted: number;
  timeSpent: number; // em minutos
  devicesUsed: string[];
}

export interface DocumentMetrics {
  documentId: string;
  title: string;
  views: number;
  edits: number;
  comments: number;
  collaborators: number;
  lastActivity: Date;
  timeSpent: number;
  performance: 'high' | 'medium' | 'low';
}

interface AnalyticsDashboardProps {
  timeRange: '24h' | '7d' | '30d' | '90d';
  onTimeRangeChange: (range: '24h' | '7d' | '30d' | '90d') => void;
  className?: string;
}

// Hook para dados de analytics
const useAnalyticsData = (timeRange: string) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [documentMetrics, setDocumentMetrics] = useState<DocumentMetrics[]>([]);

  // Simular carregamento de dados
  useEffect(() => {
    setLoading(true);
    
    const fetchData = async () => {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Gerar dados mock baseados no timeRange
      const periods = timeRange === '24h' ? 24 : 
                     timeRange === '7d' ? 7 : 
                     timeRange === '30d' ? 30 : 90;
      
      const mockData: AnalyticsData[] = Array.from({ length: periods }, (_, i) => ({
        period: timeRange === '24h' ? `${i}:00` : 
                timeRange === '7d' ? `Dia ${i + 1}` :
                timeRange === '30d' ? `${i + 1}/11` :
                `Sem ${i + 1}`,
        users: Math.floor(Math.random() * 50) + 10,
        notes: Math.floor(Math.random() * 20) + 5,
        views: Math.floor(Math.random() * 200) + 50,
        edits: Math.floor(Math.random() * 80) + 20,
        comments: Math.floor(Math.random() * 30) + 5,
        collaborations: Math.floor(Math.random() * 15) + 2,
        avgSessionTime: Math.floor(Math.random() * 120) + 30
      }));

      const mockUserActivities: UserActivity[] = [
        {
          userId: 'user-1',
          userName: 'Ana Silva',
          lastActive: new Date(Date.now() - Math.random() * 86400000),
          notesCreated: 12,
          notesEdited: 34,
          commentsPosted: 8,
          timeSpent: 245,
          devicesUsed: ['desktop', 'mobile']
        },
        {
          userId: 'user-2',
          userName: 'João Santos',
          lastActive: new Date(Date.now() - Math.random() * 86400000),
          notesCreated: 8,
          notesEdited: 23,
          commentsPosted: 15,
          timeSpent: 178,
          devicesUsed: ['desktop']
        },
        {
          userId: 'user-3',
          userName: 'Maria Costa',
          lastActive: new Date(Date.now() - Math.random() * 86400000),
          notesCreated: 15,
          notesEdited: 42,
          commentsPosted: 12,
          timeSpent: 312,
          devicesUsed: ['desktop', 'tablet']
        }
      ];

      const mockDocumentMetrics: DocumentMetrics[] = [
        {
          documentId: 'doc-1',
          title: 'Planejamento Estratégico 2024',
          views: 156,
          edits: 23,
          comments: 8,
          collaborators: 4,
          lastActivity: new Date(Date.now() - Math.random() * 86400000),
          timeSpent: 180,
          performance: 'high'
        },
        {
          documentId: 'doc-2',
          title: 'Notas da Reunião - Sprint Planning',
          views: 89,
          edits: 15,
          comments: 12,
          collaborators: 3,
          lastActivity: new Date(Date.now() - Math.random() * 86400000),
          timeSpent: 95,
          performance: 'medium'
        },
        {
          documentId: 'doc-3',
          title: 'Documentação da API',
          views: 234,
          edits: 45,
          comments: 6,
          collaborators: 2,
          lastActivity: new Date(Date.now() - Math.random() * 86400000),
          timeSpent: 278,
          performance: 'high'
        }
      ];

      setData(mockData);
      setUserActivities(mockUserActivities);
      setDocumentMetrics(mockDocumentMetrics);
      setLoading(false);
    };

    fetchData();
  }, [timeRange]);

  return { data, userActivities, documentMetrics, loading };
};

// Componente de métrica
interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon: Icon, color, loading }) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-100',
    green: 'bg-green-500 text-green-100',
    purple: 'bg-purple-500 text-purple-100',
    orange: 'bg-orange-500 text-orange-100',
    red: 'bg-red-500 text-red-100'
  };

  const changeColor = change >= 0 ? 'text-green-600' : 'text-red-600';
  const TrendIcon = change >= 0 ? TrendingUp : TrendingDown;

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          <div className={cn("flex items-center text-sm", changeColor)}>
            <TrendIcon className="h-3 w-3 mr-1" />
            <span>{Math.abs(change)}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Componente de tabela de atividades
interface ActivityTableProps {
  userActivities: UserActivity[];
  loading?: boolean;
}

const ActivityTable: React.FC<ActivityTableProps> = ({ userActivities, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-lg border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade dos Usuários</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-sm font-medium text-gray-600 pb-3">Usuário</th>
              <th className="text-left text-sm font-medium text-gray-600 pb-3">Notas</th>
              <th className="text-left text-sm font-medium text-gray-600 pb-3">Edições</th>
              <th className="text-left text-sm font-medium text-gray-600 pb-3">Comentários</th>
              <th className="text-left text-sm font-medium text-gray-600 pb-3">Tempo</th>
              <th className="text-left text-sm font-medium text-gray-600 pb-3">Última Atividade</th>
            </tr>
          </thead>
          <tbody>
            {userActivities.map((user, index) => (
              <motion.tr
                key={user.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user.userName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.userName}</p>
                      <p className="text-xs text-gray-500">
                        {user.devicesUsed.join(', ')}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-sm text-gray-600">{user.notesCreated}</td>
                <td className="py-4 text-sm text-gray-600">{user.notesEdited}</td>
                <td className="py-4 text-sm text-gray-600">{user.commentsPosted}</td>
                <td className="py-4 text-sm text-gray-600">{user.timeSpent}min</td>
                <td className="py-4 text-sm text-gray-500">
                  {user.lastActive.toLocaleDateString('pt-BR')}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

// Componente principal
export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  timeRange,
  onTimeRangeChange,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'documents'>('overview');
  const { data, userActivities, documentMetrics, loading } = useAnalyticsData(timeRange);

  // Calcular métricas agregadas
  const aggregatedMetrics = useMemo(() => {
    if (!data.length) return null;

    const totals = data.reduce((acc, curr) => ({
      users: acc.users + curr.users,
      notes: acc.notes + curr.notes,
      views: acc.views + curr.views,
      edits: acc.edits + curr.edits,
      comments: acc.comments + curr.comments,
      collaborations: acc.collaborations + curr.collaborations,
      avgSessionTime: acc.avgSessionTime + curr.avgSessionTime
    }), { users: 0, notes: 0, views: 0, edits: 0, comments: 0, collaborations: 0, avgSessionTime: 0 });

    const averages = {
      ...totals,
      avgSessionTime: Math.round(totals.avgSessionTime / data.length)
    };

    // Calcular mudanças (simulado)
    const changes = {
      users: Math.floor(Math.random() * 30) - 10,
      notes: Math.floor(Math.random() * 25) - 5,
      views: Math.floor(Math.random() * 40) - 15,
      edits: Math.floor(Math.random() * 35) - 10,
      comments: Math.floor(Math.random() * 45) - 20,
      collaborations: Math.floor(Math.random() * 50) - 20
    };

    return { totals: averages, changes };
  }, [data]);

  // Dados para gráfico de pizza (dispositivos)
  const deviceData = [
    { name: 'Desktop', value: 65, color: '#3B82F6' },
    { name: 'Mobile', value: 25, color: '#10B981' },
    { name: 'Tablet', value: 10, color: '#F59E0B' }
  ];

  return (
    <div className={cn("analytics-dashboard p-6 bg-gray-50 min-h-screen", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Métricas e insights do Notion Spark Studio</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Filtro de tempo */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {(['24h', '7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                className={cn(
                  "px-3 py-1 text-sm rounded transition-colors",
                  timeRange === range
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                {range}
              </button>
            ))}
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white border border-gray-200 rounded-lg p-1 w-fit">
        {[
          { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
          { id: 'users', label: 'Usuários', icon: Users },
          { id: 'documents', label: 'Documentos', icon: FileText }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm rounded transition-colors",
              activeTab === id
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Cards de métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Usuários Ativos"
                value={aggregatedMetrics?.totals.users || 0}
                change={aggregatedMetrics?.changes.users || 0}
                icon={Users}
                color="blue"
                loading={loading}
              />
              <MetricCard
                title="Notas Criadas"
                value={aggregatedMetrics?.totals.notes || 0}
                change={aggregatedMetrics?.changes.notes || 0}
                icon={FileText}
                color="green"
                loading={loading}
              />
              <MetricCard
                title="Visualizações"
                value={aggregatedMetrics?.totals.views || 0}
                change={aggregatedMetrics?.changes.views || 0}
                icon={Eye}
                color="purple"
                loading={loading}
              />
              <MetricCard
                title="Colaborações"
                value={aggregatedMetrics?.totals.collaborations || 0}
                change={aggregatedMetrics?.changes.collaborations || 0}
                icon={Users}
                color="orange"
                loading={loading}
              />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de atividade */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade ao Longo do Tempo</h3>
                {loading ? (
                  <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="users" 
                        stackId="1" 
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="edits" 
                        stackId="1" 
                        stroke="#10B981" 
                        fill="#10B981" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Gráfico de dispositivos */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Uso por Dispositivo</h3>
                {loading ? (
                  <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {deviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ActivityTable userActivities={userActivities} loading={loading} />
          </motion.div>
        )}

        {activeTab === 'documents' && (
          <motion.div
            key="documents"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance dos Documentos</h3>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {documentMetrics.map((doc, index) => (
                  <motion.div
                    key={doc.documentId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{doc.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {doc.views} visualizações
                        </span>
                        <span className="flex items-center gap-1">
                          <Edit className="h-3 w-3" />
                          {doc.edits} edições
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {doc.comments} comentários
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {doc.collaborators} colaboradores
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "px-2 py-1 text-xs rounded-full",
                        doc.performance === 'high' ? 'bg-green-100 text-green-800' :
                        doc.performance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      )}>
                        {doc.performance === 'high' ? 'Alta' :
                         doc.performance === 'medium' ? 'Média' : 'Baixa'} Performance
                      </div>
                      <span className="text-sm text-gray-500">
                        {doc.timeSpent}min
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnalyticsDashboard; 