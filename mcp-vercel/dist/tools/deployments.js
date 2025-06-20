export const deploymentTools = [
    {
        name: 'vercel-list-deployments',
        description: 'Lista deployments da Vercel com filtros opcionais',
        inputSchema: {
            type: 'object',
            properties: {
                limit: {
                    type: 'number',
                    description: 'Número máximo de deployments para retornar (padrão: 10)',
                    default: 10
                },
                state: {
                    type: 'string',
                    enum: ['BUILDING', 'ERROR', 'INITIALIZING', 'QUEUED', 'READY', 'CANCELED'],
                    description: 'Filtrar por status do deployment'
                },
                target: {
                    type: 'string',
                    enum: ['production', 'staging'],
                    description: 'Filtrar por ambiente (production/staging)'
                },
                projectId: {
                    type: 'string',
                    description: 'ID do projeto para filtrar deployments'
                }
            }
        }
    },
    {
        name: 'vercel-get-deployment',
        description: 'Obtém detalhes específicos de um deployment',
        inputSchema: {
            type: 'object',
            properties: {
                deploymentId: {
                    type: 'string',
                    description: 'ID único do deployment',
                    required: true
                }
            },
            required: ['deploymentId']
        }
    },
    {
        name: 'vercel-get-latest-deployment',
        description: 'Obtém o deployment mais recente de um projeto',
        inputSchema: {
            type: 'object',
            properties: {
                projectId: {
                    type: 'string',
                    description: 'ID do projeto',
                    required: true
                }
            },
            required: ['projectId']
        }
    }
];
export async function handleDeploymentTool(name, args, vercelClient) {
    switch (name) {
        case 'vercel-list-deployments': {
            const filters = {
                limit: args.limit || 10,
                state: args.state,
                target: args.target,
                projectId: args.projectId
            };
            const deployments = await vercelClient.listDeployments(filters);
            return {
                content: [{
                        type: 'text',
                        text: `📋 **Deployments encontrados: ${deployments.length}**\n\n` +
                            deployments.map(d => `${vercelClient.formatDeploymentStatus(d)} **${d.name}**\n` +
                                `   🔗 URL: https://${d.url}\n` +
                                `   📅 Criado: ${new Date(d.createdAt).toLocaleString('pt-BR')}\n` +
                                `   🎯 Target: ${d.target}\n` +
                                `   📋 ID: ${d.uid}\n`).join('\n')
                    }]
            };
        }
        case 'vercel-get-deployment': {
            const deployment = await vercelClient.getDeployment(args.deploymentId);
            if (!deployment) {
                return {
                    content: [{
                            type: 'text',
                            text: `❌ Deployment não encontrado: ${args.deploymentId}`
                        }]
                };
            }
            return {
                content: [{
                        type: 'text',
                        text: `📦 **Detalhes do Deployment**\n\n` +
                            `${vercelClient.formatDeploymentStatus(deployment)} **${deployment.name}**\n` +
                            `🔗 **URL:** https://${deployment.url}\n` +
                            `📋 **ID:** ${deployment.uid}\n` +
                            `📅 **Criado:** ${new Date(deployment.createdAt).toLocaleString('pt-BR')}\n` +
                            `🎯 **Target:** ${deployment.target}\n` +
                            `🌍 **Regiões:** ${deployment.regions.join(', ')}\n` +
                            `👤 **Criador:** ${deployment.creator.username}\n` +
                            `📝 **Fonte:** ${deployment.source}\n`
                    }]
            };
        }
        case 'vercel-get-latest-deployment': {
            const deployment = await vercelClient.getLatestDeployment(args.projectId);
            if (!deployment) {
                return {
                    content: [{
                            type: 'text',
                            text: `❌ Nenhum deployment encontrado para o projeto: ${args.projectId}`
                        }]
                };
            }
            return {
                content: [{
                        type: 'text',
                        text: `🚀 **Deployment Mais Recente**\n\n` +
                            `${vercelClient.formatDeploymentStatus(deployment)} **${deployment.name}**\n` +
                            `🔗 **URL:** https://${deployment.url}\n` +
                            `📅 **Criado:** ${new Date(deployment.createdAt).toLocaleString('pt-BR')}\n` +
                            `🎯 **Target:** ${deployment.target}\n`
                    }]
            };
        }
        default:
            throw new Error(`Ferramenta desconhecida: ${name}`);
    }
}
//# sourceMappingURL=deployments.js.map