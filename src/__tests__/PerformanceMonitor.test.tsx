import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PerformanceMonitor } from '../components/PerformanceMonitor/index';

// Mock do Supabase
jest.mock('../integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      update: jest.fn().mockResolvedValue({ data: null, error: null }),
      delete: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  }
}));

// Mock do SupabaseMonitoringService
jest.mock('../services/supabaseMonitoring', () => ({
  supabaseMonitoring: {
    recordAnalytics: jest.fn(),
    recordError: jest.fn(),
    trackPageView: jest.fn(),
    trackUserAction: jest.fn(),
    trackPerformance: jest.fn(),
    getSessionMetrics: jest.fn(() => ({
      sessionId: 'test-session-123',
      queueSize: 0
    }))
  }
}));

// Mock básico da performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1024 * 1024 * 50,
      totalJSHeapSize: 1024 * 1024 * 100
    }
  }
});

global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});

describe('PerformanceMonitor', () => {
  it('deve renderizar botão de ativação', () => {
    render(<PerformanceMonitor />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('deve abrir monitor quando clicado', () => {
    render(<PerformanceMonitor />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('Performance Monitor')).toBeInTheDocument();
  });

  it('deve exibir métricas FPS e Memory', () => {
    render(<PerformanceMonitor />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('FPS')).toBeInTheDocument();
    expect(screen.getByText('Memory')).toBeInTheDocument();
  });
}); 