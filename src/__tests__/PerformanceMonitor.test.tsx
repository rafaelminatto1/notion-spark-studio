
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PerformanceMonitor from '../components/PerformanceMonitor/index';

// Mock do Supabase
vi.mock('../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null })
    }))
  }
}));

// Mock do SupabaseMonitoringService
vi.mock('../services/supabaseMonitoring', () => ({
  supabaseMonitoring: {
    recordAnalytics: vi.fn(),
    recordError: vi.fn(),
    trackPageView: vi.fn(),
    trackUserAction: vi.fn(),
    trackPerformance: vi.fn(),
    getSessionMetrics: vi.fn(() => ({
      sessionId: 'test-session-123',
      queueSize: 0
    }))
  }
}));

// Mock da performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1024 * 1024 * 50,
      totalJSHeapSize: 1024 * 1024 * 100
    }
  }
});

global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
  setTimeout(cb, 16);
  return 1;
});

describe('PerformanceMonitor', () => {
  it('deve renderizar botão de ativação', () => {
    render(<PerformanceMonitor />);
    const button = screen.getByRole('button');
    expect(button).toBeDefined();
  });

  it('deve abrir monitor quando clicado', () => {
    render(<PerformanceMonitor />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('Performance Monitor')).toBeDefined();
  });

  it('deve exibir métricas FPS e Memory', () => {
    render(<PerformanceMonitor />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('FPS')).toBeDefined();
    expect(screen.getByText('Memory')).toBeDefined();
  });
});
