import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Zap, Monitor, Clock, Cpu, HardDrive, Wifi, Battery, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  
  // Runtime Performance
  fps: number;
  memoryUsage: number;
  memoryLimit: number;
  cpuUsage: number;
  
  // Network
  networkLatency: number;
  bandwidth: number;
  
  // Storage
  storageUsed: number;
  storageQuota: number;
  
  // Battery (if available)
  batteryLevel: number;
  isCharging: boolean;
  
  // Custom Metrics
  renderTime: number;
  interactionDelay: number;
  cacheHitRate: number;
}

interface PerformanceScore {
  overall: number;
  performance: number;
  memory: number;
  network: number;
  interactivity: number;
}

export const UltimatePerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: 0, fid: 0, cls: 0, fcp: 0, ttfb: 0,
    fps: 60, memoryUsage: 0, memoryLimit: 0, cpuUsage: 0,
    networkLatency: 0, bandwidth: 0,
    storageUsed: 0, storageQuota: 0,
    batteryLevel: 100, isCharging: false,
    renderTime: 0, interactionDelay: 0, cacheHitRate: 0
  });
  
  const [score, setScore] = useState<PerformanceScore>({
    overall: 100, performance: 100, memory: 100, network: 100, interactivity: 100
  });
  
  const [isMonitoring, setIsMonitoring] = useState(false);

  const collectMetrics = useCallback(async () => {
    const newMetrics = { ...metrics };
    
    // Core Web Vitals
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        newMetrics.fcp = navigation.loadEventEnd - navigation.loadEventStart;
        newMetrics.ttfb = navigation.responseStart - navigation.requestStart;
      }
      
      // FPS calculation
      const now = performance.now();
      requestAnimationFrame(() => {
        const fps = 1000 / (performance.now() - now);
        newMetrics.fps = Math.min(fps, 60);
      });
    }
    
    // Memory Usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      newMetrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024;
      newMetrics.memoryLimit = memory.jsHeapSizeLimit / 1024 / 1024;
    }
    
    // Network
    const connection = (navigator as any).connection;
    if (connection) {
      newMetrics.networkLatency = connection.rtt || 0;
      newMetrics.bandwidth = connection.downlink || 0;
    }
    
    // Storage
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        newMetrics.storageUsed = (estimate.usage || 0) / 1024 / 1024;
        newMetrics.storageQuota = (estimate.quota || 0) / 1024 / 1024;
      } catch (error) {
        console.warn('Storage estimate failed:', error);
      }
    }
    
    // Battery
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        newMetrics.batteryLevel = battery.level * 100;
        newMetrics.isCharging = battery.charging;
      } catch (error) {
        console.warn('Battery API failed:', error);
      }
    }
    
    setMetrics(newMetrics);
    calculateScore(newMetrics);
  }, [metrics]);

  const calculateScore = useCallback((metrics: PerformanceMetrics) => {
    // Performance score based on Core Web Vitals
    const performanceScore = Math.max(0, 100 - (metrics.fcp / 10) - (metrics.lcp / 25));
    
    // Memory score
    const memoryScore = Math.max(0, 100 - (metrics.memoryUsage / metrics.memoryLimit * 100));
    
    // Network score
    const networkScore = Math.max(0, 100 - (metrics.networkLatency / 10));
    
    // Interactivity score
    const interactivityScore = Math.max(0, 100 - (metrics.fid * 10) - (metrics.cls * 1000));
    
    // Overall score
    const overall = (performanceScore + memoryScore + networkScore + interactivityScore) / 4;
    
    setScore({
      overall: Math.round(overall),
      performance: Math.round(performanceScore),
      memory: Math.round(memoryScore),
      network: Math.round(networkScore),
      interactivity: Math.round(interactivityScore),
    });
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isMonitoring) {
      interval = setInterval(collectMetrics, 1000);
      collectMetrics(); // Initial collection
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, collectMetrics]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ultimate Performance Monitor</h2>
          <p className="text-muted-foreground">Real-time system performance analysis</p>
        </div>
        <Button
          onClick={() => setIsMonitoring(!isMonitoring)}
          variant={isMonitoring ? "destructive" : "default"}
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </Button>
      </div>

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(score.overall)}`}>
                {score.overall}
              </div>
              <div className="text-sm text-muted-foreground">
                {getScoreLabel(score.overall)}
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Performance</span>
                <Badge variant="outline" className={getScoreColor(score.performance)}>
                  {score.performance}
                </Badge>
              </div>
              <Progress value={score.performance} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Memory</span>
                <Badge variant="outline" className={getScoreColor(score.memory)}>
                  {score.memory}
                </Badge>
              </div>
              <Progress value={score.memory} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Network</span>
                <Badge variant="outline" className={getScoreColor(score.network)}>
                  {score.network}
                </Badge>
              </div>
              <Progress value={score.network} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Interactivity</span>
                <Badge variant="outline" className={getScoreColor(score.interactivity)}>
                  {score.interactivity}
                </Badge>
              </div>
              <Progress value={score.interactivity} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Core Web Vitals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Core Web Vitals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>LCP</span>
              <span className="font-mono">{metrics.lcp.toFixed(0)}ms</span>
            </div>
            <div className="flex justify-between">
              <span>FID</span>
              <span className="font-mono">{metrics.fid.toFixed(0)}ms</span>
            </div>
            <div className="flex justify-between">
              <span>CLS</span>
              <span className="font-mono">{metrics.cls.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span>FCP</span>
              <span className="font-mono">{metrics.fcp.toFixed(0)}ms</span>
            </div>
            <div className="flex justify-between">
              <span>TTFB</span>
              <span className="font-mono">{metrics.ttfb.toFixed(0)}ms</span>
            </div>
          </CardContent>
        </Card>

        {/* Runtime Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Runtime Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>FPS</span>
              <span className="font-mono">{metrics.fps.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Memory Usage</span>
              <span className="font-mono">{metrics.memoryUsage.toFixed(1)}MB</span>
            </div>
            <div className="flex justify-between">
              <span>Memory Limit</span>
              <span className="font-mono">{metrics.memoryLimit.toFixed(1)}MB</span>
            </div>
            <div className="flex justify-between">
              <span>CPU Usage</span>
              <span className="font-mono">{metrics.cpuUsage.toFixed(1)}%</span>
            </div>
            <Progress 
              value={(metrics.memoryUsage / metrics.memoryLimit) * 100} 
              className="h-2"
            />
          </CardContent>
        </Card>

        {/* Network & Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              Network & Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Latency</span>
              <span className="font-mono">{metrics.networkLatency}ms</span>
            </div>
            <div className="flex justify-between">
              <span>Bandwidth</span>
              <span className="font-mono">{metrics.bandwidth.toFixed(1)}Mbps</span>
            </div>
            <div className="flex justify-between">
              <span>Storage Used</span>
              <span className="font-mono">{metrics.storageUsed.toFixed(1)}MB</span>
            </div>
            <div className="flex justify-between">
              <span>Storage Quota</span>
              <span className="font-mono">{metrics.storageQuota.toFixed(1)}MB</span>
            </div>
            <Progress 
              value={(metrics.storageUsed / metrics.storageQuota) * 100} 
              className="h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Battery Status */}
      {metrics.batteryLevel > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Battery className="w-5 h-5" />
              Battery Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span>Battery Level</span>
                  <span className="font-mono">{metrics.batteryLevel.toFixed(0)}%</span>
                </div>
                <Progress value={metrics.batteryLevel} className="h-3" />
              </div>
              <Badge variant={metrics.isCharging ? "default" : "secondary"}>
                {metrics.isCharging ? 'Charging' : 'Not Charging'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UltimatePerformanceMonitor; 