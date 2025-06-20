export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  type: 'LAMBDAS';
  target: 'production' | 'staging';
  projectId: string;
  createdAt: number;
  buildingAt?: number;
  readyAt?: number;
  source: 'cli' | 'git' | 'import';
  creator: {
    uid: string;
    username: string;
  };
  meta?: Record<string, any>;
  regions: string[];
}

export interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  createdAt: number;
  updatedAt: number;
  framework: string;
  devCommand?: string;
  buildCommand?: string;
  outputDirectory?: string;
  rootDirectory?: string;
  directoryListing: boolean;
  nodeVersion: string;
}

export interface VercelEnvironmentVariable {
  id: string;
  key: string;
  value: string;
  target: ('production' | 'preview' | 'development')[];
  gitBranch?: string;
  type: 'system' | 'secret' | 'encrypted' | 'plain';
  createdAt: number;
  updatedAt: number;
}

export interface VercelTeam {
  id: string;
  slug: string;
  name: string;
  createdAt: number;
  avatar?: string;
}

export interface VercelAPIResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    count: number;
    next?: number;
    prev?: number;
  };
}

export interface DeploymentFilters {
  limit?: number;
  since?: number;
  until?: number;
  state?: VercelDeployment['state'];
  target?: VercelDeployment['target'];
  projectId?: string;
} 