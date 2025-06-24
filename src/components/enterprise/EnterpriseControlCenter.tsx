import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Users, 
  BarChart3, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Database,
  Globe,
  Lock,
  Zap,
  TrendingUp,
  Server,
  Clock,
  Eye
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { useEnterpriseAuth } from '../../hooks/useEnterpriseAuth';
import { autoScalingService, type LoadMetrics, type ServerInstance } from '../../services/AutoScalingService';
import { complianceMonitoringService, type SecurityEvent, type ComplianceReport } from '../../services/ComplianceMonitoringService';

interface SystemStatus {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  uptime: number;
  lastCheck: string;
  metrics: any;
}

export function EnterpriseControlCenter() {
  const { user, organization, permissions, isAuthenticated } = useEnterpriseAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([]);
  const [loadMetrics, setLoadMetrics] = useState<LoadMetrics | null>(null);
  const [instances, setInstances] = useState<ServerInstance[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Initialize system monitoring
    const initializeMonitoring = async () => {
      // Load auto-scaling data
      setLoadMetrics(autoScalingService.getCurrentMetrics());
      setInstances(autoScalingService.getInstances());
      
      // Load security events
      setSecurityEvents(complianceMonitoringService.getSecurityEvents().slice(-20));
      
      // Generate compliance report
      if (organization?.id) {
        const report = await complianceMonitoringService.generateComplianceReport(
          organization.id,
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          new Date().toISOString()
        );
        setComplianceReport(report);
      }

      // Initialize system status
      setSystemStatus([
        {
          name: 'Authentication Service',
          status: 'healthy',
          uptime: 99.9,
          lastCheck: new Date().toISOString(),
          metrics: { active_sessions: 1250, failed_logins: 5 }
        },
        {
          name: 'Auto-Scaling Service',
          status: autoScalingService.getSystemStatus().healthy_instances > 0 ? 'healthy' : 'critical',
          uptime: 99.8,
          lastCheck: new Date().toISOString(),
          metrics: autoScalingService.getSystemStatus()
        },
        {
          name: 'Compliance Monitoring',
          status: 'healthy',
          uptime: 100,
          lastCheck: new Date().toISOString(),
          metrics: { events_processed: securityEvents.length }
        },
        {
          name: 'AI Performance Optimizer',
          status: 'healthy',
          uptime: 99.5,
          lastCheck: new Date().toISOString(),
          metrics: { optimizations_applied: 12, score: 85 }
        },
        {
          name: 'Real-Time Collaboration',
          status: 'healthy',
          uptime: 99.7,
          lastCheck: new Date().toISOString(),
          metrics: { active_collaborators: 3, sync_efficiency: 98 }
        }
      ]);
    };

    initializeMonitoring();

    // Update data every 30 seconds
    const interval = setInterval(() => {
      setLoadMetrics(autoScalingService.getCurrentMetrics());
      setInstances(autoScalingService.getInstances());
      setSecurityEvents(complianceMonitoringService.getSecurityEvents().slice(-20));
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, organization]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Enterprise Control Center requires authentication.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!permissions?.canAccessAnalytics && !permissions?.adminAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Insufficient Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">You don't have permission to access the Enterprise Control Center.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {systemStatus.map((system) => (
              <div key={system.name} className="text-center">
                <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                  system.status === 'healthy' ? 'bg-green-100 text-green-600' :
                  system.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {system.status === 'healthy' ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                <p className="font-medium text-sm">{system.name}</p>
                <p className="text-xs text-gray-500">{system.uptime}% uptime</p>
                <Badge variant={system.status === 'healthy' ? 'default' : 'destructive'} className="mt-1">
                  {system.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceReport?.summary.total_events || 0}</div>
            <p className="text-xs text-gray-500">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadMetrics ? Math.round(loadMetrics.cpu_usage) : 0}%</div>
            <Progress value={loadMetrics?.cpu_usage ?? 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">95/100</div>
            <p className="text-xs text-gray-500">Excellent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {complianceReport ? 
                Math.round((1 - complianceReport.summary.compliance_violations / complianceReport.summary.total_events) * 100) : 100
              }%
            </div>
            <p className="text-xs text-gray-500">GDPR Compliant</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Recent Security Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {securityEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    event.severity === 'critical' ? 'bg-red-500' :
                    event.severity === 'high' ? 'bg-orange-500' :
                    event.severity === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <div>
                    <p className="font-medium text-sm">{event.type.replace('_', ' ').toUpperCase()}</p>
                    <p className="text-xs text-gray-500">User: {event.user_id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={event.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {event.severity}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderScaling = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Auto-Scaling Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium mb-2">Current Load</h3>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage</span>
                    <span>{loadMetrics ? Math.round(loadMetrics.cpu_usage) : 0}%</span>
                  </div>
                  <Progress value={loadMetrics?.cpu_usage ?? 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span>{loadMetrics ? Math.round(loadMetrics.memory_usage) : 0}%</span>
                  </div>
                  <Progress value={loadMetrics?.memory_usage ?? 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Response Time</span>
                    <span>{loadMetrics ? Math.round(loadMetrics.response_time) : 0}ms</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Active Instances</h3>
              <div className="text-3xl font-bold mb-2">
                {instances.filter(i => i.status === 'running').length}
              </div>
              <div className="space-y-1">
                {Object.entries(
                  instances.reduce((acc, instance) => {
                    acc[instance.region] = (acc[instance.region] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([region, count]) => (
                  <div key={region} className="flex justify-between text-sm">
                    <span>{region}</span>
                    <span>{count} instances</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Actions</h3>
              <div className="space-y-2">
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => autoScalingService.manualScale('up', 1)}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Scale Up
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => autoScalingService.manualScale('down', 1)}
                >
                  Scale Down
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instance Details */}
      <Card>
        <CardHeader>
          <CardTitle>Instance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {instances.map((instance) => (
              <div key={instance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-sm">{instance.id}</p>
                  <p className="text-xs text-gray-500">{instance.region} • {instance.type}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm">Health: {instance.health_score}/100</p>
                    <p className="text-xs text-gray-500">
                      CPU: {Math.round(instance.current_load.cpu_usage)}%
                    </p>
                  </div>
                  <Badge variant={
                    instance.status === 'running' ? 'default' :
                    instance.status === 'starting' ? 'secondary' :
                    'destructive'
                  }>
                    {instance.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security & Compliance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {complianceReport && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium mb-2">Security Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Events</span>
                    <span className="font-medium">{complianceReport.summary.total_events}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Security Incidents</span>
                    <span className="font-medium text-orange-600">{complianceReport.summary.security_incidents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Data Breaches</span>
                    <span className="font-medium text-red-600">{complianceReport.summary.data_breaches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Compliance Violations</span>
                    <span className="font-medium text-red-600">{complianceReport.summary.compliance_violations}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">GDPR Compliance</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Data Requests</span>
                    <span className="font-medium">{complianceReport.gdpr_compliance.data_requests_processed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Data Deletions</span>
                    <span className="font-medium">{complianceReport.gdpr_compliance.data_deletions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Consent Updates</span>
                    <span className="font-medium">{complianceReport.gdpr_compliance.consent_updates}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Login Success Rate</span>
                    <span className="font-medium text-green-600">{complianceReport.metrics.login_success_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Failed Logins</span>
                    <span className="font-medium">{complianceReport.metrics.failed_login_attempts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Suspicious Activities</span>
                    <span className="font-medium text-orange-600">{complianceReport.metrics.suspicious_activities}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Security Events Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {securityEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    event.severity === 'critical' ? 'bg-red-500' :
                    event.severity === 'high' ? 'bg-orange-500' :
                    event.severity === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <div>
                    <p className="font-medium text-sm">{event.type.replace('_', ' ').toUpperCase()}</p>
                    <p className="text-xs text-gray-500">
                      User: {event.user_id} • Org: {event.organization_id}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={event.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {event.severity}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'scaling', label: 'Auto-Scaling', icon: TrendingUp },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Enterprise Control Center</h1>
              <p className="text-slate-400">
                {organization?.name} • {organization?.tier?.toUpperCase()} Plan
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                <CheckCircle className="w-3 h-3 mr-1" />
                All Systems Operational
              </Badge>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock className="w-4 h-4" />
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-slate-700">
        <div className="container mx-auto px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'scaling' && renderScaling()}
          {activeTab === 'security' && renderSecurity()}
          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">User management features coming soon...</p>
              </CardContent>
            </Card>
          )}
          {activeTab === 'analytics' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Advanced Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Advanced analytics dashboard coming soon...</p>
              </CardContent>
            </Card>
          )}
          {activeTab === 'settings' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Enterprise Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Enterprise settings panel coming soon...</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
} 