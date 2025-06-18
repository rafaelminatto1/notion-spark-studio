interface LoadMetrics {
  cpu_usage: number;
  memory_usage: number;
  active_connections: number;
  request_rate: number; // requests per second
  response_time: number; // milliseconds
  error_rate: number; // percentage
  database_connections: number;
  queue_size: number;
  timestamp: string;
}

interface ScalingRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: {
    metric: keyof LoadMetrics;
    threshold: number;
    duration: number; // seconds
    comparison: 'greater_than' | 'less_than';
  };
  action: {
    type: 'scale_up' | 'scale_down' | 'load_balance' | 'cache_clear' | 'alert';
    parameters: {
      instances?: number;
      percentage?: number;
      target_regions?: string[];
      notification_channels?: string[];
    };
  };
  cooldown: number; // seconds
  priority: number;
}

interface ServerInstance {
  id: string;
  region: string;
  type: 'web' | 'api' | 'database' | 'cache' | 'worker';
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  capacity: {
    max_connections: number;
    max_cpu: number;
    max_memory: number;
  };
  current_load: LoadMetrics;
  health_score: number;
  created_at: string;
  last_health_check: string;
}

interface TrafficDistribution {
  total_requests: number;
  instances: {
    [instanceId: string]: {
      requests: number;
      percentage: number;
      health_score: number;
    };
  };
  regional_distribution: {
    [region: string]: {
      requests: number;
      percentage: number;
      average_response_time: number;
    };
  };
}

interface PredictiveScaling {
  enabled: boolean;
  model_accuracy: number;
  predictions: {
    next_hour: {
      expected_load: number;
      confidence: number;
      recommended_instances: number;
    };
    next_day: {
      expected_load: number;
      confidence: number;
      recommended_instances: number;
    };
    next_week: {
      expected_load: number;
      confidence: number;
      recommended_instances: number;
    };
  };
  historical_patterns: {
    daily_peak_hours: number[];
    weekly_peak_days: number[];
    seasonal_trends: any[];
  };
}

class AutoScalingService {
  private static instance: AutoScalingService;
  private instances: ServerInstance[] = [];
  private scalingRules: ScalingRule[] = [];
  private currentMetrics: LoadMetrics;
  private trafficDistribution: TrafficDistribution;
  private predictiveScaling: PredictiveScaling;
  private isMonitoring = false;
  private lastScalingAction = 0;

  public static getInstance(): AutoScalingService {
    if (!AutoScalingService.instance) {
      AutoScalingService.instance = new AutoScalingService();
    }
    return AutoScalingService.instance;
  }

  constructor() {
    this.initializeDefaultRules();
    this.initializeInstances();
    this.initializePredictiveScaling();
    this.startMonitoring();
  }

  private initializeDefaultRules(): void {
    this.scalingRules = [
      {
        id: 'cpu-scale-up',
        name: 'CPU Scale Up',
        enabled: true,
        trigger: {
          metric: 'cpu_usage',
          threshold: 80,
          duration: 300, // 5 minutes
          comparison: 'greater_than'
        },
        action: {
          type: 'scale_up',
          parameters: {
            instances: 2,
            target_regions: ['us-east-1', 'eu-west-1']
          }
        },
        cooldown: 600, // 10 minutes
        priority: 1
      },
      {
        id: 'memory-scale-up',
        name: 'Memory Scale Up',
        enabled: true,
        trigger: {
          metric: 'memory_usage',
          threshold: 85,
          duration: 180,
          comparison: 'greater_than'
        },
        action: {
          type: 'scale_up',
          parameters: {
            instances: 1,
            target_regions: ['us-east-1']
          }
        },
        cooldown: 300,
        priority: 2
      },
      {
        id: 'response-time-scale-up',
        name: 'Response Time Scale Up',
        enabled: true,
        trigger: {
          metric: 'response_time',
          threshold: 2000, // 2 seconds
          duration: 120,
          comparison: 'greater_than'
        },
        action: {
          type: 'scale_up',
          parameters: {
            instances: 3,
            target_regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1']
          }
        },
        cooldown: 300,
        priority: 3
      },
      {
        id: 'low-traffic-scale-down',
        name: 'Low Traffic Scale Down',
        enabled: true,
        trigger: {
          metric: 'cpu_usage',
          threshold: 20,
          duration: 1800, // 30 minutes
          comparison: 'less_than'
        },
        action: {
          type: 'scale_down',
          parameters: {
            percentage: 25 // Remove 25% of instances
          }
        },
        cooldown: 1800,
        priority: 10
      }
    ];
  }

