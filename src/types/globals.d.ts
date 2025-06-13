// Tipos globais para o projeto

declare global {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }

  interface Window {
    beforeinstallprompt?: BeforeInstallPromptEvent;
  }

  interface PerformanceNavigationTiming {
    navigationStart?: number;
    loadEventEnd?: number;
  }
}

// Tipos para TextOperation que estão sendo usados
export interface TextOperation {
  id: string;
  type: 'insert' | 'delete' | 'retain';
  position: number;
  text?: string;
  length?: number;
  timestamp: number;
  userId: string;
  userName: string;
  documentVersion: number;
}

// Tipos para WebSocket messages
export interface WebSocketMessage {
  type: string;
  userId: string;
  timestamp: number;
  data?: any;
}

export {}; 