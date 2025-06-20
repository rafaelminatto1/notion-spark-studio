import { VercelDeployment, VercelProject, VercelEnvironmentVariable, VercelTeam, DeploymentFilters } from './types.js';
export declare class VercelClient {
    private client;
    private teamId?;
    constructor(token: string, teamId?: string);
    listDeployments(filters?: DeploymentFilters): Promise<VercelDeployment[]>;
    getDeployment(deploymentId: string): Promise<VercelDeployment | null>;
    listProjects(limit?: number): Promise<VercelProject[]>;
    getProject(projectId: string): Promise<VercelProject | null>;
    getEnvironmentVariables(projectId: string): Promise<VercelEnvironmentVariable[]>;
    listTeams(): Promise<VercelTeam[]>;
    getProjectByName(name: string): Promise<VercelProject | null>;
    getLatestDeployment(projectId: string): Promise<VercelDeployment | null>;
    formatDeploymentStatus(deployment: VercelDeployment): string;
}
//# sourceMappingURL=vercel-client.d.ts.map