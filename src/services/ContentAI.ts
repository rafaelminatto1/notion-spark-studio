import { FileItem } from '@/types';

export interface AIAnalysis {
  tags: string[];
  keywords: string[];
  entities: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  readingTime: number;
  complexity: 'low' | 'medium' | 'high';
  summary: string;
  relatedDocuments: string[];
  suggestions: string[];
}

export interface SimilarityResult {
  documentId: string;
  score: number;
  reason: string;
  sharedConcepts: string[];
}

export class ContentIntelligence {
  private stopWords = new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
    'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
    'para', 'por', 'com', 'sem', 'sobre', 'entre', 'até', 'desde',
    'e', 'ou', 'mas', 'que', 'se', 'quando', 'onde', 'como', 'porque',
    'é', 'são', 'foi', 'foram', 'será', 'serão', 'tem', 'têm', 'teve', 'tiveram',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had'
  ]);

  private technicalTerms = new Map([
    ['react', 'React'],
    ['typescript', 'TypeScript'],
    ['javascript', 'JavaScript'],
    ['python', 'Python'],
    ['api', 'API'],
    ['database', 'Database'],
    ['frontend', 'Frontend'],
    ['backend', 'Backend'],
    ['ui', 'UI'],
    ['ux', 'UX'],
    ['css', 'CSS'],
    ['html', 'HTML'],
    ['node', 'Node.js'],
    ['mongodb', 'MongoDB'],
    ['postgresql', 'PostgreSQL'],
    ['git', 'Git'],
    ['docker', 'Docker'],
    ['kubernetes', 'Kubernetes'],
    ['aws', 'AWS'],
    ['azure', 'Azure'],
    ['gcp', 'Google Cloud'],
    ['machine learning', 'Machine Learning'],
    ['ai', 'Artificial Intelligence'],
    ['ml', 'Machine Learning'],
    ['deep learning', 'Deep Learning'],
    ['neural network', 'Neural Networks'],
    ['algorithm', 'Algorithms'],
    ['data science', 'Data Science'],
    ['analytics', 'Analytics'],
    ['automation', 'Automation'],
    ['devops', 'DevOps'],
    ['ci/cd', 'CI/CD'],
    ['microservices', 'Microservices'],
    ['serverless', 'Serverless'],
    ['blockchain', 'Blockchain'],
    ['cryptocurrency', 'Cryptocurrency'],
    ['web3', 'Web3'],
    ['nft', 'NFT'],
    ['defi', 'DeFi'],
    ['security', 'Security'],
    ['cybersecurity', 'Cybersecurity'],
    ['encryption', 'Encryption'],
    ['oauth', 'OAuth'],
    ['jwt', 'JWT'],
    ['rest', 'REST API'],
    ['graphql', 'GraphQL'],
    ['websocket', 'WebSocket'],
    ['performance', 'Performance'],
    ['optimization', 'Optimization'],
    ['scalability', 'Scalability'],
    ['architecture', 'Architecture'],
    ['design patterns', 'Design Patterns'],
    ['solid', 'SOLID Principles'],
    ['testing', 'Testing'],
    ['unit test', 'Unit Testing'],
    ['integration test', 'Integration Testing'],
    ['e2e', 'End-to-End Testing'],
    ['agile', 'Agile'],
    ['scrum', 'Scrum'],
    ['kanban', 'Kanban'],
    ['product management', 'Product Management'],
    ['project management', 'Project Management'],
    ['business intelligence', 'Business Intelligence'],
    ['crm', 'CRM'],
    ['erp', 'ERP'],
    ['saas', 'SaaS'],
    ['paas', 'PaaS'],
    ['iaas', 'IaaS'],
    ['cloud computing', 'Cloud Computing'],
    ['edge computing', 'Edge Computing'],
    ['iot', 'Internet of Things'],
    ['ar', 'Augmented Reality'],
    ['vr', 'Virtual Reality'],
    ['mobile development', 'Mobile Development'],
    ['ios', 'iOS Development'],
    ['android', 'Android Development'],
    ['flutter', 'Flutter'],
    ['react native', 'React Native'],
    ['progressive web app', 'Progressive Web Apps'],
    ['pwa', 'Progressive Web Apps']
  ]);

  async analyzeContent(content: string, title?: string): Promise<AIAnalysis> {
    const words = this.tokenize(content);
    const keywords = this.extractKeywords(words);
    const entities = this.extractEntities(content);
    const tags = this.generateTags(keywords, entities, title);
    const sentiment = this.analyzeSentiment(content);
    const readingTime = this.calculateReadingTime(content);
    const complexity = this.analyzeComplexity(content);
    const summary = this.generateSummary(content);
    const suggestions = this.generateSuggestions(content, keywords);

    return {
      tags,
      keywords,
      entities,
      sentiment,
      readingTime,
      complexity,
      summary,
      relatedDocuments: [], // Will be populated by findSimilarDocuments
      suggestions
    };
  }

  async findSimilarDocuments(
    targetDocument: FileItem, 
    allDocuments: FileItem[], 
    threshold: number = 0.3
  ): Promise<SimilarityResult[]> {
    const results: SimilarityResult[] = [];
    const targetAnalysis = await this.analyzeContent(targetDocument.content || '', targetDocument.name);

    for (const doc of allDocuments) {
      if (doc.id === targetDocument.id || !doc.content) continue;

      const docAnalysis = await this.analyzeContent(doc.content, doc.name);
      const similarity = this.calculateSimilarity(targetAnalysis, docAnalysis);

      if (similarity.score >= threshold) {
        results.push({
          documentId: doc.id,
          score: similarity.score,
          reason: similarity.reason,
          sharedConcepts: similarity.sharedConcepts
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  async generateContentSuggestions(
    currentContent: string,
    relatedDocuments: FileItem[],
    context?: { tags?: string[]; category?: string }
  ): Promise<string[]> {
    const suggestions: string[] = [];
    const analysis = await this.analyzeContent(currentContent);

    // Content completion suggestions
    if (currentContent.length < 100) {
      suggestions.push(
        '💡 Adicione uma introdução para contextualizar o conteúdo',
        '📝 Considere expandir com exemplos práticos',
        '🔗 Inclua links para documentos relacionados'
      );
    }

    // Structure suggestions
    if (!currentContent.includes('#') && currentContent.length > 200) {
      suggestions.push('📋 Organize o conteúdo com títulos e subtítulos');
    }

    if (!currentContent.includes('-') && !currentContent.includes('*') && currentContent.length > 300) {
      suggestions.push('📝 Use listas para melhorar a legibilidade');
    }

    // Technical content suggestions
    if (analysis.keywords.some(k => this.technicalTerms.has(k.toLowerCase()))) {
      suggestions.push(
        '💻 Adicione exemplos de código para ilustrar conceitos',
        '📊 Considere incluir diagramas ou imagens explicativas',
        '🔧 Documente passos de implementação'
      );
    }

    // Related content suggestions
    if (relatedDocuments.length > 0) {
      const relatedTopics = relatedDocuments
        .flatMap(doc => this.extractKeywords(this.tokenize(doc.content || '')))
        .filter((topic, index, arr) => arr.indexOf(topic) === index)
        .slice(0, 3);

      if (relatedTopics.length > 0) {
        suggestions.push(
          `🔗 Considere mencionar: ${relatedTopics.join(', ')}`,
          '📚 Adicione referências a documentos relacionados'
        );
      }
    }

    // SEO and discoverability suggestions
    if (analysis.tags.length < 3) {
      suggestions.push('🏷️ Adicione mais tags para melhor organização');
    }

    if (!currentContent.toLowerCase().includes('conclusão') && currentContent.length > 500) {
      suggestions.push('🎯 Adicione uma conclusão para resumir os pontos principais');
    }

    return suggestions.slice(0, 6);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word));
  }

  private extractKeywords(words: string[]): string[] {
    const wordFreq = new Map<string, number>();
    
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    // Prioritize technical terms
    const keywords = Array.from(wordFreq.entries())
      .sort((a, b) => {
        const aIsTechnical = this.technicalTerms.has(a[0]);
        const bIsTechnical = this.technicalTerms.has(b[0]);
        
        if (aIsTechnical && !bIsTechnical) return -1;
        if (!aIsTechnical && bIsTechnical) return 1;
        
        return b[1] - a[1]; // Sort by frequency
      })
      .slice(0, 15)
      .map(([word]) => this.technicalTerms.get(word) || word);

    return keywords;
  }

  private extractEntities(content: string): string[] {
    const entities: string[] = [];
    
    // Extract URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = content.match(urlRegex) || [];
    entities.push(...urls.map(url => `URL: ${new URL(url).hostname}`));

    // Extract email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = content.match(emailRegex) || [];
    entities.push(...emails.map(email => `Email: ${email}`));

    // Extract mentions (@username)
    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex) || [];
    entities.push(...mentions.map(mention => `Mention: ${mention}`));

    // Extract hashtags
    const hashtagRegex = /#(\w+)/g;
    const hashtags = content.match(hashtagRegex) || [];
    entities.push(...hashtags.map(tag => `Tag: ${tag.slice(1)}`));

    // Extract code blocks
    const codeRegex = /```[\s\S]*?```|`[^`]+`/g;
    const codeBlocks = content.match(codeRegex) || [];
    if (codeBlocks.length > 0) {
      entities.push(`Code: ${codeBlocks.length} block(s)`);
    }

    return entities.slice(0, 10);
  }

  private generateTags(keywords: string[], entities: string[], title?: string): string[] {
    const tags = new Set<string>();

    // Add top keywords as tags
    keywords.slice(0, 8).forEach(keyword => {
      if (this.technicalTerms.has(keyword.toLowerCase())) {
        tags.add(this.technicalTerms.get(keyword.toLowerCase())!);
      } else {
        tags.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    });

    // Extract tags from title
    if (title) {
      const titleWords = this.tokenize(title);
      titleWords.slice(0, 3).forEach(word => {
        if (this.technicalTerms.has(word)) {
          tags.add(this.technicalTerms.get(word)!);
        } else if (word.length > 3) {
          tags.add(word.charAt(0).toUpperCase() + word.slice(1));
        }
      });
    }

    // Add category tags based on content
    if (entities.some(e => e.includes('Code:'))) {
      tags.add('Programming');
    }
    if (keywords.some(k => ['meeting', 'reunion', 'agenda'].includes(k))) {
      tags.add('Meeting');
    }
    if (keywords.some(k => ['project', 'plan', 'roadmap', 'timeline'].includes(k))) {
      tags.add('Project');
    }
    if (keywords.some(k => ['idea', 'brainstorm', 'concept', 'innovation'].includes(k))) {
      tags.add('Ideas');
    }
    if (keywords.some(k => ['research', 'study', 'analysis', 'data'].includes(k))) {
      tags.add('Research');
    }

    return Array.from(tags).slice(0, 8);
  }

  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'awesome', 'fantastic', 'wonderful',
      'success', 'achieve', 'accomplish', 'win', 'victory', 'progress', 'improve',
      'love', 'like', 'enjoy', 'happy', 'pleased', 'satisfied', 'excited',
      'bom', 'ótimo', 'excelente', 'incrível', 'fantástico', 'maravilhoso',
      'sucesso', 'conquistar', 'vitória', 'progresso', 'melhorar',
      'amar', 'gostar', 'feliz', 'satisfeito', 'empolgado'
    ];

    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'fail', 'failure', 'problem',
      'issue', 'error', 'bug', 'wrong', 'difficult', 'hard', 'challenge',
      'hate', 'dislike', 'angry', 'frustrated', 'disappointed', 'sad',
      'ruim', 'terrível', 'horrível', 'falha', 'problema', 'erro',
      'difícil', 'desafio', 'odiar', 'raiva', 'frustrado', 'triste'
    ];

    const words = this.tokenize(content);
    let score = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });

    if (score > 2) return 'positive';
    if (score < -2) return 'negative';
    return 'neutral';
  }

  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private analyzeComplexity(content: string): 'low' | 'medium' | 'high' {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = content.length / sentences.length;
    const technicalTermCount = this.tokenize(content)
      .filter(word => this.technicalTerms.has(word)).length;

    if (avgSentenceLength > 100 || technicalTermCount > 10) return 'high';
    if (avgSentenceLength > 50 || technicalTermCount > 5) return 'medium';
    return 'low';
  }

  private generateSummary(content: string): string {
    const sentences = content.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);

    if (sentences.length === 0) return 'Conteúdo muito breve para gerar resumo.';
    if (sentences.length <= 2) return sentences.join('. ') + '.';

    // Take first sentence, longest sentence, and last sentence
    const firstSentence = sentences[0];
    const longestSentence = sentences.reduce((a, b) => a.length > b.length ? a : b);
    const lastSentence = sentences[sentences.length - 1];

    const summary = [firstSentence];
    if (longestSentence !== firstSentence && longestSentence !== lastSentence) {
      summary.push(longestSentence);
    }
    if (lastSentence !== firstSentence) {
      summary.push(lastSentence);
    }

    return summary.join('. ') + '.';
  }

  private generateSuggestions(content: string, keywords: string[]): string[] {
    const suggestions: string[] = [];

    // Content-based suggestions
    if (content.length < 200) {
      suggestions.push('Expandir com mais detalhes e exemplos');
    }

    if (!content.includes('#')) {
      suggestions.push('Adicionar estrutura com títulos');
    }

    if (keywords.length > 5) {
      suggestions.push('Considerar dividir em múltiplos documentos');
    }

    // Technical content suggestions
    const hasTechnicalContent = keywords.some(k => this.technicalTerms.has(k.toLowerCase()));
    if (hasTechnicalContent) {
      suggestions.push('Adicionar exemplos de código');
      suggestions.push('Incluir diagramas explicativos');
    }

    return suggestions;
  }

  private calculateSimilarity(analysis1: AIAnalysis, analysis2: AIAnalysis): {
    score: number;
    reason: string;
    sharedConcepts: string[];
  } {
    const sharedKeywords = analysis1.keywords.filter(k => 
      analysis2.keywords.some(k2 => k2.toLowerCase() === k.toLowerCase())
    );
    
    const sharedTags = analysis1.tags.filter(t => 
      analysis2.tags.some(t2 => t2.toLowerCase() === t.toLowerCase())
    );

    const keywordSimilarity = sharedKeywords.length / 
      Math.max(analysis1.keywords.length, analysis2.keywords.length);
    
    const tagSimilarity = sharedTags.length / 
      Math.max(analysis1.tags.length, analysis2.tags.length);

    const complexitySimilarity = analysis1.complexity === analysis2.complexity ? 0.1 : 0;
    const sentimentSimilarity = analysis1.sentiment === analysis2.sentiment ? 0.1 : 0;

    const totalScore = (keywordSimilarity * 0.6) + (tagSimilarity * 0.3) + 
                      complexitySimilarity + sentimentSimilarity;

    const sharedConcepts = [...sharedKeywords, ...sharedTags].slice(0, 5);
    
    let reason = '';
    if (sharedKeywords.length > 0) {
      reason += `Palavras-chave em comum: ${sharedKeywords.slice(0, 3).join(', ')}`;
    }
    if (sharedTags.length > 0) {
      reason += reason ? ` | Tags: ${sharedTags.slice(0, 2).join(', ')}` : 
                `Tags em comum: ${sharedTags.slice(0, 2).join(', ')}`;
    }

    return {
      score: Math.round(totalScore * 100) / 100,
      reason: reason || 'Similaridade estrutural',
      sharedConcepts
    };
  }
}

export const contentAI = new ContentIntelligence(); 