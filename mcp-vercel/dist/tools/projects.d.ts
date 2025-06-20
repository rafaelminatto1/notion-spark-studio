import { VercelClient } from '../vercel-client.js';
export declare const projectTools: ({
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
            projectId?: undefined;
            name?: undefined;
        };
        required?: undefined;
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
            name?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            name: {
                type: string;
                description: string;
                required: boolean;
            };
            limit?: undefined;
            projectId?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleProjectTool(name: string, args: any, vercelClient: VercelClient): Promise<any>;
//# sourceMappingURL=projects.d.ts.map