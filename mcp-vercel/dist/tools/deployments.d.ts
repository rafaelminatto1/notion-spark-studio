import { VercelClient } from '../vercel-client.js';
export declare const deploymentTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            limit: {
                type: string;
                description: string;
                default: number;
            };
            state: {
                type: string;
                enum: string[];
                description: string;
            };
            target: {
                type: string;
                enum: string[];
                description: string;
            };
            projectId: {
                type: string;
                description: string;
                required?: undefined;
            };
            deploymentId?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            deploymentId: {
                type: string;
                description: string;
                required: boolean;
            };
            limit?: undefined;
            state?: undefined;
            target?: undefined;
            projectId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            projectId: {
                type: string;
                description: string;
                required: boolean;
            };
            limit?: undefined;
            state?: undefined;
            target?: undefined;
            deploymentId?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleDeploymentTool(name: string, args: any, vercelClient: VercelClient): Promise<any>;
//# sourceMappingURL=deployments.d.ts.map