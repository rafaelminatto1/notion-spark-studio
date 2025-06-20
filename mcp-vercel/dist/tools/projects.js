export const projectTools = [
    {
        name: 'vercel-list-projects',
        description: 'Lista projetos da Vercel',
        inputSchema: {
            type: 'object',
            properties: {
                limit: {
                    type: 'number',
                    description: 'Número máximo de projetos para retornar (padrão: 20)',
                    default: 20
                }
            }
        }
    },
    {
        name: 'vercel-get-project',
        description: 'Obtém detalhes específicos de um projeto',
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
    },
    {
        name: 'vercel-find-project-by-name',
        description: 'Encontra projeto pelo nome',
        inputSchema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Nome do projeto',
                    required: true
                }
            },
            required: ['name']
        }
    },
    {
        name: 'vercel-get-environment-variables',
        description: 'Lista variáveis de ambiente de um projeto',
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
export async function handleProjectTool(name, args, vercelClient) {
    switch (name) {
        case 'vercel-list-projects': {
            const projects = await vercelClient.listProjects(args.limit || 20);
            return {
                content: [{
                        type: 'text',
                        text: `📂 **Projetos encontrados: ${projects.length}**\n\n` +
                            projects.map(p => `🚀 **${p.name}**\n` +
                                `   📋 ID: ${p.id}\n` +
                                `   🛠️ Framework: ${p.framework}\n` +
                                `   📅 Criado: ${new Date(p.createdAt).toLocaleString('pt-BR')}\n` +
                                `   🔧 Node: ${p.nodeVersion}\n`).join('\n')
                    }]
            };
        }
        case 'vercel-get-project': {
            const project = await vercelClient.getProject(args.projectId);
            if (!project) {
                return {
                    content: [{
                            type: 'text',
                            text: `❌ Projeto não encontrado: ${args.projectId}`
                        }]
                };
            }
            return {
                content: [{
                        type: 'text',
                        text: `📦 **Detalhes do Projeto**\n\n` +
                            `🚀 **Nome:** ${project.name}\n` +
                            `📋 **ID:** ${project.id}\n` +
                            `🛠️ **Framework:** ${project.framework}\n` +
                            `📅 **Criado:** ${new Date(project.createdAt).toLocaleString('pt-BR')}\n` +
                            `📅 **Atualizado:** ${new Date(project.updatedAt).toLocaleString('pt-BR')}\n` +
                            `🔧 **Node Version:** ${project.nodeVersion}\n` +
                            `📁 **Root Directory:** ${project.rootDirectory || 'N/A'}\n` +
                            `📤 **Output Directory:** ${project.outputDirectory || 'N/A'}\n` +
                            `⚙️ **Build Command:** ${project.buildCommand || 'N/A'}\n` +
                            `🛠️ **Dev Command:** ${project.devCommand || 'N/A'}\n`
                    }]
            };
        }
        case 'vercel-find-project-by-name': {
            const project = await vercelClient.getProjectByName(args.name);
            if (!project) {
                return {
                    content: [{
                            type: 'text',
                            text: `❌ Projeto não encontrado com nome: ${args.name}`
                        }]
                };
            }
            return {
                content: [{
                        type: 'text',
                        text: `🎯 **Projeto Encontrado**\n\n` +
                            `🚀 **Nome:** ${project.name}\n` +
                            `📋 **ID:** ${project.id}\n` +
                            `🛠️ **Framework:** ${project.framework}\n` +
                            `📅 **Criado:** ${new Date(project.createdAt).toLocaleString('pt-BR')}\n`
                    }]
            };
        }
        case 'vercel-get-environment-variables': {
            const envVars = await vercelClient.getEnvironmentVariables(args.projectId);
            return {
                content: [{
                        type: 'text',
                        text: `🔐 **Variáveis de Ambiente: ${envVars.length}**\n\n` +
                            envVars.map(env => `🔑 **${env.key}**\n` +
                                `   🎯 Target: ${env.target.join(', ')}\n` +
                                `   🔒 Tipo: ${env.type}\n` +
                                `   📅 Criado: ${new Date(env.createdAt).toLocaleString('pt-BR')}\n`).join('\n')
                    }]
            };
        }
        default:
            throw new Error(`Ferramenta desconhecida: ${name}`);
    }
}
//# sourceMappingURL=projects.js.map