  private initializeInstances(): void {
    // Simulate initial instances
    this.instances = [
      {
        id: 'web-us-east-1-001',
        region: 'us-east-1',
        type: 'web',
        status: 'running',
        capacity: {
          max_connections: 1000,
          max_cpu: 100,
          max_memory: 100
        },
        current_load: this.generateMockMetrics(),
        health_score: 95,
        created_at: new Date().toISOString(),
        last_health_check: new Date().toISOString()
      },
      {
        id: 'api-us-east-1-001',
        region: 'us-east-1',
        type: 'api',
        status: 'running',
        capacity: {
          max_connections: 2000,
          max_cpu: 100,
          max_memory: 100
        },
        current_load: this.generateMockMetrics(),
        health_score: 98,
        created_at: new Date().toISOString(),
        last_health_check: new Date().toISOString()
      }
    ];

    this.updateTrafficDistribution();
  }

  private initializePredictiveScaling(): void {
    this.predictiveScaling = {
      enabled: true,
      model_accuracy: 87.5,
      predictions: {
        next_hour: {
          expected_load: 65,
          confidence: 92,
          recommended_instances: 3
        },
        next_day: {
          expected_load: 78,
          confidence: 85,
          recommended_instances: 4
        },
        next_week: {
          expected_load: 82,
          confidence: 78,
          recommended_instances: 5
        }
      },
      historical_patterns: {
        daily_peak_hours: [9, 10, 11, 14, 15, 16], // Business hours
        weekly_peak_days: [1, 2, 3, 4, 5], // Weekdays
        seasonal_trends: []
      }
    };
  }

  private startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Monitor metrics every 30 seconds
    setInterval(() => {
      this.collectMetrics();
      this.evaluateScalingRules();
      this.updateHealthScores();
    }, 30000);

    // Update predictions every 5 minutes
    setInterval(() => {
      this.updatePredictions();
    }, 300000);

    // Perform health checks every minute
    setInterval(() => {
      this.performHealthChecks();
    }, 60000);

    // Optimize traffic distribution every 2 minutes
    setInterval(() => {
      this.optimizeTrafficDistribution();
    }, 120000);

