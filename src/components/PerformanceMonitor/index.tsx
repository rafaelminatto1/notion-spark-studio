import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Cpu, MemoryStick, Gauge, Database, Globe, AlertTriangle } from 'lucide-react';
import { supabaseMonitoring } from '@/services/supabaseMonitoring';

interface PerformanceMetrics {
  fps: number;
  memory: number;
  renderTime: number;
  score: number;
  vitals: {
    fcp?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
  };
  errors: number;
  analytics: {
    sessionId: string;
    queueSize: number;
  };
}

export const PerformanceMonitor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: 0,
    renderTime: 0,
    score: 100,
    vitals: {},
    errors: 0,
    analytics: {
      sessionId: '',
      queueSize: 0
    }
  });

  const fpsCounter = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    if (!isVisible) return;

    const updateMetrics = () => {
      const now = performance.now();
      const delta = now - lastTime.current;
      lastTime.current = now;
      
      if (delta > 0) {
        fpsCounter.current = Math.round(1000 / delta);
      }

      // Monitor memory if available
      const perfMemory = performance as unknown as { memory?: { usedJSHeapSize: number } };
      const memoryUsage = perfMemory.memory?.usedJSHeapSize 
        ? Math.round(perfMemory.memory.usedJSHeapSize / 1024 / 1024) 
        : 0;

      const sessionMetrics = supabaseMonitoring.getSessionMetrics();
      
      setMetrics({
        fps: fpsCounter.current,
        memory: memoryUsage,
        renderTime: delta,
        score: fpsCounter.current > 50 ? 100 : Math.round((fpsCounter.current / 60) * 100),
        vitals: {
          // Web Vitals will be populated by the monitoring service
        },
        errors: 0, // TODO: Get from monitoring service
        analytics: {
          sessionId: sessionMetrics.sessionId,
          queueSize: sessionMetrics.queueSize
        }
      });

      if (isVisible) {
        requestAnimationFrame(updateMetrics);
      }
    };

    requestAnimationFrame(updateMetrics);
  }, [isVisible]);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => { setIsVisible(true); }}
          className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
          size="icon"
        >
          <Activity className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 bg-white dark:bg-gray-900 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Performance</CardTitle>
              <Badge variant={metrics.score > 80 ? "default" : "destructive"}>
                {metrics.score}%
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setIsVisible(false); }}
              className="h-8 w-8"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <Gauge className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-sm font-medium">FPS</div>
                <div className="text-xl font-bold text-blue-600">{metrics.fps}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <MemoryStick className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm font-medium">Memory</div>
                <div className="text-xl font-bold text-green-600">{metrics.memory}MB</div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <Cpu className="h-4 w-4 text-orange-600" />
            <div className="flex-1">
              <div className="text-sm font-medium">Render Time</div>
              <div className="text-lg font-bold text-orange-600">{metrics.renderTime.toFixed(1)}ms</div>
            </div>
          </div>
          
          {/* Analytics & Monitoring Section */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              <Database className="h-4 w-4" />
              Monitoramento Avançado
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-950/20 rounded">
                <Globe className="h-3 w-3 text-purple-600" />
                <div>
                  <div className="text-xs font-medium">Queue</div>
                  <div className="text-sm font-bold text-purple-600">{metrics.analytics.queueSize}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded">
                <AlertTriangle className="h-3 w-3 text-red-600" />
                <div>
                  <div className="text-xs font-medium">Errors</div>
                  <div className="text-sm font-bold text-red-600">{metrics.errors}</div>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              Session: {metrics.analytics.sessionId.slice(0, 8)}...
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitor; 