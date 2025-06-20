import axios from "axios";
export class VercelClient {
    client;
    teamId;
    constructor(token, teamId) {
        this.teamId = teamId;
        this.client = axios.create({
            baseURL: 'https://api.vercel.com',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    }
    // Deployments
    async listDeployments(filters = {}) {
        const params = new URLSearchParams();
        if (filters.limit)
            params.append('limit', filters.limit.toString());
        if (filters.since)
            params.append('since', filters.since.toString());
        if (filters.until)
            params.append('until', filters.until.toString());
        if (filters.state)
            params.append('state', filters.state);
        if (filters.target)
            params.append('target', filters.target);
        if (filters.projectId)
            params.append('projectId', filters.projectId);
        if (this.teamId)
            params.append('teamId', this.teamId);
        const response = await this.client.get(`/v6/deployments?${params}`);
        return response.data.deployments || [];
    }
    async getDeployment(deploymentId) {
        try {
            const params = new URLSearchParams();
            if (this.teamId)
                params.append('teamId', this.teamId);
            const response = await this.client.get(`/v13/deployments/${deploymentId}?${params}`);
            return response.data;
        }
        catch (error) {
            console.error('Erro ao buscar deployment:', error);
            return null;
        }
    }
    // Projects
    async listProjects(limit = 20) {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        if (this.teamId)
            params.append('teamId', this.teamId);
        const response = await this.client.get(`/v9/projects?${params}`);
        return response.data.projects || [];
    }
    async getProject(projectId) {
        try {
            const params = new URLSearchParams();
            if (this.teamId)
                params.append('teamId', this.teamId);
            const response = await this.client.get(`/v9/projects/${projectId}?${params}`);
            return response.data;
        }
        catch (error) {
            console.error('Erro ao buscar projeto:', error);
            return null;
        }
    }
    // Environment Variables
    async getEnvironmentVariables(projectId) {
        try {
            const params = new URLSearchParams();
            if (this.teamId)
                params.append('teamId', this.teamId);
            const response = await this.client.get(`/v9/projects/${projectId}/env?${params}`);
            return response.data.envs || [];
        }
        catch (error) {
            console.error('Erro ao buscar variáveis de ambiente:', error);
            return [];
        }
    }
    // Teams
    async listTeams() {
        try {
            const response = await this.client.get('/v2/teams');
            return response.data.teams || [];
        }
        catch (error) {
            console.error('Erro ao buscar teams:', error);
            return [];
        }
    }
    // Utility methods
    async getProjectByName(name) {
        const projects = await this.listProjects(100);
        return projects.find(p => p.name === name) || null;
    }
    async getLatestDeployment(projectId) {
        const deployments = await this.listDeployments({
            projectId,
            limit: 1,
            target: 'production'
        });
        return deployments[0] || null;
    }
    formatDeploymentStatus(deployment) {
        const statusEmojis = {
            'READY': '✅',
            'BUILDING': '🔄',
            'ERROR': '❌',
            'INITIALIZING': '⏳',
            'QUEUED': '📋',
            'CANCELED': '🚫'
        };
        const emoji = statusEmojis[deployment.state] || '❓';
        const duration = deployment.readyAt && deployment.createdAt
            ? `(${Math.round((deployment.readyAt - deployment.createdAt) / 1000)}s)`
            : '';
        return `${emoji} ${deployment.state} ${duration}`;
    }
}
//# sourceMappingURL=vercel-client.js.map