    console.log('[AutoScaling] Monitoring started');
  }

  private collectMetrics(): void {
    // Aggregate metrics from all instances
    const allMetrics = this.instances.map(instance => instance.current_load);
    
    this.currentMetrics = {
      cpu_usage: this.calculateAverage(allMetrics.map(m => m.cpu_usage)),
      memory_usage: this.calculateAverage(allMetrics.map(m => m.memory_usage)),
      active_connections: allMetrics.reduce((sum, m) => sum + m.active_connections, 0),
      request_rate: allMetrics.reduce((sum, m) => sum + m.request_rate, 0),
      response_time: this.calculateAverage(allMetrics.map(m => m.response_time)),
      error_rate: this.calculateAverage(allMetrics.map(m => m.error_rate)),
      database_connections: allMetrics.reduce((sum, m) => sum + m.database_connections, 0),
      queue_size: allMetrics.reduce((sum, m) => sum + m.queue_size, 0),
      timestamp: new Date().toISOString()
    };

    // Update individual instance metrics
    this.instances.forEach(instance => {
      instance.current_load = this.generateMockMetrics();
    });

    this.updateTrafficDistribution();
  }

  private generateMockMetrics(): LoadMetrics {
    // Generate realistic metrics with some randomness
    const baseLoad = 40 + Math.sin(Date.now() / 3600000) * 20; // Sine wave pattern
    
    return {
      cpu_usage: Math.max(0, Math.min(100, baseLoad + (Math.random() - 0.5) * 30)),
      memory_usage: Math.max(0, Math.min(100, baseLoad + (Math.random() - 0.5) * 25)),
      active_connections: Math.floor(200 + Math.random() * 800),
      request_rate: Math.floor(50 + Math.random() * 200),
      response_time: Math.floor(100 + Math.random() * 500),
      error_rate: Math.random() * 5,
      database_connections: Math.floor(10 + Math.random() * 50),
      queue_size: Math.floor(Math.random() * 100),
      timestamp: new Date().toISOString()
    };
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private evaluateScalingRules(): void {
    const now = Date.now();
    
    // Sort rules by priority
    const sortedRules = [...this.scalingRules]
      .filter(rule => rule.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      // Check cooldown
      if (now - this.lastScalingAction < rule.cooldown * 1000) {
        continue;
      }

      const currentValue = this.currentMetrics[rule.trigger.metric];
      const meetsCondition = rule.trigger.comparison === 'greater_than' 
        ? currentValue > rule.trigger.threshold
        : currentValue < rule.trigger.threshold;

      if (meetsCondition) {
        console.log(`[AutoScaling] Rule triggered: ${rule.name} (${currentValue} ${rule.trigger.comparison} ${rule.trigger.threshold})`);
        this.executeScalingAction(rule);
        this.lastScalingAction = now;
        break; // Only execute one rule at a time
      }
    }
  }

  private async executeScalingAction(rule: ScalingRule): Promise<void> {
    console.log(`[AutoScaling] Executing action: ${rule.action.type} for rule: ${rule.name}`);

    switch (rule.action.type) {
      case 'scale_up':
        await this.scaleUp(rule.action.parameters);
        break;
      case 'scale_down':
        await this.scaleDown(rule.action.parameters);
        break;
      case 'load_balance':
        await this.rebalanceTraffic();
        break;
      case 'cache_clear':
        await this.clearCaches();
        break;
      case 'alert':
        await this.sendAlert(rule);
        break;
    }
  }

  private async scaleUp(parameters: any): Promise<void> {
    const instancesToAdd = parameters.instances || 1;
    const targetRegions = parameters.target_regions || ['us-east-1'];

    for (let i = 0; i < instancesToAdd; i++) {
      const region = targetRegions[i % targetRegions.length];
      const newInstance: ServerInstance = {
        id: `web-${region}-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
        region,
        type: 'web',
        status: 'starting',
        capacity: {
          max_connections: 1000,
          max_cpu: 100,
          max_memory: 100
        },
        current_load: {
          cpu_usage: 0,
          memory_usage: 0,
          active_connections: 0,
          request_rate: 0,
          response_time: 0,
          error_rate: 0,
          database_connections: 0,
          queue_size: 0,
          timestamp: new Date().toISOString()
        },
        health_score: 100,
        created_at: new Date().toISOString(),
        last_health_check: new Date().toISOString()
      };

      this.instances.push(newInstance);
      
      // Simulate startup time
      setTimeout(() => {
        newInstance.status = 'running';
        newInstance.current_load = this.generateMockMetrics();
        console.log(`[AutoScaling] Instance ${newInstance.id} is now running`);
      }, 30000); // 30 seconds startup time
    }

    console.log(`[AutoScaling] Scaled up by ${instancesToAdd} instances in regions: ${targetRegions.join(', ')}`);
  }

  private async scaleDown(parameters: any): Promise<void> {
    const percentage = parameters.percentage || 25;
    const runningInstances = this.instances.filter(instance => instance.status === 'running');
    const instancesToRemove = Math.ceil(runningInstances.length * (percentage / 100));

    // Remove instances with lowest health scores first
    const sortedInstances = runningInstances.sort((a, b) => a.health_score - b.health_score);
    
    for (let i = 0; i < Math.min(instancesToRemove, sortedInstances.length - 1); i++) { // Keep at least 1 instance
      const instance = sortedInstances[i];
      instance.status = 'stopping';
      
      setTimeout(() => {
        this.instances = this.instances.filter(inst => inst.id !== instance.id);
        console.log(`[AutoScaling] Instance ${instance.id} has been terminated`);
      }, 10000); // 10 seconds graceful shutdown
    }

    console.log(`[AutoScaling] Scaling down ${instancesToRemove} instances (${percentage}%)`);
  }

  private async rebalanceTraffic(): Promise<void> {
    console.log('[AutoScaling] Rebalancing traffic across instances');
    this.updateTrafficDistribution();
    // Would implement actual load balancer configuration
  }

  private async clearCaches(): Promise<void> {
    console.log('[AutoScaling] Clearing distributed caches');
    // Would implement cache clearing across all instances
  }

  private async sendAlert(rule: ScalingRule): Promise<void> {
    console.warn(`[AutoScaling] ALERT: ${rule.name} - Threshold breached`);
    // Would send to notification channels
  }

  private performHealthChecks(): void {
    this.instances.forEach(instance => {
      if (instance.status === 'running') {
        // Simulate health check
        const healthFactors = [
          instance.current_load.cpu_usage < 90 ? 20 : 0,
          instance.current_load.memory_usage < 95 ? 20 : 0,
          instance.current_load.response_time < 1000 ? 20 : 0,
          instance.current_load.error_rate < 5 ? 20 : 0,
          Math.random() * 20 // Random factor for network, disk, etc.
        ];
        
        instance.health_score = Math.round(healthFactors.reduce((sum, factor) => sum + factor, 0));
        instance.last_health_check = new Date().toISOString();
        
        if (instance.health_score < 50) {
          console.warn(`[AutoScaling] Instance ${instance.id} has low health score: ${instance.health_score}`);
          // Would trigger instance replacement
        }
      }
    });
  }

  private updateHealthScores(): void {
    // Update health scores based on current metrics
    this.instances.forEach(instance => {
      if (instance.status === 'running') {
        const metrics = instance.current_load;
        let score = 100;
        
        // Deduct points for high resource usage
        if (metrics.cpu_usage > 80) score -= 20;
        if (metrics.memory_usage > 80) score -= 20;
        if (metrics.response_time > 1000) score -= 20;
        if (metrics.error_rate > 5) score -= 20;
        
        instance.health_score = Math.max(0, score);
      }
    });
  }

  private updateTrafficDistribution(): void {
    const runningInstances = this.instances.filter(instance => instance.status === 'running');
    const totalRequests = runningInstances.reduce((sum, instance) => sum + instance.current_load.request_rate, 0);

    const instances: TrafficDistribution['instances'] = {};
    const regionalDistribution: TrafficDistribution['regional_distribution'] = {};

    runningInstances.forEach(instance => {
      const instanceRequests = instance.current_load.request_rate;
      const percentage = totalRequests > 0 ? (instanceRequests / totalRequests) * 100 : 0;
      
      instances[instance.id] = {
        requests: instanceRequests,
        percentage: Math.round(percentage * 100) / 100,
        health_score: instance.health_score
      };

      // Regional aggregation
      if (!regionalDistribution[instance.region]) {
        regionalDistribution[instance.region] = {
          requests: 0,
          percentage: 0,
          average_response_time: 0
        };
      }
      
      regionalDistribution[instance.region].requests += instanceRequests;
      regionalDistribution[instance.region].average_response_time += instance.current_load.response_time;
    });

    // Calculate regional percentages and average response times
    Object.keys(regionalDistribution).forEach(region => {
      const regionalData = regionalDistribution[region];
      regionalData.percentage = totalRequests > 0 ? (regionalData.requests / totalRequests) * 100 : 0;
      
      const regionalInstances = runningInstances.filter(instance => instance.region === region);
      regionalData.average_response_time = regionalInstances.length > 0 
        ? regionalData.average_response_time / regionalInstances.length 
        : 0;
    });

    this.trafficDistribution = {
      total_requests: totalRequests,
      instances,
      regional_distribution: regionalDistribution
    };
  }

  private optimizeTrafficDistribution(): void {
    const runningInstances = this.instances.filter(instance => instance.status === 'running');
    
    // Find instances with low health scores or high load
    const overloadedInstances = runningInstances.filter(instance => 
      instance.health_score < 70 || instance.current_load.cpu_usage > 85
    );

    if (overloadedInstances.length > 0) {
      console.log(`[AutoScaling] Optimizing traffic distribution - ${overloadedInstances.length} overloaded instances detected`);
      // Would implement traffic shifting logic
    }
  }

  private updatePredictions(): void {
    // Simulate ML model predictions
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();
    
    // Business hours have higher load
    const hourlyMultiplier = this.predictiveScaling.historical_patterns.daily_peak_hours.includes(currentHour) ? 1.3 : 0.8;
    const dailyMultiplier = this.predictiveScaling.historical_patterns.weekly_peak_days.includes(currentDay) ? 1.2 : 0.9;
    
    const baseLoad = this.currentMetrics.cpu_usage;
    const nextHourLoad = Math.min(100, baseLoad * hourlyMultiplier);
    
    this.predictiveScaling.predictions = {
      next_hour: {
        expected_load: Math.round(nextHourLoad),
        confidence: 85 + Math.random() * 10,
        recommended_instances: Math.ceil(nextHourLoad / 25) // 25% load per instance
      },
      next_day: {
        expected_load: Math.round(baseLoad * dailyMultiplier),
        confidence: 80 + Math.random() * 10,
        recommended_instances: Math.ceil((baseLoad * dailyMultiplier) / 25)
      },
      next_week: {
        expected_load: Math.round(baseLoad * 1.1), // 10% growth assumption
        confidence: 70 + Math.random() * 10,
        recommended_instances: Math.ceil((baseLoad * 1.1) / 25)
      }
    };

    // Proactive scaling based on predictions
    if (this.predictiveScaling.enabled && this.predictiveScaling.predictions.next_hour.confidence > 90) {
      const currentInstanceCount = this.instances.filter(i => i.status === 'running').length;
      const recommendedInstances = this.predictiveScaling.predictions.next_hour.recommended_instances;
      
      if (recommendedInstances > currentInstanceCount + 1) {
        console.log(`[AutoScaling] Proactive scaling: Adding instances based on predictions`);
        this.scaleUp({ instances: 1, target_regions: ['us-east-1'] });
      }
    }
  }

  // Public API methods
  public getCurrentMetrics(): LoadMetrics {
    return { ...this.currentMetrics };
  }

  public getInstances(): ServerInstance[] {
    return [...this.instances];
  }

  public getTrafficDistribution(): TrafficDistribution {
    return { ...this.trafficDistribution };
  }

  public getPredictiveScaling(): PredictiveScaling {
    return { ...this.predictiveScaling };
  }

  public getScalingRules(): ScalingRule[] {
    return [...this.scalingRules];
  }

  public async addScalingRule(rule: Omit<ScalingRule, 'id'>): Promise<string> {
    const newRule: ScalingRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.scalingRules.push(newRule);
    console.log(`[AutoScaling] Added new scaling rule: ${newRule.name}`);
    
    return newRule.id;
  }

  public async updateScalingRule(id: string, updates: Partial<ScalingRule>): Promise<boolean> {
    const ruleIndex = this.scalingRules.findIndex(rule => rule.id === id);
    if (ruleIndex === -1) return false;
    
    this.scalingRules[ruleIndex] = { ...this.scalingRules[ruleIndex], ...updates };
    console.log(`[AutoScaling] Updated scaling rule: ${id}`);
    
    return true;
  }

  public async removeScalingRule(id: string): Promise<boolean> {
    const initialLength = this.scalingRules.length;
    this.scalingRules = this.scalingRules.filter(rule => rule.id !== id);
    
    if (this.scalingRules.length < initialLength) {
      console.log(`[AutoScaling] Removed scaling rule: ${id}`);
      return true;
    }
    
    return false;
  }

  public async manualScale(action: 'up' | 'down', instances: number, regions?: string[]): Promise<void> {
    const parameters = {
      instances,
      target_regions: regions || ['us-east-1']
    };

    if (action === 'up') {
      await this.scaleUp(parameters);
    } else {
      await this.scaleDown({ percentage: (instances / this.instances.length) * 100 });
    }
  }

  public getSystemStatus(): {
    healthy_instances: number;
    total_instances: number;
    average_health_score: number;
    system_load: number;
    auto_scaling_active: boolean;
  } {
    const runningInstances = this.instances.filter(i => i.status === 'running');
    const healthyInstances = runningInstances.filter(i => i.health_score >= 70);
    
    return {
      healthy_instances: healthyInstances.length,
      total_instances: runningInstances.length,
      average_health_score: runningInstances.length > 0 
        ? Math.round(runningInstances.reduce((sum, i) => sum + i.health_score, 0) / runningInstances.length)
        : 0,
      system_load: Math.round(this.currentMetrics.cpu_usage),
      auto_scaling_active: this.isMonitoring
    };
  }
}

export const autoScalingService = AutoScalingService.getInstance();
export default AutoScalingService;
export type { LoadMetrics, ScalingRule, ServerInstance, TrafficDistribution, PredictiveScaling }; 