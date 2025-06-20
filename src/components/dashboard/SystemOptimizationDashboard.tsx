import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, Zap, TrendingUp, TrendingDown, Activity, 
  Play, Pause, RotateCcw, AlertTriangle, CheckCircle,
  Monitor, Users, Server, BarChart3, Brain, Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { systemOptimizationEngine, SystemHealth, OptimizationResult } from '../../services/SystemOptimizationEngine';

interface DashboardProps {
  className?: string;
}

export const SystemOptimizationDashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [optimizationHistory, setOptimizationHistory] = useState<OptimizationResult[]>([]);
  const [isEngineRunning, setIsEngineRunning] = useState(false);
  const [lastOptimization, setLastOptimization] = useState<Date | null>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState({
    optimizationsToday: 0,
    averageImprovement: 0,
    systemLoad: 0,
    activeRules: 0
  });

  // Initialize and update data
  const updateDashboard = useCallback(() => {
    const health = systemOptimizationEngine.getSystemHealth();
    const history = systemOptimizationEngine.getOptimizationHistory();
    
    setSystemHealth(health);
    setOptimizationHistory(history.slice(-10)); // Last 10 optimizations
    
    // Calculate metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOptimizations = history.filter(opt => new Date(opt.details) >= today);
    
    const avgImprovement = history.length > 0 
      ? history.reduce((sum, opt) => sum + opt.improvement, 0) / history.length
      : 0;

    setRealtimeMetrics({
      optimizationsToday: todayOptimizations.length,
      averageImprovement: avgImprovement,
      systemLoad: Math.random() * 40 + 30, // Simulated system load
      activeRules: 7 // Number of active optimization rules
    });

    if (history.length > 0) {
      setLastOptimization(new Date());
    }
  }, []);

  useEffect(() => {
    updateDashboard();
    
    // Set up event listeners
    const handleOptimizationCompleted = (data: any) => {
      updateDashboard();
      console.log('[Dashboard] Optimization completed:', data);
    };

    const handleOptimizationCycle = (results: OptimizationResult[]) => {
      updateDashboard();
      console.log('[Dashboard] Optimization cycle completed:', results.length, 'optimizations');
    };

    systemOptimizationEngine.on('optimization-completed', handleOptimizationCompleted);
    systemOptimizationEngine.on('optimization-cycle-completed', handleOptimizationCycle);

    // Update dashboard every 30 seconds
    const interval = setInterval(updateDashboard, 30000);

    return () => {
      clearInterval(interval);
      systemOptimizationEngine.off('optimization-completed', handleOptimizationCompleted);
      systemOptimizationEngine.off('optimization-cycle-completed', handleOptimizationCycle);
    };
  }, [updateDashboard]);

  const handleStartEngine = () => {
    systemOptimizationEngine.start(60000); // Run every minute
    setIsEngineRunning(true);
  };

  const handleStopEngine = () => {
    systemOptimizationEngine.stop();
    setIsEngineRunning(false);
  };

  const handleManualOptimization = async () => {
    console.log('[Dashboard] Running manual optimization...');
    const results = await systemOptimizationEngine.runOptimization();
    updateDashboard();
    
    if (results.length === 0) {
      console.log('[Dashboard] No optimizations needed at this time');
    } else {
      console.log(`[Dashboard] Completed ${results.length} manual optimizations`);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 15) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (improvement > 5) return <TrendingUp className="w-4 h-4 text-blue-500" />;
    return <TrendingDown className="w-4 h-4 text-orange-500" />;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            System Optimization Engine
          </h1>
          <p className="text-muted-foreground">
            Intelligent automated optimization and performance monitoring
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={handleManualOptimization}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            Run Optimization
          </Button>
          
          {isEngineRunning ? (
            <Button
              onClick={handleStopEngine}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Pause className="w-4 h-4" />
              Stop Engine
            </Button>
          ) : (
            <Button
              onClick={handleStartEngine}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start Engine
            </Button>
          )}
        </div>
      </div>

      {/* Status Alert */}
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>
              Engine Status: {isEngineRunning ? (
                <Badge variant="default">Running</Badge>
              ) : (
                <Badge variant="secondary">Stopped</Badge>
              )}
            </span>
            {lastOptimization && (
              <span className="text-sm text-muted-foreground">
                Last optimization: {lastOptimization.toLocaleTimeString()}
              </span>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Optimizations Today</p>
                <p className="text-2xl font-bold">{realtimeMetrics.optimizationsToday}</p>
              </div>
              <Zap className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Improvement</p>
                <p className="text-2xl font-bold">{realtimeMetrics.averageImprovement.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Load</p>
                <p className="text-2xl font-bold">{realtimeMetrics.systemLoad.toFixed(0)}%</p>
              </div>
              <Monitor className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold">{realtimeMetrics.activeRules}</p>
              </div>
              <Settings className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              System Health Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Overall Health Score */}
              <div className="text-center">
                <div className={`text-6xl font-bold ${getHealthColor(systemHealth.overall)}`}>
                  {systemHealth.overall.toFixed(0)}
                </div>
                <div className="text-lg text-muted-foreground">
                  {getHealthLabel(systemHealth.overall)}
                </div>
                <Badge variant="outline" className="mt-2">
                  Overall Health
                </Badge>
              </div>

              {/* Detailed Scores */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Performance
                  </span>
                  <div className="flex items-center gap-2">
                    <Progress value={systemHealth.performance} className="w-24 h-2" />
                    <span className={`font-mono text-sm ${getHealthColor(systemHealth.performance)}`}>
                      {systemHealth.performance.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Stability
                  </span>
                  <div className="flex items-center gap-2">
                    <Progress value={systemHealth.stability} className="w-24 h-2" />
                    <span className={`font-mono text-sm ${getHealthColor(systemHealth.stability)}`}>
                      {systemHealth.stability.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Efficiency
                  </span>
                  <div className="flex items-center gap-2">
                    <Progress value={systemHealth.efficiency} className="w-24 h-2" />
                    <span className={`font-mono text-sm ${getHealthColor(systemHealth.efficiency)}`}>
                      {systemHealth.efficiency.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    User Experience
                  </span>
                  <div className="flex items-center gap-2">
                    <Progress value={systemHealth.userExperience} className="w-24 h-2" />
                    <span className={`font-mono text-sm ${getHealthColor(systemHealth.userExperience)}`}>
                      {systemHealth.userExperience.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for detailed views */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Optimization History</TabsTrigger>
          <TabsTrigger value="trends">Trends & Analytics</TabsTrigger>
          <TabsTrigger value="settings">Engine Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Optimizations</CardTitle>
            </CardHeader>
            <CardContent>
              {optimizationHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No optimizations have been performed yet.
                  <br />
                  <Button onClick={handleManualOptimization} className="mt-4">
                    Run First Optimization
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {optimizationHistory.map((opt, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-lg border"
                    >
                      <div className="flex-shrink-0">
                        {opt.success ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{opt.impact}</h4>
                          {opt.success && (
                            <div className="flex items-center gap-1">
                              {getImprovementIcon(opt.improvement)}
                              <span className="text-sm font-mono">
                                +{opt.improvement.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {opt.details}
                        </p>
                        {opt.recommendations && opt.recommendations.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {opt.recommendations.slice(0, 3).map((rec, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {rec}
                              </Badge>
                            ))}
                            {opt.recommendations.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{opt.recommendations.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {systemHealth && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Improving Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {systemHealth.trends.improving.length === 0 ? (
                      <p className="text-muted-foreground">No significant improvements detected.</p>
                    ) : (
                      <div className="space-y-2">
                        {systemHealth.trends.improving.map((trend, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="text-sm">{trend}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-orange-500" />
                      Areas Needing Attention
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {systemHealth.trends.declining.length === 0 ? (
                      <p className="text-muted-foreground">All systems stable.</p>
                    ) : (
                      <div className="space-y-2">
                        {systemHealth.trends.declining.map((trend, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-orange-500" />
                            <span className="text-sm">{trend}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Engine Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Optimization Interval</label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="30">30 seconds</option>
                      <option value="60" selected>1 minute</option>
                      <option value="300">5 minutes</option>
                      <option value="600">10 minutes</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Optimization Aggressiveness</label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="conservative">Conservative</option>
                      <option value="balanced" selected>Balanced</option>
                      <option value="aggressive">Aggressive</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Active Optimization Rules</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'Memory Cleanup', enabled: true, priority: 'High' },
                      { name: 'Cache Optimization', enabled: true, priority: 'Medium' },
                      { name: 'Bundle Optimization', enabled: true, priority: 'Medium' },
                      { name: 'Bounce Rate Optimization', enabled: true, priority: 'High' },
                      { name: 'Interaction Optimization', enabled: false, priority: 'Medium' },
                      { name: 'Error Rate Reduction', enabled: true, priority: 'Critical' },
                      { name: 'Response Time Optimization', enabled: true, priority: 'High' },
                    ].map((rule, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{rule.name}</div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {rule.priority}
                          </Badge>
                        </div>
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          className="w-4 h-4"
                          readOnly
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Defaults
                  </Button>
                  <Button>
                    Save Configuration
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemOptimizationDashboard; 